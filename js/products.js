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
    let allProducts = await fetchProducts(true);
    
    if (currentCategory !== 'all') {
      allProducts = allProducts.filter(p => p.category === currentCategory);
    }

    if (currentCondition !== 'all') {
      allProducts = allProducts.filter(p => p.condition === currentCondition);
    }

    if (currentDistrict !== 'all') {
      allProducts = allProducts.filter(p => (String(p.district || '').split(' • ')[0] || 'Unknown') === currentDistrict);
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
          <p class="text-muted mt-1">${allProducts.length} items available ${currentDistrict !== 'all' ? `in ${currentDistrict}` : ''}</p>
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
      const displayImg = Array.isArray(p.image) ? p.image[0] : p.image;
      return `
        <a href="product.html?id=${p.id}" class="product-card">
          <img src="${displayImg}" alt="${p.name}" class="product-card-img" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
          <div class="product-card-content">
            <div style="display:flex; align-items:center; gap: 0.5rem;">
              <span class="product-category">${p.category}</span>
              <span class="badge-condition ${p.condition === 'New' ? 'badge-new' : 'badge-used'}">${p.condition}</span>
            </div>
            <h3 class="product-title">${p.name}</h3>
            <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.6rem;"><i class="fa-solid fa-location-dot"></i> ${p.district || 'District not set'}</div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">
              <span class="product-price">${formatPrice(p.price)}</span>
              <button onclick='event.preventDefault(); addToCart(${JSON.stringify(p).replace(/'/g, "&apos;")})' class="btn btn-primary" style="padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.8rem; background: #febd69; color: #131921; border:none;">
                <i class="fa-solid fa-cart-plus"></i>
              </button>
            </div>
          </div>
        </a>
      `;
    }).join('');
  }

  await renderProducts();
});
