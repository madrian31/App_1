import { useEffect, useState } from "react";
import { authErrorMessage, changeOwnPassword } from "../../services/auth/authService";
import { validatePassword } from "../../utils/validation";
import "../../pages/Ledger/ledger.css"; // .ledger-field form fields
import "../../pages/Settings/users.css"; // shared account modal styles

interface ChangePasswordModalProps {
  onClose: () => void;
}

export default function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSave() {
    const problem = !current
      ? "Please enter your current password."
      : validatePassword(next) || (confirm !== next ? "The new passwords don't match." : "");
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await changeOwnPassword(current, next);
      setDone(true);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      // A wrong current password comes back as a sign-in error.
      setError(
        code === "auth/invalid-credential" || code === "auth/wrong-password"
          ? "Your current password is not correct."
          : authErrorMessage(err)
      );
    } finally {
      setSaving(false);
    }
  }

  const type = show ? "text" : "password";

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label="Change Password">
        <h2 className="modal-title">Change Password</h2>

        {done ? (
          <>
            <p className="account-modal-success">
              <i className="fa-solid fa-circle-check" aria-hidden="true" /> Your password has been changed. Use the new
              one the next time you sign in.
            </p>
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
                <label htmlFor="cp-current">Current password</label>
                <input id="cp-current" type={type} autoComplete="current-password" value={current}
                  onChange={(e) => setCurrent(e.target.value)} disabled={saving} autoFocus />
              </div>
              <div className="ledger-field">
                <label htmlFor="cp-new">New password</label>
                <input id="cp-new" type={type} autoComplete="new-password" value={next}
                  onChange={(e) => setNext(e.target.value)} disabled={saving} />
                <small className="account-field-hint">At least 8 characters.</small>
              </div>
              <div className="ledger-field">
                <label htmlFor="cp-confirm">Confirm new password</label>
                <input id="cp-confirm" type={type} autoComplete="new-password" value={confirm}
                  onChange={(e) => setConfirm(e.target.value)} disabled={saving} />
              </div>
              <label className="account-check">
                <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
                Show passwords
              </label>
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
                {saving ? "Saving…" : "Change Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
