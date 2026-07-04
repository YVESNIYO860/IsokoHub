document.addEventListener('DOMContentLoaded', async () => {
  const CATEGORIES = ['Electronics', 'Fashion', 'Shoes', 'Phones', 'Cars', 'Houses & Rents', 'Others'];
  const filtersContainer = document.getElementById('category-filters');
  const districtFiltersContainer = document.getElementById('district-filters');
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

  // Render categories in sidebar
  CATEGORIES.forEach(cat => {
    const el = document.createElement('span');
    el.className = `filter-item ${currentCategory === cat ? 'active' : ''}`;
    el.textContent = cat;
    el.onclick = () => {
      document.querySelectorAll('.filter-item').forEach(i => i.classList.remove('active'));
      el.classList.add('active');
      currentCategory = cat;
      const newUrl = `products.html?category=${encodeURIComponent(cat)}${searchQuery ? '&q=' + encodeURIComponent(searchQuery) : ''}`;
      window.history.pushState({}, '', newUrl);
      renderProducts();
    };
    filtersContainer.appendChild(el);
  });
  
  // Also hook 'All Categories'
    filtersContainer.children[0].onclick = (e) => {
      document.querySelectorAll('.filter-item').forEach(i => i.classList.remove('active'));
      e.target.classList.add('active');
      currentCategory = 'all';
      const newUrl = `products.html${searchQuery ? '?q=' + encodeURIComponent(searchQuery) : ''}`;
      window.history.pushState({}, '', newUrl);
      renderProducts();
    };

  const conditionFilters = document.querySelectorAll('#condition-filters .filter-item');
  conditionFilters.forEach(el => {
    el.onclick = () => {
      conditionFilters.forEach(i => i.classList.remove('active'));
      el.classList.add('active');
      currentCondition = el.dataset.cond;
      renderProducts();
    };
  });

  const districtFilters = document.createElement('div');
  districtFiltersContainer.innerHTML = '';
  const allDistrictFilter = document.createElement('span');
  allDistrictFilter.className = `filter-item ${currentDistrict === 'all' ? 'active' : ''}`;
  allDistrictFilter.textContent = 'All Districts';
  allDistrictFilter.dataset.dist = 'all';
  allDistrictFilter.onclick = () => {
    document.querySelectorAll('#district-filters .filter-item').forEach(i => i.classList.remove('active'));
    allDistrictFilter.classList.add('active');
    currentDistrict = 'all';
    updateUrlAndRender();
  };
  districtFiltersContainer.appendChild(allDistrictFilter);

  RWANDA_DISTRICTS.forEach(dist => {
    const el = document.createElement('span');
    el.className = `filter-item ${currentDistrict === dist ? 'active' : ''}`;
    el.textContent = dist;
    el.dataset.dist = dist;
    el.onclick = () => {
      document.querySelectorAll('#district-filters .filter-item').forEach(i => i.classList.remove('active'));
      el.classList.add('active');
      currentDistrict = dist;
      updateUrlAndRender();
    };
    districtFiltersContainer.appendChild(el);
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
      allProducts = allProducts.filter(p => (p.district || 'Unknown') === currentDistrict);
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
