export default function SocialLogin() {
  return (
    <>
      <div className="login-divider">
        <div className="login-divider-line" />
        <span className="login-divider-text">Or</span>
        <div className="login-divider-line" />
      </div>

      <div className="login-social-grid">
        <button type="button" className="login-social-btn" aria-label="Sign in with Google">
          <i className="fa-brands fa-google login-icon-google"></i>
        </button>
        <button type="button" className="login-social-btn" aria-label="Sign in with Facebook">
          <i className="fa-brands fa-facebook login-icon-facebook"></i>
        </button>
        <button type="button" className="login-social-btn" aria-label="Sign in with Apple">
          <i className="fa-brands fa-apple login-icon-apple"></i>
        </button>
      </div>

      <p className="login-signup">
        Don't have an account?{" "}
        <a href="#" className="login-link login-link-bold">
          Sign up
        </a>
      </p>
    </>
  );
}