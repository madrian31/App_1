import { useState } from "react";
import { authErrorMessage, requestPasswordReset } from "../../services/auth/authService";

interface ForgotPasswordFormProps {
  onBack: () => void;
}

type Outcome = { tone: "success" | "error"; text: string } | null;

export default function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [identifier, setIdentifier] = useState("");
  const [sending, setSending] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>(null);

  async function handleSubmit() {
    if (!identifier.trim()) {
      setOutcome({ tone: "error", text: "Please enter your username or email." });
      return;
    }
    setSending(true);
    setOutcome(null);
    try {
      const result = await requestPasswordReset(identifier);
      setOutcome(
        result === "no-email"
          ? {
              tone: "error",
              text: "This account has no email, so the password can't be reset by email. Please ask your church admin to reset it for you.",
            }
          : {
              tone: "success",
              text: "If that account has an email, we sent it a link to choose a new password. Please check your inbox and your Spam folder.",
            }
      );
    } catch (err) {
      setOutcome({ tone: "error", text: authErrorMessage(err) });
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <p className="login-help">
        Enter your username or email. If your account has an email, we'll send you a link to choose a new password.
      </p>

      <div className="login-fields">
        <input
          type="text"
          placeholder="Username or email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="login-input"
          aria-label="Username or email"
          disabled={sending}
          autoFocus
        />
      </div>

      {outcome && (
        <p
          className={`login-form-message login-form-message-spaced ${
            outcome.tone === "success" ? "login-form-message-success" : "login-form-message-error"
          }`}
          role="status"
        >
          {outcome.text}
        </p>
      )}

      <button type="submit" className="login-submit login-submit-spaced" disabled={sending} aria-busy={sending}>
        {sending ? (
          <>
            <i className="fa-solid fa-spinner login-spinner"></i>
            Sending...
          </>
        ) : (
          "Send Reset Link"
        )}
      </button>

      <button type="button" className="login-link login-back" onClick={onBack}>
        <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back to sign in
      </button>
    </form>
  );
}
