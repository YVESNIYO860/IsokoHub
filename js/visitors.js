function formatPageLabel(pagePath = '') {
  const pageKey = String(pagePath).split('?')[0].replace(/\/$/, '').toLowerCase();
  const pageNames = {
    '': 'Homepage',
    '/': 'Homepage',
    '/index.html': 'Homepage',
    '/sell.html': 'Sell page',
    '/houses-rent.html': 'Househub',
    '/products.html': 'Marketplace',
    '/shop.html': 'Shop page',
    '/dashboard.html': 'User dashboard',
    '/admin.html': 'Admin dashboard',
    '/visitors.html': 'Visitor analytics',
    '/product.html': 'Product detail'
  };
  return pageNames[pageKey] || pageKey.replace(/\//g, '') || 'Unknown page';
}

function renderVisitorPlacesGraph(rows = []) {
  const graphEl = document.getElementById('visitor-places-graph');
  if (!graphEl) return;

  const totals = rows.reduce((acc, visit) => {
    const page = formatPageLabel(visit.page || 'Unknown');
    acc[page] = (acc[page] || 0) + 1;
    return acc;
  }, {});

  const pageEntries = Object.entries(totals)
    .filter(([page]) => page)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  if (pageEntries.length === 0) {
    graphEl.innerHTML = '<div class="text-center">No visit place data available yet.</div>';
    return;
  }

  const maxValue = Math.max(...pageEntries.map(([, count]) => count), 1);
  graphEl.innerHTML = pageEntries.map(([page, count]) => {
    const width = Math.round((count / maxValue) * 100);
    return `
      <div class="analytics-graph-row">
        <div class="analytics-graph-label">${page}</div>
        <div class="analytics-graph-bar-wrap">
          <span class="analytics-graph-bar" style="width:${width}%;"></span>
        </div>
        <div class="analytics-graph-value">${count}</div>
      </div>
    `;
  }).join('');
}

async function renderVisitorsAnalytics() {
  const visitorCount = await fetchSiteVisitCount();
  const hourly = await fetchSiteVisitMetrics('hourly');
  const daily = await fetchSiteVisitMetrics('daily');
  const weekly = await fetchSiteVisitMetrics('weekly');
  const monthly = await fetchSiteVisitMetrics('monthly');

  document.getElementById('visitor-count').textContent = visitorCount;
  document.getElementById('visitor-hourly-count').textContent = hourly;
  document.getElementById('visitor-daily-count').textContent = daily;
  document.getElementById('visitor-weekly-count').textContent = weekly;
  document.getElementById('visitor-monthly-count').textContent = monthly;

  const rows = await fetchRecentVisits(100);
  renderVisitorPlacesGraph(rows);

  const body = document.getElementById('visitor-table-body');
  const recentRows = rows.slice(0, 12);
  body.innerHTML = '';

  if (!recentRows || recentRows.length === 0) {
    body.innerHTML = '<tr><td colspan="3" class="text-center">No recent visitor records found.</td></tr>';
    return;
  }

  recentRows.forEach((visit) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${new Date(visit.visited_at || visit.timestamp || '').toLocaleString()}</td>
      <td>${visit.page || 'Unknown'}</td>
      <td>${visit.visitor_id || 'Guest'}</td>
    `;
    body.appendChild(row);
  });
}

renderVisitorsAnalytics();
