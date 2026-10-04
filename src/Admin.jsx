import { useEffect } from 'react';

export default function Admin() {
  useEffect(() => {
    document.title = 'Admin Dashboard - IsokoHub';
  }, []);

  return (
    <main className="admin-command-center">
      <div className="admin-shell-header">
        <div>
          <div className="admin-eyebrow">IsokoHub operations</div>
          <h1>Good morning, administrator.</h1>
          <p>Keep the marketplace healthy from one focused workspace. Review what needs attention, then move on.</p>
        </div>
        <div className="admin-header-actions">
          <button id="admin-sidebar-toggle" className="btn btn-secondary admin-sidebar-toggle" aria-expanded="false" aria-controls="admin-sidebar"><i className="fa-solid fa-bars"></i> Menu</button>
          <button id="refresh-admin-btn" className="btn btn-primary"><i className="fa-solid fa-rotate"></i> Refresh</button>
        </div>
      </div>

      <div className="admin-shell-grid">
        <aside id="admin-sidebar" className="admin-sidebar">
          <h2>Workspace</h2>
          <div className="admin-menu">
            <button type="button" className="active" data-tab="pending">Pending Review</button>
            <button type="button" data-tab="inventory">Inventory</button>
            <button type="button" data-tab="users">Users</button>
            <button type="button" data-tab="shops">Shop Management</button>
            <button type="button" data-tab="settings">Settings</button>
            <a href="admin-chat.html" className="admin-secondary-link"><i className="fa-solid fa-comments"></i> Conversation Inbox</a>
          </div>

          <div className="admin-sidebar-section">
            <h3>Filter by category</h3>
            <select id="admin-category-filter"><option value="all">All categories</option></select>
          </div>

          <div className="admin-quick-actions"><h3>Today</h3><p>Start with pending reviews. Keep response time low and the marketplace trustworthy.</p></div>
        </aside>

        <section className="admin-main">
          <div id="admin-stat-cards" className="admin-stat-cards" aria-live="polite"></div>
          <div className="dashboard-card">
            <div id="admin-content">
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
                <p className="mt-1">Loading dashboard data...</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
