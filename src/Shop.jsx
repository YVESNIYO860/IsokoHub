import { useEffect } from 'react';

const shopStyles = `
  .shop-page-shell { padding: 2rem 0 4rem; }
  .shop-hero-card { background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 24px; padding: 1.5rem; box-shadow: 0 18px 35px rgba(15, 23, 42, 0.06); display: grid; gap: 1rem; margin-bottom: 1.5rem; }
  .shop-hero-meta { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
  .shop-hero-pill { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.7rem; border-radius: 999px; background: #eff6ff; color: #1d4ed8; font-size: 0.8rem; font-weight: 700; }
  .shop-hero-grid { display: grid; grid-template-columns: 1.4fr 0.8fr; gap: 1rem; }
  .shop-info-list { display: grid; gap: 0.65rem; color: var(--text-muted); }
  .shop-product-section { margin-top: 1rem; }
  @media (max-width: 768px) {
    .shop-hero-grid { grid-template-columns: 1fr; }
    .shop-page-shell { padding: 1rem 0 3rem; }
  }
`;

export default function Shop() {
  useEffect(() => {
    document.title = 'Shop Storefront - IsokoHub';
  }, []);

  return (
    <>
      <style>{shopStyles}</style>
      <main>
        <div className="container shop-page-shell">
          <div id="shop-wrapper"></div>
        </div>
      </main>
    </>
  );
}
