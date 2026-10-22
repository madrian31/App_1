import { useEffect, useState } from "react";
import CredentialsNote from "./CredentialsNote";
import { hasRealEmail } from "../../services/auth/authService";
import { generateTempPassword, type ResetResult } from "../../services/auth/userAccountsService";
import type { AppUser } from "../../types/auth";
import { validatePassword } from "../../utils/validation";

interface ResetPasswordModalProps {
  account: AppUser;
  onReset: (account: AppUser, newPassword: string) => Promise<ResetResult>;
  onClose: () => void;
}

export default function ResetPasswordModal({ account, onReset, onClose }: ResetPasswordModalProps) {
  const byEmail = hasRealEmail(account.authEmail);
  const [password, setPassword] = useState(() => generateTempPassword());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResetResult | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleReset() {
    const problem = byEmail ? "" : validatePassword(password);
    if (problem) {
      setError(`${problem}.`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      setResult(await onReset(account, password));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box account-modal" role="dialog" aria-modal="true" aria-label="Reset Password">
        <h2 className="modal-title">Reset Password — {account.displayName}</h2>

        {result?.kind === "email-sent" ? (
          <p className="account-modal-success">
            <i className="fa-solid fa-circle-check" aria-hidden="true" /> We emailed a reset link to{" "}
            <strong>{result.email}</strong>. Ask {account.displayName} to open it (check the Spam folder too) and
            choose a new password.
          </p>
        ) : result?.kind === "replaced" ? (
          <CredentialsNote name={account.displayName} username={account.username} password={password} />
        ) : byEmail ? (
          <p className="account-modal-text">
            We'll email a link to <strong>{account.authEmail}</strong> so {account.displayName} can choose a new
            password.
          </p>
        ) : (
          <div className="account-form">
            <p className="account-modal-text">
              This account has no email, so you'll set a new temporary password and give it to {account.displayName}.
              Their old password will stop working.
            </p>
            <div className="ledger-field">
              <label htmlFor="reset-password">New temporary password</label>
              <div className="account-password-row">
                <input id="reset-password" type="text" autoComplete="new-password" value={password} disabled={saving}
                  onChange={(e) => setPassword(e.target.value)} />
                <button type="button" className="btn-icon" title="Make a new password" aria-label="Make a new password"
                  onClick={() => setPassword(generateTempPassword())}>
                  <i className="fa-solid fa-rotate" aria-hidden="true" />
                </button>
              </div>
              <small className="account-field-hint">At least 8 characters.</small>
            </div>
          </div>
        )}

        {error && (
          <div className="modal-error" role="alert">
            <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
            {error}
          </div>
        )}

        <div className="modal-actions">
          {result ? (
            <button type="button" className="btn-primary" onClick={onClose}>
              Done
            </button>
          ) : (
            <>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={handleReset} disabled={saving}>
                {saving ? "Working…" : byEmail ? "Send Reset Link" : "Reset Password"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
