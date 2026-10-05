import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import About from './About.jsx';
import Admin from './Admin.jsx';
import AdminChat from './AdminChat.jsx';
import AdminProfile from './AdminProfile.jsx';
import { Login, Signup } from './AuthPages.jsx';
import BlogPost from './BlogPost.jsx';
import Chat from './Chat.jsx';
import ChatInbox from './ChatInbox.jsx';
import Checkout from './Checkout.jsx';
import Dashboard from './Dashboard.jsx';
import HousehubSell from './HousehubSell.jsx';
import HousesRent from './HousesRent.jsx';
import Home from './Home.jsx';
import ImageStudio from './ImageStudio.jsx';
import Products from './Products.jsx';
import ProductDetails from './ProductDetails.jsx';
import { Privacy, Terms } from './PolicyPages.jsx';
import SellerProfile from './SellerProfile.jsx';
import Sell from './Sell.jsx';
import Shop from './Shop.jsx';
import Support from './Support.jsx';
import Visitors from './Visitors.jsx';

const root = createRoot(document.getElementById('react-home-root'));

function normalizeRoutePath(pathname = window.location.pathname) {
  const value = String(pathname || '/').toLowerCase();
  const cleaned = value.replace(/\/+$/, '') || '/';
  return cleaned.endsWith('.html') ? cleaned.slice(0, -5) || '/' : cleaned;
}

const sharedScripts = ['js/route-utils.js', 'js/data.js', 'js/core/isoko-core.js', 'js/core/user-capabilities.js', 'js/core/profile-service.js', 'js/core/module-registry.js', 'js/core/search-architecture.js', 'js/core/ecosystem-discovery.js', 'js/core/isokolink-service.js', 'js/core/module-access-policy.js', 'js/core/service-module.js', 'js/core/property-module.js', 'js/app.js'];
const routeDefinitions = {
  '/': { component: Home, styles: () => import('./Home.css'), scripts: [...sharedScripts, 'js/home.js'] },
  '/home': { component: Home, styles: () => import('./Home.css'), scripts: [...sharedScripts, 'js/home.js'] },
  '/about': { component: About, scripts: sharedScripts },
  '/admin-profile': { component: AdminProfile, scripts: sharedScripts },
  '/admin': {
    component: Admin,
    styles: () => import('./Admin.css'),
    scripts: ['js/route-utils.js', 'js/data.js', 'js/auth.js', 'js/app.js', 'js/claude.js'],
    afterScripts: ['js/admin.js']
  },
  '/admin-chat': {
    component: AdminChat,
    scripts: sharedScripts,
    afterScripts: ['js/admin-chat.js']
  },
  '/privacy': { component: Privacy, scripts: sharedScripts },
  '/terms': { component: Terms, scripts: sharedScripts },
  '/support': { component: Support, scripts: sharedScripts },
  '/login': { component: Login, scripts: ['js/route-utils.js', 'js/data.js', 'js/app.js', 'js/auth.js'] },
  '/signup': { component: Signup, scripts: ['js/route-utils.js', 'js/data.js', 'js/app.js', 'js/auth.js'] },
  '/blog-post': {
    component: BlogPost,
    scripts: sharedScripts,
    afterScripts: ['js/blog-data.js', 'js/blog-viewer.js']
  },
  '/chat-inbox': {
    component: ChatInbox,
    scripts: sharedScripts,
    afterScripts: ['js/chat-inbox.js']
  },
  '/chat': {
    component: Chat,
    scripts: sharedScripts,
    afterScripts: ['js/chat.js']
  },
  '/checkout': {
    component: Checkout,
    scripts: sharedScripts,
    afterScripts: ['js/checkout.js']
  },
  '/dashboard': {
    component: Dashboard,
    scripts: ['js/route-utils.js', 'js/data.js', 'js/app.js', 'js/auth.js'],
    afterScripts: ['js/dashboard.js']
  },
  '/image-studio': {
    component: ImageStudio,
    scripts: sharedScripts,
    afterScripts: [
      'js/services/image/imageStudioImageUtils.js',
      'js/services/image/backgroundRemovalService.js',
      'js/services/image/enhancementService.js',
      'js/services/image/upscaleService.js',
      'js/image-studio.js'
    ]
  },
  '/househub-sell': {
    component: HousehubSell,
    scripts: ['js/route-utils.js', 'js/data.js', 'js/auth.js', 'js/app.js'],
    afterScripts: ['js/househub-sell.js']
  },
  '/houses-rent': {
    component: HousesRent,
    scripts: sharedScripts,
    afterScripts: ['js/houses-rent.js']
  },
  '/seller-profile': {
    component: SellerProfile,
    scripts: sharedScripts,
    afterScripts: ['js/seller-profile.js']
  },
  '/shop': {
    component: Shop,
    scripts: sharedScripts,
    afterScripts: ['js/shop.js']
  },
  '/products': {
    component: Products,
    scripts: sharedScripts,
    afterScripts: ['js/products.js']
  },
  '/product': {
    component: ProductDetails,
    styles: () => import('./ProductDetails.css'),
    scripts: ['js/route-utils.js', 'js/data.js', 'js/app.js', 'js/claude.js'],
    afterScripts: ['js/product-details.js']
  },
  '/sell': {
    component: Sell,
    scripts: sharedScripts,
    afterScripts: ['js/sell.js']
  },
  '/visitors': {
    component: Visitors,
    scripts: ['js/route-utils.js', 'js/data.js', 'js/auth.js', 'js/app.js'],
    afterScripts: ['js/visitors.js']
  }
};

const aliasRoutes = {};
for (const [routePath, routeConfig] of Object.entries(routeDefinitions)) {
  if (routePath !== '/') {
    aliasRoutes[`${routePath}.html`] = routeConfig;
  }
  aliasRoutes[`${routePath}/index.html`] = routeConfig;
}
aliasRoutes['/index.html'] = routeDefinitions['/'];
aliasRoutes['/home.html'] = routeDefinitions['/home'];

const routes = { ...routeDefinitions, ...aliasRoutes };
const pathname = normalizeRoutePath(window.location.pathname);
const route = routes[pathname] || routes['/'];
const loadedScripts = new Set();
const pageMetadata = {
  '/': ['IsokoHub | Buy Easy. Sell Smart.', 'Discover products, homes, and local sellers on IsokoHub, Rwanda marketplace for buying and selling nearby.'],
  '/home': ['IsokoHub | Buy Easy. Sell Smart.', 'Discover products, homes, and local sellers on IsokoHub, Rwanda marketplace for buying and selling nearby.'],
  '/products': ['Browse Products | IsokoHub', 'Explore local products and listings from sellers across Rwanda.'],
  '/product': ['Product Details | IsokoHub', 'View product details and connect with a local IsokoHub seller.'],
  '/sell': ['Sell on IsokoHub', 'Create a product listing and reach buyers across Rwanda with IsokoHub.'],
  '/houses-rent': ['Homes and Rentals | IsokoHub', 'Discover homes and rental listings from across Rwanda.'],
  '/househub-sell': ['List a Home | IsokoHub', 'Share a home or rental listing with people searching on IsokoHub.'],
  '/about': ['About IsokoHub', 'Learn about IsokoHub and our mission to connect local buyers and sellers.'],
  '/admin-profile': ['About the Founder | IsokoHub', 'Meet the founder and developer behind IsokoHub.'],
  '/support': ['Support | IsokoHub', 'Get help with your IsokoHub account, listings, or marketplace conversations.'],
  '/privacy': ['Privacy Policy | IsokoHub', 'Read how IsokoHub uses information to provide marketplace features.'],
  '/terms': ['Terms and Conditions | IsokoHub', 'Read the terms for using IsokoHub marketplace services.'],
  '/login': ['Sign In | IsokoHub', 'Sign in to manage your IsokoHub account, listings, and conversations.'],
  '/signup': ['Create an Account | IsokoHub', 'Create an IsokoHub account to buy and sell locally.'],
  '/chat-inbox': ['Messages | IsokoHub', 'View and manage your IsokoHub marketplace conversations.'],
  '/chat': ['Marketplace Chat | IsokoHub', 'Continue your conversation with an IsokoHub buyer or seller.'],
  '/checkout': ['Checkout | IsokoHub', 'Review your IsokoHub purchase details.'],
  '/dashboard': ['Your Dashboard | IsokoHub', 'Manage your IsokoHub account, listings, and seller settings.'],
  '/admin': ['Admin Dashboard | IsokoHub', 'Review and manage IsokoHub marketplace listings.'],
  '/admin-chat': ['Admin Conversations | IsokoHub', 'Review marketplace support conversations in IsokoHub.'],
  '/image-studio': ['Image Studio | IsokoHub', 'Prepare clear product images for your IsokoHub listings.'],
  '/visitors': ['Marketplace Activity | IsokoHub', 'Review IsokoHub marketplace activity.'],
  '/shop': ['Seller Shop | IsokoHub', 'Explore products from an IsokoHub seller.'],
  '/seller-profile': ['Seller Profile | IsokoHub', 'View seller details and listings on IsokoHub.'],
  '/blog-post': ['IsokoHub Stories', 'Read updates and tips from the IsokoHub marketplace.']
};
const [routeTitle, routeDescription] = pageMetadata[pathname] || pageMetadata['/'];
document.title = routeTitle;

function setMeta(selector, attribute, value) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    const [key, keyValue] = selector.match(/\[(name|property)="([^"]+)"\]/).slice(1);
    element.setAttribute(key, keyValue);
    document.head.appendChild(element);
  }
  element.setAttribute(attribute, value);
}

setMeta('meta[name="description"]', 'content', routeDescription);
setMeta('meta[property="og:title"]', 'content', routeTitle);
setMeta('meta[property="og:description"]', 'content', routeDescription);
setMeta('meta[property="og:type"]', 'content', 'website');

let canonicalLink = document.head.querySelector('link[rel="canonical"]');
if (!canonicalLink) {
  canonicalLink = document.createElement('link');
  canonicalLink.rel = 'canonical';
  document.head.appendChild(canonicalLink);
}
canonicalLink.href = `${window.location.origin}${pathname}`;

async function loadScripts(scripts) {
  for (const source of scripts) {
    if (loadedScripts.has(source)) continue;
    loadedScripts.add(source);

    await new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = `/${source}`;
      script.onload = resolve;
      script.onerror = () => {
        console.error(`Unable to load page dependency: ${source}`);
        resolve();
      };
      document.body.appendChild(script);
    });
  }
}

async function startApp() {
  if (route.styles) await route.styles();
  await loadScripts(route.scripts);
  const Page = route.component;

  flushSync(() => {
    root.render(<Page />);
  });

  await loadScripts(route.afterScripts || []);
  document.dispatchEvent(new Event('DOMContentLoaded'));
}

startApp();