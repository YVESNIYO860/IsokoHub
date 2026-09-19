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
  // The homepage uses the static hero markup from index.html.
  // No slideshow or intro video is rendered on app open.
  updateInlineStats();
  renderCategories();
  updateHomepageProductCount();
  await renderShops();
  renderFeaturedProducts();
  renderHomepageProductShelf();
  startSellerShowcase();
  initHomepageAdPopup();
});

async function renderHomepageProductShelf() {
  const container = document.getElementById('homepage-product-shelf');
  if (!container) return;
  const track = container.querySelector('.amazon-product-track');
  if (!track) return;

  try {
    const products = await enrichProductsWithShopData(await fetchProducts(true));
    const picks = products.filter((product) => product && product.status !== 'pending').slice(0, 8);
    if (!picks.length) {
      track.innerHTML = '<div class="amazon-shelf-loading">No products available right now.</div>';
      return;
    }

    const shelfProducts = [...picks];
    while (shelfProducts.length < 8 && picks.length > 1) {
      shelfProducts.push(...picks);
    }
    const cards = shelfProducts.map((product) => createFeaturedProductCard(product, true)).join('');
    track.innerHTML = `${cards}${cards}${cards}${cards}${cards}`;
    enableProductImageRotation(track);
    startHomepageShelfScroll();
  } catch (error) {
    console.warn('Unable to render homepage product shelf:', error);
    track.innerHTML = '<div class="amazon-shelf-loading">Products are temporarily unavailable.</div>';
  }
}

function startHomepageShelfScroll() {
  const shelf = document.getElementById('homepage-product-shelf');
  const viewport = shelf?.querySelector('.amazon-product-viewport');
  const track = shelf?.querySelector('.amazon-product-track');
  const previousButton = shelf?.querySelector('.amazon-shelf-arrow-prev');
  const nextButton = shelf?.querySelector('.amazon-shelf-arrow-next');
  if (!shelf || !viewport || !track || !previousButton || !nextButton) return;

  const mobileCards = Array.from(track.querySelectorAll('.product-card'));
  const cycleLength = Math.floor(mobileCards.length / 5);
  let mobileCardIndex = cycleLength * 2;
  let wrapTimer = null;
  if (cycleLength) {
    viewport.scrollLeft = mobileCards[mobileCardIndex].offsetLeft;
  }

  const moveShelf = (direction) => {
    if (!cycleLength || !Number.isFinite(direction) || wrapTimer) return;
    mobileCardIndex -= direction;

    const movingNext = direction < 0;
    const crossedForwardBoundary = movingNext && mobileCardIndex >= cycleLength * 4;
    const crossedBackwardBoundary = !movingNext && mobileCardIndex < cycleLength;
    if (crossedForwardBoundary) mobileCardIndex = cycleLength * 4;
    if (crossedBackwardBoundary) mobileCardIndex = cycleLength - 1;

    const targetCard = mobileCards[mobileCardIndex];
    if (!targetCard) {
      mobileCardIndex = cycleLength;
      return;
    }

    viewport.scrollTo({
      left: targetCard.offsetLeft,
      behavior: 'smooth'
    });

    if (wrapTimer) window.clearTimeout(wrapTimer);
    if (crossedForwardBoundary || crossedBackwardBoundary) {
      wrapTimer = window.setTimeout(() => {
        mobileCardIndex = crossedForwardBoundary ? cycleLength * 2 : cycleLength * 3 - 1;
        const resetCard = mobileCards[mobileCardIndex];
        if (resetCard) {
          viewport.scrollTo({ left: resetCard.offsetLeft, behavior: 'auto' });
        }
        wrapTimer = null;
      }, 450);
    }
  };

  previousButton.onclick = () => moveShelf(1);
  nextButton.onclick = () => moveShelf(-1);
}

function initHomepageAdPopup() {
  const AD_POPUP_DISMISS_KEY = 'isokoHubAdPopupDismissed';
  if (localStorage.getItem(AD_POPUP_DISMISS_KEY) === 'true') {
    return;
  }

  setTimeout(async () => {
    if (typeof fetchPromotedProducts !== 'function' || typeof enrichProductsWithShopData !== 'function' || typeof showAdPopup !== 'function') {
      return;
    }

    try {
      const rawPromoted = await fetchPromotedProducts();
      const promotedProducts = await enrichProductsWithShopData(rawPromoted || []);
      const promoted = Array.isArray(promotedProducts) ? promotedProducts[0] : null;

      if (!promoted || !promoted.id) {
        return;
      }

      const imageUrl = normalizeProductImage(Array.isArray(promoted.image) ? promoted.image[0] : promoted.image) || 'assets/logo.png';
      const productLabel = promoted.name || 'Promoted listing';
      const productMeta = [];
      if (promoted.category) productMeta.push(promoted.category);
      if (promoted.price != null) productMeta.push(formatPrice(promoted.price));
      if (promoted.shop?.name) productMeta.push(promoted.shop.name);

      const message = productMeta.length
        ? productMeta.join(' · ')
        : `${productLabel} is a promoted listing on IsokoHub.`;

      showAdPopup({
        title: `Promoted Product: ${productLabel}`,
        message,
        imageUrl,
        ctaText: 'View product',
        ctaUrl: `product.html?id=${encodeURIComponent(promoted.id)}`,
        dismissStorageKey: AD_POPUP_DISMISS_KEY
      });
    } catch (err) {
      console.warn('Unable to load promoted product popup:', err);
    }
  }, 2200);
}

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
  const listingEl = document.getElementById('stat-active-listings');
  if (!listingEl) return;

  try {
    if (typeof fetchHeroStats === 'function') {
      const stats = await fetchHeroStats();
      const productCount = Number(stats?.productCount || 0);
      animateStatValue(listingEl, productCount, 1200);
    } else {
      listingEl.textContent = '0+';
    }
  } catch (e) {
    console.error(e);
    listingEl.textContent = '0+';
  }
}

async function updateHomepageProductCount() {
  const countEl = document.getElementById('homepage-product-count');
  if (!countEl || typeof fetchHeroStats !== 'function') return;

  try {
    const stats = await fetchHeroStats();
    const count = Number(stats?.productCount || 0);
    countEl.textContent = `${count.toLocaleString()} product${count === 1 ? '' : 's'} listed`;
  } catch (error) {
    countEl.textContent = 'Product listings available now';
  }
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

const FEATURED_PRODUCTS_PAGE_SIZE = 4;
let featuredProducts = [];
let featuredRenderedCount = 0;
let featuredProductsObserver = null;
let featuredProductsScrollListener = null;
let featuredProductsLoading = false;

function createFeaturedProductCard(p, useHeroImageTreatment = false) {
  const imageUrls = (Array.isArray(p.image) ? p.image : [p.image]).map(normalizeProductImage).filter(Boolean);
  const displayImg = imageUrls[0] || '';
  const backdropMarkup = useHeroImageTreatment
    ? `<img src="${escapeHtml(displayImg)}" alt="" aria-hidden="true" class="hero-product-card-backdrop" loading="lazy" decoding="async" onerror="this.onerror=null;this.style.display='none';">`
    : '';
  const imageMarkup = displayImg
    ? `<div class="product-card-image-shell${useHeroImageTreatment ? ' hero-image-shell' : ''}" data-image-urls="${escapeHtml(JSON.stringify(imageUrls))}">${backdropMarkup}<img src="${escapeHtml(displayImg)}" alt="${escapeHtml(p.name || 'Product image')}" class="product-card-img" loading="lazy" decoding="async" onload="this.classList.add('loaded');" onerror="this.onerror=null;this.removeAttribute('src');this.style.display='block';this.style.background='linear-gradient(135deg, #f8fbff 0%, #e0f2fe 100%);" style="object-fit: contain;"></div>`
    : `<div class="product-card-image-shell"><div class="product-card-img" style="background:linear-gradient(135deg, #f8fbff 0%, #e0f2fe 100%);"></div></div>`;
  const phone = p.seller_phone ? String(p.seller_phone).trim() : '';
  const email = p.seller_email ? String(p.seller_email).trim() : (p.sellerEmail ? String(p.sellerEmail).trim() : '');
  const shopBadge = p.shop?.name ? `<div class="product-card-shop"><i class="fa-solid fa-store"></i> ${escapeHtml(p.shop.name)}</div>` : '';
  const whatsappUrl = phone ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello, I am interested in your listing: ${p.name}`)}` : '';
  const emailUrl = email ? `mailto:${email}?subject=${encodeURIComponent(`Question about ${p.name}`)}` : '';
  const contactUrl = whatsappUrl || emailUrl || `product.html?id=${encodeURIComponent(p.id)}`;
  const contactIcon = whatsappUrl ? 'fa-solid fa-phone' : 'fa-solid fa-envelope';
  const contactTitle = whatsappUrl ? 'Contact seller' : 'Email seller';
  const productUrl = `product.html?id=${encodeURIComponent(p.id)}`;
  const productName = escapeHtml(p.name || 'Untitled listing');
  const productCategory = escapeHtml(p.category || 'Marketplace');
  const productCondition = escapeHtml(p.condition || 'Used');
  const productDistrict = escapeHtml(p.district || 'Location not set');

  return `
        <article class="product-card${useHeroImageTreatment ? ' hero-product-card blurred-product-card' : ''}">
          <a class="hero-product-card-link" href="${productUrl}" aria-label="View ${productName}">
            <div class="product-card-badge">Featured</div>
          ${imageMarkup}
          </a>
          <div class="product-card-content">
            <div class="product-card-meta-row">
              <span class="product-category">${productCategory}</span>
              <span class="badge-condition ${p.condition === 'New' ? 'badge-new' : 'badge-used'}">${productCondition}</span>
            </div>
            <h3 class="product-title"><a href="${productUrl}">${productName}</a></h3>
            ${shopBadge}
            <div class="product-card-location"><i class="fa-solid fa-location-dot"></i> ${productDistrict}</div>
            <div class="product-card-foot">
              <span class="product-price">${formatPrice(p.price)}</span>
              <div class="hero-product-card-actions">
                <a href="${productUrl}" class="hero-product-card-view">View listing</a>
                <a href="${escapeHtml(contactUrl)}" class="product-contact-btn" title="${contactTitle}" aria-label="${contactTitle}" target="_blank" rel="noopener noreferrer"><i class="${contactIcon}"></i></a>
              </div>
            </div>
          </div>
        </article>
      `;
}

function updateFeaturedProductsStatus(message) {
  let status = document.getElementById('featured-products-status');
  if (!status) {
    const container = document.getElementById('featured-products');
    if (!container) return null;
    status = document.createElement('div');
    status.id = 'featured-products-status';
    status.className = 'featured-products-status';
    container.insertAdjacentElement('afterend', status);
  }
  status.textContent = message;
  return status;
}

function removeFeaturedProductsSentinel() {
  const status = document.getElementById('featured-products-status');
  if (status) {
    status.remove();
  }
}

function disconnectFeaturedProductsObserver() {
  if (featuredProductsObserver) {
    featuredProductsObserver.disconnect();
    featuredProductsObserver = null;
  }
  if (featuredProductsScrollListener) {
    window.removeEventListener('scroll', featuredProductsScrollListener);
    featuredProductsScrollListener = null;
  }
}

function setupFeaturedProductsInfiniteScroll() {
  disconnectFeaturedProductsObserver();
  const status = document.getElementById('featured-products-status');
  if (!status) return;

  if ('IntersectionObserver' in window) {
    featuredProductsObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadMoreFeaturedProducts();
        }
      });
    }, {
      rootMargin: '200px',
      threshold: 0.1
    });
    featuredProductsObserver.observe(status);
  } else {
    featuredProductsScrollListener = () => {
      const rect = status.getBoundingClientRect();
      if (rect.top <= window.innerHeight + 200) {
        loadMoreFeaturedProducts();
      }
    };
    window.addEventListener('scroll', featuredProductsScrollListener, { passive: true });
  }
}

function renderFeaturedProductsPage() {
  const container = document.getElementById('featured-products');
  if (!container) return;

  const nextCount = Math.min(featuredRenderedCount + FEATURED_PRODUCTS_PAGE_SIZE, featuredProducts.length);
  const nextProducts = featuredProducts.slice(featuredRenderedCount, nextCount);
  if (!nextProducts.length) return;

  container.insertAdjacentHTML('beforeend', nextProducts.map((product) => createFeaturedProductCard(product, true)).join(''));
  featuredRenderedCount = nextCount;

  if (featuredRenderedCount >= featuredProducts.length) {
    updateFeaturedProductsStatus('All featured products loaded.');
    disconnectFeaturedProductsObserver();
  } else {
    updateFeaturedProductsStatus('Scroll to load more featured products...');
  }
}

async function loadMoreFeaturedProducts() {
  if (featuredProductsLoading || featuredRenderedCount >= featuredProducts.length) return;
  featuredProductsLoading = true;
  updateFeaturedProductsStatus('Loading more featured products...');
  await new Promise((resolve) => setTimeout(resolve, 60));
  renderFeaturedProductsPage();
  featuredProductsLoading = false;
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
  if (!container) return;

  container.innerHTML = `
    <label class="sr-only" for="homepage-category-filter">Choose a listing category</label>
    <div class="homepage-filter-control">
      <i class="fa-solid fa-sliders" aria-hidden="true"></i>
      <select id="homepage-category-filter">
        <option value="">All listings</option>
        ${CATEGORIES.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('')}
      </select>
      <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
    </div>
  `;

  const filter = document.getElementById('homepage-category-filter');
  filter.addEventListener('change', () => {
    if (filter.value === 'Houses & Rents') {
      window.location.href = 'houses-rent.html';
      return;
    }

    const query = filter.value ? `?category=${encodeURIComponent(filter.value)}` : '';
    window.location.href = `products.html${query}`;
  });
}

async function renderHeroSection() {
  // The hero section is kept as static HTML in index.html.
  // No slideshow or intro video is rendered here.
  return;
}

async function renderShops() {
  const container = document.getElementById('shops-container');
  if (!container) return;

  const section = container.closest('.shops-section');
  if (section) {
    section.hidden = true;
  }

  container.innerHTML = '';

  const storedShops = (await readStoredShops()).filter(Boolean);
  const visibleShops = storedShops;

  if (section) {
    section.hidden = visibleShops.length === 0;
  }

  container.innerHTML = visibleShops.map((shop) => {
    const productCount = Array.isArray(shop.products) ? shop.products.length : 0;
    const locationText = shop.location || 'Location not set';
    const descriptionText = shop.profile?.bio || shop.description || 'Discover this shop on IsokoHub.';
    const iconMap = {
      HouseHub: 'fa-solid fa-house',
      'Fashion Hub': 'fa-solid fa-shirt',
      'Electronics Hub': 'fa-solid fa-laptop',
      Electronics: 'fa-solid fa-laptop',
      Fashion: 'fa-solid fa-shirt',
      Shoes: 'fa-solid fa-shoe-prints',
      Phones: 'fa-solid fa-mobile-screen-button',
      Cars: 'fa-solid fa-car',
      'Houses & Rents': 'fa-solid fa-house',
      Others: 'fa-solid fa-box-open'
    };
    const icon = iconMap[shop.name] || 'fa-solid fa-store';
    const badge = productCount ? `${productCount} item${productCount === 1 ? '' : 's'}` : 'New shop';
    const logoMarkup = shop.profile?.logoData
      ? `<img src="${escapeHtml(shop.profile.logoData)}" alt="${escapeHtml(shop.name || 'Shop logo')}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 12px;">`
      : `<div class="shop-card-icon"><i class="${icon}"></i></div>`;
    return `
      <a href="shop.html?id=${encodeURIComponent(shop.id)}" class="shop-card">
        <div class="shop-card-header">
          ${logoMarkup}
          <div class="shop-card-title">${escapeHtml(shop.name || 'Untitled shop')}</div>
        </div>
        <div class="shop-card-subtitle">${escapeHtml(descriptionText)}</div>
        <div class="shop-card-meta">
          <span class="shop-card-pill"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(locationText)}</span>
          <span class="shop-card-pill"><i class="fa-solid fa-store"></i> ${escapeHtml(badge)}</span>
        </div>
      </a>
    `;
  }).join('');
}

async function renderFeaturedProducts() {
  const container = document.getElementById('featured-products');
  if (!container) return;

  try {
    const products = await enrichProductsWithShopData(await fetchProducts(true));
    featuredProducts = products.filter((product) => product && product.status !== 'pending');
    featuredRenderedCount = 0;
    disconnectFeaturedProductsObserver();
    removeFeaturedProductsSentinel();

    if (featuredProducts.length === 0) {
      container.innerHTML = '<p class="text-center text-muted" style="grid-column: 1/-1; padding: 2rem;">No products available at the moment. Check back soon!</p>';
      return;
    }

    container.innerHTML = '';
    renderFeaturedProductsPage();

    if (featuredRenderedCount < featuredProducts.length) {
      updateFeaturedProductsStatus('Scroll to load more featured products...');
      setupFeaturedProductsInfiniteScroll();
    }
  } catch (err) {
    console.error('Unable to render featured products:', err);
    container.innerHTML = '<p class="text-center text-muted" style="grid-column: 1/-1; padding: 2rem;">No products available at the moment. Check back soon!</p>';
  }
}
