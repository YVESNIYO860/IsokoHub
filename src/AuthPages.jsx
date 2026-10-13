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
      <style>{`
        .auth-form { display: grid; gap: 1rem; margin: 1.25rem 0; padding: 1.15rem; border: 2px solid #64748b; border-radius: var(--radius-sm); background: #fff; }
        .auth-form[hidden] { display: none; }
        .auth-field { display: grid; gap: .4rem; color: var(--text-dark); font-size: .9rem; font-weight: 650; }
        .auth-field input { width: 100%; min-height: 46px; padding: .65rem .8rem; border: 1px solid #94a3b8; border-radius: var(--radius-sm); background: #fff; color: var(--text-dark); font: inherit; }
        .auth-field input:focus { outline: 3px solid rgba(37, 99, 235, .16); border-color: var(--primary-blue); }
        .auth-form-row { display: flex; align-items: flex-start; justify-content: space-between; gap: .75rem; }
        .auth-check { display: flex; align-items: flex-start; gap: .55rem; color: var(--text-muted); font-size: .85rem; line-height: 1.5; }
        .auth-check input { width: 17px; height: 17px; flex: 0 0 auto; margin: .1rem 0 0; accent-color: var(--primary-blue); }
        .auth-check a, .auth-link-button { color: var(--primary-blue); font-weight: 700; }
        .auth-link-button { padding: 0; border: 0; background: transparent; font: inherit; white-space: nowrap; cursor: pointer; }
        .auth-verify-row { display: flex; gap: .65rem; align-items: end; }
        .auth-verify-row .auth-field { flex: 1; }
        .auth-divider { display: flex; align-items: center; gap: .8rem; margin: 1rem 0; color: var(--text-muted); font-size: .8rem; }
        .auth-divider::before, .auth-divider::after { content: ''; height: 1px; flex: 1; background: var(--border-color); }
        .auth-switch { margin: 1rem 0 0; color: var(--text-muted); font-size: .9rem; text-align: center; }
        .auth-switch a { color: var(--primary-blue); font-weight: 700; }
        @media (max-width: 420px) { .auth-container { padding: 1.25rem; } .auth-form-row { flex-wrap: wrap; } }
      `}</style>
      <div className="container">
        <div className="auth-container">

          <span className="auth-kicker">Your marketplace account</span>
          <h1 className="auth-title">{signup ? 'Create an account' : 'Welcome back'}</h1>
          <p className="auth-description">{signup ? 'Create an account to buy and sell locally.' : 'Continue to your listings, messages, and account.'}</p>
          <div id="error-msg" className="text-danger text-center mb-2 d-none"></div>
          {signup ? (
            <form id="signup-form" className="auth-form">
              <label className="auth-field">Email address<input id="email" type="email" autoComplete="email" required /></label>
              <label className="auth-check"><input id="accept-terms-signup" type="checkbox" required /><span>I agree to the <a href="terms.html" target="_blank" rel="noreferrer">Terms and Conditions</a>.</span></label>
              <label className="auth-field">Full name<input id="name" type="text" autoComplete="name" required /></label>
              <label className="auth-field">Username<input id="username" type="text" autoComplete="username" minLength="3" maxLength="24" pattern="[A-Za-z0-9_]{3,24}" required /><small>3-24 letters, numbers, or underscores.</small></label>
              <label className="auth-field">Phone number<input id="phone" type="tel" autoComplete="tel" required /></label>
              <label className="auth-field">Password<input id="password" type="password" autoComplete="new-password" minLength="8" required /></label>
              <button type="submit" className="btn btn-primary btn-block">Create account</button>
            </form>
          ) : (
            <>
              <form id="login-form" className="auth-form">
                <label className="auth-field">Email or username<input id="email" type="text" autoComplete="username" required /></label>
                <label className="auth-field">Password<input id="password" type="password" autoComplete="current-password" required /></label>
                <div className="auth-form-row">
                  <label className="auth-check"><input id="accept-terms-login" type="checkbox" required /><span>I agree to the <a href="terms.html" target="_blank" rel="noreferrer">Terms and Conditions</a>.</span></label>
                  <button id="forgot-password-btn" type="button" className="auth-link-button">Forgot password?</button>
                </div>
                <button type="submit" className="btn btn-primary btn-block">Sign in</button>
              </form>
              <form id="password-reset-form" className="auth-form" hidden>
                <p className="auth-description">Choose a new password for your account.</p>
                <label className="auth-field">New password<input id="new-password" type="password" autoComplete="new-password" minLength="8" required /></label>
                <label className="auth-field">Confirm new password<input id="confirm-password" type="password" autoComplete="new-password" minLength="8" required /></label>
                <button type="submit" className="btn btn-primary btn-block">Update password</button>
              </form>
            </>
          )}
          <div className="auth-divider">or continue with</div>
          <div className="d-grid">
            <button id={signup ? 'google-signup-btn' : 'google-login-btn'} type="button" className="btn btn-google btn-block">
              <GoogleMark />
              <span>Continue with Google</span>
            </button>
          </div>
          <p className="auth-switch">{signup ? <>Already have an account? <a href="/login">Sign in</a></> : <>New to IsokoHub? <a href="/signup">Create an account</a></>}</p>
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
