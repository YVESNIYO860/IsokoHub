// Supabase PostgreSQL Data Layer (100% Supabase, no Firebase)
const CURRENT_USER_KEY = 'isokoHubCurrentUser';
const RWANDA_DISTRICTS = [
  'Bugesera', 'Burera', 'Gakenke', 'Gasabo', 'Gatsibo', 'Gicumbi', 'Gisagara', 'Huye',
  'Kamonyi', 'Karongi', 'Kayonza', 'Kicukiro', 'Kirehe', 'Muhanga', 'Musanze', 'Ngoma',
  'Ngororero', 'Nyabihu', 'Nyagatare', 'Nyamagabe', 'Nyamasheke', 'Nyanza', 'Nyarugenge',
  'Nyaruguru', 'Rubavu', 'Ruhango', 'Rulindo', 'Rusizi', 'Rutsiro', 'Rwamagana'
];

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
  if (!supabase) {
    return { productCount: 0, responseMinutes: 15 };
  }

  try {
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    const productCount = count || 0;
    const responseMinutes = 15;

    return { productCount, responseMinutes };
  } catch (err) {
    console.error('Error fetching hero stats:', err);
    return { productCount: 0, responseMinutes: 15 };
  }
}

/**
 * Fetch products from Supabase PostgreSQL
 * @param {boolean} approvedOnly - If true, only returns products with status 'approved'
 * @param {string} sellerId - Optional: filter by seller
 */
async function fetchProducts(approvedOnly = true, sellerId = null) {
  if (!supabase) return [];
  showAppLoader('Loading marketplace items...');
  try {
    let query = supabase.from('products').select('*');
    
    if (approvedOnly) {
      query = query.eq('status', 'approved');
    }
    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    hideAppLoader();
    if (error) throw error;
    return data || [];
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
  if (!supabase) return [];
  showAppLoader('Loading pending listings...');
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    hideAppLoader();
    if (error) throw error;
    return data || [];
  } catch (err) {
    hideAppLoader();
    console.error("Error fetching pending products:", err);
    return [];
  }
}

async function fetchProductById(id) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error fetching product by ID:", err);
    return null;
  }
}

/**
 * Create a new product listing (Defaults to 'pending' status)
 */
async function createProduct(productData) {
  if (!supabase) throw new Error("Database not initialized");
  
  // Get current Supabase user
  const session = supabase && supabase.auth ? supabase.auth.session() : null;
  if (!session || !session.user) {
    throw new Error("You must be logged in to save a product.");
  }

  console.log('Current Supabase User ID:', session.user.id);
  console.log('Creating product with data:', productData);

  // Convert camelCase keys to snake_case for PostgreSQL
  const newProduct = {
    name: productData.name,
    category: productData.category,
    price: productData.price,
    currency: productData.currency || 'RWF',
    image: productData.image || [],
    description: productData.description,
    condition: productData.condition,
    seller_phone: productData.sellerPhone,
    district: productData.district,
    seller_id: session.user.id,
    status: 'pending',
    is_ad: false,
    ad_requested: false,
    property_type: productData.propertyType || null,
    listing_type: productData.listingType || null,
    video_url: productData.videoUrl || null,
  };
  
  console.log('Final product object for Supabase:', newProduct);
  
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([newProduct])
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✓ Product saved to Supabase with ID:', data.id);
    return data;
  } catch (error) {
    console.error('✗ Error saving product to Supabase:', error);
    console.error('Error message:', error.message);
    throw error;
  }
}

async function updateProductData(id, updatedData) {
  if (!supabase) return;
  
  // Convert camelCase to snake_case
  const snakeCaseData = {};
  Object.keys(updatedData).forEach(key => {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    snakeCaseData[snakeKey] = updatedData[key];
  });
  
  const { error } = await supabase
    .from('products')
    .update(snakeCaseData)
    .eq('id', id);
  
  if (error) throw error;
}

async function updateProductStatus(id, status) {
  if (!supabase) return;
  
  const { error } = await supabase
    .from('products')
    .update({ status })
    .eq('id', id);
  
  if (error) throw error;
}

async function deleteProduct(id) {
  if (!supabase) return;
  
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

/**
 * Auth Logic (localStorage sync with Supabase)
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
  if (!supabase) return;
  
  const { error } = await supabase
    .from('products')
    .update({ ad_requested: true })
    .eq('id', productId);
  
  if (error) throw error;
}

async function approveAdPlacement(productId) {
  if (!supabase) return;
  
  const { error } = await supabase
    .from('products')
    .update({ is_ad: true, ad_requested: false })
    .eq('id', productId);
  
  if (error) throw error;
}

async function rejectAdPlacement(productId) {
  if (!supabase) return;
  
  const { error } = await supabase
    .from('products')
    .update({ ad_requested: false })
    .eq('id', productId);
  
  if (error) throw error;
}

async function fetchPromotedProducts() {
  if (!supabase) return [];
  showAppLoader('Loading featured deals...');
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'approved')
      .eq('is_ad', true)
      .limit(6)
      .order('created_at', { ascending: false });
    
    hideAppLoader();
    if (error) throw error;
    return data || [];
  } catch (err) {
    hideAppLoader();
    console.error("Error fetching promoted products:", err);
    return [];
  }
}

async function fetchAdRequests() {
  if (!supabase) return [];
  showAppLoader('Loading ad requests...');
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('ad_requested', true)
      .order('created_at', { ascending: false });
    
    hideAppLoader();
    if (error) throw error;
    return data || [];
  } catch (err) {
    hideAppLoader();
    console.error("Error fetching ad requests:", err);
    return [];
  }
}

