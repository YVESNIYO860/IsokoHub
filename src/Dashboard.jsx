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
