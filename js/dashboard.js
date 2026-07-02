document.addEventListener('DOMContentLoaded', async () => {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  document.getElementById('user-greeting').textContent = `Manage your inventory and promotions, ${user.name.split(' ')[0]}`;
  
  window.deleteItem = async function(id) {
    if(confirm('Are you sure you want to delete this listing? This will remove all associated data.')) {
      await deleteProduct(id);
      await renderDashboard(); 
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
    const myProducts = await fetchProducts(false, user.id);

    // Update Stats
    const activeCount = myProducts.filter(p => p.status === 'approved').length;
    const totalValue = myProducts.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
    const adCount = myProducts.filter(p => p.isAd).length;

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
          const adRequested = p.adRequested || false;
          const isAd = p.isAd || false;

          let statusBg = '#fef9c3'; 
          let statusText = '#854d0e';
          let statusLabel = 'Pending Review';

          if (isApproved) {
            statusBg = '#dcfce7';
            statusText = '#166534';
            statusLabel = 'Live On Site';
          }

          return `
          <div class="seller-card">
            <div class="status-badge" style="background: ${statusBg}; color: ${statusText};">
              ${statusLabel}
            </div>
            ${isAd ? '<div class="status-badge" style="top:45px; background: #fff7ed; color: #9a3412; border: 1px solid #ffedd1;">Promoted</div>' : ''}
            
            <img src="${displayImg}" class="seller-card-img" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
            
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
  }

  await renderDashboard();
});

