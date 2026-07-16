import { useState } from "react";
import { useLoginForm } from "../hooks/useLoginForm";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    email,
    password,
    emailError,
    passwordError,
    status,
    formMessage,
    handleEmailChange,
    handlePasswordChange,
    handleSubmit,
  } = useLoginForm();

  const isLoading = status === "loading";

  return (
    <>
      <div className="login-fields">
        <div className="login-field-group">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            className={`login-input ${emailError ? "login-input-error" : ""}`}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "email-error" : undefined}
            disabled={isLoading}
          />
          {emailError && (
            <p id="email-error" className="login-field-error" role="alert">
              {emailError}
            </p>
          )}
        </div>

        <div className="login-field-group">
          <div className="login-password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              className={`login-input login-input-password ${passwordError ? "login-input-error" : ""}`}
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
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="login-checkbox"
          />
          Remember me
        </label>
        <a href="#" className="login-link">
          Forgot password?
        </a>
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

      <button
        onClick={handleSubmit}
        className="login-submit"
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <i className="fa-solid fa-spinner login-spinner"></i>
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </button>
    </>
  );
}