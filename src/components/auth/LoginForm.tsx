import { useState } from "react";
import { useLoginForm } from "../../hooks/useLoginForm";

interface LoginFormProps {
  onForgotPassword: () => void;
}

export default function LoginForm({ onForgotPassword }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    identifier,
    password,
    remember,
    setRemember,
    identifierError,
    passwordError,
    status,
    formMessage,
    handleIdentifierChange,
    handlePasswordChange,
    handleSubmit,
  } = useLoginForm();

  // Stays busy after success too, until the page moves on.
  const isLoading = status === "loading" || status === "success";

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <div className="login-fields">
        <div className="login-field-group">
          <input
            type="text"
            placeholder="Username or email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={identifier}
            onChange={(e) => handleIdentifierChange(e.target.value)}
            className={`login-input ${identifierError ? "login-input-error" : ""}`}
            aria-label="Username or email"
            aria-invalid={!!identifierError}
            aria-describedby={identifierError ? "identifier-error" : undefined}
            disabled={isLoading}
            autoFocus
          />
          {identifierError && (
            <p id="identifier-error" className="login-field-error" role="alert">
              {identifierError}
            </p>
          )}
        </div>

        <div className="login-field-group">
          <div className="login-password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              className={`login-input login-input-password ${passwordError ? "login-input-error" : ""}`}
              aria-label="Password"
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? "password-error" : undefined}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="login-eye-toggle"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <i className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
            </button>
          </div>
          {passwordError && (
            <p id="password-error" className="login-field-error" role="alert">
              {passwordError}
            </p>
          )}
        </div>
      </div>

      <div className="login-row">
        <label className="login-remember">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="login-checkbox"
          />
          Remember me
        </label>
        <button type="button" className="login-link" onClick={onForgotPassword}>
          Forgot password?
        </button>
      </div>

      {formMessage && (
        <p
          className={`login-form-message ${
            status === "success" ? "login-form-message-success" : "login-form-message-error"
          }`}
          role="status"
        >
          {formMessage}
        </p>
      )}

      <button type="submit" className="login-submit" disabled={isLoading} aria-busy={isLoading}>
        {isLoading ? (
          <>
            <i className="fa-solid fa-spinner login-spinner"></i>
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
}
