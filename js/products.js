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
  if (lower.includes('no image') || lower.includes('placeholder') || /[<>"]/.test(text)) {
    return '';
  }
  return text;
}

document.addEventListener('DOMContentLoaded', async () => {
  const CATEGORIES = ['Electronics', 'Fashion', 'Shoes', 'Phones', 'Cars', 'Houses & Rents', 'Others'];
  const categorySelect = document.getElementById('category-filter-select');
  const conditionSelect = document.getElementById('condition-filter-select');
  const districtSelect = document.getElementById('district-filter-select');
  const productsContainer = document.getElementById('products-container');
  const summaryEl = document.getElementById('search-summary');
  
  let currentCategory = 'all';
  let currentCondition = 'all';
  let currentDistrict = 'all';
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('q');
  const queryCat = urlParams.get('category');
  const queryDistrict = urlParams.get('district');
  const queryBuyOnline = urlParams.get('buy_online') || urlParams.get('buyonline') || null;
  
  if (queryCat) {
    currentCategory = queryCat;
  }
  if (queryDistrict) {
    currentDistrict = queryDistrict;
  }

  CATEGORIES.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });

  RWANDA_DISTRICTS.forEach(dist => {
    const option = document.createElement('option');
    option.value = dist;
    option.textContent = dist;
    districtSelect.appendChild(option);
  });

  categorySelect.value = currentCategory;
  conditionSelect.value = currentCondition;
  districtSelect.value = currentDistrict;

  categorySelect.addEventListener('change', () => {
    currentCategory = categorySelect.value;
    updateUrlAndRender();
  });

  conditionSelect.addEventListener('change', () => {
    currentCondition = conditionSelect.value;
    updateUrlAndRender();
  });

  districtSelect.addEventListener('change', () => {
    currentDistrict = districtSelect.value;
    updateUrlAndRender();
  });

  function updateUrlAndRender() {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (currentCategory !== 'all') params.set('category', currentCategory);
    if (currentDistrict !== 'all') params.set('district', currentDistrict);
    const newUrl = `products.html${params.toString() ? '?' + params.toString() : ''}`;
    window.history.pushState({}, '', newUrl);
    renderProducts();
  }

  async function renderProducts(queryStr = searchQuery) {
    productsContainer.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 3rem;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p class="mt-1">Loading products...</p></div>';
    
    // fetch only approved products for the public view
    let allProducts = await enrichProductsWithShopData(await fetchProducts(true));
    
    if (currentCategory !== 'all') {
      allProducts = allProducts.filter(p => p.category === currentCategory);
    }

    if (currentCondition !== 'all') {
      allProducts = allProducts.filter(p => p.condition === currentCondition);
    }

    if (currentDistrict !== 'all') {
      allProducts = allProducts.filter(p => (String(p.district || '').split(' • ')[0] || 'Unknown') === currentDistrict);
    }

    if (queryBuyOnline && (queryBuyOnline === '1' || queryBuyOnline === 'true')) {
      allProducts = allProducts.filter(p => p.buy_online === true || p.buy_online === 'true' || p.buyOnline === true);
    }
    
    if (queryStr) {
      const q = queryStr.toLowerCase();
      allProducts = allProducts.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
      summaryEl.innerHTML = `
        <div style="border-bottom: 2px solid #febd69; padding-bottom: 1rem; margin-bottom: 1.5rem;">
          <h2 style="font-size: 1.8rem; color: #131921;">Search results for "${queryStr}"</h2>
          <p class="text-muted mt-1">${allProducts.length} items found ${currentDistrict !== 'all' ? `in ${currentDistrict}` : ''}</p>
        </div>
      `;
    } else {
      summaryEl.innerHTML = `
        <div style="border-bottom: 2px solid #febd69; padding-bottom: 1rem; margin-bottom: 1.5rem;">
          <h2 style="font-size: 1.8rem; color: #131921;">${currentCategory === 'all' ? 'All Products' : currentCategory}</h2>
          <p class="text-muted mt-1">${allProducts.length} products available${currentDistrict !== 'all' ? ` in ${currentDistrict}` : ''}</p>
        </div>
      `;
    }

    if (allProducts.length === 0) {
      productsContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding: 4rem 0;">
          <h3 class="text-muted">No products found matching your criteria.</h3>
          <button onclick="window.location.href='products.html'" class="btn btn-secondary mt-2">Clear Filters</button>
        </div>
      `;
      return;
    }

    productsContainer.innerHTML = allProducts.map(p => {
      const prevPriceVal = Number(p.previous_price || p.previousPrice || 0);
      const currentPriceVal = Number(p.price || 0);
      const priceMarkup = (prevPriceVal && prevPriceVal > currentPriceVal)
        ? `<div><span class="old-price">${formatPrice(prevPriceVal)}</span> <span class="new-price">${formatPrice(currentPriceVal)}</span></div>`
        : `<span class="product-price">${formatPrice(currentPriceVal)}</span>`;
      const imageUrls = (Array.isArray(p.image) ? p.image : [p.image]).map(normalizeProductImage).filter(Boolean);
      const displayImg = imageUrls[0] || '';
      const imageMarkup = displayImg
        ? `<div class="product-card-image-shell" data-image-urls="${escapeHtml(JSON.stringify(imageUrls))}"><img src="${escapeHtml(displayImg)}" alt="" aria-hidden="true" class="product-card-backdrop" loading="lazy" decoding="async" onerror="this.onerror=null;this.style.display='none';"><img src="${escapeHtml(displayImg)}" alt="${escapeHtml(p.name || 'Product image')}" class="product-card-img" loading="lazy" decoding="async" onload="this.classList.add('loaded');" onerror="this.onerror=null;this.removeAttribute('src');this.style.display='block';this.style.background='linear-gradient(135deg, #f8fbff 0%, #e0f2fe 100%);"><span class="product-card-image-condition">${escapeHtml(p.condition || 'Used')}</span>${p.buy_online ? '<span class="product-card-image-buy"><i class="fa-solid fa-bolt"></i> Buy online</span>' : ''}</div>`
        : `<div class="product-card-image-shell"><div class="product-card-img" style="background:linear-gradient(135deg, #f8fbff 0%, #e0f2fe 100%);"></div></div>`;
      const shopBadge = p.shop?.name
        ? `<div class="product-card-shop"><i class="fa-solid fa-store"></i> ${escapeHtml(p.shop.name)}</div>`
        : '';
      return `
        <div class="product-card blurred-product-card">
          <a href="product.html?id=${p.id}" style="display:block; color:inherit; text-decoration:none;">
            <div class="product-card-image-shell">
              ${imageMarkup}
              <span class="product-card-image-condition">${escapeHtml(p.condition || 'Used')}</span>
              ${p.buy_online ? '<span class="product-card-image-buy"><i class="fa-solid fa-bolt"></i> Buy online</span>' : ''}
            </div>
            <div class="product-card-content">
              <div class="product-card-meta-row">
                <span class="product-category">${p.category}</span>
              </div>
              <h3 class="product-title">${p.name}</h3>
              ${shopBadge}
              <div class="product-card-seller-line"><i class="fa-solid fa-location-dot"></i><span>${p.district || 'District not set'}</span><span class="product-card-dot">•</span><span>${p.seller_phone || p.seller_email ? 'Seller available' : 'Seller details pending'}</span></div>
              <div class="product-card-foot">
                ${priceMarkup}
                <span class="product-card-view-link">View details <i class="fa-solid fa-arrow-right"></i></span>
              </div>
            </div>
          </a>
          <div class="product-card-actions">
            <a href="chat.html?product=${encodeURIComponent(p.id)}" onclick="event.stopPropagation();" class="product-card-chat"><i class="fa-solid fa-comments"></i> Chat</a>
            ${p.buy_online ? `<button type="button" onclick="event.preventDefault(); event.stopPropagation(); window.location.href='product.html?id=${p.id}&buy=1'" class="btn btn-primary btn-buy-online"><i class="fa-solid fa-bolt"></i> Buy now</button>` : '<span class="product-card-availability"><i class="fa-solid fa-circle-check"></i> Available</span>'}
          </div>
        </div>
      `;
    }).join('');
    enableProductImageRotation(productsContainer);
  }

  await renderProducts();
});
