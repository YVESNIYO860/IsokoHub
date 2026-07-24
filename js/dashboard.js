document.addEventListener('DOMContentLoaded', async () => {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  // Display user avatar from database
  const avatarImg = document.getElementById('user-avatar');
  if (avatarImg) {
    const avatarUrl = await getUserAvatar(user.id);
    avatarImg.src = avatarUrl;
  }

  document.getElementById('user-greeting').textContent = `Manage your inventory and promotions, ${user.name.split(' ')[0]}`;

  const urlParams = new URLSearchParams(window.location.search);
  const successMessage = urlParams.get('message');
  if (successMessage) {
    const header = document.querySelector('.dashboard-main-card');
    if (header) {
      const banner = document.createElement('div');
      banner.className = 'success-banner';
      banner.innerHTML = `<i class="fa-solid fa-circle-check"></i><span>${successMessage}</span>`;
      header.insertBefore(banner, header.firstChild);
    }
  }
  
  window.deleteItem = async function(id) {
    if(confirm('Are you sure you want to delete this listing? This will remove all associated data.')) {
      await deleteProduct(id);
      await renderDashboard(); 
    }
  };

  window.updateSoldStatus = async function(id, sold) {
    const action = sold ? 'sold' : 'available again';
    if (confirm(`Mark this listing as ${action}?`)) {
      await updateProductData(id, { sold, status: 'approved' });
      await renderDashboard();
    }
  };

  window.updateAvailability = async function(id, mode) {
    if (!['unavailable', 'available'].includes(mode)) return;
    const confirmMsg = mode === 'unavailable' ? 'Mark this listing as unavailable (hide from marketplace)?' : 'Make this listing available on the marketplace?';
    if (!confirm(confirmMsg)) return;
    try {
      if (mode === 'unavailable') {
        await updateProductData(id, { sold: true, status: 'unavailable' });
      } else {
        await updateProductData(id, { sold: false, status: 'approved' });
      }
      await renderDashboard();
    } catch (err) {
      console.error('Failed to update availability:', err);
      alert('Failed to update availability. Check console.');
    }
  };

  window.handleRequestAd = async function(id) {
    if(confirm('Request a premium Ad placement for this product? Admin will review your request.')) {
      try {
        await requestAdPlacement(id);
        alert('Ad request submitted successfully! Admin will review it soon.');
        await renderDashboard();
      } catch (err) {
        alert('Failed to submit ad request.');
      }
    }
  };

  async function renderDashboard() {
    const content = document.getElementById('dashboard-content');
    content.innerHTML = `
      <div style="text-align:center; padding: 2rem;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>
    `;

    try {
      // Prefer the Supabase session user id, fallback to localStorage user id
      let sellerId = (user && user.id) ? user.id : null;
      try {
        if (window.supabase && supabase && supabase.auth) {
          const session = supabase.auth.session ? supabase.auth.session() : null;
          if (session && session.user && session.user.id) sellerId = session.user.id;
        }
      } catch (e) {
        console.warn('Could not read supabase session for sellerId fallback', e);
      }

      console.debug('Dashboard: fetching products for sellerId=', sellerId);
      const myProducts = await fetchProducts(false, sellerId);

      // Update Stats
      const activeCount = myProducts.filter(p => p.status === 'approved').length;
      const totalValue = myProducts.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
      const adCount = myProducts.filter(p => p.is_ad).length;

      document.getElementById('stat-active').textContent = activeCount;
      document.getElementById('stat-value').textContent = formatPrice(totalValue);
      document.getElementById('stat-ads').textContent = adCount;

      if (myProducts.length === 0) {
        content.innerHTML = `
          <div style="text-align:center; padding: 5rem 2rem;">
            <i class="fa-solid fa-store-slash fa-4x" style="color: #cbd5e1; margin-bottom: 1.5rem;"></i>
            <h3 style="color: #475569;">No Listings Found</h3>
            <p class="text-muted mt-1">Start selling today by creating your first product listing.</p>
            <a href="sell.html" class="btn btn-primary mt-3" style="border-radius: 50px; padding: 1rem 2.5rem;">Create First Listing</a>
          </div>
        `;
        return;
      }

      content.innerHTML = `
        <div class="listing-grid">
          ${myProducts.map(p => {
          const displayImg = Array.isArray(p.image) ? p.image[0] : p.image;
          const isApproved = p.status === 'approved';
          const adRequested = p.ad_requested || false;
          const isAd = p.is_ad || false;
          const isSold = p.sold === true;

          let statusBg = '#fef9c3'; 
          let statusText = '#854d0e';
          let statusLabel = 'Pending Review';

          if (isApproved) {
            statusBg = '#dcfce7';
            statusText = '#166534';
            statusLabel = isSold ? 'Sold' : 'Live On Site';
          }

          return `
          <div class="seller-card">
            <div class="status-badge" style="background: ${statusBg}; color: ${statusText};">
              ${statusLabel}
            </div>
            ${isAd ? '<div class="status-badge" style="top:45px; background: #fff7ed; color: #9a3412; border: 1px solid #ffedd1;">✨ Promoted</div>' : ''}
            
            <img src="${displayImg}" class="seller-card-img" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"300\" viewBox=\"0 0 400 300\"><rect width=\"400\" height=\"300\" fill=\"%23f8fbff\"/><rect x=\"24\" y=\"24\" width=\"352\" height=\"252\" rx=\"20\" fill=\"%23ffffff\" stroke=\"%23dbeafe\" stroke-width=\"2\"/><circle cx=\"200\" cy=\"120\" r=\"56\" fill=\"%23e0f2fe\"/><path d=\"M140 220c20-42 100-42 120 0\" fill=\"%23bfdbfe\"/><text x=\"200\" y=\"268\" text-anchor=\"middle\" font-family=\"Arial, sans-serif\" font-size=\"18\" fill=\"%231d4ed8\">No image</text></svg>'">
            
            <div class="seller-card-body">
              <h4 style="margin-bottom: 0.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.name}</h4>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                <span style="font-weight: 700; color: var(--primary-blue); font-size: 1.1rem;">${formatPrice(p.price)}</span>
                <span class="text-muted" style="font-size: 0.8rem;">${p.category}</span>
              </div>

              ${isApproved && !isAd && !adRequested ? `
                <button onclick="handleRequestAd('${p.id}')" class="btn promote-btn">
                  <i class="fa-solid fa-bullhorn"></i> Advertise My Product
                </button>
              ` : ''}

              ${isApproved ? `
                    <div class="manage-actions" style="margin-top: 0.75rem;">
                      <button onclick="window.updateSoldStatus('${p.id}', true)" class="btn btn-secondary" style="flex:1; border-radius:50px; font-size: 0.85rem;">Mark Sold</button>
                      <button onclick="window.updateSoldStatus('${p.id}', false)" class="btn btn-secondary" style="flex:1; border-radius:50px; font-size: 0.85rem;">Available</button>
                      <button onclick="window.updateAvailability('${p.id}', '${isSold ? 'available' : 'unavailable'}')" class="btn btn-warning" style="flex:1; border-radius:50px; font-size: 0.85rem;">${isSold ? 'Make Available' : 'Make Unavailable'}</button>
                    </div>
              ` : ''}

              ${adRequested ? `
                <button class="btn btn-secondary btn-block" disabled style="opacity: 0.7; margin-top: 1rem; border-radius:50px;">
                  <i class="fa-solid fa-clock"></i> Ad Review Sent
                </button>
              ` : ''}

              <div class="manage-actions">
                <a href="sell.html?editId=${p.id}" class="btn btn-secondary" style="flex:1; border-radius:50px; font-size: 0.85rem;">Edit</a>
                <button onclick="deleteItem('${p.id}')" class="btn btn-danger" style="flex:1; border-radius:50px; font-size: 0.85rem;">Delete</button>
              </div>
            </div>
          </div>
          `;
        }).join('')}
      </div>
    `;
    } catch (err) {
      console.error('Error rendering dashboard:', err);
      content.innerHTML = `
        <div style="text-align:center; padding: 3rem;">
          <h3 style="color:#b91c1c;">Failed to load listings</h3>
          <p class="text-muted">${(err && err.message) ? err.message : 'An unexpected error occurred.'}</p>
          <p style="font-size:0.85rem; color:#6b7280;">Check the browser console for details.</p>
        </div>
      `;
    } finally {
      try { hideAppLoader(); } catch(e) { /* ignore */ }
    }
  }

  await renderDashboard();
});

