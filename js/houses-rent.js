document.addEventListener('DOMContentLoaded', async () => {
  const productsContainer = document.getElementById('housing-products');
  const summaryEl = document.getElementById('housing-summary');
  const categorySelect = document.getElementById('housing-category-select');
  const listingSelect = document.getElementById('housing-listing-select');
  const wantedSelect = document.getElementById('housing-wanted-select');
  const districtSelect = document.getElementById('housing-district-select');
  const locationInput = document.getElementById('housing-location-input');
  const rentRangeSelect = document.getElementById('rent-range-select');
  const saleRangeSelect = document.getElementById('sale-range-select');

  let currentCategory = 'all';
  let currentListing = 'all';
  let currentWanted = 'all';
  let currentDistrict = 'all';
  let currentLocation = '';
  let currentRentRange = 'all';
  let currentSaleRange = 'all';

  categorySelect.addEventListener('change', () => {
    currentCategory = categorySelect.value;
    renderHousingProducts();
  });

  listingSelect.addEventListener('change', () => {
    currentListing = listingSelect.value;
    renderHousingProducts();
  });

  wantedSelect.addEventListener('change', () => {
    currentWanted = wantedSelect.value;
    renderHousingProducts();
  });

  districtSelect.addEventListener('change', () => {
    currentDistrict = districtSelect.value;
    renderHousingProducts();
  });

  locationInput.addEventListener('input', () => {
    currentLocation = locationInput.value.trim().toLowerCase();
    renderHousingProducts();
  });

  rentRangeSelect.addEventListener('change', () => {
    currentRentRange = rentRangeSelect.value;
    renderHousingProducts();
  });

  saleRangeSelect.addEventListener('change', () => {
    currentSaleRange = saleRangeSelect.value;
    renderHousingProducts();
  });

  function parseRangeValue(rangeString) {
    const [min, max] = (rangeString || '').split('-').map((value) => Number(value.trim()));
    return {
      min: Number.isFinite(min) ? min : 0,
      max: Number.isFinite(max) ? max : Number.MAX_SAFE_INTEGER,
    };
  }

  function checkRentRange(product, rangeString) {
    if (!rangeString || rangeString === 'all') return true;
    const productListing = (product.listingType || product.subcategory || '').toString().toLowerCase();
    if (productListing !== 'rent') return true;
    const price = Number(product.price);
    if (!price) return false;
    const { min, max } = parseRangeValue(rangeString);
    return price >= min && price <= max;
  }

  function checkSaleRange(product, rangeString) {
    if (!rangeString || rangeString === 'all') return true;
    const productListing = (product.listingType || product.subcategory || '').toString().toLowerCase();
    if (productListing !== 'sell') return true;
    const price = Number(product.price);
    if (!price) return false;
    const { min, max } = parseRangeValue(rangeString);
    return price >= min && price <= max;
  }

  function checkDistrict(product, districtValue) {
    if (!districtValue || districtValue === 'all') return true;
    const district = String(product.district || '').split(' • ')[0].toLowerCase();
    return district === districtValue;
  }

  function checkLocation(product, locationValue) {
    if (!locationValue) return true;
    const location = String(product.district || product.location || product.address || '').toLowerCase();
    return location.includes(locationValue);
  }

  function checkWanted(product, wantedValue) {
    if (!wantedValue || wantedValue === 'all') return true;
    const text = ((product.wanted || product.tags || product.description || '') + '').toLowerCase();
    return text.includes(wantedValue);
  }

  function populateDistrictOptions() {
    if (!districtSelect) return;
    const districts = [
      'Bugesera','Burera','Gakenke','Gasabo','Gatsibo','Gicumbi','Gisagara','Huye',
      'Kamonyi','Karongi','Kayonza','Kicukiro','Kirehe','Muhanga','Musanze','Ngoma',
      'Ngororero','Nyabihu','Nyagatare','Nyamagabe','Nyamasheke','Nyanza','Nyarugenge',
      'Nyaruguru','Rubavu','Ruhango','Rulindo','Rusizi','Rutsiro','Rwamagana'
    ];
    districts.forEach((district) => {
      const option = document.createElement('option');
      option.value = district.toLowerCase();
      option.textContent = district;
      districtSelect.appendChild(option);
    });
  }

  populateDistrictOptions();

  async function renderHousingProducts() {
    productsContainer.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 3rem;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p class="mt-1">Loading housing listings...</p></div>';

    const allProducts = await fetchProducts(true);
    const housingProducts = allProducts.filter((product) => {
      const isHousing = product.category === 'Houses & Rents' || product.category === 'Housing' || product.category === 'Rent' || product.category === 'House' || product.category === 'HouseHub';
      if (!isHousing) return false;

      const normalizedCategory = (product.subcategory || product.houseType || product.listingType || product.category || '').toString().toLowerCase();
      const normalizedListing = (product.listingType || product.subcategory || '').toString().toLowerCase();

      const matchesCategory = currentCategory === 'all' || normalizedCategory === currentCategory.toLowerCase();
      const matchesListing = currentListing === 'all' || normalizedListing === currentListing.toLowerCase();
      const matchesWant = checkWanted(product, currentWanted);
      const matchesDistrict = checkDistrict(product, currentDistrict);
      const matchesLocation = checkLocation(product, currentLocation);
      const matchesRent = checkRentRange(product, currentRentRange);
      const matchesSale = checkSaleRange(product, currentSaleRange);

      return matchesCategory && matchesListing && matchesWant && matchesDistrict && matchesLocation && matchesRent && matchesSale;
    });

    const categoryLabel = currentCategory === 'all' ? 'HOUSEHUB Special Listings' : `${currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)} Listings`;
    const listingLabel = currentListing === 'all' ? '' : ` · ${currentListing.charAt(0).toUpperCase() + currentListing.slice(1)}`;

    summaryEl.innerHTML = `
      <div style="padding: 1rem 1rem; border-radius: 20px; border: 1px solid rgba(15,23,42,0.08); background: #ffffff; margin-bottom: 1rem;">
        <h2 style="font-size: 1.35rem; color: #0f172a; margin: 0;">${categoryLabel}${listingLabel}</h2>
        <p style="margin: 0.65rem 0 0; color: #475569;">${housingProducts.length} special listings available</p>
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
          <img src="${displayImg}" alt="${p.name}" class="product-card-img" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"300\" viewBox=\"0 0 400 300\"><rect width=\"400\" height=\"300\" fill=\"%23f8fbff\"/><rect x=\"24\" y=\"24\" width=\"352\" height=\"252\" rx=\"20\" fill=\"%23ffffff\" stroke=\"%23dbeafe\" stroke-width=\"2\"/><circle cx=\"200\" cy=\"120\" r=\"56\" fill=\"%23e0f2fe\"/><path d=\"M140 220c20-42 100-42 120 0\" fill=\"%23bfdbfe\"/><text x=\"200\" y=\"268\" text-anchor=\"middle\" font-family=\"Arial, sans-serif\" font-size=\"18\" fill=\"%231d4ed8\">No image</text></svg>'">
          <div class="product-card-content">
            <div style="display:flex; align-items:center; gap: 0.5rem; flex-wrap: wrap;">
              <span class="product-category">${p.category}</span>
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
