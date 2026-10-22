import { useState } from "react";
import {
  authErrorMessage,
  createFirstAdmin,
  USERNAME_HINT,
  validateUsername,
} from "../../services/auth/authService";
import { validateEmail, validatePassword } from "../../utils/validation";

type Errors = Partial<Record<"displayName" | "username" | "email" | "password" | "confirm", string>>;

/** Shown on the login page only while no account exists yet. Creates the
 *  first Admin, who then makes everyone else's accounts on the Users page. */
export default function FirstAdminSetup() {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function validate(): boolean {
    const next: Errors = {
      displayName: displayName.trim() ? "" : "Please enter your name.",
      username: validateUsername(username),
      email: email.trim() ? validateEmail(email) : "",
      password: validatePassword(password),
      confirm: confirm === password ? "" : "The passwords don't match.",
    };
    setErrors(next);
    return Object.values(next).every((e) => !e);
  }

  async function handleSubmit() {
    setFormError("");
    if (!validate()) return;
    setSaving(true);
    try {
      await createFirstAdmin({ displayName, username, email, password });
      // Signed in now — the Login page moves on once the account has loaded.
    } catch (err) {
      setFormError(authErrorMessage(err));
      setSaving(false);
    }
  }

  const field = (key: keyof Errors) => ({
    className: `login-input ${errors[key] ? "login-input-error" : ""}`,
    "aria-invalid": !!errors[key],
    disabled: saving,
  });

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <p className="login-help">
        There are no accounts yet. Create the first <strong>Admin</strong> account. You will use it to make accounts for
        everyone else.
      </p>

      <div className="login-fields">
        <div className="login-field-group">
          <label className="login-label" htmlFor="setup-name">Your name</label>
          <input id="setup-name" type="text" autoComplete="name" value={displayName}
            onChange={(e) => setDisplayName(e.target.value)} {...field("displayName")} autoFocus />
          {errors.displayName && <p className="login-field-error" role="alert">{errors.displayName}</p>}
        </div>

        <div className="login-field-group">
          <label className="login-label" htmlFor="setup-username">Username</label>
          <input id="setup-username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false}
            value={username} onChange={(e) => setUsername(e.target.value)} {...field("username")} />
          {errors.username ? (
            <p className="login-field-error" role="alert">{errors.username}</p>
          ) : (
            <p className="login-field-hint">{USERNAME_HINT}</p>
          )}
        </div>

        <div className="login-field-group">
          <label className="login-label" htmlFor="setup-email">Email (optional)</label>
          <input id="setup-email" type="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} {...field("email")} />
          {errors.email ? (
            <p className="login-field-error" role="alert">{errors.email}</p>
          ) : (
            <p className="login-field-hint">Needed if you ever want to reset your password by email.</p>
          )}
        </div>

        <div className="login-field-group">
          <label className="login-label" htmlFor="setup-password">Password</label>
          <div className="login-password-wrapper">
            <input id="setup-password" type={showPassword ? "text" : "password"} autoComplete="new-password"
              value={password} onChange={(e) => setPassword(e.target.value)} {...field("password")}
              className={`${field("password").className} login-input-password`} />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="login-eye-toggle"
              aria-label={showPassword ? "Hide password" : "Show password"}>
              <i className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
            </button>
          </div>
          {errors.password && <p className="login-field-error" role="alert">{errors.password}</p>}
        </div>

        <div className="login-field-group">
          <label className="login-label" htmlFor="setup-confirm">Confirm password</label>
          <input id="setup-confirm" type={showPassword ? "text" : "password"} autoComplete="new-password"
            value={confirm} onChange={(e) => setConfirm(e.target.value)} {...field("confirm")} />
          {errors.confirm && <p className="login-field-error" role="alert">{errors.confirm}</p>}
        </div>
      </div>

      {formError && (
        <p className="login-form-message login-form-message-error login-form-message-spaced" role="alert">
          {formError}
        </p>
      )}

      <button type="submit" className="login-submit login-submit-spaced" disabled={saving} aria-busy={saving}>
        {saving ? (
          <>
            <i className="fa-solid fa-spinner login-spinner"></i>
            Creating account...
          </>
        ) : (
          "Create Admin Account"
        )}
      </button>
    </form>
  );
}
