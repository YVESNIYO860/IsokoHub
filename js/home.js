document.addEventListener('DOMContentLoaded', async () => {
  await renderHeroSection();
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

async function renderHeroSection() {
  const container = document.getElementById('home-slideshow');
  if (!container) return;

  const stats = await fetchHeroStats();
  const productCountLabel = formatHeroProductCount(stats.productCount);
  const responseLabel = formatHeroResponseTime(stats.responseMinutes);

  const slides = [
    {
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=1600&h=900',
      imageMobile: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=900&h=1200',
      title: 'Shop trusted products from Rwanda sellers.',
      desc: `${productCountLabel} local listings, ${responseLabel} responses, and clear RWF pricing — all in one marketplace.`,
      cta: { label: 'Browse products', href: 'products.html' }
    },
    {
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=1600&h=900',
      imageMobile: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=900&h=1200',
      title: 'Sell smarter. Reach buyers faster.',
      desc: 'List electronics, fashion, cars, and more. Get your products in front of local buyers with verified listings.',
      cta: { label: 'Start selling', href: 'sell.html' }
    },
    {
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1600&h=900',
      imageMobile: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=900&h=1200',
      title: 'Find homes and rentals across Rwanda.',
      desc: 'Explore apartments, houses, and rental listings with transparent pricing and direct seller contact.',
      cta: { label: 'View homes', href: 'houses-rent.html' }
    }
  ];

  container.innerHTML = `
    ${slides.map((slide, index) => `
      <div class="slide${index === 0 ? ' active' : ''}" data-slide="${index}">
        <img
          class="slide-img"
          src="${slide.image}"
          srcset="${slide.imageMobile} 900w, ${slide.image} 1600w"
          sizes="100vw"
          alt=""
          ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}
        >
        <div class="slide-content">
          <span class="slide-eyebrow"><i class="fa-solid fa-certificate"></i> IsokoHub Marketplace</span>
          <h2 class="slide-title">${slide.title}</h2>
          <p class="slide-desc">${slide.desc}</p>
          <a href="${slide.cta.href}" class="btn btn-primary slide-btn">${slide.cta.label}</a>
        </div>
      </div>
    `).join('')}
    <div class="slideshow-nav" aria-label="Hero slideshow navigation">
      ${slides.map((_, index) => `<button type="button" class="dot${index === 0 ? ' active' : ''}" data-slide="${index}" aria-label="Go to slide ${index + 1}"></button>`).join('')}
    </div>
  `;

  startHeroSlideshow(container);
}

function startHeroSlideshow(container) {
  const slides = container.querySelectorAll('.slide');
  const dots = container.querySelectorAll('.dot');
  if (!slides.length) return;

  let current = 0;
  let timer;

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('active', i === current));
    dots.forEach((dot, i) => dot.classList.toggle('active', i === current));
  }

  function next() {
    goTo(current + 1);
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(next, 5500);
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      goTo(Number(dot.dataset.slide));
      resetTimer();
    });
  });

  let touchStartX = 0;
  let touchStartY = 0;

  container.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].screenX;
    touchStartY = event.changedTouches[0].screenY;
  }, { passive: true });

  container.addEventListener('touchend', (event) => {
    const touchEndX = event.changedTouches[0].screenX;
    const touchEndY = event.changedTouches[0].screenY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY)) return;

    goTo(deltaX > 0 ? current - 1 : current + 1);
    resetTimer();
  }, { passive: true });

  resetTimer();
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
      <a href="product.html?id=${p.id}" class="product-card promoted-card">
        <div class="ad-badge"><i class="fa-solid fa-bullhorn"></i> Sponsored</div>
        <img src="${displayImg}" alt="${p.name}" class="product-card-img" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
        <div class="product-card-content">
          <div class="product-card-meta-row">
            <span class="product-category">${p.category}</span>
            <span class="badge-condition ${p.condition === 'New' ? 'badge-new' : 'badge-used'}">${p.condition}</span>
          </div>
          <h3 class="product-title" style="color: #1e293b;">${p.name}</h3>
          <div class="product-card-location"><i class="fa-solid fa-location-dot"></i> ${p.district || 'District not set'}</div>
          <div class="product-card-actions">
            <span class="product-price" style="color: #2563eb;">${formatPrice(p.price)}</span>
            <div class="product-action-buttons">
              <a href="product.html?id=${p.id}" class="product-icon-btn product-view-btn" onclick='event.stopPropagation();' title="View product">
                <i class="fa-solid fa-eye"></i>
              </a>
              <button onclick='event.preventDefault(); event.stopPropagation(); addToCart(${JSON.stringify(p).replace(/'/g, "&apos;")})' class="product-icon-btn product-cart-btn">
                <i class="fa-solid fa-cart-plus"></i>
              </button>
            </div>
          </div>
        </div>
      </a>
    `;
  }).join('');
}
