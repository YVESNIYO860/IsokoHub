import { useEffect } from 'react';

const policyStyles = `
  .privacy-page, .terms-page { padding: 2rem 0 3rem; background: var(--bg-color); }
  .privacy-card, .terms-card { overflow: hidden; border: 1px solid var(--border-color); border-radius: var(--radius-lg); background: #fff; box-shadow: var(--shadow-sm); }
  .privacy-hero, .terms-hero { padding: 2rem; background: #10213f; color: #fff; }
  .privacy-hero h1, .terms-hero h1 { margin: 0.7rem 0 0.55rem; font-size: 2rem; }
  .privacy-hero p, .terms-hero p { max-width: 760px; color: #d2deef; line-height: 1.7; }
  .policy-home-link { display: inline-flex; align-items: center; gap: 0.45rem; min-height: 40px; color: #dbeafe; font-size: 0.85rem; font-weight: 650; text-decoration: none; }
  .policy-home-link:hover { color: #fff; }
  .privacy-body, .terms-body { padding: 2rem; }
  .privacy-section, .terms-section { margin-bottom: 1.25rem; padding-left: 1rem; border-left: 3px solid #60a5fa; }
  .privacy-section h2, .terms-section h2 { margin-bottom: 0.35rem; color: var(--text-dark); font-size: 1.05rem; }
  .privacy-section p { margin: 0; color: var(--text-muted); line-height: 1.7; }
  .terms-section p { color: var(--text-muted); line-height: 1.7; margin-bottom: 0; }
  .terms-pill { display: inline-flex; margin-top: 0.8rem; padding: 0.35rem 0.65rem; border: 1px solid rgba(191, 219, 254, 0.35); border-radius: 999px; background: rgba(96, 165, 250, 0.12); color: #dbeafe; font-size: 0.8rem; font-weight: 650; }
  .policy-actions { display: flex; flex-wrap: wrap; gap: 0.65rem; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-color); }
  @media (max-width: 768px) {
    .privacy-page, .terms-page { padding: 1rem 0 2rem; }
    .privacy-body, .terms-body { padding: 1.25rem; }
    .privacy-hero, .terms-hero { padding: 1.25rem; }
    .privacy-hero h1, .terms-hero h1 { font-size: 1.7rem; }
  }
`;

function usePageTitle(title) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

export function Privacy() {
  usePageTitle('Privacy Policy - IsokoHub');

  return (
    <>
      <style>{policyStyles}</style>
      <main className="privacy-page">
        <div className="container">
          <article className="privacy-card">
            <header className="privacy-hero">
              <a href="/home" className="policy-home-link"><i className="fa-solid fa-arrow-left" aria-hidden="true"></i> Back to home</a>
              <h1>Privacy Policy</h1>
              <p>This policy explains what IsokoHub stores and how marketplace features use information.</p>
            </header>
            <div className="privacy-body">
              <section className="privacy-section"><h2>Marketplace conversations</h2><p>Messages sent through IsokoHub are stored in our database so buyers and sellers can return to their conversations across sessions. Conversations are not end-to-end encrypted and authorized IsokoHub administrators can review them for safety, fraud prevention, dispute handling, and support.</p></section>
              <section className="privacy-section"><h2>Demo names</h2><p>Visitors may choose a demo display name for chat. That name and the messages sent from the device are associated with the conversation and visible to the seller and authorized administrators.</p></section>
              <section className="privacy-section"><h2>Information safety</h2><p>Do not share passwords, payment credentials, identity documents, or other highly sensitive information in marketplace chat. Contact the administrator if you need help reviewing or removing information.</p></section>
              <section className="privacy-section"><h2>Contact</h2><p>For privacy questions or data requests, contact the IsokoHub administrator through the Help Center.</p></section>
              <div className="policy-actions"><a href="/home" className="btn btn-primary">Back to home</a><a href="/support" className="btn btn-secondary">Contact support</a></div>
            </div>
          </article>
        </div>
      </main>
    </>
  );
}

export function Terms() {
  usePageTitle('Terms and Conditions - IsokoHub');

  return (
    <>
      <style>{policyStyles}</style>
      <main className="terms-page">
        <div className="container">
          <div className="terms-card">
            <div className="terms-hero">
              <a href="/home" className="policy-home-link"><i className="fa-solid fa-arrow-left" aria-hidden="true"></i> Back to home</a>
              <h1>Terms &amp; Conditions</h1>
              <p>By using IsokoHub, you agree to the rules below that help keep the marketplace trusted, safe, and easy to use for everyone.</p>
              <span className="terms-pill">Secure • Transparent • Community-friendly</span>
            </div>
            <div className="terms-body">
              <div className="terms-section">
                <h2>1. Acceptance of terms</h2>
                <p>By creating an account, signing in, or listing an item, you accept these Terms and Conditions and agree to follow them while using IsokoHub.</p>
              </div>
              <div className="terms-section">
                <h2>2. Account responsibility</h2>
                <p>You must provide accurate information, protect your login details, and keep your account secure at all times.</p>
              </div>
              <div className="terms-section">
                <h2>3. Product and rental listings</h2>
                <p>All listings must be truthful, lawful, and respectful of local regulations. Admin approval is required before public posting.</p>
              </div>
              <div className="terms-section">
                <h2>4. Google sign-in and privacy</h2>
                <p>Signing in with Google confirms your consent to these Terms and Conditions. Your data is stored securely and used to provide marketplace services.</p>
              </div>
              <div className="terms-section">
                <h2>5. Marketplace conversations</h2>
                <p>IsokoHub conversations are not end-to-end encrypted. Messages sent through the marketplace may be stored in our database and can be reviewed by authorized IsokoHub administrators for safety, fraud prevention, dispute handling, and support. Do not share passwords, payment credentials, or other highly sensitive information in chat.</p>
              </div>
              <div className="terms-section">
                <h2>6. Contact and support</h2>
                <p>If you need help, want to review your data, or have questions about these rules, please contact the site administrator or visit the Help Center.</p>
              </div>
              <div className="policy-actions"><a href="/home" className="btn btn-primary">Return to marketplace</a><a href="/support" className="btn btn-secondary">Contact support</a></div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
