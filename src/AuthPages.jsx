import { useEffect } from 'react';

function GoogleMark() {
  return (
    <span className="google-logo" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
        <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.24-.17-1.82H9v3.44h4.84c-.21 1.12-.84 2.07-1.79 2.71v2.24h2.9c1.7-1.57 2.68-3.88 2.68-6.57z" />
        <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.24c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.58-5.05-3.71H.99v2.33C2.47 15.88 5.53 18 9 18z" />
        <path fill="#FBBC05" d="M3.95 10.73c-.18-.54-.28-1.12-.28-1.73s.1-1.19.28-1.73V4.94H.99A8.98 8.98 0 000 9c0 1.48.35 2.88.99 4.06l2.96-2.33z" />
        <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.43 1.34l2.57-2.57C13.44.96 11.4 0 9 0 5.53 0 2.47 2.12.99 5.06l2.96 2.33C4.66 5.16 6.65 3.58 9 3.58z" />
      </svg>
    </span>
  );
}

function AuthPage({ signup }) {
  useEffect(() => {
    document.title = signup ? 'IsokoHub' : 'Login - IsokoHub';
  }, [signup]);

  return (
    <main className="auth-page">
      <div className="container">
        <div className="auth-container">
          <a href="/home" className="auth-brand" aria-label="IsokoHub home">
            <img src="assets/logo.png" alt="" width="40" height="40" />
            <span>IsokoHub</span>
          </a>
          <span className="auth-kicker">Your marketplace account</span>
          <h1 className="auth-title">{signup ? 'Create an account' : 'Welcome back'}</h1>
          <p className="auth-description">{signup ? 'Sign in securely to start buying and selling locally.' : 'Continue to your listings, messages, and account.'}</p>
          <div id="error-msg" className="text-danger text-center mb-2 d-none"></div>
          <div className="auth-provider-label">Continue securely with</div>
          <div className="d-grid">
            <button id={signup ? 'google-signup-btn' : 'google-login-btn'} type="button" className="btn btn-google btn-block">
              <GoogleMark />
              <span>Continue with Google</span>
            </button>
            <p className="auth-legal-copy">
              By continuing, you agree to the <a href="terms.html" target="_blank" rel="noreferrer">Terms and Conditions</a>.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export function Login() {
  return <AuthPage signup={false} />;
}

export function Signup() {
  return <AuthPage signup />;
}
