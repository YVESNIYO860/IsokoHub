document.addEventListener('DOMContentLoaded', async () => {
  // The homepage uses the static hero markup from index.html.
  // No slideshow or intro video is rendered on app open.
  updateInlineStats();
  renderCategories();
  renderFeaturedProducts();
  startSellerShowcase();
});

function formatStatValue(value, target = null) {
  const effectiveTarget = Number.isFinite(target) && target > 0 ? target : value;
  const displayValue = Math.min(value, effectiveTarget);
  return displayValue > 1000 ? (displayValue / 1000).toFixed(1).replace('.0', '') + 'K+' : displayValue + '+';
}

function animateStatValue(element, targetValue, duration = 1400, target = null) {
  if (!element) return;
  const finalValue = Number.isFinite(targetValue) ? targetValue : 0;
  const effectiveTarget = Number.isFinite(target) && target > 0 ? target : finalValue;
  const startTime = performance.now();

  const step = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.round(finalValue * eased);
    element.textContent = formatStatValue(currentValue, effectiveTarget);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      element.textContent = formatStatValue(finalValue, effectiveTarget);
    }
  };

  element.textContent = '0+';
  requestAnimationFrame(step);
}

async function updateInlineStats() {
  try {
    if (typeof fetchHeroStats === 'function') {
      const stats = await fetchHeroStats();
      const listingEl = document.getElementById('stat-active-listings');
      if (listingEl && stats.productCount > 0) {
        animateStatValue(listingEl, stats.productCount, 1200);
      }
    }
  } catch(e) { console.error(e); }

  try {
    const sellerCount = await fetchVerifiedSellerCount();
    const sellerEl = document.getElementById('stat-verified-sellers');
    if (sellerEl) {
      const targetValue = Number(localStorage.getItem('isokoSellerTarget')) || sellerCount;
      animateStatValue(sellerEl, sellerCount, 1600, targetValue);
    }
  } catch(e) { console.error(e); }
}

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

async function renderHeroSection() {
  // The hero section is kept as static HTML in index.html.
  // No slideshow or intro video is rendered here.
  return;
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
    const phone = p.seller_phone ? String(p.seller_phone).trim() : '';
    const email = p.seller_email ? String(p.seller_email).trim() : (p.sellerEmail ? String(p.sellerEmail).trim() : '');
    const whatsappUrl = phone ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello, I am interested in your listing: ${p.name}`)}` : '';
    const emailUrl = email ? `mailto:${email}?subject=${encodeURIComponent(`Question about ${p.name}`)}` : '';
    const contactUrl = whatsappUrl || emailUrl || `product.html?id=${p.id}`;
    const contactIcon = whatsappUrl ? 'fa-solid fa-phone' : (emailUrl ? 'fa-solid fa-envelope' : 'fa-solid fa-eye');
    const contactTitle = whatsappUrl ? 'Contact seller' : emailUrl ? 'Email seller' : 'View listing';

    return `
      <a href="product.html?id=${p.id}" class="product-card">
        <div class="product-card-badge">Featured</div>
        <img src="${displayImg}" alt="${p.name}" class="product-card-img" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
        <div class="product-card-content">
          <div class="product-card-meta-row">
            <span class="product-category">${p.category}</span>
            <span class="badge-condition ${p.condition === 'New' ? 'badge-new' : 'badge-used'}">${p.condition}</span>
          </div>
          <h3 class="product-title">${p.name}</h3>
          <div class="product-card-location"><i class="fa-solid fa-location-dot"></i> ${p.district || 'District not set'}</div>
          <div class="product-card-foot">
            <span class="product-price">${formatPrice(p.price)}</span>
            <button type="button" onclick='event.preventDefault(); event.stopPropagation(); window.open(${JSON.stringify(contactUrl)}, "_blank", "noopener,noreferrer")' class="product-contact-btn" title="${contactTitle}">
              <i class="${contactIcon}"></i>
            </button>
          </div>
        </div>
      </a>
    `;
  }).join('');
}
