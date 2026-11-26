function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeProductImage(value) {
  return normalizeProductImageUrl(value);
}

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const shopId = urlParams.get('id');
  const wrapper = document.getElementById('shop-wrapper');

  if (!shopId) {
    wrapper.innerHTML = '<div class="text-center" style="padding:3rem 0;"><h2 class="text-danger">Shop not found</h2><a href="products.html" class="btn btn-primary mt-2">Back to marketplace</a></div>';
    return;
  }

  const shop = await getShopById(shopId);
  if (!shop) {
    wrapper.innerHTML = '<div class="text-center" style="padding:3rem 0;"><h2 class="text-danger">Shop not found</h2><a href="products.html" class="btn btn-primary mt-2">Back to marketplace</a></div>';
    return;
  }

  const products = (await enrichProductsWithShopData(await fetchProducts(true)))
    .filter((product) => product.shop?.id === shopId);
  const shopProductsById = new Map(products.map((product) => [String(product.id), product]));

  wrapper.innerHTML = `
    <section class="shop-hero-card">
      <div class="shop-hero-meta">
        <span class="shop-hero-pill"><i class="fa-solid fa-store"></i> ${escapeHtml(shop.name || 'Shop storefront')}</span>
        <span class="shop-hero-pill"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(shop.location || 'Location not set')}</span>
        <span class="shop-hero-pill"><i class="fa-solid fa-circle-check"></i> ${escapeHtml(shop.status || 'active')}</span>
      </div>
      <div class="shop-hero-grid">
        <div>
          ${shop.profile?.logoData ? `<div style="margin-bottom: 1rem; width: 88px; height: 88px; border-radius: 18px; overflow: hidden; border: 1px solid #e2e8f0; background: #f8fafc;"><img src="${escapeHtml(shop.profile.logoData)}" alt="${escapeHtml(shop.name || 'Shop logo')}" style="width: 100%; height: 100%; object-fit: cover;"></div>` : ''}
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
            const exactPrice = Number(product.price);
            const canAddToCart = !product.sold && Number.isFinite(exactPrice) && exactPrice > 0 && !hasProductPriceRange(product);
            const imageMarkup = displayImg
              ? `<img src="${escapeHtml(displayImg)}" alt="${escapeHtml(product.name || 'Product image')}" class="product-card-img" loading="lazy" decoding="async" onload="this.classList.add('loaded');" onerror="this.onerror=null;this.removeAttribute('src');this.style.display='block';this.style.background='linear-gradient(135deg, #f8fbff 0%, #e0f2fe 100%)';">`
              : `<div class="product-card-img" style="background:linear-gradient(135deg, #f8fbff 0%, #e0f2fe 100%);"></div>`;
            return `
              <article class="product-card shop-product-card">
                <a href="product.html?id=${encodeURIComponent(product.id)}" class="shop-product-link">
                ${imageMarkup}
                <div class="product-card-content">
                  <div class="product-card-meta-row">
                    <span class="product-category">${escapeHtml(product.category || 'Other')}</span>
                    <span class="badge-condition ${product.condition === 'New' ? 'badge-new' : 'badge-used'}">${escapeHtml(product.condition || 'Used')}</span>
                  </div>
                  <h3 class="product-title">${escapeHtml(product.name || 'Untitled listing')}</h3>
                  <div class="product-card-location"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(product.district || 'District not set')}</div>
                  <div class="product-card-foot">
                    <span class="product-price">${formatProductPrice(product)}</span>
                    <span style="background:#ecfeff;color:#0f766e;border-radius:999px;padding:0.35rem 0.75rem;font-size:0.78rem;display:inline-flex;align-items:center;gap:0.4rem;"><i class="fa-solid fa-eye"></i> View</span>
                  </div>
                </div>
                </a>
                <div class="shop-product-actions">
                  <button type="button" class="product-share-button" data-share-product="${escapeHtml(String(product.id))}" data-product-name="${escapeHtml(product.name || 'Untitled listing')}" aria-label="Share ${escapeHtml(product.name || 'Untitled listing')}" title="Share this product">
                    <i class="fa-solid fa-share-nodes" aria-hidden="true"></i><span class="product-share-label">Share</span>
                  </button>
                  ${canAddToCart ? `<button type="button" class="isokohub-add-to-cart" data-shop-add-to-cart="${escapeHtml(String(product.id))}"><i class="fa-solid fa-cart-plus" aria-hidden="true"></i> Add to cart</button>` : ''}
                </div>
              </article>
            `;
          }).join('')}
        </div>
      ` : '<p class="text-muted">This shop has not assigned any products yet.</p>'}
    </section>
  `;

  wrapper.querySelectorAll('[data-shop-add-to-cart]').forEach((button) => {
    button.addEventListener('click', () => {
      const product = shopProductsById.get(button.dataset.shopAddToCart);
      if (product) addToCart(product);
    });
  });
});
