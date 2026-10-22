import { useEffect, useState } from "react";
import MemberSearchSelect from "../visitation/MemberSearchSelect";
import CredentialsNote from "./CredentialsNote";
import { getMemberById } from "../../services/members/memberService/membersService";
import { USERNAME_HINT, validateUsername } from "../../services/auth/authService";
import {
  generateTempPassword,
  type AccountChanges,
  type NewAccountInput,
} from "../../services/auth/userAccountsService";
import { memberDisplayName } from "../../types/member";
import type { AppUser, UserRole } from "../../types/auth";
import { validateEmail, validatePassword } from "../../utils/validation";

interface UserFormModalProps {
  account?: AppUser; // given = edit that account; omitted = make a new one
  isSelf: boolean; // editing your own account
  isLastAdmin: boolean; // the only active Admin — can't be made a User
  onCreate: (input: NewAccountInput) => Promise<AppUser>;
  onUpdate: (uid: string, changes: AccountChanges) => Promise<void>;
  onClose: () => void;
}

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: "user", label: "User", description: "Can use every page except Users." },
  { value: "admin", label: "Admin", description: "Can also make and manage accounts." },
];

export default function UserFormModal({ account, isSelf, isLastAdmin, onCreate, onUpdate, onClose }: UserFormModalProps) {
  const editing = Boolean(account);
  const [displayName, setDisplayName] = useState(account?.displayName ?? "");
  const [memberId, setMemberId] = useState(account?.memberId ?? "");
  const [memberName, setMemberName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>(account?.role ?? "user");
  const [password, setPassword] = useState(() => generateTempPassword());
  const [showPassword, setShowPassword] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<AppUser | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Show the linked member's name when editing an account that has one.
  useEffect(() => {
    if (!account?.memberId) return;
    getMemberById(account.memberId)
      .then((m) => m && setMemberName(memberDisplayName(m)))
      .catch((err) => console.error("Failed to load linked member:", err));
  }, [account?.memberId]);

  const roleLocked = editing && (isSelf || (isLastAdmin && account?.role === "admin"));

  async function handleSave() {
    const problem =
      (!displayName.trim() && "Please enter the person's name.") ||
      (!editing && validateUsername(username)) ||
      (!editing && email.trim() && validateEmail(email)) ||
      (!editing && validatePassword(password)) ||
      "";
    if (problem) {
      setError(problem.endsWith(".") ? problem : `${problem}.`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (account) {
        await onUpdate(account.uid, { displayName, role, memberId });
        onClose();
      } else {
        setCreated(await onCreate({ displayName, username, email, password, role, memberId: memberId || undefined }));
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box account-modal" role="dialog" aria-modal="true" aria-label={editing ? "Edit Account" : "Add User"}>
        <h2 className="modal-title">{created ? "Account Made" : editing ? "Edit Account" : "Add User"}</h2>

        {created ? (
          <>
            <CredentialsNote name={created.displayName} username={created.username} password={password} />
            <div className="modal-actions">
              <button type="button" className="btn-primary" onClick={onClose}>
                Done
              </button>
            </div>
          </>
        ) : (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="account-form">
              <div className="ledger-field">
                <label>Link to a member (optional)</label>
                <div className="account-member-row">
                  <MemberSearchSelect
                    value={memberId}
                    displayName={memberName}
                    onSelect={(m) => {
                      setMemberId(m.id);
                      setMemberName(memberDisplayName(m));
                      if (!displayName.trim()) setDisplayName(memberDisplayName(m));
                    }}
                  />
                  {memberId && (
                    <button
                      type="button"
                      className="btn-icon"
                      title="Unlink member"
                      aria-label="Unlink member"
                      onClick={() => {
                        setMemberId("");
                        setMemberName("");
                      }}
                    >
                      <i className="fa-solid fa-xmark" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <small className="account-field-hint">Picking a member fills in the name below.</small>
              </div>

              <div className="ledger-field">
                <label htmlFor="acct-name">Name</label>
                <input id="acct-name" type="text" value={displayName} disabled={saving}
                  onChange={(e) => setDisplayName(e.target.value)} autoFocus={editing} />
                <small className="account-field-hint">Shown in the menu and saved as "Added by" on records.</small>
              </div>

              {editing && account ? (
                <div className="account-readonly">
                  <div>
                    <span>Username</span>
                    <strong>{account.username}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>{account.email || "None"}</strong>
                  </div>
                  <small className="account-field-hint">Username and email can't be changed after the account is made.</small>
                </div>
              ) : (
                <>
                  <div className="ledger-field">
                    <label htmlFor="acct-username">Username</label>
                    <input id="acct-username" type="text" autoCapitalize="none" spellCheck={false} value={username}
                      disabled={saving} onChange={(e) => setUsername(e.target.value)} />
                    <small className="account-field-hint">{USERNAME_HINT}</small>
                  </div>

                  <div className="ledger-field">
                    <label htmlFor="acct-email">Email (optional)</label>
                    <input id="acct-email" type="email" value={email} disabled={saving}
                      onChange={(e) => setEmail(e.target.value)} />
                    <small className="account-field-hint">
                      With an email, they can reset a forgotten password themselves.
                    </small>
                  </div>

                  <div className="ledger-field">
                    <label htmlFor="acct-password">Temporary password</label>
                    <div className="account-password-row">
                      <input id="acct-password" type={showPassword ? "text" : "password"} autoComplete="new-password"
                        value={password} disabled={saving} onChange={(e) => setPassword(e.target.value)} />
                      <button type="button" className="btn-icon" title={showPassword ? "Hide password" : "Show password"}
                        aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((v) => !v)}>
                        <i className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"}`} aria-hidden="true" />
                      </button>
                      <button type="button" className="btn-icon" title="Make a new password" aria-label="Make a new password"
                        onClick={() => setPassword(generateTempPassword())}>
                        <i className="fa-solid fa-rotate" aria-hidden="true" />
                      </button>
                    </div>
                    <small className="account-field-hint">At least 8 characters. They can change it after signing in.</small>
                  </div>
                </>
              )}

              <fieldset className="account-roles" disabled={saving || roleLocked}>
                <legend>Role</legend>
                {ROLE_OPTIONS.map((opt) => (
                  <label key={opt.value} className={`account-role${role === opt.value ? " checked" : ""}`}>
                    <input type="radio" name="role" value={opt.value} checked={role === opt.value}
                      onChange={() => setRole(opt.value)} />
                    <span>
                      <strong>{opt.label}</strong>
                      <small>{opt.description}</small>
                    </span>
                  </label>
                ))}
                {roleLocked && (
                  <small className="account-field-hint">
                    {isSelf ? "You can't change your own role." : "This is the only Admin, so it has to stay an Admin."}
                  </small>
                )}
              </fieldset>
            </div>

            {error && (
              <div className="modal-error" role="alert">
                <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
                {error}
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : editing ? "Save Changes" : "Make Account"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
