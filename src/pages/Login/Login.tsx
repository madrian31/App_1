import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import "./login.css";
import LoginForm from "../../components/auth/LoginForm";
import ForgotPasswordForm from "../../components/auth/ForgotPasswordForm";
import FirstAdminSetup from "../../components/auth/FirstAdminSetup";
import { useAuth } from "../../auth/authContext";
import { isSetupDone } from "../../services/auth/authService";

export default function Login() {
  const { status, notice } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  // null while checking whether the first admin account exists yet.
  const [setupDone, setSetupDone] = useState<boolean | null>(null);
  const [mode, setMode] = useState<"signIn" | "forgot">("signIn");

  useEffect(() => {
    isSetupDone()
      .then(setSetupDone)
      .catch((err) => {
        // Can't tell — show the normal sign-in rather than the setup form.
        console.error("Failed to check account setup:", err);
        setSetupDone(true);
      });
  }, []);

  if (status === "signedIn") {
    return <Navigate to={from && from !== "/login" ? from : "/dashboard"} replace />;
  }

  const firstRun = setupDone === false;

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Gradient blob accent */}
        <div className="login-blob" />

        <div className="login-content">
          {setupDone === null ? (
            <p className="login-help" role="status">
              <i className="fa-solid fa-spinner login-spinner" aria-hidden="true" /> Loading…
            </p>
          ) : firstRun ? (
            <>
              <p className="login-subtitle">Welcome to LINK Up</p>
              <h1 className="login-title">Set Up Your Account</h1>
              <FirstAdminSetup />
            </>
          ) : mode === "forgot" ? (
            <>
              <p className="login-subtitle">Forgot your password?</p>
              <h1 className="login-title">Reset Password</h1>
              <ForgotPasswordForm onBack={() => setMode("signIn")} />
            </>
          ) : (
            <>
              <p className="login-subtitle">Please enter your details</p>
              <h1 className="login-title">Welcome Back</h1>

              {notice && (
                <p className="login-notice" role="alert">
                  <i className="fa-solid fa-circle-info" aria-hidden="true" /> {notice}
                </p>
              )}

              <LoginForm onForgotPassword={() => setMode("forgot")} />

              <p className="login-signup">No account yet? Ask your church admin to make one for you.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
