import { useEffect } from 'react';

export default function Visitors() {
  useEffect(() => {
    document.title = 'Visitor Analytics - IsokoHub';
  }, []);

  return (
    <main className="admin-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-title">
            <i className="fa-solid fa-chart-line" style={{ color: '#3b82f6' }}></i>
            Visitor Analytics
          </h1>
          <p className="text-muted">Track website traffic with hourly, daily, weekly, and monthly visitor metrics.</p>
        </div>
        <div className="admin-page-actions">
          <a href="admin.html" className="btn btn-secondary">Back to Admin</a>
        </div>
      </div>

      <section className="admin-main">
        <div className="admin-stat-cards">
          <div className="admin-stat-card">
            <span className="stat-label">Total Visits</span>
            <strong id="visitor-count">0</strong>
            <p className="text-muted">All visits tracked across the marketplace.</p>
          </div>
          <div className="admin-stat-card">
            <span className="stat-label">Hourly Visits</span>
            <strong id="visitor-hourly-count">0</strong>
            <p className="text-muted">Last 60 minutes of traffic.</p>
          </div>
          <div className="admin-stat-card">
            <span className="stat-label">Daily Visits</span>
            <strong id="visitor-daily-count">0</strong>
            <p className="text-muted">Last 24 hours of traffic.</p>
          </div>
          <div className="admin-stat-card">
            <span className="stat-label">Weekly Visits</span>
            <strong id="visitor-weekly-count">0</strong>
            <p className="text-muted">Last 7 days of traffic.</p>
          </div>
          <div className="admin-stat-card">
            <span className="stat-label">Monthly Visits</span>
            <strong id="visitor-monthly-count">0</strong>
            <p className="text-muted">Last 30 days of traffic.</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="admin-section-title">Visitor Places Overview</div>
          <div id="visitor-places-graph" className="analytics-graph">
            <div className="text-center">Loading visitor place breakdown...</div>
          </div>
          <p className="text-muted analytics-description">This chart shows the most visited pages (places) across IsokoHub and helps you understand which sections of the marketplace visitors use most often.</p>
        </div>

        <div className="dashboard-card">
          <div className="admin-section-title">Recent Visits</div>
          <div className="visitor-table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Page</th>
                  <th>Visitor ID</th>
                </tr>
              </thead>
              <tbody id="visitor-table-body">
                <tr>
                  <td colSpan="3" className="text-center">Loading visitor records...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
