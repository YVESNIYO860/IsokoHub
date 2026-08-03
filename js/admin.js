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
  const tabShops = document.getElementById('tab-shops');
  const tabSettings = document.getElementById('tab-settings');
  const menuButtons = Array.from(document.querySelectorAll('.admin-menu button'));
  const refreshBtn = document.getElementById('refresh-admin-btn');
  const urlParams = new URLSearchParams(window.location.search);

  let activeTab = ['pending', 'ads', 'inventory', 'users', 'shops', 'settings'].includes(urlParams.get('tab') || urlParams.get('view')) ? (urlParams.get('tab') || urlParams.get('view')) : 'pending';
  let selectedCategory = 'all';
  let editingShopId = null;
  const rwandaDistricts = [
    'Kigali',
    'Bugesera',
    'Burera',
    'Gakenke',
    'Gatsibo',
    'Gasabo',
    'Gicumbi',
    'Gisagara',
    'Huye',
    'Kamonyi',
    'Karongi',
    'Kayonza',
    'Kicukiro',
    'Kirehe',
    'Muhanga',
    'Musanze',
    'Ngoma',
    'Ngororero',
    'Nyabihu',
    'Nyagatare',
    'Nyamagabe',
    'Nyamasheke',
    'Nyanza',
    'Nyarugenge',
    'Nyaruguru',
    'Rubavu',
    'Ruhango',
    'Rulindo',
    'Rusizi',
    'Rutsiro',
    'Rwamagana'
  ];

  function escapeHtml(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function loadShopSettings() {
    try {
      const raw = localStorage.getItem('isokoHubAdminShops');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('Invalid shop settings', err);
      return [];
    }
  }

  function saveShopSettings(shops = []) {
    localStorage.setItem('isokoHubAdminShops', JSON.stringify(shops));
  }

  function createShopId() {
    return `shop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

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
    [tabPending, tabAds, tabInventory, tabUsers, tabShops, tabSettings].forEach((btn) => {
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
  if (tabShops) tabShops.onclick = () => switchTab('shops');
  if (tabSettings) tabSettings.onclick = () => switchTab('settings');

  menuButtons.forEach((btn) => {
    btn.onclick = () => switchTab(btn.dataset.tab);
  });

  if (refreshBtn) {
    refreshBtn.onclick = () => renderAdmin();
  }

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

  window.editShop = function(id) {
    editingShopId = id;
    renderAdmin();
  };

  window.cancelShopEdit = function() {
    editingShopId = null;
    renderAdmin();
  };

  window.saveShop = function() {
    const name = document.getElementById('shop-name')?.value?.trim() || '';
    const description = document.getElementById('shop-description')?.value?.trim() || '';
    const slogan = document.getElementById('shop-slogan')?.value?.trim() || '';
    const logoUrl = document.getElementById('shop-logo-url')?.value?.trim() || '';
    const bio = document.getElementById('shop-bio')?.value?.trim() || '';
    const location = document.getElementById('shop-location')?.value?.trim() || '';
    const contact = document.getElementById('shop-contact')?.value?.trim() || '';
    const status = document.getElementById('shop-status')?.value || 'active';

    if (!name) {
      alert('Shop name is required.');
      return;
    }

    const shops = loadShopSettings();
    const profile = {
      slogan,
      logoUrl,
      bio
    };

    if (editingShopId) {
      const index = shops.findIndex((shop) => shop.id === editingShopId);
      if (index >= 0) {
        shops[index] = { ...shops[index], name, description, location, contact, status, profile };
      }
    } else {
      shops.unshift({ id: createShopId(), name, description, location, contact, status, profile, products: [] });
    }

    saveShopSettings(shops);
    editingShopId = null;
    renderAdmin();
  };

  window.deleteShop = function(id) {
    if (!confirm('Delete this shop and its assignments?')) return;
    const shops = loadShopSettings().filter((shop) => shop.id !== id);
    saveShopSettings(shops);
    if (editingShopId === id) editingShopId = null;
    renderAdmin();
  };

  window.addProductToShop = function(shopId) {
    const select = document.getElementById(`shop-product-select-${shopId}`);
    const productId = select?.value;
    if (!productId) return;

    const shops = loadShopSettings();
    const shop = shops.find((entry) => entry.id === shopId);
    if (!shop) return;

    if (!shop.products.includes(productId)) {
      shop.products = [...(shop.products || []), productId];
      saveShopSettings(shops);
    }
    renderAdmin();
  };

  window.removeProductFromShop = function(shopId, productId) {
    const shops = loadShopSettings();
    const shop = shops.find((entry) => entry.id === shopId);
    if (!shop) return;
    shop.products = (shop.products || []).filter((entryId) => entryId !== productId);
    saveShopSettings(shops);
    renderAdmin();
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
        <div style="max-width: 1000px; margin: 0 auto; padding: 1rem; display:grid; gap:1.25rem;">
          <div>
            <h2>Admin Settings</h2>
            <p class="text-muted">Manage marketplace defaults, support contact details, announcements, and moderation preferences.</p>
          </div>

          <div style="display:grid; gap:1rem;">
            <div style="border:1px solid #e2e8f0; border-radius:16px; padding:1rem; background:#f8fafc;">
              <h3 style="margin-bottom:0.75rem;">Support & communication</h3>
              <div style="display:grid; gap:0.9rem;">
                <label style="display:flex; flex-direction:column; gap:0.4rem;">
                  Default support email
                  <input id="admin-default-email" class="form-control" type="email" value="${settings.supportEmail || ''}" placeholder="admin@isokohub.com">
                </label>
                <label style="display:flex; flex-direction:column; gap:0.4rem;">
                  Default support phone
                  <input id="admin-default-phone" class="form-control" type="tel" value="${settings.supportPhone || ''}" placeholder="+250 788 123 456">
                </label>
                <label style="display:flex; flex-direction:column; gap:0.4rem;">
                  Admin announcement
                  <textarea id="admin-announcement" class="form-control" rows="3" placeholder="Display a short notice to site admins and sellers.">${settings.announcement || ''}</textarea>
                </label>
              </div>
            </div>

            <div style="border:1px solid #e2e8f0; border-radius:16px; padding:1rem; background:#f8fafc;">
              <h3 style="margin-bottom:0.75rem;">Marketplace controls</h3>
              <div style="display:grid; gap:0.8rem;">
                <label style="display:flex; align-items:center; gap:0.75rem; font-weight:600;">
                  <input id="admin-maintenance-mode" type="checkbox" ${settings.maintenanceMode ? 'checked' : ''}>
                  Enable maintenance mode (temporary marketplace shutdown)
                </label>
                <label style="display:flex; align-items:center; gap:0.75rem; font-weight:600;">
                  <input id="admin-auto-approve" type="checkbox" ${settings.autoApprove ? 'checked' : ''}>
                  Auto-approve listings with complete seller details
                </label>
                <label style="display:flex; align-items:center; gap:0.75rem; font-weight:600;">
                  <input id="admin-show-promoted" type="checkbox" ${settings.showPromoted ? 'checked' : ''}>
                  Show promoted listings on the homepage
                </label>
              </div>
            </div>

            <div style="border:1px solid #e2e8f0; border-radius:16px; padding:1rem; background:#f8fafc;">
              <h3 style="margin-bottom:0.75rem;">Display preferences</h3>
              <div style="display:grid; gap:0.9rem;">
                <label style="display:flex; flex-direction:column; gap:0.4rem;">
                  Default dashboard view
                  <select id="admin-dashboard-view" class="form-control">
                    <option value="pending" ${settings.dashboardView === 'pending' ? 'selected' : ''}>Pending Review</option>
                    <option value="ads" ${settings.dashboardView === 'ads' ? 'selected' : ''}>Ad Requests</option>
                    <option value="inventory" ${settings.dashboardView === 'inventory' ? 'selected' : ''}>Inventory</option>
                    <option value="users" ${settings.dashboardView === 'users' ? 'selected' : ''}>Users</option>
                  </select>
                </label>
                <label style="display:flex; flex-direction:column; gap:0.4rem;">
                  Refresh interval (seconds)
                  <input id="admin-refresh-interval" class="form-control" type="number" min="10" max="300" value="${settings.refreshInterval || 30}">
                </label>
              </div>
            </div>
          </div>

          <div style="display:flex; gap:0.75rem; flex-wrap:wrap; margin-top:0.5rem;">
            <button id="admin-save-settings" class="btn btn-primary">Save settings</button>
            <button id="admin-reset-settings" class="btn btn-secondary">Reset to defaults</button>
          </div>
          <div id="admin-settings-status" style="color:#0b6c4a; font-size:0.95rem; display:none; margin-top:0.25rem;"></div>
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
          const refreshInterval = Number(document.getElementById('admin-refresh-interval').value || 30);
          const newSettings = {
            supportEmail: document.getElementById('admin-default-email').value.trim(),
            supportPhone: document.getElementById('admin-default-phone').value.trim(),
            maintenanceMode: document.getElementById('admin-maintenance-mode').checked,
            autoApprove: document.getElementById('admin-auto-approve').checked,
            showPromoted: document.getElementById('admin-show-promoted').checked,
            dashboardView: document.getElementById('admin-dashboard-view').value,
            refreshInterval: Number.isFinite(refreshInterval) ? Math.min(300, Math.max(10, refreshInterval)) : 30,
            announcement: document.getElementById('admin-announcement').value.trim()
          };
          saveAdminSettings(newSettings);
          showStatus('Settings saved locally.');
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('isokoHubAdminSettings', JSON.stringify(newSettings));
          }
        };
      }

      if (resetButton) {
        resetButton.onclick = () => {
          saveAdminSettings({});
          showStatus('Defaults restored.');
          setTimeout(() => renderAdmin(), 120);
        };
      }

      return;
    }

    if (activeTab === 'shops') {
      const shops = loadShopSettings();
      const editingShop = shops.find((shop) => shop.id === editingShopId) || null;
      const productOptions = allProducts.map((item) => `<option value="${item.id}">${escapeHtml(item.name || 'Untitled product')}</option>`).join('');

      content.innerHTML = `
        <div style="display:grid; gap:1.25rem;">
          <div style="border:1px solid #e2e8f0; border-radius:16px; padding:1rem; background:#f8fafc;">
            <h3 style="margin-bottom:0.75rem;">${editingShop ? 'Edit shop' : 'Create a new shop'}</h3>
            <div style="display:grid; gap:0.8rem;">
              <label style="display:flex; flex-direction:column; gap:0.35rem;">
                Shop name
                <input id="shop-name" class="form-control" type="text" value="${escapeHtml(editingShop?.name || '')}" placeholder="e.g. Fashion Hub">
              </label>
              <label style="display:flex; flex-direction:column; gap:0.35rem;">
                Description
                <textarea id="shop-description" class="form-control" rows="2" placeholder="What does this shop specialize in?">${escapeHtml(editingShop?.description || '')}</textarea>
              </label>
              <label style="display:flex; flex-direction:column; gap:0.35rem;">
                Slogan
                <input id="shop-slogan" class="form-control" type="text" value="${escapeHtml(editingShop?.profile?.slogan || '')}" placeholder="e.g. Quality goods, fair prices">
              </label>
              <label style="display:flex; flex-direction:column; gap:0.35rem;">
                Logo URL
                <input id="shop-logo-url" class="form-control" type="url" value="${escapeHtml(editingShop?.profile?.logoUrl || '')}" placeholder="https://example.com/logo.png">
              </label>
              <label style="display:flex; flex-direction:column; gap:0.35rem;">
                Shop bio
                <textarea id="shop-bio" class="form-control" rows="2" placeholder="Tell shoppers about your shop">${escapeHtml(editingShop?.profile?.bio || '')}</textarea>
              </label>
              <label style="display:flex; flex-direction:column; gap:0.35rem;">
                Location
                <select id="shop-location" class="form-control">
                  <option value="">Select district</option>
                  ${rwandaDistricts.map((district) => `<option value="${escapeHtml(district)}" ${editingShop?.location === district ? 'selected' : ''}>${escapeHtml(district)}</option>`).join('')}
                </select>
              </label>
              <label style="display:flex; flex-direction:column; gap:0.35rem;">
                Contact
                <input id="shop-contact" class="form-control" type="text" value="${escapeHtml(editingShop?.contact || '')}" placeholder="Phone or email">
              </label>
              <label style="display:flex; flex-direction:column; gap:0.35rem;">
                Status
                <select id="shop-status" class="form-control">
                  <option value="active" ${editingShop?.status === 'active' || !editingShop ? 'selected' : ''}>Active</option>
                  <option value="paused" ${editingShop?.status === 'paused' ? 'selected' : ''}>Paused</option>
                  <option value="maintenance" ${editingShop?.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                </select>
              </label>
              <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
                <button type="button" onclick="window.saveShop()" class="btn btn-primary">${editingShop ? 'Save changes' : 'Create shop'}</button>
                ${editingShop ? '<button type="button" onclick="window.cancelShopEdit()" class="btn btn-secondary">Cancel</button>' : ''}
              </div>
            </div>
          </div>

          <div style="display:grid; gap:1rem;">
            ${shops.length === 0 ? '<div class="text-muted">No shops yet. Create the first shop to start grouping products.</div>' : ''}
            ${shops.length > 0 ? `
              <div style="overflow-x:auto; border:1px solid #e2e8f0; border-radius:16px; background:#fff;">
                <table style="width:100%; border-collapse:collapse; min-width:780px;">
                  <thead>
                    <tr style="background:#f8fafc; text-align:left; border-bottom:1px solid #e2e8f0;">
                      <th style="padding:0.9rem 0.8rem; font-size:0.9rem;">Shop</th>
                      <th style="padding:0.9rem 0.8rem; font-size:0.9rem;">Details</th>
                      <th style="padding:0.9rem 0.8rem; font-size:0.9rem;">Status</th>
                      <th style="padding:0.9rem 0.8rem; font-size:0.9rem;">Products</th>
                      <th style="padding:0.9rem 0.8rem; font-size:0.9rem;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${shops.map((shop) => {
                      const assignedProducts = (shop.products || []).map((productId) => allProducts.find((entry) => entry.id === productId)).filter(Boolean);
                      return `
                        <tr style="border-bottom:1px solid #f1f5f9; vertical-align:top;">
                          <td style="padding:0.85rem 0.8rem;">
                            <div style="display:grid; gap:0.3rem;">
                              <strong>${escapeHtml(shop.name || 'Unnamed shop')}</strong>
                              <span class="text-muted" style="font-size:0.9rem;">${escapeHtml(shop.description || 'No description yet')}</span>
                            </div>
                          </td>
                          <td style="padding:0.85rem 0.8rem;">
                            <div style="display:grid; gap:0.25rem; color:#475569; font-size:0.92rem;">
                              <div><strong>Location:</strong> ${escapeHtml(shop.location || 'Not set')}</div>
                              <div><strong>Contact:</strong> ${escapeHtml(shop.contact || 'Not set')}</div>
                            </div>
                          </td>
                          <td style="padding:0.85rem 0.8rem;">
                            <span style="padding:0.35rem 0.7rem; border-radius:999px; background:#ecfeff; color:#0f766e; font-size:0.8rem; font-weight:700;">${escapeHtml(shop.status || 'active')}</span>
                          </td>
                          <td style="padding:0.85rem 0.8rem;">
                            <div style="display:grid; gap:0.35rem; min-width:220px;">
                              ${assignedProducts.length === 0 ? '<div class="text-muted">No products assigned yet.</div>' : assignedProducts.map((product) => `
                                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; padding:0.45rem 0.55rem; border:1px solid #e2e8f0; border-radius:10px; background:#f8fafc;">
                                  <span style="font-size:0.9rem;">${escapeHtml(product.name || 'Untitled product')}</span>
                                  <button type="button" onclick="window.removeProductFromShop('${shop.id}', '${product.id}')" class="btn btn-secondary" style="padding:0.24rem 0.6rem; font-size:0.78rem;">Remove</button>
                                </div>
                              `).join('')}
                            </div>
                          </td>
                          <td style="padding:0.85rem 0.8rem;">
                            <div style="display:grid; gap:0.55rem; min-width:220px;">
                              <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
                                <button type="button" onclick="window.editShop('${shop.id}')" class="btn btn-secondary">Edit</button>
                                <button type="button" onclick="window.deleteShop('${shop.id}')" class="btn btn-danger">Delete</button>
                              </div>
                              <div style="display:flex; gap:0.45rem; align-items:center; flex-wrap:wrap;">
                                <select id="shop-product-select-${shop.id}" class="form-control" style="max-width:180px; min-width:150px;">
                                  <option value="">Select a product</option>
                                  ${productOptions}
                                </select>
                                <button type="button" onclick="window.addProductToShop('${shop.id}')" class="btn btn-primary">Add</button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}
          </div>
        </div>
      `;
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

