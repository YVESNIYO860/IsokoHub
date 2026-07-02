document.addEventListener('DOMContentLoaded', () => {
  renderSlideshow();
  renderPromotedProducts();
  renderCategories();
  renderFeaturedProducts();
});

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
  container.innerHTML = CATEGORIES.map(cat => `
    <a href="products.html?category=${encodeURIComponent(cat.name)}" class="category-card">
      <i class="${cat.icon} category-icon"></i>
      <span class="category-name">${cat.name}</span>
    </a>
  `).join('');
}

function renderSlideshow() {
  const container = document.getElementById('home-slideshow');
  if (!container) return;

  const slidesData = [
    {
      img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=1600&h=600',
      title: 'Premium Electronics',
      desc: 'The place where you find qualitative products directly from sellers without third-party interference.',
      btnText: 'Shop Electronics',
      href: 'products.html?category=Electronics'
    },
    {
      img: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=1600&h=600',
      title: 'Global Fashion Trends',
      desc: 'Direct access to high-quality apparel. Smart shopping for smart people.',
      btnText: 'Shop Fashion',
      href: 'products.html?category=Fashion'
    },
    {
      img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1600&h=600',
      title: 'Step Up Your Style',
      desc: 'Authentic footwear from verified sellers. Quality you can trust, delivered easy.',
      btnText: 'Shop Shoes',
      href: 'products.html?category=Shoes'
    },
    {
      img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=1600&h=600',
      title: 'Next-Gen Connectivity',
      desc: 'Top-tier smartphones at smart prices. Buy easy, sell smart, and stay connected.',
      btnText: 'Shop Phones',
      href: 'products.html?category=Phones'
    },
    {
      img: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1600&h=600',
      title: 'Elite Automotive Deals',
      desc: 'Qualitative cars and luxury vehicles. Your dream ride is just one click away.',
      btnText: 'Shop Cars',
      href: 'products.html?category=Cars'
    },
    {
      img: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=1600&h=600',
      title: 'Premium Houses & Rentals',
      desc: 'Find your dream home or the perfect rental property. Verified listings only.',
      btnText: 'Explore Properties',
      href: 'products.html?category=Houses%20%26%20Rents'
    }
  ];

  let html = '';
  let navHtml = '<div class="slideshow-nav">';
  
  slidesData.forEach((slide, index) => {
    html += `
      <div class="slide ${index === 0 ? 'active' : ''}" data-index="${index}">
        <img src="${slide.img}" class="slide-img" alt="${slide.title}">
        <div class="slide-content">
          <h1 class="slide-title">${slide.title}</h1>
          <p class="slide-desc">${slide.desc}</p>
          <a href="${slide.href}" class="btn btn-primary" style="padding: 1rem 2rem; font-size: 1.1rem; border-radius: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border: 2px solid white;">${slide.btnText}</a>
        </div>
      </div>
    `;
    navHtml += `<div class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>`;
  });
  navHtml += '</div>';
  
  container.innerHTML = html + navHtml;

  let currentSlide = 0;
  const slides = container.querySelectorAll('.slide');
  const dots = container.querySelectorAll('.dot');
  let slideInterval;

  function showSlide(index) {
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    
    currentSlide = index;
    
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
  }

  function nextSlide() {
    let nextIndex = (currentSlide + 1) % slidesData.length;
    showSlide(nextIndex);
  }

  function startSlideshow() {
    slideInterval = setInterval(nextSlide, 5000); // 5 seconds per slide
  }

  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      clearInterval(slideInterval);
      showSlide(parseInt(e.target.dataset.index));
      startSlideshow();
    });
  });

  startSlideshow();
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
