async function syncDashboardUserFromSupabase() {
  if (!window.supabase || !supabase || !supabase.auth || typeof supabase.auth.session !== 'function') {
    return null;
  }

  try {
    const session = supabase.auth.session();
    if (session?.user) {
      const user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
        role: session.user.email === 'yvesniyonkuru2022@gmail.com' ? 'admin' : 'seller'
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    }
  } catch (err) {
    console.warn('Unable to sync dashboard user from Supabase session:', err);
  }

  return null;
}

document.addEventListener('DOMContentLoaded', async () => {
  let user = getCurrentUser();

  if (!user) {
    user = await syncDashboardUserFromSupabase();
  }

  if (!user) {
    if (window.supabase && supabase && supabase.auth && typeof supabase.auth.onAuthStateChange === 'function') {
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          window.location.reload();
        }
      });
    }
    window.location.href = 'login.html';
    return;
  }

  // Display user avatar from database
  const avatarImg = document.getElementById('user-avatar');
  if (avatarImg) {
    const avatarUrl = await getUserAvatar(user.id, user.email);
    avatarImg.src = avatarUrl || createInitialsAvatarUrl(user.name, user.email);
  }

  document.getElementById('user-greeting').textContent = `Manage your inventory and promotions, ${user.name.split(' ')[0]}`;

  const urlParams = new URLSearchParams(window.location.search);
  const successMessage = urlParams.get('message');
  const initialView = urlParams.get('view') === 'settings' ? 'settings' : 'catalog';
  if (successMessage) {
    const header = document.querySelector('.dashboard-main-card');
    if (header) {
      const banner = document.createElement('div');
      banner.className = 'success-banner';
      banner.innerHTML = `<i class="fa-solid fa-circle-check"></i><span>${successMessage}</span>`;
      header.insertBefore(banner, header.firstChild);
    }
  }
  
  function updateStoredUserProfile(changes = {}) {
    const currentUser = getCurrentUser() || user;
    const updatedUser = {
      ...currentUser,
      ...changes,
      name: changes.name || changes.full_name || currentUser?.name || currentUser?.full_name || currentUser?.email?.split('@')[0] || 'User',
      full_name: changes.full_name || changes.name || currentUser?.full_name || currentUser?.name || currentUser?.email?.split('@')[0] || 'User'
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    user = updatedUser;
    return updatedUser;
  }

  window.openUserSettings = function() {
    window.location.href = 'dashboard.html?view=settings';
  };

  window.saveUserSettings = async function(event) {
    if (event) event.preventDefault();
    const statusEl = document.getElementById('user-settings-status');
    const nameInput = document.getElementById('user-settings-name');
    const phoneInput = document.getElementById('user-settings-phone');
    const notifyInput = document.getElementById('user-settings-notify');
    const saveButton = document.getElementById('user-settings-save');
    const themeSelect = document.getElementById('user-settings-theme');
    const compactToggle = document.getElementById('user-settings-compact');
    const reducedMotionToggle = document.getElementById('user-settings-reduced-motion');
    const highContrastToggle = document.getElementById('user-settings-high-contrast');

    const fullName = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const notificationsEnabled = notifyInput.checked;

    if (!fullName) {
      statusEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Please enter your name.';
      statusEl.style.display = 'block';
      return;
    }

    saveButton.disabled = true;
    saveButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    try {
      const updatedUser = updateStoredUserProfile({
        name: fullName,
        full_name: fullName,
        phone,
        notificationsEnabled,
        email: user.email
      });

      await saveUserProfile(user.id, {
        name: fullName,
        full_name: fullName,
        phone,
        notifications_enabled: notificationsEnabled,
        email: user.email
      });

      const appearanceSettings = {
        theme: themeSelect ? themeSelect.value : 'light',
        compactMode: compactToggle ? compactToggle.checked : false,
        reducedMotion: reducedMotionToggle ? reducedMotionToggle.checked : false,
        highContrast: highContrastToggle ? highContrastToggle.checked : false
      };
      saveDrawerUiSettings(appearanceSettings);

      document.getElementById('user-greeting').textContent = `Manage your inventory and promotions, ${fullName.split(' ')[0]}`;
      statusEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> Settings and appearance updated successfully.';
      statusEl.style.display = 'block';
      nameInput.value = updatedUser.name || fullName;
      phoneInput.value = updatedUser.phone || '';
      notifyInput.checked = Boolean(updatedUser.notificationsEnabled);
    } catch (err) {
      console.error('Failed to save user settings:', err);
      statusEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Unable to save settings right now.';
      statusEl.style.display = 'block';
    } finally {
      saveButton.disabled = false;
      saveButton.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save changes';
    }
  };

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

  async function renderDashboard(viewMode = 'catalog') {
    const content = document.getElementById('dashboard-content');
    content.innerHTML = `
      <div style="text-align:center; padding: 2rem;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>
    `;

    if (viewMode === 'settings') {
      const currentAppearance = getDrawerUiSettings();
      content.innerHTML = `
        <div style="border: 1px solid #e2e8f0; border-radius: 20px; padding: 1.5rem; background: #f8fafc;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:1rem; flex-wrap:wrap; margin-bottom: 1.25rem;">
            <div>
              <h3 style="margin-bottom: 0.25rem;">Account Settings</h3>
              <p class="text-muted" style="margin: 0;">Update your profile details and notification preferences.</p>
            </div>
            <a href="dashboard.html" class="btn btn-secondary" style="border-radius: 999px;">Back to listings</a>
          </div>

          <form id="user-settings-form" onsubmit="event.preventDefault(); window.saveUserSettings(event);">
            <div style="display:grid; gap:1rem;">
              <div>
                <label class="form-label" for="user-settings-name">Full name</label>
                <input id="user-settings-name" class="form-control" type="text" value="${escapeHtml(user?.name || user?.full_name || '')}" placeholder="Enter your full name">
              </div>
              <div>
                <label class="form-label" for="user-settings-phone">Phone number</label>
                <input id="user-settings-phone" class="form-control" type="tel" value="${escapeHtml(user?.phone || '')}" placeholder="e.g. +250 788 123 456">
              </div>
              <div>
                <label class="form-label" for="user-settings-email">Email</label>
                <input id="user-settings-email" class="form-control" type="email" value="${escapeHtml(user?.email || '')}" disabled>
              </div>
              <div>
                <label class="form-label" for="user-settings-theme">Theme</label>
                <select id="user-settings-theme" class="form-control">
                  <option value="light" ${currentAppearance.theme === 'light' ? 'selected' : ''}>Light</option>
                  <option value="dark" ${currentAppearance.theme === 'dark' ? 'selected' : ''}>Dark</option>
                </select>
              </div>
              <div style="display:grid; gap:0.7rem;">
                <label style="display:flex; align-items:center; gap:0.6rem; padding:0.8rem 0.9rem; border:1px solid #e2e8f0; border-radius:12px; background:#fff; margin:0; cursor:pointer;">
                  <input id="user-settings-compact" type="checkbox" ${currentAppearance.compactMode ? 'checked' : ''}>
                  <span>Compact mode</span>
                </label>
                <label style="display:flex; align-items:center; gap:0.6rem; padding:0.8rem 0.9rem; border:1px solid #e2e8f0; border-radius:12px; background:#fff; margin:0; cursor:pointer;">
                  <input id="user-settings-reduced-motion" type="checkbox" ${currentAppearance.reducedMotion ? 'checked' : ''}>
                  <span>Reduced motion</span>
                </label>
                <label style="display:flex; align-items:center; gap:0.6rem; padding:0.8rem 0.9rem; border:1px solid #e2e8f0; border-radius:12px; background:#fff; margin:0; cursor:pointer;">
                  <input id="user-settings-high-contrast" type="checkbox" ${currentAppearance.highContrast ? 'checked' : ''}>
                  <span>High contrast</span>
                </label>
              </div>
              <div style="display:flex; align-items:center; gap:0.6rem; padding:0.85rem 1rem; border:1px solid #e2e8f0; border-radius: 12px; background:#fff;">
                <input id="user-settings-notify" type="checkbox" ${Boolean(user?.notificationsEnabled) ? 'checked' : ''}>
                <label for="user-settings-notify" style="margin:0; cursor:pointer;">Receive notification emails about account activity</label>
              </div>
              <div id="user-settings-status" style="display:none; padding:0.75rem 0.9rem; border-radius:10px; background:#ecfeff; color:#0f766e; font-weight:600;"></div>
              <button id="user-settings-save" type="submit" class="btn btn-primary" style="border-radius:999px; width: fit-content;">
                <i class="fa-solid fa-floppy-disk"></i> Save changes
              </button>
            </div>
          </form>
        </div>
      `;

      const themeSelect = document.getElementById('user-settings-theme');
      const compactToggle = document.getElementById('user-settings-compact');
      const reducedMotionToggle = document.getElementById('user-settings-reduced-motion');
      const highContrastToggle = document.getElementById('user-settings-high-contrast');
      const applyAppearance = () => {
        saveDrawerUiSettings({
          theme: themeSelect ? themeSelect.value : 'light',
          compactMode: compactToggle ? compactToggle.checked : false,
          reducedMotion: reducedMotionToggle ? reducedMotionToggle.checked : false,
          highContrast: highContrastToggle ? highContrastToggle.checked : false
        });
      };
      [themeSelect, compactToggle, reducedMotionToggle, highContrastToggle].forEach((control) => {
        if (control) control.addEventListener('change', applyAppearance);
      });
      return;
    }

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
      const myProducts = await fetchProducts(false, sellerId, true);

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
            
            <img src="${displayImg}" class="seller-card-img" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"300\" viewBox=\"0 0 400 300\"><rect width=\"400\" height=\"300\" fill=\"%23f8fbff\"/><rect x=\"24\" y=\"24\" width=\"352\" height=\"252\" rx=\"20\" fill=\"%23ffffff\" stroke=\"%23dbeafe\" stroke-width=\"2\"/><circle cx=\"200\" cy=\"120\" r=\"56\" fill=\"%23e0f2fe\"/><path d=\"M140 220c20-42 100-42 120 0\" fill=\"%23bfdbfe\"/></svg>'">
            
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

  await renderDashboard(initialView);
});

