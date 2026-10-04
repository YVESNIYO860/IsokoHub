import { useEffect } from 'react';

const supportStyles = `
  .support-hero { background: var(--bg-color); color: var(--text-dark); padding: 3rem 0 4rem; }
  .support-page-heading { max-width: 720px; margin: 0 auto 2rem; text-align: center; }
  .support-page-heading > span { color: var(--primary-blue); font-size: 0.78rem; font-weight: 800; text-transform: uppercase; }
  .support-hero h1 { margin: 0.4rem 0 0.65rem; font-size: 2.35rem; }
  .support-page-heading p { color: var(--text-muted); line-height: 1.7; }
  .whatsapp-cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    width: fit-content;
    min-height: 48px;
    padding: 0.9rem 1rem;
    border-radius: var(--radius-sm);
    background: var(--primary-blue);
    color: white;
    text-decoration: none;
    font-weight: 700;
    box-shadow: var(--shadow-sm);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .whatsapp-cta:hover { transform: translateY(-1px); box-shadow: var(--shadow-md); color: white; text-decoration: none; }
  .whatsapp-cta-icon { display: inline-flex; align-items: center; justify-content: center; width: 2rem; height: 2rem; border-radius: 8px; background: rgba(255,255,255,0.14); color: white; font-size: 1rem; }
  .support-intro--highlight { display: grid; gap: 1rem; padding: 1.3rem; border-radius: 1.2rem; background: rgba(255, 255, 255, 0.07); border: 1px solid rgba(255,255,255,0.14); }
  .support-intro--highlight p { color: #e2e8f0; line-height: 1.7; margin: 0; }
  .support-return-home { display: inline-flex; align-items: center; justify-content: center; margin-top: 0.5rem; color: #94a3b8; text-decoration: none; font-weight: 600; transition: color 0.2s ease; }
  .support-return-home:hover { color: #2563eb; }
  .support-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; padding: 2rem 0 3rem; align-items: start; }
  .support-card { background: white; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.4rem; box-shadow: var(--shadow-sm); max-width: 760px; margin: 0 auto; }
  .support-card--single { padding: 0; border: none; box-shadow: none; background: transparent; }
  .support-card--right { display: flex; flex-direction: column; gap: 1rem; min-height: 100%; }
  .support-card h2 { margin-bottom: 0.7rem; font-size: 1.25rem; }
  .support-card p { color: var(--text-muted); line-height: 1.7; margin-bottom: 1rem; }
  .support-intro { padding: 1.2rem 1.3rem; border-radius: 14px; background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%); border: 1px solid #dbeafe; margin-bottom: 0.25rem; }
  .support-intro strong { display: block; margin-bottom: 0.35rem; color: #1d4ed8; font-size: 1rem; }
  .support-intro p { margin: 0; color: #475569; font-size: 0.95rem; }
  .support-form .form-group { margin-bottom: 1rem; }
  .support-form textarea { min-height: 140px; resize: vertical; }
  .support-grid { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(260px, 0.7fr); gap: 1rem; max-width: 920px; margin: 0 auto; align-items: stretch; }
  .support-contact-list { display: grid; gap: 0.65rem; }
  .support-contact-list a { display: flex; align-items: center; gap: 0.7rem; min-height: 44px; color: var(--primary-blue); font-weight: 650; text-decoration: none; }
  .support-contact-list i { display: grid; width: 2rem; height: 2rem; place-items: center; border-radius: 8px; background: #eff6ff; }
  .support-card--single { display: grid; align-content: center; max-width: none; margin: 0; padding: 1.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: #fff; box-shadow: var(--shadow-sm); }
  .support-intro, .support-intro--highlight { display: grid; gap: 0.8rem; margin: 0; padding: 0; border: 0; border-radius: 0; background: transparent; }
  .support-intro strong { margin: 0; color: var(--text-dark); }
  .support-intro p, .support-intro--highlight p { margin: 0; color: var(--text-muted); line-height: 1.7; }
  .support-return-home { color: var(--text-muted); }
  @media (max-width: 680px) { .support-hero { padding: 2rem 0 3rem; } .support-grid { grid-template-columns: 1fr; } .support-page-heading { margin-bottom: 1.3rem; text-align: left; } .support-hero h1 { font-size: 1.9rem; } .whatsapp-cta { width: 100%; } }
`;

export default function Support() {
  useEffect(() => {
    document.title = 'Support - IsokoHub';
  }, []);

  return (
    <>
      <style>{supportStyles}</style>
      <main>
        <section className="support-hero" aria-labelledby="support-title">
          <div className="container">
            <header className="support-page-heading">
              <span>IsokoHub support</span>
              <h1 id="support-title">How can we help?</h1>
              <p>Get help with your account, listings, orders, or marketplace conversations.</p>
            </header>
            <div className="support-grid">
              <section className="support-card support-card--single" aria-labelledby="support-whatsapp-title">
                <div className="support-intro">
                  <strong id="support-whatsapp-title">Talk with our support team</strong>
                  <p>Message us on WhatsApp and tell us what you need help with.</p>
                  <a href="https://wa.me/250798269987" target="_blank" rel="noopener" className="whatsapp-cta">
                    <span className="whatsapp-cta-icon"><i className="fa-brands fa-whatsapp" aria-hidden="true"></i></span>
                    <span>Chat on WhatsApp</span>
                  </a>
                  <a href="/home" className="support-return-home">Return to home</a>
                </div>
              </section>
              <aside className="support-card support-card--contact" aria-labelledby="support-contact-title">
                <h2 id="support-contact-title">Other ways to reach us</h2>
                <p>Choose the contact method that works best for you.</p>
                <div className="support-contact-list">
                  <a href="mailto:yvesniyonkuru2022@gmail.com"><i className="fa-solid fa-envelope" aria-hidden="true"></i> Email support</a>
                  <a href="tel:+250798269987"><i className="fa-solid fa-phone" aria-hidden="true"></i> Call support</a>
                </div>
                <p className="support-contact-note">For order, listing, or account questions, include the relevant details in your message.</p>
              </aside>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
