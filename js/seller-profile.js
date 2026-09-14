function profileEscape(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('seller-profile-content');
  const sellerId = new URLSearchParams(window.location.search).get('id');
  if (!sellerId) {
    root.innerHTML = '<div class="seller-profile-empty">Seller profile not found.</div>';
    return;
  }

  let profile = null;
  if (window.supabase) {
    const profileResult = await supabase.from('user_profiles').select('*').eq('id', sellerId).maybeSingle();
    profile = profileResult.data || null;
  }
  if (!profile && typeof fetchUserProfiles === 'function') {
    const profiles = await fetchUserProfiles();
    profile = profiles.find((item) => item?.id === sellerId) || null;
  }
  const products = typeof fetchProducts === 'function' ? await fetchProducts(true) : [];
  const sellerProducts = products.filter((item) => item?.seller_id === sellerId || item?.sellerId === sellerId);
  const displayName = profile?.name || profile?.full_name || profile?.email || 'IsokoHub seller';
  const initials = displayName.slice(0, 2).toUpperCase();

  root.innerHTML = `
    <section class="seller-profile-card">
      <div class="seller-profile-hero">
        <div class="seller-profile-avatar">${profileEscape(initials)}</div>
        <div><span class="seller-profile-kicker">Seller profile</span><h1>${profileEscape(displayName)}</h1><p>${profileEscape(profile?.bio || 'Connecting with buyers on IsokoHub.')}</p></div>
      </div>
      <div class="seller-profile-facts"><span><i class="fa-solid fa-box"></i> ${sellerProducts.length} listing${sellerProducts.length === 1 ? '' : 's'}</span><span><i class="fa-solid fa-shield-heart"></i> Community seller</span><span><i class="fa-solid fa-location-dot"></i> ${profileEscape(profile?.district || 'Local marketplace')}</span></div>
    </section>
    <section class="seller-profile-listings"><div class="seller-profile-section-heading"><div><span class="seller-profile-kicker">Available now</span><h2>Seller listings</h2></div><a href="products.html">Browse marketplace <i class="fa-solid fa-arrow-right"></i></a></div><div class="seller-profile-product-grid">${sellerProducts.length ? sellerProducts.map((product) => `<a class="seller-profile-product" href="product.html?id=${encodeURIComponent(product.id)}"><img src="${profileEscape(Array.isArray(product.image) ? product.image[0] : product.image || 'assets/logo.png')}" alt="${profileEscape(product.name)}"><div><strong>${profileEscape(product.name)}</strong><span>${formatPrice(product.price || 0)}</span></div></a>`).join('') : '<p class="seller-profile-empty">This seller has no active listings yet.</p>'}</div></section>
  `;
});
