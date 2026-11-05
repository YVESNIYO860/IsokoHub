import { useEffect } from 'react';

const dashboardStyles = `
  .dashboard-hero { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 4rem 0 8rem 0; color: white; margin-bottom: -6rem; }
  .dashboard-hero .hero-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap; }
  .dashboard-hero .hero-header > div { min-width: 0; }
  .dashboard-hero h1 { font-size: clamp(2rem, 4vw, 2.7rem); margin-bottom: 0.5rem; }
  .dashboard-hero p { max-width: 36rem; line-height: 1.5; opacity: 0.85; }
  .dashboard-hero .btn-primary { min-width: 220px; }
  .dashboard-main-card { background: white; border-radius: 24px; padding: 2.5rem; box-shadow: 0 20px 40px rgba(0,0,0,0.1); border: 1px solid var(--border-color); }
  .listing-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem; margin-top: 2rem; }
  @media (max-width: 880px) {
    .dashboard-hero { padding: 3rem 0 5rem 0; margin-bottom: -4rem; }
    .dashboard-hero .hero-header { align-items: flex-start; }
    .dashboard-hero .btn-primary { width: 100%; min-width: 0; }
    .dashboard-main-card { padding: 1.8rem; }
    .listing-grid { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
  }
  @media (max-width: 560px) {
    .dashboard-hero { padding: 2.5rem 0 4rem 0; margin-bottom: -3rem; }
    .dashboard-hero .hero-header { flex-direction: column; align-items: stretch; }
    .dashboard-hero h1 { font-size: 2rem; }
    .dashboard-hero p { font-size: 0.95rem; }
    #user-avatar { width: 64px; height: 64px; }
    .stats-row { gap: 1rem; }
    .dashboard-main-card { margin-top: 1rem; }
  }
  .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; }
  .stat-card { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); padding: 1.5rem; border-radius: 20px; text-align: center; transition: transform 0.3s ease; }
  .stat-card:hover { transform: translateY(-5px); background: rgba(255, 255, 255, 0.15); }
  .stat-card i { font-size: 2rem; color: #febd69; margin-bottom: 0.5rem; }
  .stat-card h3 { font-size: 1.8rem; font-weight: 800; }
  .stat-card p { font-size: 0.85rem; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px; }
  .seller-card { border: 1px solid var(--border-color); border-radius: 16px; overflow: hidden; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); position: relative; }
  .seller-card:hover { transform: scale(1.02); box-shadow: 0 12px 30px rgba(0,0,0,0.1); }
  .seller-card-img { height: 180px; width: 100%; object-fit: cover; }
  .seller-card-body { padding: 1.2rem; }
  .status-badge { position: absolute; top: 10px; left: 10px; padding: 0.4rem 0.8rem; border-radius: 50px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; backdrop-filter: blur(5px); }
  .promote-btn { background: linear-gradient(135deg, #febd69, #f3a847); color: #131921; font-weight: 700; border-radius: 50px; width: 100%; margin-top: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
  .manage-actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
  .success-banner { background: #dcfce7; color: #166534; border: 1px solid #86efac; border-radius: 14px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem; font-weight: 600; }
  .shop-count-label { padding: 0.3rem 0.65rem; border-radius: 999px; background: #eff6ff; color: #1d4ed8; font-size: 0.78rem; font-weight: 750; }
  .seller-shop-form { display: grid; gap: 0.9rem; padding: 1rem; border: 1px solid var(--border-color); border-radius: 12px; background: #f8fafc; }
  .seller-shop-form h3 { margin: 0; color: #152238; font-size: 1.05rem; }
  .seller-shop-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.8rem; }
  .seller-shop-form-grid label { display: grid; align-content: start; gap: 0.35rem; min-width: 0; color: #334155; font-size: 0.82rem; font-weight: 700; }
  .seller-shop-form-grid .form-control { width: 100%; min-width: 0; }
  .seller-shop-wide { grid-column: 1 / -1; }
  .seller-shop-form select[multiple] { min-height: 8rem; }
  .seller-shop-list { display: grid; gap: 0.6rem; }
  .seller-shop-row { display: flex; align-items: center; justify-content: space-between; gap: 0.8rem; padding: 0.9rem; border: 1px solid var(--border-color); border-radius: 8px; background: #fff; }
  .seller-shop-row > div:first-child { display: grid; gap: 0.25rem; min-width: 0; }
  .seller-shop-row span { color: #64748b; font-size: 0.8rem; }
  .seller-shop-row-actions { display: flex; flex-wrap: wrap; gap: 0.4rem; }
  .seller-shop-row-actions .btn { min-height: 38px; padding: 0.45rem 0.65rem; border-radius: 6px; font-size: 0.78rem; }
  .seller-shops-empty { display: grid; justify-items: center; gap: 0.45rem; padding: 2rem 1rem; border: 1px dashed var(--border-color); border-radius: 8px; color: #64748b; text-align: center; }
  .seller-shops-empty i { color: #1d4ed8; font-size: 1.5rem; }
  .seller-shops-empty strong { color: #152238; }
  @media (max-width: 600px) { .seller-shop-form-grid { grid-template-columns: minmax(0, 1fr); } .seller-shop-wide { grid-column: auto; } .seller-shop-row { align-items: flex-start; flex-direction: column; } .seller-shop-row-actions { width: 100%; } .seller-shop-row-actions .btn { flex: 1; text-align: center; } }
`;

export default function Dashboard() {
  useEffect(() => {
    document.title = 'Seller Hub - IsokoHub';
  }, []);

  return (
    <>
      <style>{dashboardStyles}</style>
      <div className="dashboard-hero">
        <div className="container">
          <div className="hero-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', minWidth: 0 }}>
              <img id="user-avatar" src="" alt="User Avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid white', objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }} />
              <div>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Seller Hub</h1>
                <p id="user-greeting" style={{ opacity: 0.8, fontSize: '1.1rem' }}></p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a href="dashboard.html?view=shops" className="btn btn-secondary" style={{ padding: '1rem 1.5rem', borderRadius: '50px' }}>My Shops</a>
              <a href="dashboard.html?view=settings" className="btn btn-secondary" style={{ padding: '1rem 1.5rem', borderRadius: '50px' }}>Settings</a>
              <a href="sell.html" className="btn btn-primary" style={{ padding: '1rem 2rem', borderRadius: '50px' }}>List New Item</a>
            </div>
          </div>
        </div>
      </div>

      <main style={{ paddingBottom: '5rem' }}>
        <div className="container">
          <div className="stats-row">
            <div className="stat-card"><i className="fa-solid fa-boxes-stacked"></i><h3 id="stat-active">0</h3><p>Active Listings</p></div>
            <div className="stat-card"><i className="fa-solid fa-sack-dollar"></i><h3 id="stat-value">0</h3><p>Inventory Value</p></div>
            <div className="stat-card"><i className="fa-solid fa-bullhorn"></i><h3 id="stat-ads">0</h3><p>Ad Placements</p></div>
          </div>

          <div className="dashboard-main-card">
            <h2 style={{ color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem' }}>My Product Catalog</h2>
            <div id="dashboard-content">
              <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                <i className="fa-solid fa-spinner fa-spin fa-3x" style={{ color: 'var(--primary-blue)' }}></i>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
