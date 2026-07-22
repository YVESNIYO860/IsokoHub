document.addEventListener('DOMContentLoaded', async () => {
  const user = getCurrentUser();
  const ADMIN_EMAIL = 'yvesniyonkuru2022@gmail.com';
  const isAdminEmail = (email) => !!email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Admin access is determined locally by the signed-in account and stored role.
  let isAdminUser = !!(user?.role === 'admin' || isAdminEmail(user?.email));
  if (!isAdminUser && isAdminEmail(user?.email) && typeof saveUserProfile === 'function') {
    try {
      await saveUserProfile(user.id, {
        email: user.email,
        full_name: user.name || user.full_name || user.email,
        role: 'admin',
        phone: user.phone || '',
        avatar_url: user.avatarUrl || null,
        created_at: new Date().toISOString()
      });
      isAdminUser = true;
      if (user) {
        localStorage.setItem('isokoHubCurrentUser', JSON.stringify({ ...user, role: 'admin' }));
      }
    } catch (err) {
      console.warn('Admin role sync skipped:', err);
    }
  }

  // Final fallback: Check email if DB check failed or document missing
  if (!isAdminUser) {
    alert('Access Denied: Administrative privileges required.');
    window.location.href = 'index.html';
    return;
  }

  const content = document.getElementById('admin-content');
  const countSpan = document.getElementById('pending-count');
  const adCountSpan = document.getElementById('ad-request-count');
  const approvedCountSpan = document.getElementById('approved-count');
  const totalCountSpan = document.getElementById('total-count');
  const userCountSpan = document.getElementById('user-count');
  const categorySelect = document.getElementById('admin-category-filter');
  const tabPending = document.getElementById('tab-pending');
  const tabAds = document.getElementById('tab-ads');
  const tabInventory = document.getElementById('tab-inventory');
  const tabUsers = document.getElementById('tab-users');
  const tabSettings = document.getElementById('tab-settings');
  const menuButtons = Array.from(document.querySelectorAll('.admin-menu button'));
  const refreshBtn = document.getElementById('refresh-admin-btn');

  let activeTab = 'pending';
  let selectedCategory = 'all';

  if (categorySelect) {
    categorySelect.addEventListener('change', () => {
      selectedCategory = categorySelect.value || 'all';
      renderAdmin();
    });
  }

  function getUniqueCategories(items = []) {
    const categories = new Set();
    items.forEach((item) => {
      if (item?.category) categories.add(item.category);
      else if (item?.subcategory) categories.add(item.subcategory);
    });
    return Array.from(categories).sort((a, b) => a.localeCompare(b));
  }

  function updateCategoryFilterOptions(categories) {
    if (!categorySelect) return;
    const currentValue = categorySelect.value || 'all';
    categorySelect.innerHTML = `
      <option value="all">All categories</option>
      ${categories.map((category) => `<option value="${category}">${category}</option>`).join('')}
    `;
    categorySelect.value = currentValue;
  }

  function loadAdminSettings() {
    const raw = localStorage.getItem('isokoHubAdminSettings');
    try {
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.warn('Invalid saved admin settings', err);
      return {};
    }
  }

  function saveAdminSettings(settings) {
    localStorage.setItem('isokoHubAdminSettings', JSON.stringify(settings || {}));
  }

  const switchTab = (tab) => {
    activeTab = tab;
    [tabPending, tabAds, tabInventory, tabUsers, tabSettings].forEach((btn) => {
      if (!btn) return;
      btn.classList.toggle('active-tab', btn.id === `tab-${tab}`);
    });
    menuButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    renderAdmin();
  };

  tabPending.onclick = () => switchTab('pending');
  tabAds.onclick = () => switchTab('ads');
  tabInventory.onclick = () => switchTab('inventory');
  if (tabUsers) tabUsers.onclick = () => switchTab('users');
  if (tabSettings) tabSettings.onclick = () => switchTab('settings');

  menuButtons.forEach((btn) => {
    btn.onclick = () => switchTab(btn.dataset.tab);
  });

  if (refreshBtn) {
    refreshBtn.onclick = () => renderAdmin();
  }

  setInterval(() => {
    renderAdmin();
  }, 30000);

  window.handleApprove = async function(id) {
    if (confirm('Approve this product for public listing?')) {
      await updateProductStatus(id, 'approved');
      renderAdmin();
    }
  };

  window.handleReject = async function(id) {
    if (confirm('REJECT and DELETE this listing? This cannot be undone.')) {
      await deleteProduct(id);
      renderAdmin();
    }
  };

  window.handleApproveAd = async function(id) {
    if (confirm('Approve this Ad placement? It will appear in the Homepage Promoted section.')) {
      await approveAdPlacement(id);
      renderAdmin();
    }
  };

  window.handleRejectAd = async function(id) {
    if (confirm('Reject this Ad request?')) {
      await rejectAdPlacement(id);
      renderAdmin();
    }
  };

  window.handleMarkSold = async function(id) {
    if (confirm('Mark this product as sold?')) {
      await updateProductData(id, { sold: true, status: 'approved' });
      renderAdmin();
    }
  };

  window.handleMarkAvailable = async function(id) {
    if (confirm('Mark this product as available again?')) {
      await updateProductData(id, { sold: false, status: 'approved' });
      renderAdmin();
    }
  };

  window.handleRestorePending = async function(id) {
    if (confirm('Send this listing back to review?')) {
      await updateProductStatus(id, 'pending');
      renderAdmin();
    }
  };

  window.handleRemoveBoost = async function(id) {
    if (confirm('Remove the boost/ad status from this listing?')) {
      await updateProductData(id, { is_ad: false, ad_requested: false });
      renderAdmin();
    }
  };

  window.handleOpenListing = function(id) {
    window.open(`product.html?id=${id}`, '_blank', 'noopener,noreferrer');
  };

  window.handleCopyPhone = async function(phone) {
    if (!phone) {
      alert('No phone number available.');
      return;
    }

    try {
      await navigator.clipboard.writeText(phone);
      alert('Seller phone copied.');
    } catch (err) {
      prompt('Copy seller phone manually:', phone);
    }
  };

  async function renderAdmin() {
    content.innerHTML = `<div style="text-align:center; padding: 2rem;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>`;

    const [
      pendingProducts,
      adRequests,
      allProducts,
      pendingCount,
      approvedCount,
      totalCount,
      adRequestCount,
      userCount
    ] = await Promise.all([
      fetchPendingProducts(),
      fetchAdRequests(),
      fetchProducts(false),
      fetchProductCount({ status: 'pending' }),
      fetchProductCount({ status: 'approved' }),
      fetchProductCount(),
      fetchProductCount({ ad_requested: true }),
      fetchUserCount()
    ]);

    const categories = getUniqueCategories([...pendingProducts, ...adRequests, ...allProducts]);
    updateCategoryFilterOptions(categories);

    countSpan.textContent = pendingCount;
    adCountSpan.textContent = adRequestCount;
    approvedCountSpan.textContent = approvedCount;
    totalCountSpan.textContent = totalCount;
    userCountSpan.textContent = userCount;

    // Debug info for admin to diagnose empty queues and verify Supabase connectivity.
    const supabaseStatus = (typeof supabase !== 'undefined' && supabase) ? 'initialized' : 'missing';
    const debugHtml = `
      <div style="margin: 0.5rem 0 1rem; padding: 0.75rem; border-radius:8px; background:#0f172a; color:#fff; font-size:0.9rem;">
        <strong>Debug:</strong>
        <div>Supabase: ${supabaseStatus}</div>
        <div>Pending fetched: ${pendingProducts.length}</div>
        <div>Ad requests fetched: ${adRequests.length}</div>
        <div>Total products fetched: ${allProducts.length}</div>
        <div style="margin-top:0.5rem;"><button id="admin-debug-toggle" class="btn btn-secondary" style="border-radius:50px; padding:0.25rem 0.8rem; font-size:0.85rem;">Show raw fetch data</button></div>
        <div id="admin-debug-json" style="display:none; margin-top:0.75rem; max-height:220px; overflow:auto; background:#fff; color:#111; padding:0.75rem; border-radius:6px;"></div>
      </div>
    `;

    // Insert or replace debug block above content
    const existingDebug = document.getElementById('admin-debug-block');
    if (!existingDebug) {
      const wrapper = document.createElement('div');
      wrapper.id = 'admin-debug-block';
      wrapper.innerHTML = debugHtml;
      content.parentNode.insertBefore(wrapper, content);
    } else {
      existingDebug.innerHTML = debugHtml;
    }

    // Hook toggle button
    setTimeout(() => {
      const btn = document.getElementById('admin-debug-toggle');
      const jsonDiv = document.getElementById('admin-debug-json');
      if (!btn || !jsonDiv) return;
      btn.onclick = () => {
        if (jsonDiv.style.display === 'none') {
          jsonDiv.style.display = 'block';
          jsonDiv.textContent = 'Pending:\n' + JSON.stringify(pendingProducts.slice(0,10), null, 2) + '\n\nAd Requests:\n' + JSON.stringify(adRequests.slice(0,10), null, 2) + '\n\nAll Products:\n' + JSON.stringify(allProducts.slice(0,10), null, 2);
          btn.textContent = 'Hide raw fetch data';
        } else {
          jsonDiv.style.display = 'none';
          btn.textContent = 'Show raw fetch data';
        }
      };
    }, 50);

    // If Users tab active, render users management and return
    if (activeTab === 'settings') {
      const settings = loadAdminSettings();
      content.innerHTML = `
        <div style="max-width: 900px; margin: 0 auto; padding: 1rem;">
          <h2>Admin Settings</h2>
          <p class="text-muted">Configure marketplace defaults, support contact information, and maintenance mode.</p>
          <div style="margin-top:1.5rem; display:grid; gap:1rem;">
            <label style="display:flex; flex-direction:column; gap:0.5rem;">
              Default support email
              <input id="admin-default-email" class="form-control" type="email" value="${settings.supportEmail || ''}" placeholder="admin@isokohub.com">
            </label>
            <label style="display:flex; flex-direction:column; gap:0.5rem;">
              Default support phone
              <input id="admin-default-phone" class="form-control" type="tel" value="${settings.supportPhone || ''}" placeholder="+250 788 123 456">
            </label>
            <label style="display:flex; align-items:center; gap:0.75rem; font-weight:600;">
              <input id="admin-maintenance-mode" type="checkbox" ${settings.maintenanceMode ? 'checked' : ''}>
              Enable maintenance mode (for temporary marketplace shutdown)
            </label>
            <label style="display:flex; flex-direction:column; gap:0.5rem;">
              Admin announcement
              <textarea id="admin-announcement" class="form-control" rows="3" placeholder="Display a short notice to site admins and sellers.">${settings.announcement || ''}</textarea>
            </label>
            <div style="display:flex; gap:0.75rem; flex-wrap:wrap; margin-top:0.5rem;">
              <button id="admin-save-settings" class="btn btn-primary">Save settings</button>
              <button id="admin-reset-settings" class="btn btn-secondary">Reset to defaults</button>
            </div>
            <div id="admin-settings-status" style="color:#0b6c4a; font-size:0.95rem; display:none; margin-top:0.75rem;"></div>
          </div>
        </div>
      `;

      const saveButton = document.getElementById('admin-save-settings');
      const resetButton = document.getElementById('admin-reset-settings');
      const statusEl = document.getElementById('admin-settings-status');

      function showStatus(message, success = true) {
        statusEl.style.display = 'block';
        statusEl.style.color = success ? '#0b6c4a' : '#b91c1c';
        statusEl.textContent = message;
      }

      if (saveButton) {
        saveButton.onclick = () => {
          const newSettings = {
            supportEmail: document.getElementById('admin-default-email').value.trim(),
            supportPhone: document.getElementById('admin-default-phone').value.trim(),
            maintenanceMode: document.getElementById('admin-maintenance-mode').checked,
            announcement: document.getElementById('admin-announcement').value.trim()
          };
          saveAdminSettings(newSettings);
          showStatus('Settings saved locally. Refresh to apply new values.');
        };
      }

      if (resetButton) {
        resetButton.onclick = () => {
          saveAdminSettings({});
          renderAdmin();
        };
      }

      return;
    }

    if (activeTab === 'users') {
      const users = await fetchUserProfiles();
      if (!users || users.length === 0) {
        content.innerHTML = `
          <div style="text-align:center; padding: 4rem 0;">
            <h3>No users found</h3>
            <p class="text-muted">User profiles are not available yet. The admin view will continue to work normally.</p>
          </div>
        `;
        return;
      }

      content.innerHTML = `
        <table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr style="text-align: left; border-bottom: 2px solid #eee;">
              <th style="padding: 1rem;">User</th>
              <th style="padding: 1rem;">Email</th>
              <th style="padding: 1rem;">Role</th>
              <th style="padding: 1rem;">Joined</th>
              <th style="padding: 1rem; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr style="border-bottom:1px solid #f4f4f4;">
                <td style="padding:1rem;">${u.full_name || 'User'}</td>
                <td style="padding:1rem;">${u.email || 'N/A'}</td>
                <td style="padding:1rem;">${u.role || 'seller'}</td>
                <td style="padding:1rem;">${u.created_at ? new Date(u.created_at).toLocaleString() : ''}</td>
                <td style="padding:1rem; text-align:right;">
                  <button onclick="window.changeUserRole('${u.id}', '${u.role === 'admin' ? 'seller' : 'admin'}')" class="btn btn-secondary" style="margin-right:0.5rem;">${u.role === 'admin' ? 'Demote' : 'Promote'}</button>
                  <button onclick="window.deleteUserProfileHandler('${u.id}')" class="btn btn-danger">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      window.changeUserRole = async function(id, newRole) {
        if (!confirm(`Change role of user to ${newRole}?`)) return;
        try {
          await updateUserProfileRole(id, newRole);
          alert('Role updated');
          renderAdmin();
        } catch (err) {
          console.error('Failed to update role:', err);
          alert('Failed to update role. Check console.');
        }
      };

      window.deleteUserProfileHandler = async function(id) {
        if (!confirm('Delete this user profile? (This will not delete the auth account)')) return;
        try {
          await deleteUserProfile(id);
          alert('Profile deleted');
          renderAdmin();
        } catch (err) {
          console.error('Failed to delete profile:', err);
          alert('Failed to delete profile. Check console.');
        }
      };

      return;
    }

    let items = [];
    let emptyMessage = '';

    if (activeTab === 'pending') {
      items = pendingProducts;
      emptyMessage = 'No listings are waiting for approval.';
    } else if (activeTab === 'ads') {
      items = adRequests;
      emptyMessage = 'No ad requests are waiting for review.';
    } else {
      items = allProducts;
      emptyMessage = 'No inventory items found.';
    }

    if (selectedCategory !== 'all') {
      const normalizedSelected = selectedCategory.toLowerCase();
      items = items.filter((p) => {
        const normalizedCategory = (p.category || p.subcategory || '').toString().toLowerCase();
        return normalizedCategory === normalizedSelected;
      });
      if (activeTab === 'pending' || activeTab === 'ads' || activeTab === 'inventory') {
        emptyMessage = `No ${activeTab === 'inventory' ? 'inventory' : activeTab === 'ads' ? 'ad requests' : 'pending listings'} found for "${selectedCategory}".`;
      }
    }

    if (items.length === 0) {
      content.innerHTML = `
        <div style="text-align:center; padding: 4rem 0;">
          <i class="fa-solid fa-circle-check fa-4x" style="color: #dcfce7; margin-bottom: 1rem;"></i>
          <h3>Queue Clear!</h3>
          <p class="text-muted">${emptyMessage}</p>
        </div>
      `;
      return;
    }

    if (activeTab === 'inventory') {
      content.innerHTML = `
        <div class="admin-item-grid">
          ${items.map(p => {
            const displayImg = Array.isArray(p.image) ? p.image[0] : p.image || 'https://via.placeholder.com/120';
            const isSold = p.sold === true;
            const statusBadge = isSold ? '<span class="admin-item-badge sold">Sold</span>' : '<span class="admin-item-badge active">Available</span>';
            return `
              <article class="admin-item-card">
                <div class="admin-item-card-header">
                  <img src="${displayImg}" class="admin-item-thumb" onerror="this.src='https://via.placeholder.com/120'" alt="${p.name || 'Product image'}">
                  <div class="admin-item-meta">
                    <div class="admin-item-title">${p.name || 'Untitled item'}</div>
                    <div class="admin-item-subtitle">${p.category || p.subcategory || 'Uncategorized'}</div>
                    <div>${statusBadge}</div>
                  </div>
                  <strong class="admin-item-price">${formatPrice(p.price)}</strong>
                </div>
                <div class="admin-item-body">
                  <div><strong>Seller:</strong> ${p.seller_name || p.seller_email || 'Unknown'}</div>
                  <div><strong>Email:</strong> ${p.seller_email || p.sellerEmail || 'N/A'}</div>
                  <div><strong>Phone:</strong> ${p.seller_phone || 'N/A'}</div>
                </div>
                <div class="admin-item-actions">
                  <button onclick="handleMarkSold('${p.id}')" class="btn btn-primary">Mark Sold</button>
                  <button onclick="handleMarkAvailable('${p.id}')" class="btn btn-secondary">Available</button>
                  <button onclick="handleRemoveBoost('${p.id}')" class="btn btn-secondary">Remove Boost</button>
                  <button onclick="handleCopyPhone('${p.seller_phone || ''}')" class="btn btn-secondary">Copy Phone</button>
                  <button onclick="handleOpenListing('${p.id}')" class="btn btn-secondary">View</button>
                  <button onclick="handleReject('${p.id}')" class="btn btn-danger">Delete</button>
                </div>
              </article>
            `;
          }).join('')}
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <table style="width:100%; border-collapse: collapse;">
        <thead>
          <tr style="text-align: left; border-bottom: 2px solid #eee;">
            <th style="padding: 1rem;">Item Details</th>
            <th style="padding: 1rem;">Seller Info</th>
            <th style="padding: 1rem;">Price</th>
            <th style="padding: 1rem; text-align: right;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(p => {
            const displayImg = Array.isArray(p.image) ? p.image[0] : p.image;
            const isSold = p.sold === true;
            return `
              <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 1rem;">
                  <div style="display:flex; gap: 1rem; align-items: center;">
                    <img src="${displayImg}" style="width:60px; height:60px; object-fit:cover; border-radius:8px;" onerror="this.src='https://via.placeholder.com/80x80'">
                    <div>
                      <h4 style="margin:0;">${p.name}</h4>
                      <p style="margin:0; font-size:0.8rem; color:#666;">Category: ${p.category}</p>
                      ${isSold ? '<p style="margin:0.2rem 0 0; color:#b91c1c; font-weight:700;">Sold</p>' : ''}
                    </div>
                  </div>
                </td>
                <td style="padding: 1rem; font-size: 0.85rem;">
                  <div><i class="fa-solid fa-phone"></i> ${p.seller_phone || 'N/A'}</div>
                </td>
                <td style="padding: 1rem; font-weight: 700;">${formatPrice(p.price)}</td>
                <td style="padding: 1rem; text-align: right;">
                  ${activeTab === 'pending' ? `
                    <button onclick="handleApprove('${p.id}')" class="btn btn-primary" style="padding:0.4rem 0.8rem; font-size:0.85rem; border-radius:50px; margin-bottom:0.35rem;">Approve</button>
                    <button onclick="handleRestorePending('${p.id}')" class="btn btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.85rem; border-radius:50px; margin-bottom:0.35rem;">Review Again</button>
                    <button onclick="handleCopyPhone('${p.seller_phone || ''}')" class="btn btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.85rem; border-radius:50px; margin-bottom:0.35rem;">Copy Phone</button>
                    <button onclick="handleOpenListing('${p.id}')" class="btn btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.85rem; border-radius:50px; margin-bottom:0.35rem;">View</button>
                    <button onclick="handleReject('${p.id}')" class="btn btn-danger" style="padding:0.4rem 0.8rem; font-size:0.85rem; border-radius:50px;">Reject</button>
                  ` : activeTab === 'ads' ? `
                    <button onclick="handleApproveAd('${p.id}')" class="btn btn-primary" style="background:#f59e0b; padding:0.4rem 0.8rem; font-size:0.85rem; border-radius:50px; border:none; margin-bottom:0.35rem;">Boost Ad</button>
                    <button onclick="handleRemoveBoost('${p.id}')" class="btn btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.85rem; border-radius:50px; margin-bottom:0.35rem;">Remove Boost</button>
                    <button onclick="handleCopyPhone('${p.seller_phone || ''}')" class="btn btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.85rem; border-radius:50px; margin-bottom:0.35rem;">Copy Phone</button>
                    <button onclick="handleOpenListing('${p.id}')" class="btn btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.85rem; border-radius:50px; margin-bottom:0.35rem;">View</button>
                    <button onclick="handleRejectAd('${p.id}')" class="btn btn-danger" style="padding:0.4rem 0.8rem; font-size:0.85rem; border-radius:50px;">Ignore</button>
                  ` : `
                    <button onclick="handleMarkSold('${p.id}')" class="btn btn-primary" style="padding:0.4rem 0.8rem; font-size:0.85rem; border-radius:50px; margin-bottom:0.35rem;">Mark Sold</button>
                    <button onclick="handleMarkAvailable('${p.id}')" class="btn btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.85rem; border-radius:50px; margin-bottom:0.35rem;">Available</button>
                    <button onclick="handleRemoveBoost('${p.id}')" class="btn btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.85rem; border-radius:50px; margin-bottom:0.35rem;">Remove Boost</button>
                    <button onclick="handleCopyPhone('${p.seller_phone || ''}')" class="btn btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.85rem; border-radius:50px; margin-bottom:0.35rem;">Copy Phone</button>
                    <button onclick="handleOpenListing('${p.id}')" class="btn btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.85rem; border-radius:50px; margin-bottom:0.35rem;">View</button>
                    <button onclick="handleReject('${p.id}')" class="btn btn-danger" style="padding:0.4rem 0.8rem; font-size:0.85rem; border-radius:50px;">Delete</button>
                  `}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  await renderAdmin();
});

