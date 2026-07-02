// Firebase Firestore Data Layer
const EXCHANGE_RATE_USDT_RWF = 1295; // 1 USDT = 1295 RWF
const CURRENT_USER_KEY = 'easyMarketCurrentUser';

// Helper: Get Firestore collection
const getProductCol = () => db ? db.collection('products') : null;

/**
 * Fetch products from Firestore.
 * @param {boolean} approvedOnly - If true, only returns products with status 'approved'
 * @param {string} sellerId - Optional: filter by seller
 */
async function fetchProducts(approvedOnly = true, sellerId = null) {
  if (!db) return [];
  try {
    let query = getProductCol();
    if (approvedOnly) {
      query = query.where('status', '==', 'approved');
    }
    if (sellerId) {
      query = query.where('sellerId', '==', sellerId);
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Error fetching products:", err);
    return [];
  }
}

/**
 * Fetch all pending products (Admin only)
 */
async function fetchPendingProducts() {
  if (!db) return [];
  try {
    const snapshot = await getProductCol()
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
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
  
  const newProduct = {
    ...productData,
    status: 'pending', // Scam-prevention default
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  const docRef = await getProductCol().add(newProduct);
  return { id: docRef.id, ...newProduct };
}

async function updateProductData(id, updatedData) {
  if (!db) return;
  await getProductCol().doc(id).update(updatedData);
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
  if (auth) auth.signOut();
}

/**
 * Format Currency (Converts USDT to RWF)
 */
function formatPrice(usdtPrice) {
  const rwfPrice = usdtPrice * EXCHANGE_RATE_USDT_RWF;
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
  try {
    const snapshot = await getProductCol()
      .where('status', '==', 'approved')
      .where('isAd', '==', true)
      .limit(6)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Error fetching promoted products:", err);
    return [];
  }
}

async function fetchAdRequests() {
  if (!db) return [];
  try {
    const snapshot = await getProductCol()
      .where('adRequested', '==', true)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Error fetching ad requests:", err);
    return [];
  }
}

