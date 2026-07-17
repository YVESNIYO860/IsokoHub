// Firebase Firestore Data Layer
const CURRENT_USER_KEY = 'isokoHubCurrentUser';
const RWANDA_DISTRICTS = [
  'Bugesera', 'Burera', 'Gakenke', 'Gasabo', 'Gatsibo', 'Gicumbi', 'Gisagara', 'Huye',
  'Kamonyi', 'Karongi', 'Kayonza', 'Kicukiro', 'Kirehe', 'Muhanga', 'Musanze', 'Ngoma',
  'Ngororero', 'Nyabihu', 'Nyagatare', 'Nyamagabe', 'Nyamasheke', 'Nyanza', 'Nyarugenge',
  'Nyaruguru', 'Rubavu', 'Ruhango', 'Rulindo', 'Rusizi', 'Rutsiro', 'Rwamagana'
];

// Helper: Get Firestore collection
const getProductCol = () => db ? db.collection('products') : null;

function formatHeroProductCount(value) {
  if (!Number.isFinite(value) || value < 0) return '0+';
  if (value >= 1000) {
    const scaled = value / 1000;
    const rounded = scaled >= 10 ? Math.round(scaled) : Number(scaled.toFixed(1));
    return `${rounded % 1 === 0 ? rounded : rounded.toFixed(1)}k+`;
  }
  return `${value}+`;
}

function formatHeroResponseTime(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) return '15 min';
  return `${minutes} min`;
}

async function fetchHeroStats() {
  if (!db) {
    return { productCount: 0, responseMinutes: 15 };
  }

  try {
    const productsSnap = await getProductCol()
      .where('status', '==', 'approved')
      .get();

    const productCount = productsSnap.size;

    let responseMinutes = 15;
    try {
      const settingsDoc = await db.collection('settings').doc('hero').get();
      if (settingsDoc.exists) {
        const settingsData = settingsDoc.data() || {};
        if (Number.isFinite(settingsData.responseTimeMinutes)) {
          responseMinutes = settingsData.responseTimeMinutes;
        }
      }
    } catch (settingsErr) {
      console.warn('Unable to load hero settings:', settingsErr);
    }

    return { productCount, responseMinutes };
  } catch (err) {
    console.error('Error fetching hero stats:', err);
    return { productCount: 0, responseMinutes: 15 };
  }
}

/**
 * Fetch products from Firestore.
 * @param {boolean} approvedOnly - If true, only returns products with status 'approved'
 * @param {string} sellerId - Optional: filter by seller
 */
async function fetchProducts(approvedOnly = true, sellerId = null) {
  if (!db) return [];
  showAppLoader('Loading marketplace items...');
  try {
    let query = getProductCol();
    if (approvedOnly) {
      query = query.where('status', '==', 'approved');
    }
    if (sellerId) {
      query = query.where('sellerId', '==', sellerId);
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    hideAppLoader();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    hideAppLoader();
    console.error("Error fetching products:", err);
    return [];
  }
}

/**
 * Fetch all pending products (Admin only)
 */
async function fetchPendingProducts() {
  if (!db) return [];
  showAppLoader('Loading pending listings...');
  try {
    const snapshot = await getProductCol()
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();
    hideAppLoader();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    hideAppLoader();
    console.error("Error fetching pending products:", err);
    return [];
  }
}

async function fetchProductById(id) {
  if (!db) return null;
  try {
    const doc = await getProductCol().doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  } catch (err) {
    console.error("Error fetching product by ID:", err);
    return null;
  }
}

/**
 * Create a new product listing (Defaults to 'pending' status)
 */
async function createProduct(productData) {
  if (!db) throw new Error("Database not initialized");
  
  // Get current Supabase user
  const session = supabase && supabase.auth ? supabase.auth.session() : null;
  if (!session || !session.user) {
    throw new Error("You must be logged in to save a product.");
  }

  const newProduct = {
    ...productData,
    sellerId: session.user.id,
    currency: productData.currency || 'RWF',
    status: 'pending', // Scam-prevention default
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  const docRef = await getProductCol().add(newProduct);
  return { id: docRef.id, ...newProduct };
}

async function updateProductData(id, updatedData) {
  if (!db) return;
  await getProductCol().doc(id).update({
    ...updatedData,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

async function updateProductStatus(id, status) {
  if (!db) return;
  await getProductCol().doc(id).update({ status });
}

async function deleteProduct(id) {
  if (!db) return;
  await getProductCol().doc(id).delete();
}

/**
 * Auth Logic (Still partially local for session, but integrates with Firebase)
 */
function getCurrentUser() {
  const userStr = localStorage.getItem(CURRENT_USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
}

function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
  if (typeof logoutSupabaseUser === 'function') {
    logoutSupabaseUser();
  }
}

/**
 * Format Currency in Rwandan francs.
 */
function formatPrice(rwfPrice) {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0
  }).format(rwfPrice);
}

/**
 * Advertising Management
 */
async function requestAdPlacement(productId) {
  if (!db) return;
  await getProductCol().doc(productId).update({ adRequested: true });
}

async function approveAdPlacement(productId) {
  if (!db) return;
  await getProductCol().doc(productId).update({ 
    isAd: true, 
    adRequested: false 
  });
}

async function rejectAdPlacement(productId) {
  if (!db) return;
  await getProductCol().doc(productId).update({ 
    adRequested: false 
  });
}

async function fetchPromotedProducts() {
  if (!db) return [];
  showAppLoader('Loading featured deals...');
  try {
    const snapshot = await getProductCol()
      .where('status', '==', 'approved')
      .where('isAd', '==', true)
      .limit(6)
      .get();
    hideAppLoader();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    hideAppLoader();
    console.error("Error fetching promoted products:", err);
    return [];
  }
}

async function fetchAdRequests() {
  if (!db) return [];
  showAppLoader('Loading ad requests...');
  try {
    const snapshot = await getProductCol()
      .where('adRequested', '==', true)
      .get();
    hideAppLoader();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    hideAppLoader();
    console.error("Error fetching ad requests:", err);
    return [];
  }
}

