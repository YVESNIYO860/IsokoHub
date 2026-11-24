import { useEffect } from 'react';

const productsStyles = `
  .products-layout { display: flex; gap: 1rem; margin-top: 1rem; }
  .filters-sidebar { width: min(100%, 420px); background: white; padding: 1rem; border-radius: 12px; box-shadow: var(--shadow-sm); border: 1px solid var(--border-color); margin-bottom: 1rem; }
  .filters-sidebar h3 { font-size: 1rem; margin-bottom: 0.7rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.35rem; }
  .filter-select { width: 100%; padding: 0.6rem 0.7rem; border: 1px solid var(--border-color); border-radius: 8px; background: white; color: var(--text-dark); font-size: 0.9rem; margin-bottom: 0.8rem; }
  .products-main { flex: 1; }
  .products-filter-bar { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.8rem; }
  .products-filter-toggle, .products-filter-close, .products-filter-reset { display: inline-flex; align-items: center; gap: 0.45rem; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.65rem 0.85rem; color: #0f172a; background: #ffffff; font: inherit; font-size: 0.82rem; font-weight: 750; cursor: pointer; }
  .products-filter-toggle:hover, .products-filter-close:hover, .products-filter-reset:hover { border-color: #2563eb; color: #1d4ed8; }
  .products-filter-toggle { border-color: #1d4ed8; color: #1d4ed8; background: #eff6ff; }
  .products-nearby-toggle { display: inline-flex; align-items: center; gap: 0.45rem; border: 1px solid #0f766e; border-radius: 8px; padding: 0.65rem 0.85rem; color: #0f766e; background: #fff; font: inherit; font-size: 0.82rem; font-weight: 750; cursor: pointer; }
  .products-nearby-toggle:hover, .products-nearby-toggle.active { color: #fff; background: #0f766e; }
  .products-nearby-toggle:disabled { cursor: wait; opacity: 0.65; }
  .nearby-products-status { margin: 0 0 0.8rem; color: #475569; font-size: 0.86rem; }
  .products-filter-count { display: inline-grid; min-width: 1.35rem; height: 1.35rem; place-items: center; border-radius: 999px; color: #ffffff; background: #1d4ed8; font-size: 0.7rem; }
  .products-filter-panel { position: relative; }
  .products-filter-panel-header, .products-filter-panel-footer { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
  .products-filter-panel-header { margin-bottom: 0.9rem; }
  .products-filter-panel-header strong { color: #0f172a; font-size: 0.95rem; }
  .products-filter-close { padding: 0.4rem 0.55rem; border: 0; font-size: 1.1rem; }
  .products-filter-panel-footer { justify-content: flex-end; margin-top: 0.2rem; }
  .products-filter-reset { padding: 0.45rem 0.65rem; border: 0; color: #64748b; background: transparent; }
  .search-summary { font-size: 1rem; margin-bottom: 0.8rem; padding: 0.2rem 0; }
  .search-summary h2 { margin: 0; font-size: 1.5rem; line-height: 1.2; word-break: break-word; }
  .search-summary p { margin: 0.35rem 0 0; font-size: 0.9rem; }
  @media (max-width: 768px) {
    .products-layout { flex-direction: column; gap: 0.75rem; margin-top: 0.75rem; }
    .filters-sidebar { width: 100%; padding: 0.9rem; }
    .products-main { width: 100%; }
    .search-summary { margin-bottom: 0.6rem; }
    .search-summary h2 { font-size: 1.25rem; }
  }
  .product-listing-card { position: relative; display: flex; min-width: 0; flex-direction: column; }
  .product-listing-card .product-card-main-link { flex: 1 1 auto; }
  .product-listing-card .product-card-image-shell { position: relative; aspect-ratio: 4 / 3; overflow: hidden; background: #f3f6fa; }
  .product-listing-card .product-card-img { object-fit: cover; }
  .product-listing-card .product-card-content { flex: 1 1 auto; gap: 0.55rem; }
  .product-listing-card .product-card-meta-row { margin: 0; }
  .product-listing-card .product-title { margin: 0; }
  .product-listing-color { margin: 0; color: #475569; font-size: 0.74rem; font-weight: 650; }
  .product-listing-description { display: -webkit-box; min-width: 0; margin: 0; overflow: hidden; color: #64748b; font-size: 0.78rem; line-height: 1.45; overflow-wrap: anywhere; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
  .product-listing-card .product-card-shop { width: fit-content; max-width: 100%; margin: 0; }
  .product-listing-card .product-card-seller-line { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem; line-height: 1.4; }
  .product-listing-card .product-card-foot { align-items: flex-start; gap: 0.7rem; }
  .product-listing-price { display: grid; min-width: 0; gap: 0.15rem; }
  .product-listing-price-label { color: #718096; font-size: 0.66rem; font-weight: 650; letter-spacing: 0.04em; text-transform: uppercase; }
  .product-listing-price-values { display: flex; min-width: 0; flex-wrap: wrap; align-items: baseline; gap: 0.2rem 0.45rem; }
  .product-listing-price-note { color: #64748b; font-size: 0.67rem; line-height: 1.35; }
  .product-listing-discount { position: absolute; z-index: 2; top: 0.75rem; left: 0.75rem; padding: 0.35rem 0.55rem; border-radius: 999px; background: #a92d32; color: #fff; font-size: 0.68rem; font-weight: 750; line-height: 1; }
  .product-listing-sold-badge { position: absolute; z-index: 2; top: 0.75rem; right: 0.75rem; padding: 0.35rem 0.55rem; border-radius: 999px; background: #475569; color: #fff; font-size: 0.68rem; font-weight: 750; line-height: 1; }
  .product-quick-view-content > .product-listing-sold-badge { position: static; }
  .product-listing-quick-view { position: absolute; z-index: 2; top: 7rem; right: 0.75rem; display: inline-flex; min-height: 2.25rem; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.4rem 0.65rem; border: 1px solid rgba(219, 228, 239, 0.9); border-radius: 999px; background: rgba(255, 255, 255, 0.96); box-shadow: 0 3px 12px rgba(16, 33, 63, 0.12); color: #1d4ed8; font: inherit; font-size: 0.72rem; font-weight: 750; cursor: pointer; }
  .product-listing-quick-view:hover { background: #eff6ff; }
  .product-listing-quick-view:focus-visible, .product-quick-view-close:focus-visible { outline: 3px solid #60a5fa; outline-offset: 2px; }
  .product-listing-card .product-card-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.45rem; margin-top: auto; }
  .product-listing-card .product-card-actions > * { min-width: 0; width: 100%; justify-content: center; }
  .product-listing-card .product-card-actions .btn-buy-online { grid-column: 1 / -1; }
  .product-listing-card .product-card-actions .product-listing-add-cart { padding: 0.4rem 0.45rem; font-size: 0.72rem; }
  .product-quick-view { position: fixed; width: min(760px, calc(100vw - 2rem)); max-width: none; max-height: min(86vh, 760px); padding: 0; overflow: auto; border: 1px solid #dce5f0; border-radius: 16px; background: #fff; color: #152238; box-shadow: 0 24px 70px rgba(16, 33, 63, 0.24); }
  .product-quick-view::backdrop { background: rgba(15, 23, 42, 0.56); backdrop-filter: blur(3px); }
  .product-quick-view-panel { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); min-height: 360px; }
  .product-quick-view-image { width: 100%; height: 100%; min-height: 360px; aspect-ratio: 4 / 3; object-fit: contain; background: #f3f6fa; }
  .product-quick-view-placeholder { background: linear-gradient(135deg, #f8fbff 0%, #e0f2fe 100%); }
  .product-quick-view-close-form { position: absolute; z-index: 1; top: 0.75rem; right: 0.75rem; margin: 0; }
  .product-quick-view-close { display: grid; width: 2.5rem; height: 2.5rem; place-items: center; border: 1px solid #dce5f0; border-radius: 50%; background: #fff; color: #334155; font: inherit; font-size: 1.4rem; line-height: 1; cursor: pointer; }
  .product-quick-view-content { display: flex; min-width: 0; flex-direction: column; align-items: flex-start; gap: 0.75rem; padding: 2.25rem 1.5rem 1.5rem; }
  .product-quick-view-content h2 { margin: 0; color: #152238; font-size: 1.3rem; line-height: 1.3; overflow-wrap: anywhere; }
  .product-quick-view-shop, .product-quick-view-location, .product-quick-view-description, .product-quick-view-color { margin: 0; color: #64748b; font-size: 0.86rem; line-height: 1.5; overflow-wrap: anywhere; }
  .product-quick-view-price { margin: auto 0 0; color: #1d4ed8; font-size: 1.25rem; font-weight: 800; overflow-wrap: anywhere; }
  .product-quick-view-actions { display: grid; width: 100%; gap: 0.55rem; margin-top: 0.5rem; }
  .product-quick-view-actions > * { display: flex; min-height: 2.75rem; align-items: center; justify-content: center; gap: 0.45rem; padding: 0.55rem 0.75rem; border-radius: 999px; font: inherit; font-size: 0.82rem; font-weight: 750; text-align: center; text-decoration: none; cursor: pointer; }
  .product-quick-view-actions .product-card-chat { border: 1px solid #dbeafe; background: #f8fbff; color: #1d4ed8; }
  .product-quick-view-details { border: 1px solid #dce5f0; background: #fff; color: #334155; }
  @media (max-width: 600px) {
    .product-listing-card .product-card-foot { flex-direction: column; }
    .product-listing-card .product-card-view-link { width: 100%; }
    .product-listing-quick-view { width: 2.35rem; height: 2.35rem; padding: 0; }
    .product-listing-quick-view span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
    .product-quick-view-panel { grid-template-columns: minmax(0, 1fr); }
    .product-quick-view-image { height: auto; min-height: 0; max-height: 38vh; }
    .product-quick-view-content { gap: 0.6rem; padding: 1rem; }
    .product-quick-view-content h2 { padding-right: 2rem; font-size: 1.1rem; }
  }
`;

export default function Products() {
  useEffect(() => {
    document.title = 'All Products - IsokoHub';
  }, []);

  return (
    <>
      <style>{productsStyles}</style>
      <main>
        <div className="container">
          <div className="products-layout">
            <div className="products-main" style={{ marginBottom: '4rem' }}>
              <div className="products-filter-bar">
                <button type="button" className="products-filter-toggle" id="products-filter-toggle" aria-expanded="false" aria-controls="products-filter-panel">
                  <i className="fa-solid fa-sliders" aria-hidden="true"></i>
                  <span>Filters</span>
                  <span className="products-filter-count" id="products-filter-count">0</span>
                </button>
                <button type="button" className="products-nearby-toggle" id="nearby-products-toggle" aria-pressed="false"><i className="fa-solid fa-location-crosshairs" aria-hidden="true"></i> Near me</button>
                <button type="button" className="products-filter-reset" id="products-filter-reset">Clear filters</button>
              </div>
              <p id="nearby-products-status" className="nearby-products-status" role="status" hidden></p>
              <aside className="filters-sidebar products-filter-panel" id="products-filter-panel" hidden>
                <div className="products-filter-panel-header">
                  <strong>Refine products</strong>
                  <button type="button" className="products-filter-close" id="products-filter-close" aria-label="Close filters">&times;</button>
                </div>
                <h3>Category</h3>
                <select id="category-filter-select" className="filter-select" aria-label="Filter by category">
                  <option value="all">All categories</option>
                </select>
                <h3>Condition</h3>
                <select id="condition-filter-select" className="filter-select" aria-label="Filter by condition">
                  <option value="all">All conditions</option>
                  <option value="New">New</option>
                  <option value="Used">Used</option>
                </select>
                <h3>District</h3>
                <select id="district-filter-select" className="filter-select" aria-label="Filter by district">
                  <option value="all">All districts</option>
                </select>
              </aside>
              <div className="search-summary" id="search-summary">
                <h2>All Products</h2>
              </div>
              <div className="product-grid" id="products-container" style={{ marginTop: 0 }}></div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
