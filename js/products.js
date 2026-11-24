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
  const CATEGORIES = ['Electronics', 'Fashion', 'Shoes', 'Phones', 'Cars', 'Houses & Rents', 'Services', 'Businesses', 'Jobs', 'Food', 'Transport', 'Learning', 'Events', 'Digital', 'Others'];
  const categorySelect = document.getElementById('category-filter-select');
  const conditionSelect = document.getElementById('condition-filter-select');
  const districtSelect = document.getElementById('district-filter-select');
  const filterToggle = document.getElementById('products-filter-toggle');
  const filterPanel = document.getElementById('products-filter-panel');
  const filterClose = document.getElementById('products-filter-close');
  const filterReset = document.getElementById('products-filter-reset');
  const filterCount = document.getElementById('products-filter-count');
  const productsContainer = document.getElementById('products-container');
  const summaryEl = document.getElementById('search-summary');
  
  let currentCategory = 'all';
  let currentCondition = 'all';
  let currentDistrict = 'all';
  let buyerCoordinates = null;
  let nearbyEnabled = false;
  let renderedProductsById = new Map();
  const nearbyToggle = document.getElementById('nearby-products-toggle');
  const nearbyStatus = document.getElementById('nearby-products-status');
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('q');
  const queryCat = urlParams.get('category');
  const queryCondition = urlParams.get('condition');
  const queryDistrict = urlParams.get('district');
  const queryBuyOnline = urlParams.get('buy_online') || urlParams.get('buyonline') || null;
  
  if (queryCat) {
    currentCategory = queryCat;
  }
  if (queryDistrict) {
    currentDistrict = queryDistrict;
  }
  if (queryCondition) {
    currentCondition = queryCondition;
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

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const quickViewButton = target?.closest('[data-product-quick-view]');
    const cartButton = target?.closest('[data-product-add-to-cart], [data-product-quick-cart]');
    const productId = quickViewButton?.dataset.productQuickView || cartButton?.dataset.productAddToCart || cartButton?.dataset.productQuickCart;
    const product = productId ? renderedProductsById.get(productId) : null;
    if (!product) return;

    event.preventDefault();
    event.stopPropagation();

    if (cartButton) {
      const dialog = cartButton.closest('dialog');
      if (dialog) {
        if (dialog.open) dialog.close();
        dialog.remove();
      }
      addToCart(product);
      return;
    }

    const imageList = (Array.isArray(product.image) ? product.image : [product.image])
      .map(normalizeProductImage)
      .filter(Boolean);
    const image = imageList[0];
    const productUrl = `product.html?id=${encodeURIComponent(product.id)}`;
    const productName = escapeHtml(product.name || 'Untitled listing');
    const description = String(product.description || '').trim();
    const shopName = product.shop?.name ? escapeHtml(product.shop.name) : '';
    const productColor = product.color ? escapeHtml(product.color) : '';
    const price = typeof formatProductPrice === 'function'
      ? formatProductPrice(product)
      : formatPrice(Number(product.price) || 0);
    const currentPrice = Number(product.price);
    const hasExactPrice = Number.isFinite(currentPrice) && currentPrice > 0;
    const isSold = product.sold === true;
    const canAddToCart = !isSold && hasExactPrice && (typeof hasProductPriceRange !== 'function' || !hasProductPriceRange(product));
    const dialog = document.createElement('dialog');
    dialog.className = 'product-quick-view';
    dialog.setAttribute('aria-labelledby', 'product-quick-view-title');
    dialog.innerHTML = `
      <div class="product-quick-view-panel">
        <form method="dialog" class="product-quick-view-close-form">
          <button type="submit" class="product-quick-view-close" aria-label="Close quick view">&times;</button>
        </form>
        ${image ? `<img class="product-quick-view-image" src="${escapeHtml(image)}" alt="${productName}">` : '<div class="product-quick-view-image product-quick-view-placeholder" aria-hidden="true"></div>'}
        <div class="product-quick-view-content">
          <span class="product-category">${escapeHtml(product.category || 'Other')}</span>
          <h2 id="product-quick-view-title">${productName}</h2>
          ${isSold ? '<span class="product-listing-sold-badge">Sold</span>' : ''}
          ${productColor ? `<p class="product-quick-view-color"><i class="fa-solid fa-droplet" aria-hidden="true"></i> Color: ${productColor}</p>` : ''}
          ${shopName ? `<p class="product-quick-view-shop"><i class="fa-solid fa-store" aria-hidden="true"></i> ${shopName}</p>` : ''}
          ${description ? `<p class="product-quick-view-description">${escapeHtml(description)}</p>` : ''}
          <p class="product-quick-view-price">${escapeHtml(price)}</p>
          <p class="product-quick-view-location"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> ${escapeHtml(product.district || 'District not set')}</p>
          <div class="product-quick-view-actions">
            <a class="product-card-chat" href="chat.html?product=${encodeURIComponent(product.id)}"><i class="fa-solid fa-comments" aria-hidden="true"></i> Contact seller</a>
            ${canAddToCart ? `<button type="button" class="btn btn-primary" data-product-quick-cart="${escapeHtml(String(product.id))}"><i class="fa-solid fa-cart-plus" aria-hidden="true"></i> Add to cart</button>` : ''}
            <a class="product-quick-view-details" href="${productUrl}">View full details</a>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);
    const closeQuickView = () => {
      if (dialog.open) dialog.close();
      dialog.remove();
    };
    dialog.querySelector('.product-quick-view-close-form').addEventListener('submit', (submitEvent) => {
      submitEvent.preventDefault();
      closeQuickView();
    });
    dialog.addEventListener('click', (dialogEvent) => {
      if (dialogEvent.target === dialog) closeQuickView();
    });
    dialog.addEventListener('cancel', (cancelEvent) => {
      cancelEvent.preventDefault();
      closeQuickView();
    });
    dialog.querySelector('.product-quick-view-image[src]')?.addEventListener('error', (imageEvent) => {
      const placeholder = document.createElement('div');
      placeholder.className = 'product-quick-view-image product-quick-view-placeholder';
      placeholder.setAttribute('aria-hidden', 'true');
      imageEvent.currentTarget.replaceWith(placeholder);
    }, { once: true });
    dialog.addEventListener('close', () => dialog.remove(), { once: true });
    dialog.showModal();
  });

  function updateFilterCount() {
    const activeCount = [currentCategory, currentCondition, currentDistrict].filter(value => value !== 'all').length + Number(nearbyEnabled);
    filterCount.textContent = String(activeCount);
    filterToggle.setAttribute('aria-label', `${activeCount} active filters`);
  }

  function setFilterPanel(open) {
    filterPanel.hidden = !open;
    filterToggle.setAttribute('aria-expanded', String(open));
  }

  updateFilterCount();
  filterToggle.addEventListener('click', () => setFilterPanel(filterPanel.hidden));
  filterClose.addEventListener('click', () => setFilterPanel(false));
  filterReset.addEventListener('click', () => {
    currentCategory = 'all';
    currentCondition = 'all';
    currentDistrict = 'all';
    nearbyEnabled = false;
    nearbyToggle.setAttribute('aria-pressed', 'false');
    nearbyToggle.classList.remove('active');
    nearbyStatus.hidden = true;
    categorySelect.value = currentCategory;
    conditionSelect.value = currentCondition;
    districtSelect.value = currentDistrict;
    updateUrlAndRender();
    setFilterPanel(false);
  });

  categorySelect.addEventListener('change', () => {
    currentCategory = categorySelect.value;
    updateFilterCount();
    updateUrlAndRender();
  });

  conditionSelect.addEventListener('change', () => {
    currentCondition = conditionSelect.value;
    updateFilterCount();
    updateUrlAndRender();
  });

  districtSelect.addEventListener('change', () => {
    currentDistrict = districtSelect.value;
    updateFilterCount();
    updateUrlAndRender();
  });

  function distanceFromBuyer(product) {
    const rawLatitude = product.seller_lat ?? product.sellerLat ?? product.latitude;
    const rawLongitude = product.seller_lng ?? product.sellerLng ?? product.longitude;
    if (rawLatitude == null || rawLongitude == null || rawLatitude === '' || rawLongitude === '') return null;
    const latitude = Number(rawLatitude);
    const longitude = Number(rawLongitude);
    if (!buyerCoordinates || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    const radians = (degrees) => degrees * Math.PI / 180;
    const latitudeDelta = radians(latitude - buyerCoordinates.latitude);
    const longitudeDelta = radians(longitude - buyerCoordinates.longitude);
    const arc = Math.sin(latitudeDelta / 2) ** 2
      + Math.cos(radians(buyerCoordinates.latitude)) * Math.cos(radians(latitude))
      * Math.sin(longitudeDelta / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
  }

  nearbyToggle.addEventListener('click', () => {
    if (nearbyEnabled) {
      nearbyEnabled = false;
      nearbyToggle.setAttribute('aria-pressed', 'false');
      nearbyToggle.classList.remove('active');
      nearbyStatus.hidden = true;
      updateFilterCount();
      renderProducts();
      return;
    }

    if (!navigator.geolocation) {
      nearbyStatus.textContent = 'Location is not available in this browser.';
      nearbyStatus.hidden = false;
      return;
    }

    nearbyToggle.disabled = true;
    nearbyStatus.textContent = 'Finding your location…';
    nearbyStatus.hidden = false;
    navigator.geolocation.getCurrentPosition((position) => {
      buyerCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      nearbyEnabled = true;
      nearbyToggle.disabled = false;
      nearbyToggle.setAttribute('aria-pressed', 'true');
      nearbyToggle.classList.add('active');
      nearbyStatus.textContent = 'Products with a shared location appear nearest first. Your location is only used in this page.';
      updateFilterCount();
      renderProducts();
    }, (error) => {
      nearbyToggle.disabled = false;
      nearbyStatus.textContent = error.code === error.PERMISSION_DENIED
        ? 'Location access was declined. You can still browse by district.'
        : 'Could not determine your location. Try again or browse by district.';
      nearbyStatus.hidden = false;
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  });

  function updateUrlAndRender() {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (currentCategory !== 'all') params.set('category', currentCategory);
    if (currentCondition !== 'all') params.set('condition', currentCondition);
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

    if (nearbyEnabled) {
      allProducts.sort((first, second) => (distanceFromBuyer(first) ?? Infinity) - (distanceFromBuyer(second) ?? Infinity));
    }

    renderedProductsById = new Map(allProducts.map((product) => [String(product.id), product]));
    
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
      const hasPriceRange = typeof hasProductPriceRange === 'function' && hasProductPriceRange(p);
      const hasExactPrice = Number.isFinite(currentPriceVal) && currentPriceVal > 0;
      const isSold = p.sold === true;
      const hasDiscount = !isSold && !hasPriceRange && hasExactPrice && Number.isFinite(prevPriceVal) && prevPriceVal > currentPriceVal;
      const discountPercent = hasDiscount ? Math.round(((prevPriceVal - currentPriceVal) / prevPriceVal) * 100) : 0;
      const priceMarkup = !hasExactPrice && !hasPriceRange
        ? '<span class="product-listing-price-note">Contact seller for price</span>'
        : hasDiscount
        ? `<div class="product-listing-price-values"><span class="old-price">${formatPrice(prevPriceVal)}</span><span class="new-price">${formatProductPrice(p)}</span></div>`
        : `<span class="product-price">${formatProductPrice(p)}</span>`;
      const imageUrls = (Array.isArray(p.image) ? p.image : [p.image]).map(normalizeProductImage).filter(Boolean);
      const displayImg = imageUrls[0] || '';
      const imageMarkup = displayImg
        ? `<img src="${escapeHtml(displayImg)}" alt="${escapeHtml(p.name || 'Product image')}" class="product-card-img" loading="lazy" decoding="async" onload="this.classList.add('loaded');" onerror="this.onerror=null;this.removeAttribute('src');this.style.display='block';this.style.background='linear-gradient(135deg, #f8fbff 0%, #e0f2fe 100%);">`
        : `<div class="product-card-img" style="background:linear-gradient(135deg, #f8fbff 0%, #e0f2fe 100%);"></div>`;
      const shopBadge = p.shop?.name
        ? `<div class="product-card-shop"><i class="fa-solid fa-store"></i> ${escapeHtml(p.shop.name)}</div>`
        : '';
      const productUrl = `product.html?id=${encodeURIComponent(p.id)}`;
      const productName = escapeHtml(p.name || 'Untitled listing');
      const description = String(p.description || '').trim();
      const productColor = p.color ? escapeHtml(p.color) : '';
      const canAddToCart = !isSold && hasExactPrice && !hasPriceRange;
      return `
        <article class="product-card product-listing-card">
          <a href="${productUrl}" class="product-card-main-link" aria-label="View ${productName}">
            <div class="product-card-image-shell"${imageUrls.length ? ` data-image-urls="${escapeHtml(JSON.stringify(imageUrls))}"` : ''}>
              ${imageMarkup}
              ${p.condition ? `<span class="product-card-image-condition">${escapeHtml(p.condition)}</span>` : ''}
              ${p.buy_online && !isSold ? '<span class="product-card-image-buy"><i class="fa-solid fa-bolt" aria-hidden="true"></i> Buy online</span>' : ''}
            </div>
            <div class="product-card-content">
              <div class="product-card-meta-row">
                <span class="product-category">${escapeHtml(p.category || 'Other')}</span>
              </div>
              <h3 class="product-title">${productName}</h3>
              ${productColor ? `<p class="product-listing-color"><i class="fa-solid fa-droplet" aria-hidden="true"></i> Color: ${productColor}</p>` : ''}
              ${description ? `<p class="product-listing-description">${escapeHtml(description)}</p>` : ''}
              ${shopBadge}
              <div class="product-card-seller-line"><i class="fa-solid fa-location-dot" aria-hidden="true"></i><span>${nearbyEnabled && distanceFromBuyer(p) !== null ? `${distanceFromBuyer(p).toFixed(1)} km away · ` : ''}${escapeHtml(p.district || 'District not set')}</span><span class="product-card-dot" aria-hidden="true">•</span><span>${p.seller_phone || p.seller_email ? 'Seller available' : 'Seller details pending'}</span></div>
              <div class="product-card-foot">
                <div class="product-listing-price">
                  <span class="product-listing-price-label">Listed price</span>
                  ${priceMarkup}
                  ${hasPriceRange ? '<span class="product-listing-price-note">Contact seller to confirm</span>' : ''}
                </div>
                <span class="product-card-view-link">View listing <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
              </div>
            </div>
          </a>
          <button type="button" class="product-listing-quick-view" data-product-quick-view="${escapeHtml(String(p.id))}" aria-label="Quick view: ${productName}">
            <i class="fa-regular fa-eye" aria-hidden="true"></i><span>Quick view</span>
          </button>
          ${isSold ? '<span class="product-listing-sold-badge">Sold</span>' : ''}
          ${hasDiscount ? `<span class="product-listing-discount" aria-label="${discountPercent}% off">${discountPercent}% off</span>` : ''}
          <div class="product-card-actions">
            <a href="chat.html?product=${encodeURIComponent(p.id)}" onclick="event.stopPropagation();" class="product-card-chat"><i class="fa-solid fa-comments"></i> Chat</a>
            ${canAddToCart ? `<button type="button" class="btn btn-primary product-listing-add-cart" data-product-add-to-cart="${escapeHtml(String(p.id))}"><i class="fa-solid fa-cart-plus" aria-hidden="true"></i> Add to cart</button>` : ''}
            ${p.buy_online && canAddToCart ? `<a href="${productUrl}&buy=1" class="btn btn-buy-online"><i class="fa-solid fa-bolt" aria-hidden="true"></i> Buy online</a>` : ''}
          </div>
        </article>
      `;
    }).join('');
    enableProductImageRotation(productsContainer);
  }

  await renderProducts();
});
