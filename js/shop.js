function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeProductImage(value) {
  if (value == null) return '';
  const text = String(value).trim();
  if (!text) return '';
  const lower = text.toLowerCase();
  if (lower.includes('no image') || lower.includes('placeholder') || /[<>"\']/.test(text)) {
    return '';
  }
  return text;
}

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const shopId = urlParams.get('id');
  const wrapper = document.getElementById('shop-wrapper');

  if (!shopId) {
    wrapper.innerHTML = '<div class="text-center" style="padding:3rem 0;"><h2 class="text-danger">Shop not found</h2><a href="products.html" class="btn btn-primary mt-2">Back to marketplace</a></div>';
    return;
  }

  const shop = getShopById(shopId);
  if (!shop) {
    wrapper.innerHTML = '<div class="text-center" style="padding:3rem 0;"><h2 class="text-danger">Shop not found</h2><a href="products.html" class="btn btn-primary mt-2">Back to marketplace</a></div>';
    return;
  }

  const products = enrichProductsWithShopData(await fetchProducts(true))
    .filter((product) => product.shop?.id === shopId);

  wrapper.innerHTML = `
    <section class="shop-hero-card">
      <div class="shop-hero-meta">
        <span class="shop-hero-pill"><i class="fa-solid fa-store"></i> ${escapeHtml(shop.name || 'Shop storefront')}</span>
        <span class="shop-hero-pill"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(shop.location || 'Location not set')}</span>
        <span class="shop-hero-pill"><i class="fa-solid fa-circle-check"></i> ${escapeHtml(shop.status || 'active')}</span>
      </div>
      <div class="shop-hero-grid">
        <div>
          <h1 style="font-size: 2rem; margin: 0 0 0.6rem; color: #111827;">${escapeHtml(shop.name || 'Shop storefront')}</h1>
          <p style="margin: 0; color: var(--text-muted); line-height: 1.7;">${escapeHtml(shop.profile?.bio || shop.description || 'This shop is now live on IsokoHub.')}</p>
        </div>
        <div class="shop-info-list">
          ${shop.profile?.slogan ? `<div><strong>Slogan:</strong> ${escapeHtml(shop.profile.slogan)}</div>` : ''}
          ${shop.contact ? `<div><strong>Contact:</strong> ${escapeHtml(shop.contact)}</div>` : ''}
          ${shop.description ? `<div><strong>Focus:</strong> ${escapeHtml(shop.description)}</div>` : ''}
        </div>
      </div>
    </section>

    <section class="shop-product-section">
      <div class="section-title" style="margin-bottom: 1rem;">${products.length ? 'Featured products from this shop' : 'No products yet'}</div>
      ${products.length ? `
        <div class="product-grid">
          ${products.map((product) => {
            const displayImg = normalizeProductImage(Array.isArray(product.image) ? product.image[0] : product.image);
            const imageMarkup = displayImg
              ? `<img src="${escapeHtml(displayImg)}" alt="${escapeHtml(product.name || 'Product image')}" class="product-card-img" onerror="this.onerror=null;this.removeAttribute('src');this.style.display='block';this.style.background='linear-gradient(135deg, #f8fbff 0%, #e0f2fe 100%)';">`
              : `<div class="product-card-img" style="background:linear-gradient(135deg, #f8fbff 0%, #e0f2fe 100%);"></div>`;
            return `
              <a href="product.html?id=${product.id}" class="product-card">
                ${imageMarkup}
                <div class="product-card-content">
                  <div class="product-card-meta-row">
                    <span class="product-category">${escapeHtml(product.category || 'Other')}</span>
                    <span class="badge-condition ${product.condition === 'New' ? 'badge-new' : 'badge-used'}">${escapeHtml(product.condition || 'Used')}</span>
                  </div>
                  <h3 class="product-title">${escapeHtml(product.name || 'Untitled listing')}</h3>
                  <div class="product-card-location"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(product.district || 'District not set')}</div>
                  <div class="product-card-foot">
                    <span class="product-price">${formatPrice(product.price)}</span>
                    <span style="background:#ecfeff;color:#0f766e;border-radius:999px;padding:0.35rem 0.75rem;font-size:0.78rem;display:inline-flex;align-items:center;gap:0.4rem;"><i class="fa-solid fa-eye"></i> View</span>
                  </div>
                </div>
              </a>
            `;
          }).join('')}
        </div>
      ` : '<p class="text-muted">This shop has not assigned any products yet.</p>'}
    </section>
  `;
});
