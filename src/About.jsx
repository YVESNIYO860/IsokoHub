import { useEffect } from 'react';

export default function About() {
  useEffect(() => {
    document.title = 'About IsokoHub';
  }, []);

  return (
    <>
      <style>{`
        .about-hero {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #f8fafc;
          padding: 4rem 0 3rem;
          position: relative;
          overflow: hidden;
        }

        .about-hero::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top right, rgba(59,130,246,0.16), transparent 30%);
          pointer-events: none;
        }

        .about-hero .container {
          position: relative;
          z-index: 1;
        }

        .about-hero .eyebrow {
          color: #bfdbfe;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          font-size: 0.78rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .about-hero h1 {
          font-size: clamp(2.4rem, 4.5vw, 3.8rem);
          line-height: 1.03;
          max-width: 760px;
          margin-bottom: 1.25rem;
        }

        .about-hero p {
          max-width: 720px;
          color: #cbd5e1;
          font-size: 1.05rem;
          line-height: 1.8;
          margin-bottom: 1.8rem;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
        }

        .hero-actions a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.95rem 1.4rem;
          border-radius: 999px;
          font-weight: 700;
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .hero-actions a.primary {
          background: #1d4ed8;
          color: white;
          box-shadow: 0 10px 24px rgba(29,78,216,0.2);
        }

        .hero-actions a.secondary {
          background: rgba(255,255,255,0.12);
          color: #f8fafc;
          border: 1px solid rgba(255,255,255,0.18);
        }

        .hero-actions a:hover {
          transform: translateY(-2px);
        }

        .about-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1.25rem;
          padding: 2.25rem 0 4rem;
        }

        .about-card {
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1.5rem;
          box-shadow: var(--shadow-sm);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .about-card:hover {
          transform: translateY(-2px);
          border-color: #93c5fd;
        }

        .about-card h3 {
          color: var(--text-dark);
          margin-bottom: 0.85rem;
          font-size: 1.15rem;
        }

        .about-card p {
          color: var(--text-muted);
          margin-bottom: 1.1rem;
          line-height: 1.75;
        }

        .about-card a {
          color: var(--primary-blue);
          font-weight: 700;
          text-decoration: none;
        }

        .about-card a:hover {
          color: var(--primary-blue-hover);
          text-decoration: underline;
        }

        .about-card .contact-list {
          display: grid;
          gap: 0.55rem;
          margin-bottom: 1rem;
        }

        .about-card .contact-list a {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          color: #0f172a;
          font-weight: 600;
        }

        .about-card .contact-list a:hover {
          color: #2563eb;
        }

        @media (max-width: 960px) {
          .about-grid {
            grid-template-columns: 1fr;
          }
          .hero-actions {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
      <main>
        <section className="about-hero">
          <div className="container">
            <p className="eyebrow">About IsokoHub</p>
            <h1>Buy, sell, rent, and grow with confidence.</h1>
            <p>IsokoHub is a modern Rwandan marketplace built to help local buyers and sellers connect faster with trusted listings, simple discovery, and a smooth experience on any device.</p>
            <div className="hero-actions">
              <a href="products.html" className="primary">Explore marketplace</a>
              <a href="support.html" className="secondary">Get support</a>
            </div>
          </div>
        </section>

        <div className="container about-grid">
          <article className="about-card" id="about">
            <h3>Who we are</h3>
            <p>IsokoHub brings products, homes, and services into one welcoming platform so people can discover what they need without friction.</p>
            <a href="products.html">Explore marketplace</a>
          </article>

          <article className="about-card" id="mission">
            <h3>Our mission</h3>
            <p>Make it easier for people in Rwanda to find useful products and connect with local sellers through a clear, accessible digital marketplace.</p>
            <a href="support.html">Talk to our team</a>
          </article>

          <article className="about-card" id="vision">
            <h3>Our vision</h3>
            <p>Build a trusted home for local discovery where buyers, sellers, and communities can grow together as digital commerce evolves.</p>
            <a href="houses-rent.html">Explore local listings</a>
          </article>

          <article className="about-card" id="platform">
            <h3>One platform, useful tools</h3>
            <p>Browse products, discover homes, message sellers, and prepare listing photos with tools designed around practical local needs.</p>
            <a href="image-studio.html">Open Image Studio</a>
          </article>

          <article className="about-card" id="careers">
            <h3>Careers</h3>
            <p>We are growing our team and looking for creative people who can help improve the marketplace experience for buyers and sellers.</p>
            <a href="mailto:hello@isokohub.rw">Join our team</a>
          </article>

          <article className="about-card" id="blog">
            <h3>Blog</h3>
            <p>Stay updated with tips, product highlights, and stories that help sellers and buyers make better decisions.</p>
            <a href="blog-post.html">Read latest stories</a>
          </article>

          <article className="about-card" id="investor">
            <h3>Investor Relations</h3>
            <p>We are building a reliable digital marketplace with strong community focus, local relevance, and long-term growth goals.</p>
            <a href="mailto:investors@isokohub.rw">Contact investors</a>
          </article>

          <article className="about-card" id="help">
            <h3>Help Center</h3>
            <p>Need help with signing in, posting a listing, or managing your account? Our support team is ready to help.</p>
            <a href="support.html">Get support</a>
          </article>

          <article className="about-card" id="contact">
            <h3>Contact Us</h3>
            <p>Reach us for sales, partnerships, support, or feedback. We are happy to hear from the IsokoHub community.</p>
            <div className="contact-list">
              <a href="https://wa.me/250798269987" target="_blank" rel="noopener">WhatsApp: +250 798 269 987</a>
              <a href="mailto:yvesniyonkuru2022@gmail.com">Email: yvesniyonkuru2022@gmail.com</a>
            </div>
            <a href="support.html">Get in touch</a>
          </article>
        </div>
      </main>
    </>
  );
}
