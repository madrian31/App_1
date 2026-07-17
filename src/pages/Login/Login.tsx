import "./login.css";
import LoginForm from "../../components/auth/LoginForm";
import SocialLogin from "../../components/auth/SocialLogin";

export default function Login() {
  return (
    <div className="login-page">
      <div className="login-card">
        {/* Gradient blob accent */}
        <div className="login-blob" />

        <div className="login-content">

          <p className="login-subtitle">Please enter your details</p>
          <h1 className="login-title">Welcome Back</h1>

          <LoginForm />
          <SocialLogin />
          
        </div>
      </div>
    </div>
  );
}