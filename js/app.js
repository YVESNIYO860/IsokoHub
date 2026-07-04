document.addEventListener('DOMContentLoaded', () => {
  addDependencies();
  setupLoaderLogic();
  ensureBackToHomeLink();
  renderNavbar();
  renderFooter();
  setupStickyHeader();
});

function ensureBackToHomeLink() {
  if (document.querySelector('.back-to-home-link')) return;
  if (document.querySelector('nav.navbar, header')) return;

  const banner = document.createElement('div');
  banner.className = 'back-to-home-link';
  banner.innerHTML = '<a href="index.html"><i class="fa-solid fa-house"></i> Back to Home</a>';
  document.body.insertBefore(banner, document.body.firstChild);
}

function openSupportMail(subject = 'EasyMarket Support') {
  window.location.href = `mailto:yvesniyonkuru2022@gmail.com?subject=${encodeURIComponent(subject)}`;
}

function setupStickyHeader() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

function setupLoaderLogic() {
  const navEntry = performance.getEntriesByType("navigation")[0];
  const isReload = navEntry && navEntry.type === "reload";
  const hasSeenLoader = sessionStorage.getItem('loaderSeen');

  if (!hasSeenLoader || isReload) {
    sessionStorage.setItem('loaderSeen', 'true');
    renderLoader();
    
    // Start the 5-second timer immediately to guarantee it disappears
    const loader = document.getElementById('app-loader');
    if (loader) {
      setTimeout(() => {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 800);
      }, 5000); 
    }
  }
}

function addDependencies() {
  if (!document.getElementById('fontawesome-css')) {
    const link = document.createElement('link');
    link.id = 'fontawesome-css';
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(link);
  }
}

function renderLoader() {
  const loaderHTML = `
    <div id="app-loader">
      <img src="assets/logo.png" class="loader-brand-logo" alt="EasyMarket Logo">
      <div class="loader-icons">
        <div class="center-icon-wrapper">
          <i class="fa-solid fa-mobile-screen-button base-icon"></i>
          <i class="fa-solid fa-users overlay-icon"></i>
        </div>
        <i class="fa-solid fa-shopping-cart marketing-icon icon-1"></i>
        <i class="fa-solid fa-tags marketing-icon icon-2"></i>
        <i class="fa-solid fa-shopping-bag marketing-icon icon-3"></i>
        <i class="fa-solid fa-truck-fast marketing-icon icon-4"></i>
        <i class="fa-solid fa-gift marketing-icon icon-5"></i>
      </div>
      <div class="loader-text">EASYMARKET EVERYWHERE YOU ARE</div>
    </div>
  `;
  document.body.insertAdjacentHTML('afterbegin', loaderHTML);
}

function renderNavbar() {
  const user = getCurrentUser();
  const navbarHTML = `
    <nav class="navbar">
      <!-- Top Tier: Branding, Search, Actions -->
      <div class="navbar-top">
        <div class="menu-trigger" id="side-menu-trigger">
          <i class="fa-solid fa-bars"></i>
          <span>All</span>
        </div>
        
        <a href="index.html" class="navbar-brand">
          <img src="assets/logo.png" alt="EasyMarket Logo" onerror="this.src=''; this.alt='EasyMarket'">
          Easy<span>Market</span>
        </a>
        
        <form class="search-form" id="global-search-form" onsubmit="handleSearch(event)">
          <input type="text" class="search-input" id="global-search-input" placeholder="Search for products, brands and categories...">
          <button type="submit" class="search-btn">
            <i class="fa-solid fa-magnifying-glass"></i>
          </button>
        </form>

        <div class="navbar-actions">
          <a href="${user ? 'dashboard.html' : 'login.html'}" class="nav-action-item">
            <span>Hello, ${user ? user.name : 'Sign in'}</span>
            <strong>Account & Lists</strong>
          </a>
          
          
          

          <a href="#" class="nav-action-item cart-icon">
            <i class="fa-solid fa-cart-shopping" style="font-size: 1.5rem;"></i>
            <span class="cart-count">0</span>
            <strong>Cart</strong>
          </a>
        </div>
      </div>

      <!-- Bottom Tier: Categories -->
      <div class="navbar-bottom">
        <a href="products.html?category=Electronics">Electronics</a>
        <a href="products.html?category=Fashion">Fashion</a>
        <a href="products.html?category=Cars">Cars</a>
        <a href="houses-rent.html" target="_blank" rel="noopener" style="color: #b45309; font-weight: 700; background: #fff7ed; padding: 0.3rem 0.7rem; border-radius: 999px; border: 1px solid #fdba74;">Houses & Rent</a>
        <a href="sell.html" style="color: #febd69; font-weight: 700;">Sell on EasyMarket</a>
      </div>
    </nav>

    <!-- Side Navigation Drawer (Amazon Style) -->
    <div class="side-drawer-overlay" id="side-drawer-overlay"></div>
    <div class="side-drawer" id="side-drawer">
      <div class="side-drawer-header">
        <i class="fa-solid fa-circle-user"></i>
        <span>Hello, ${user ? user.name : 'Sign In'}</span>
        <button class="close-drawer" id="close-drawer">&times;</button>
      </div>
      <div class="side-drawer-content">
        <div class="drawer-section">
          <h3 style="display:flex; align-items:center; gap:0.6rem;"><i class="fa-solid fa-fire" style="color:#f97316"></i> Trending</h3>
          <ul>
            <li><a href="products.html">Best Sellers <i class="fa-solid fa-chevron-right" style="font-size:0.7rem; opacity:0.5;"></i></a></li>
            <li><a href="products.html">New Releases <i class="fa-solid fa-chevron-right" style="font-size:0.7rem; opacity:0.5;"></i></a></li>
            <li><a href="products.html">Movers & Shakers <i class="fa-solid fa-chevron-right" style="font-size:0.7rem; opacity:0.5;"></i></a></li>
          </ul>
        </div>
        
        <div class="drawer-section">
          <h3 style="display:flex; align-items:center; gap:0.6rem;"><i class="fa-solid fa-microchip" style="color:#3b82f6"></i> High-Tech & Auto</h3>
          <ul>
            <li><a href="products.html?category=Electronics">Computers & Audio <i class="fa-solid fa-chevron-right" style="font-size:0.7rem; opacity:0.5;"></i></a></li>
            <li><a href="products.html?category=Phones">Smartphones <i class="fa-solid fa-chevron-right" style="font-size:0.7rem; opacity:0.5;"></i></a></li>
            <li><a href="products.html?category=Cars">Cars & Vehicles <i class="fa-solid fa-chevron-right" style="font-size:0.7rem; opacity:0.5;"></i></a></li>
          </ul>
        </div>
        
        <div class="drawer-section">
          <h3 style="display:flex; align-items:center; gap:0.6rem;"><i class="fa-solid fa-house-chimney" style="color:#10b981"></i> Real Estate</h3>
          <ul>
            <li><a href="products.html?category=Houses%20%26%20Rents">Houses for Sale <i class="fa-solid fa-chevron-right" style="font-size:0.7rem; opacity:0.5;"></i></a></li>
            <li><a href="products.html?category=Houses%20%26%20Rents">Apartments & Rents <i class="fa-solid fa-chevron-right" style="font-size:0.7rem; opacity:0.5;"></i></a></li>
          </ul>
        </div>
        
        <div class="drawer-section">
          <h3 style="display:flex; align-items:center; gap:0.6rem;"><i class="fa-solid fa-gear" style="color:#64748b"></i> Help & Settings</h3>
          <ul>
            <li><a href="${user ? 'dashboard.html' : 'signup.html'}"><i class="fa-solid fa-circle-user" style="margin-right:0.5rem; opacity:0.7;"></i> Your Account <i class="fa-solid fa-chevron-right" style="font-size:0.7rem; opacity:0.5;"></i></a></li>
            ${user?.email === 'yvesniyonkuru2022@gmail.com' ? '<li><a href="admin.html" style="color: #febd69; font-weight: bold;"><i class="fa-solid fa-user-shield"></i> Admin Panel <i class="fa-solid fa-chevron-right" style="font-size:0.7rem; opacity:0.5;"></i></a></li>' : ''}
            ${user ? `<li><a href="#" onclick="handleLogout(event)" style="color:var(--danger)"><i class="fa-solid fa-right-from-bracket" style="margin-right:0.5rem; opacity:0.7;"></i> Sign Out</a></li>` : ''}
          </ul>
        </div>

        <div class="drawer-section drawer-form-section">
          <h3><i class="fa-solid fa-headset" style="color:#ef4444"></i> Customer Support</h3>
          <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1rem;">Have a question? Send us a message directly.</p>
          <form id="drawer-support-form" onsubmit="event.preventDefault(); openSupportMail('EasyMarket Support Request')">
            <div class="drawer-form-group">
              <input type="text" placeholder="Your Name" required>
            </div>
            <div class="drawer-form-group">
              <textarea placeholder="How can we help?" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary btn-block">Send Request</button>
          </form>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('afterbegin', navbarHTML);

  const sideTrigger = document.getElementById('side-menu-trigger');
  const sideDrawer = document.getElementById('side-drawer');
  const drawerOverlay = document.getElementById('side-drawer-overlay');
  const closeBtn = document.getElementById('close-drawer');

  if (sideTrigger && sideDrawer && drawerOverlay) {
    sideTrigger.addEventListener('click', () => {
      sideDrawer.classList.add('active');
      drawerOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    const closeMenu = () => {
      sideDrawer.classList.remove('active');
      drawerOverlay.classList.remove('active');
      document.body.style.overflow = 'auto';
    };

    [drawerOverlay, closeBtn].forEach(el => el.addEventListener('click', closeMenu));
  }
}

function renderFooter() {
  const footerHTML = `
    <footer class="footer">
      <div class="container footer-grid">
        <div class="footer-col">
          <h4>Get to Know Us</h4>
          <ul>
            <li><a href="about.html#careers">Careers</a></li>
            <li><a href="about.html#blog">Blog</a></li>
            <li><a href="about.html#about">About EasyMarket</a></li>
            <li><a href="admin-profile.html">About Admin</a></li>
            <li><a href="about.html#investor">Investor Relations</a></li>
            <li><a href="about.html#help">Help Center</a></li>
            <li><a href="terms.html">Terms &amp; Conditions</a></li>
            <li><a href="about.html#contact">Contact Us</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Make Money with Us</h4>
          <ul>
            <li><a href="sell.html">Sell on EasyMarket</a></li>
            <li><a href="#">Sell on EasyMarket Business</a></li>
            <li><a href="#">Apps on EasyMarket</a></li>
            <li><a href="#">Become an Affiliate</a></li>
            <li><a href="#">Advertise Your Products</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Let Us Help You</h4>
          <ul>
            <li><a href="dashboard.html">Your Account</a></li>
            <li><a href="products.html">Your Orders</a></li>
            <li><a href="about.html#help">Help Center</a></li>
            <li><a href="https://wa.me/250798269987" target="_blank" class="whatsapp-support">
              <i class="fa-brands fa-whatsapp whatsapp-icon-anim"></i> WhatsApp Support
            </a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Follow Us</h4>
          <ul class="footer-socials" style="display:flex; gap:1rem; list-style:none; padding:0; margin-top:1rem; font-size:1.2rem;">
            <li><a href="https://www.facebook.com/profile.php?id=100073494818427&sk=friends" target="_blank" style="color:#1877f2;"><i class="fa-brands fa-facebook"></i></a></li>
            <li><a href="https://www.instagram.com/maverix_001/" target="_blank" style="color:#e4405f;"><i class="fa-brands fa-instagram"></i></a></li>
            <li><a href="https://x.com/best_shineboy" target="_blank" style="color:#ffffff;"><i class="fa-brands fa-x-twitter"></i></a></li>
            <li><a href="https://www.youtube.com/@Maverix1" target="_blank" style="color:#ff0000;"><i class="fa-brands fa-youtube"></i></a></li>
            <li><a href="https://www.linkedin.com/in/best-shineboy-3aa183383/" target="_blank" style="color:#0077b5;"><i class="fa-brands fa-linkedin"></i></a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="container">
          <div class="footer-logo">Easy<span>Market</span></div>
          <p>&copy; ${new Date().getFullYear()} EasyMarket Marketplace. All rights reserved. <span style="opacity: 0.2; font-weight: 700; margin-left: 8px;">DESIGNED BY NIYONKURU YVES</span></p>
        </div>
      </div>
    </footer>
  `;
  document.body.insertAdjacentHTML('beforeend', footerHTML);
}

function handleSearch(e) {
  e.preventDefault();
  const query = document.getElementById('global-search-input').value.trim();
  if (query) {
    window.location.href = `products.html?q=${encodeURIComponent(query)}`;
  }
}

function handleLogout(e) {
  e.preventDefault();
  logoutUser();
  window.location.href = 'index.html';
}

function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// ---- Shopping Cart Logic ----
const CART_KEY = 'easyMarketCart';

function getCart() {
  const cartStr = localStorage.getItem(CART_KEY);
  return cartStr ? JSON.parse(cartStr) : [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartUI();
  // Dispatch custom event for other scripts to listen
  window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart } }));
}

function addToCart(product) {
  const cart = getCart();
  const existingItem = cart.find(item => item.id === product.id);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: Array.isArray(product.image) ? product.image[0] : product.image,
      quantity: 1
    });
  }
  
  saveCart(cart);
  openCartDrawer();
}

function updateQuantity(productId, delta) {
  let cart = getCart();
  const item = cart.find(item => item.id === productId);
  
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      cart = cart.filter(i => i.id !== productId);
    }
    saveCart(cart);
  }
}

function removeFromCart(productId) {
  const cart = getCart().filter(item => item.id !== productId);
  saveCart(cart);
}

function updateCartUI() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  // Update header count
  const countEl = document.querySelector('.cart-count');
  if (countEl) {
    countEl.textContent = count;
    countEl.style.display = count > 0 ? 'inline-block' : 'none';
  }
  
  renderCartContent();
}

function openCartDrawer() {
  const cartDrawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('side-drawer-overlay');
  if (cartDrawer && overlay) {
    cartDrawer.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function renderCartContent() {
  const container = document.getElementById('cart-items-container');
  if (!container) return;
  
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  if (cart.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 4rem 2rem;">
        <i class="fa-solid fa-cart-shopping" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 1.5rem;"></i>
        <h3 style="color: #64748b; margin-bottom: 1rem;">Your cart is empty</h3>
        <p style="font-size: 0.9rem; color: #94a3b8; margin-bottom: 2rem;">Looks like you haven't added anything to your cart yet.</p>
        <button onclick="document.getElementById('close-cart').click()" class="btn btn-primary btn-block">Start Shopping</button>
      </div>
    `;
    document.getElementById('cart-subtotal').textContent = formatPrice(0);
    return;
  }
  
  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/80?text=No+Image'">
      <div class="cart-item-details">
        <div class="cart-item-title">${item.name}</div>
        <div class="cart-item-price">${formatPrice(item.price)}</div>
        <div class="cart-item-actions">
          <div class="quantity-control">
            <button onclick="updateQuantity('${item.id}', -1)">-</button>
            <span>${item.quantity}</span>
            <button onclick="updateQuantity('${item.id}', 1)">+</button>
          </div>
          <button class="remove-item" onclick="removeFromCart('${item.id}')">Remove</button>
        </div>
      </div>
    </div>
  `).join('');
  
  document.getElementById('cart-subtotal').textContent = formatPrice(subtotal);
}

// Update the renderNavbar to include the Cart Drawer HTML
const originalRenderNavbar = renderNavbar;
renderNavbar = function() {
  originalRenderNavbar();
  
  const cartDrawerHTML = `
    <div class="side-drawer cart-drawer" id="cart-drawer">
      <div class="side-drawer-header">
        <i class="fa-solid fa-cart-shopping"></i>
        <span>Your Shopping Cart</span>
        <button class="close-drawer" id="close-cart">&times;</button>
      </div>
      <div class="side-drawer-content" style="flex:1; display:flex; flex-direction:column;">
        <div id="cart-items-container" style="flex:1; overflow-y:auto; padding: 1rem;">
          <!-- Items injected via JS -->
        </div>
        
        <div class="cart-footer" style="padding: 1.5rem; border-top: 1px solid var(--border-color); background: #f8fafc;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
            <strong style="font-size: 1.1rem;">Subtotal</strong>
            <strong id="cart-subtotal" style="font-size: 1.25rem; color: var(--text-dark);">0 RWF</strong>
          </div>
          <button class="btn btn-primary btn-block" style="padding: 1rem; border-radius: 8px;">
            Proceed to Checkout
          </button>
          <p style="text-align:center; font-size: 0.8rem; color: #64748b; margin-top: 0.8rem;">
            Shipping and taxes calculated at checkout.
          </p>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', cartDrawerHTML);
  
  // Link Cart Icon Trigger
  const cartTrigger = document.querySelector('.cart-icon');
  const closeCart = document.getElementById('close-cart');
  const cartDrawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('side-drawer-overlay');
  
  if (cartTrigger) {
    cartTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      openCartDrawer();
    });
  }
  
  const closeAllDrawers = () => {
    cartDrawer.classList.remove('active');
    document.getElementById('side-drawer').classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  };
  
  if (closeCart) closeCart.addEventListener('click', closeAllDrawers);
  if (overlay) overlay.addEventListener('click', closeAllDrawers);
  
  updateCartUI();
};

// ---- Test Mode (Developer Mode) Logic ----
function isTestMode() {
  return localStorage.getItem('easyMarketTestMode') === 'true';
}

function toggleTestMode() {
  const current = isTestMode();
  localStorage.setItem('easyMarketTestMode', !current);
  location.reload();
}

function renderTestModeBanner() {
  if (!isTestMode()) return;
  const banner = document.createElement('div');
  banner.className = 'test-mode-banner';
  banner.innerHTML = `
    <i class="fa-solid fa-vial"></i> 
    <strong>TEST MODE ACTIVE</strong> &bull; Mock Data Enabled
    <button onclick="toggleTestMode()">Disable</button>
  `;
  document.body.prepend(banner);
}

// ---- Global Support Action ----
function renderGlobalSupportButton() {
  const btnHTML = `
    <button class="support-fab" onclick="openSupportDrawer()" title="Contact Support">
      <i class="fa-solid fa-headset"></i>
      <span>Contact Support</span>
    </button>
  `;
  document.body.insertAdjacentHTML('beforeend', btnHTML);
}

function openSupportDrawer() {
  const sideDrawer = document.getElementById('side-drawer');
  const overlay = document.getElementById('side-drawer-overlay');
  if (sideDrawer && overlay) {
    sideDrawer.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Focus the support form
    setTimeout(() => {
      const form = document.getElementById('drawer-support-form');
      if (form) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 400);
  }
}

// Initialize Global UI Components
document.addEventListener('DOMContentLoaded', () => {
  renderTestModeBanner();
  renderGlobalSupportButton();
});
