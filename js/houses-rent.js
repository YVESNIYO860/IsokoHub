document.addEventListener('DOMContentLoaded', async () => {
  const productsContainer = document.getElementById('housing-products');
  const summaryEl = document.getElementById('housing-summary');
  const filterItems = document.querySelectorAll('#housing-filters .filter-item');
  const locationItems = document.querySelectorAll('#housing-location-filters .filter-item');

  let currentType = 'all';
  let currentLocation = 'all';

  filterItems.forEach((item) => {
    item.addEventListener('click', () => {
      filterItems.forEach((entry) => entry.classList.remove('active'));
      item.classList.add('active');
      currentType = item.dataset.housing;
      renderHousingProducts();
    });
  });

  locationItems.forEach((item) => {
    item.addEventListener('click', () => {
      locationItems.forEach((entry) => entry.classList.remove('active'));
      item.classList.add('active');
      currentLocation = item.dataset.location;
      renderHousingProducts();
    });
  });

  async function renderHousingProducts() {
    productsContainer.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 3rem;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p class="mt-1">Loading housing listings...</p></div>';

    const allProducts = await fetchProducts(true);
    const housingProducts = allProducts.filter((product) => {
      const isHousing = product.category === 'Houses & Rents' || product.category === 'Housing' || product.category === 'Rent' || product.category === 'House';
      if (!isHousing) return false;

      const matchesType = currentType === 'all' || product.listingType === currentType || product.subcategory === currentType;
      const matchesLocation = currentLocation === 'all' || (product.location && product.location.toLowerCase()) === currentLocation.toLowerCase() || (product.city && product.city.toLowerCase()) === currentLocation.toLowerCase();

      return matchesType && matchesLocation;
    });

    summaryEl.innerHTML = `
      <div style="border-bottom: 2px solid #febd69; padding-bottom: 1rem; margin-bottom: 1.5rem;">
        <h2 style="font-size: 1.8rem; color: #131921;">${currentType === 'all' ? 'Housing & Rental Listings' : currentType + ' Listings'}</h2>
        <p class="text-muted mt-1">${housingProducts.length} items available</p>
      </div>
    `;

    if (housingProducts.length === 0) {
      productsContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding: 4rem 0;">
          <h3 class="text-muted">No housing listings found for this filter.</h3>
        </div>
      `;
      return;
    }

    productsContainer.innerHTML = housingProducts.map((p) => {
      const displayImg = Array.isArray(p.image) ? p.image[0] : p.image;
      const listingType = p.listingType || p.subcategory || 'Property';
      return `
        <a href="product.html?id=${p.id}" class="product-card" style="border: 1px solid #dbeafe;">
          <img src="${displayImg}" alt="${p.name}" class="product-card-img" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
          <div class="product-card-content">
            <div style="display:flex; align-items:center; gap: 0.5rem; flex-wrap: wrap;">
              <span class="product-category">${p.category}</span>
              <span class="badge-condition ${p.condition === 'New' ? 'badge-new' : 'badge-used'}">${p.condition}</span>
              <span style="padding: 0.2rem 0.55rem; border-radius: 999px; background: #eff6ff; color: #2563eb; font-size: 0.7rem; font-weight: 700;">${listingType}</span>
            </div>
            <h3 class="product-title">${p.name}</h3>
            <p style="font-size: 0.92rem; color: #64748b; margin-bottom: 0.9rem;">${p.description ? p.description.slice(0, 90) + (p.description.length > 90 ? '...' : '') : 'Beautiful property ready for viewing.'}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; gap: 0.75rem;">
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

  await renderHousingProducts();
});
