document.addEventListener('DOMContentLoaded', () => {
  renderHeroSection();
  renderPromotedProducts();
  renderCategories();
  renderFeaturedProducts();
  startSellerShowcase();
});

function startSellerShowcase() {
  const slides = document.querySelectorAll('.seller-slide');
  const indicators = document.querySelectorAll('.seller-indicator');
  if (!slides.length) return;

  let current = 0;
  setInterval(() => {
    slides.forEach((slide, index) => {
      slide.classList.toggle('active', index === current);
    });

    indicators.forEach((indicator, index) => {
      indicator.classList.toggle('active', index === current);
    });

    current = (current + 1) % slides.length;
  }, 2600);
}

const CATEGORIES = [
  { name: 'Electronics', icon: 'fa-solid fa-laptop' },
  { name: 'Fashion', icon: 'fa-solid fa-shirt' },
  { name: 'Shoes', icon: 'fa-solid fa-shoe-prints' },
  { name: 'Phones', icon: 'fa-solid fa-mobile-screen-button' },
  { name: 'Cars', icon: 'fa-solid fa-car' },
  { name: 'Houses & Rents', icon: 'fa-solid fa-house' },
  { name: 'Others', icon: 'fa-solid fa-box-open' }
];

function renderCategories() {
  const container = document.getElementById('categories-container');
  container.innerHTML = CATEGORIES.map(cat => {
    const isHousing = cat.name === 'Houses & Rents';
    const href = isHousing ? 'houses-rent.html' : `products.html?category=${encodeURIComponent(cat.name)}`;
    const extraClass = isHousing ? ' category-card-special' : '';
    const badge = isHousing ? '<span class="category-badge">Special</span>' : '';

    const target = isHousing ? ' target="_blank" rel="noopener"' : '';

    return `
      <a href="${href}" class="category-card${extraClass}"${target}>
        <i class="${cat.icon} category-icon"></i>
        <span class="category-name">${cat.name}</span>
        ${badge}
      </a>
    `;
  }).join('');
}

function renderHeroSection() {
  const container = document.getElementById('home-slideshow');
  if (!container) return;

  container.innerHTML = `
    <section class="hero-shell">
      <div class="hero-copy">
        <div class="hero-title-row">
          <span class="hero-badge"><i class="fa-solid fa-bolt"></i> Rwanda’s trusted marketplace</span>
          <div class="hero-logo-orb" aria-hidden="true">
            <img src="assets/logo.png" alt="EasyMarket logo">
          </div>
        </div>
        <h1>Buy smart, sell faster, and grow your business in RWF.</h1>
        <p>Discover verified products, connect with real sellers, and list your own items in minutes with a smooth, secure experience.</p>
        <div class="hero-actions">
          <a href="products.html" class="btn btn-primary hero-btn">Browse Products</a>
          <a href="sell.html" class="btn btn-secondary hero-btn hero-btn-secondary">Start Selling</a>
        </div>
        <div class="hero-stats">
          <div class="hero-stat-card"><strong>500+</strong><span>Verified listings</span></div>
          <div class="hero-stat-card"><strong>24/7</strong><span>Seller support</span></div>
          <div class="hero-stat-card"><strong>RWF</strong><span>Prices shown clearly</span></div>
        </div>
      </div>
      <div class="hero-panel">
        <div class="hero-panel-card">
          <p class="hero-panel-title">Why sellers love EasyMarket</p>
          <div class="seller-showcase" id="seller-showcase">
            <div class="seller-slide active">
              <div class="seller-slide-media">
                <img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=400&h=220" alt="Phone sale example">
              </div>
              <div class="seller-slide-copy">
                <i class="fa-solid fa-mobile-screen-button"></i>
                <strong>Phone sold in 24 hours</strong>
                <span>A verified seller closed a fast deal with direct buyer contact.</span>
              </div>
            </div>
            <div class="seller-slide">
              <div class="seller-slide-media">
                <img src="https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&q=80&w=400&h=220" alt="House sale example">
              </div>
              <div class="seller-slide-copy">
                <i class="fa-solid fa-house"></i>
                <strong>Apartment listing gained attention</strong>
                <span>Housing posts are getting real inquiries through EasyMarket.</span>
              </div>
            </div>
            <div class="seller-slide">
              <div class="seller-slide-media">
                <img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=80&w=400&h=220" alt="Fashion sale example">
              </div>
              <div class="seller-slide-copy">
                <i class="fa-solid fa-bag-shopping"></i>
                <strong>Fashion bundle sold fast</strong>
                <span>Shoppers are responding quickly to clear photos and RWF pricing.</span>
              </div>
            </div>
            <div class="seller-showcase-indicators" aria-label="Showcase progress">
              <span class="seller-indicator active"></span>
              <span class="seller-indicator"></span>
              <span class="seller-indicator"></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

async function renderFeaturedProducts() {
  const container = document.getElementById('featured-products');
  if (!container) return;
  
  // Only show approved products on homepage
  const products = await fetchProducts(true);
  const featured = products.slice(0, 4); 
  
  if (featured.length === 0) {
    container.innerHTML = '<p class="text-center text-muted" style="grid-column: 1/-1; padding: 2rem;">No products available at the moment. Check back soon!</p>';
    return;
  }

  container.innerHTML = featured.map(p => {
    const categoryObj = { icon: 'fa-solid fa-box' }; // Simplified for now
    const displayImg = Array.isArray(p.image) ? p.image[0] : p.image;
    return `
      <a href="product.html?id=${p.id}" class="product-card">
        <img src="${displayImg}" alt="${p.name}" class="product-card-img" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
        <div class="product-card-content">
          <div style="display:flex; align-items:center; gap: 0.5rem;">
            <i class="${categoryObj.icon}" style="color: var(--primary-blue); font-size: 0.8rem;"></i>
            <span class="product-category">${p.category}</span>
            <span class="badge-condition ${p.condition === 'New' ? 'badge-new' : 'badge-used'}">${p.condition}</span>
          </div>
          <h3 class="product-title">${p.name}</h3>
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

async function renderPromotedProducts() {
  const container = document.getElementById('promoted-products');
  const section = document.getElementById('promoted-section');
  if (!container || !section) return;

  const promoted = await fetchPromotedProducts();
  if (promoted.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  container.innerHTML = promoted.map(p => {
    const displayImg = Array.isArray(p.image) ? p.image[0] : p.image;
    return `
      <a href="product.html?id=${p.id}" class="product-card promoted-card" style="border: 2px solid #febd69; transform: scale(1.02); box-shadow: 0 10px 20px rgba(254, 189, 105, 0.2);">
        <div class="ad-badge" style="position:absolute; top:10px; right:10px; background: #febd69; color:#131921; padding: 0.2rem 0.6rem; border-radius:4px; font-weight:800; font-size:0.7rem; z-index:10; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">AD</div>
        <img src="${displayImg}" alt="${p.name}" class="product-card-img" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
        <div class="product-card-content">
          <div style="display:flex; align-items:center; gap: 0.5rem;">
            <span class="product-category">${p.category}</span>
            <span class="badge-condition ${p.condition === 'New' ? 'badge-new' : 'badge-used'}">${p.condition}</span>
          </div>
          <h3 class="product-title" style="color: #1e293b;">${p.name}</h3>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">
            <span class="product-price" style="color: #2563eb;">${formatPrice(p.price)}</span>
            <button onclick='event.preventDefault(); addToCart(${JSON.stringify(p).replace(/'/g, "&apos;")})' class="btn btn-primary" style="padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.8rem; background: #febd69; color: #131921; border:none;">
              <i class="fa-solid fa-cart-plus"></i>
            </button>
          </div>
        </div>
      </a>
    `;
  }).join('');
}
