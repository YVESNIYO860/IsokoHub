// Supabase PostgreSQL Data Layer (100% Supabase, no Firebase)
const CURRENT_USER_KEY = 'isokoHubCurrentUser';
const SITE_VISITS_TABLE = 'site_visits';
const SITE_VISIT_STORAGE_KEY = 'isokoHubSiteVisitHistory';
const SITE_VISITOR_ID_KEY = 'isokoHubVisitorId';
const PRODUCT_LISTING_HISTORY_KEY = 'isokoHubProductListingCount';
const RWANDA_DISTRICTS = [
  'Bugesera', 'Burera', 'Gakenke', 'Gasabo', 'Gatsibo', 'Gicumbi', 'Gisagara', 'Huye',
  'Kamonyi', 'Karongi', 'Kayonza', 'Kicukiro', 'Kirehe', 'Muhanga', 'Musanze', 'Ngoma',
  'Ngororero', 'Nyabihu', 'Nyagatare', 'Nyamagabe', 'Nyamasheke', 'Nyanza', 'Nyarugenge',
  'Nyaruguru', 'Rubavu', 'Ruhango', 'Rulindo', 'Rusizi', 'Rutsiro', 'Rwamagana'
];

function createShopId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `shop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeShopRecord(record = {}) {
  const profile = record?.profile && typeof record.profile === 'object' ? record.profile : {};
  return {
    id: record?.id || createShopId(),
    name: record?.name || 'Untitled shop',
    description: record?.description || '',
    location: record?.location || '',
    contact: record?.contact || '',
    status: record?.status || 'active',
    profile: {
      slogan: profile?.slogan || '',
      logoUrl: profile?.logoUrl || '',
      bio: profile?.bio || record?.bio || ''
    },
    products: Array.isArray(record?.products) ? record.products : []
  };
}

async function fetchShops() {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('shops').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Unable to fetch shops from Supabase:', error);
      return [];
    }
    return (Array.isArray(data) ? data : []).map(normalizeShopRecord);
  } catch (err) {
    console.warn('Unable to load shops from Supabase:', err);
    return [];
  }
}

async function readStoredShops() {
  try {
    const localShops = localStorage.getItem('isokoHubAdminShops');
    if (localShops) {
      const parsed = JSON.parse(localShops);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.map(normalizeShopRecord);
      }
    }
  } catch (err) {
    console.warn('Unable to load shops from storage:', err);
  }

  return await fetchShops();
}

async function getShopById(shopId) {
  if (!shopId) return null;
  const shops = await readStoredShops();
  return shops.find((shop) => shop && shop.id === shopId) || null;
}

async function enrichProductsWithShopData(products = []) {
  const shops = await readStoredShops();
  return (Array.isArray(products) ? products : []).map((product) => {
    const matchedShop = shops.find((shop) => Array.isArray(shop?.products) && shop.products.includes(product?.id)) || null;
    return {
      ...product,
      shop: matchedShop
        ? {
            ...matchedShop,
            profile: matchedShop.profile || {}
          }
        : null
    };
  });
}

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
  const localListingCount = getStoredProductListingCount();
  if (!supabase) {
    return { productCount: localListingCount, responseMinutes: 15 };
  }

  try {
    const { count, error } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    const dbCount = Number.isFinite(count) ? count : 0;
    const productCount = Math.max(localListingCount, dbCount);
    if (dbCount > localListingCount) {
      saveStoredProductListingCount(dbCount);
    }

    const responseMinutes = 15;
    return { productCount, responseMinutes };
  } catch (err) {
    console.error('Error fetching hero stats:', err?.message || err);
    return { productCount: localListingCount, responseMinutes: 15 };
  }
}

async function fetchProductCount(filters = {}) {
  if (!supabase) return 0;

  try {
    let query = supabase.from('products').select('id', { count: 'exact', head: true });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.ad_requested !== undefined) {
      query = query.eq('ad_requested', filters.ad_requested);
    }

    if (filters.is_ad !== undefined) {
      query = query.eq('is_ad', filters.is_ad);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  } catch (err) {
    console.error('Error fetching product count:', err);
    return 0;
  }
}

let supabaseUserProfilesTableMissing = false;
let siteVisitsTableMissing = false;

async function fetchUserCount() {
  if (!supabase || supabaseUserProfilesTableMissing) {
    const stored = getStoredUserProfiles();
    return stored.length;
  }

  try {
    const { count, error } = await supabase
      .from(SUPABASE_USER_PROFILES_TABLE)
      .select('id', { count: 'exact', head: true });

    if (error) {
      const isMissingTable = error?.status === 404
        || (error?.message && /not found|does not exist|relation .* does not exist/i.test(error.message))
        || error?.code === '42P01';

      if (isMissingTable) {
        console.warn('Supabase user profile table missing, falling back to local storage:', error);
        supabaseUserProfilesTableMissing = true;
        const stored = getStoredUserProfiles();
        return stored.length;
      }
      throw error;
    }

    if (typeof count === 'number' && count > 0) {
      return count;
    }

    const stored = getStoredUserProfiles();
    return stored.length;
  } catch (err) {
    console.error('Error fetching user count:', err?.message || err);
    const stored = getStoredUserProfiles();
    return stored.length;
  }
}

function getVisitorId() {
  try {
    let visitorId = localStorage.getItem(SITE_VISITOR_ID_KEY);
    if (!visitorId) {
      visitorId = `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem(SITE_VISITOR_ID_KEY, visitorId);
    }
    return visitorId;
  } catch (err) {
    return `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

function getStoredProductListingCount() {
  try {
    const storedValue = Number(localStorage.getItem(PRODUCT_LISTING_HISTORY_KEY));
    return Number.isFinite(storedValue) && storedValue >= 0 ? storedValue : 0;
  } catch (err) {
    return 0;
  }
}

function saveStoredProductListingCount(value = 0) {
  try {
    localStorage.setItem(PRODUCT_LISTING_HISTORY_KEY, String(Math.max(0, Number(value) || 0)));
  } catch (err) {
    console.warn('Unable to save local product listing count:', err);
  }
}

function incrementStoredProductListingCount(count = 1) {
  const current = getStoredProductListingCount();
  const next = current + (Number.isFinite(count) ? count : 1);
  saveStoredProductListingCount(next);
  return next;
}

function getStoredSiteVisits() {
  try {
    const rawVisits = localStorage.getItem(SITE_VISIT_STORAGE_KEY);
    const visits = rawVisits ? JSON.parse(rawVisits) : [];
    return Array.isArray(visits) ? visits : [];
  } catch (err) {
    return [];
  }
}

function saveStoredSiteVisits(visits = []) {
  try {
    localStorage.setItem(SITE_VISIT_STORAGE_KEY, JSON.stringify(Array.isArray(visits) ? visits : []));
  } catch (err) {
    console.warn('Unable to save local site visits:', err);
  }
}

async function logSiteVisit(pagePath = window.location.pathname) {
  const visitorId = getVisitorId();
  const visitRecord = {
    visitor_id: visitorId,
    page: String(pagePath || window.location.pathname),
    visited_at: new Date().toISOString()
  };

  const storedVisits = getStoredSiteVisits();
  if (!supabase || siteVisitsTableMissing) {
    storedVisits.push(visitRecord);
    saveStoredSiteVisits(storedVisits);
    return storedVisits.length;
  }

  try {
    const { error } = await supabase
      .from(SITE_VISITS_TABLE)
      .insert([visitRecord]);

    if (error) {
      throw error;
    }

    return storedVisits.length + 1;
  } catch (err) {
    const tableMissing = err?.status === 404
      || (err?.message && /not found|does not exist|relation .* does not exist/i.test(err.message));

    if (tableMissing) {
      siteVisitsTableMissing = true;
      storedVisits.push(visitRecord);
      saveStoredSiteVisits(storedVisits);
      return storedVisits.length;
    }

    console.warn('Unable to log site visit:', err?.message || err);
    storedVisits.push(visitRecord);
    saveStoredSiteVisits(storedVisits);
    return storedVisits.length;
  }
}

async function fetchSiteVisitCount() {
  const storedVisits = getStoredSiteVisits();
  let totalVisits = storedVisits.length;

  if (!supabase || siteVisitsTableMissing) {
    return totalVisits;
  }

  try {
    const { count, error } = await supabase
      .from(SITE_VISITS_TABLE)
      .select('id', { count: 'exact', head: true });

    if (!error && typeof count === 'number') {
      totalVisits = count;
    }
  } catch (err) {
    const tableMissing = err?.status === 404
      || (err?.message && /not found|does not exist|relation .* does not exist/i.test(err.message));

    if (tableMissing) {
      siteVisitsTableMissing = true;
      return totalVisits;
    }

    console.warn('Unable to fetch site visit count from Supabase:', err?.message || err);
  }

  return totalVisits;
}

function countStoredVisitsSince(startDate) {
  const storedVisits = getStoredSiteVisits();
  return storedVisits.reduce((count, visit) => {
    const visitedAt = new Date(visit?.visited_at || '');
    return count + (Number.isFinite(visitedAt.valueOf()) && visitedAt >= startDate ? 1 : 0);
  }, 0);
}

async function fetchSiteVisitCountSince(startDate) {
  if (!supabase || siteVisitsTableMissing) {
    return countStoredVisitsSince(startDate);
  }

  try {
    const { count, error } = await supabase
      .from(SITE_VISITS_TABLE)
      .select('id', { count: 'exact', head: true })
      .gte('visited_at', startDate.toISOString());

    if (!error && typeof count === 'number') {
      return count;
    }
  } catch (err) {
    const tableMissing = err?.status === 404
      || (err?.message && /not found|does not exist|relation .* does not exist/i.test(err.message));

    if (tableMissing) {
      siteVisitsTableMissing = true;
      return countStoredVisitsSince(startDate);
    }

    console.warn('Unable to fetch site visit count since date from Supabase:', err?.message || err);
  }

  return countStoredVisitsSince(startDate);
}

async function fetchSiteVisitMetrics(timeframe = null) {
  const now = new Date();
  const hourlyAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const dailyAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weeklyAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthlyAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const metrics = {
    hourly: await fetchSiteVisitCountSince(hourlyAgo),
    daily: await fetchSiteVisitCountSince(dailyAgo),
    weekly: await fetchSiteVisitCountSince(weeklyAgo),
    monthly: await fetchSiteVisitCountSince(monthlyAgo),
    total: await fetchSiteVisitCount()
  };

  if (typeof timeframe === 'string') {
    const key = timeframe.toLowerCase();
    return metrics[key] ?? 0;
  }

  return metrics;
}

async function fetchRecentVisits(limit = 10) {
  if (!supabase || siteVisitsTableMissing) {
    const storedVisits = getStoredSiteVisits();
    return storedVisits
      .slice(-limit)
      .reverse()
      .map((visit) => ({
        visitor_id: visit.visitor_id || 'Guest',
        page: visit.page || 'Unknown',
        visited_at: visit.visited_at || visit.timestamp || ''
      }));
  }

  try {
    const { data, error } = await supabase
      .from(SITE_VISITS_TABLE)
      .select('visitor_id, page, visited_at')
      .order('visited_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((visit) => ({
      visitor_id: visit.visitor_id || 'Guest',
      page: visit.page || 'Unknown',
      visited_at: visit.visited_at || ''
    }));
  } catch (err) {
    console.warn('Unable to fetch recent visits from Supabase:', err);
    const storedVisits = getStoredSiteVisits();
    return storedVisits
      .slice(-limit)
      .reverse()
      .map((visit) => ({
        visitor_id: visit.visitor_id || 'Guest',
        page: visit.page || 'Unknown',
        visited_at: visit.visited_at || visit.timestamp || ''
      }));
  }
}

async function fetchVerifiedSellerCount() {
  const isVerifiedSeller = (profile) => {
    return profile?.role === 'seller' && profile?.is_verified === true;
  };

  if (!supabase || supabaseUserProfilesTableMissing) {
    const stored = getStoredUserProfiles();
    return stored.filter(isVerifiedSeller).length;
  }

  try {
    const { count, error } = await supabase
      .from(SUPABASE_USER_PROFILES_TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('role', 'seller')
      .eq('is_verified', true);

    if (error) {
      const isMissingTable = error?.status === 404
        || (error?.message && /not found|does not exist|relation .* does not exist/i.test(error.message))
        || error?.code === '42P01';
      const isMissingColumn = error?.code === '42703'
        || (error?.message && /column .* does not exist/i.test(error.message));

      if (isMissingTable) {
        console.warn('Supabase user profile table missing, falling back to local storage:', error);
        supabaseUserProfilesTableMissing = true;
        const stored = getStoredUserProfiles();
        return stored.filter(isVerifiedSeller).length;
      }

      if (isMissingColumn) {
        console.warn('Supabase is_verified column is not available yet; using local verified-seller fallback:', error);
        const stored = getStoredUserProfiles();
        return stored.filter(isVerifiedSeller).length;
      }

      throw error;
    }

    if (typeof count === 'number') {
      return count;
    }

    const stored = getStoredUserProfiles();
    return stored.filter(isVerifiedSeller).length;
  } catch (err) {
    console.error('Error fetching verified seller count:', err?.message || err);
    const stored = getStoredUserProfiles();
    return stored.filter(isVerifiedSeller).length;
  }
}

/**
 * Fetch products from Supabase PostgreSQL
 * @param {boolean} approvedOnly - If true, only returns products with status 'approved'
 * @param {string} sellerId - Optional: filter by seller
 */
async function fetchProducts(approvedOnly = true, sellerId = null, includeHousehub = false) {
  if (!supabase) return [];
  showAppLoader('Loading marketplace items...');
  try {
    // Basic query without server-side exclude filters to avoid REST 400 errors
    let query = supabase.from('products').select('*');
    if (approvedOnly) query = query.eq('status', 'approved');
    if (sellerId) query = query.eq('seller_id', sellerId);
    const { data, error } = await query.order('created_at', { ascending: false });
    hideAppLoader();
    if (error) {
      console.warn('fetchProducts error from Supabase:', error?.message || error);
      return [];
    }

    // If caller does not want Househub items, filter them client-side.
    const rows = Array.isArray(data) ? data : [];
    if (!includeHousehub) {
      return rows.filter((r) => !(r && (r.exclude_from_browse === true || r.excludeFromBrowse === true)));
    }
    return rows;
  } catch (err) {
    hideAppLoader();
    console.error('Error fetching products:', err?.message || err);
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

  if (window.ISOKO_DEBUG === true) console.log('Current Supabase User ID:', session.user.id);
  if (window.ISOKO_DEBUG === true) console.log('Creating product with data:', productData);

  // Convert camelCase keys to snake_case for PostgreSQL
  const newProduct = {
    name: productData.name,
    category: productData.category,
    price: productData.price,
    currency: productData.currency || 'RWF',
    image: productData.image || [],
    description: productData.description,
    condition: productData.condition,
    seller_email: productData.sellerEmail,
    seller_phone: productData.sellerPhone,
    district: productData.district,
    seller_lat: productData.sellerLat || productData.seller_lat || null,
    seller_lng: productData.sellerLng || productData.seller_lng || null,
    buy_online: productData.buyOnline === true || productData.buy_online === true || false,
    seller_id: session.user.id,
    status: 'pending',
    is_ad: false,
    ad_requested: false,
    property_type: productData.propertyType || null,
    listing_type: productData.listingType || null,
    video_url: productData.videoUrl || null,
    is_househub: (productData.isHousehub === true) || ['Houses & Rents', 'Housing', 'House', 'HouseHub', 'Rent'].includes(productData.category),
    exclude_from_browse: (productData.isHousehub === true) || false,
  };
  
  if (window.ISOKO_DEBUG === true) console.log('Final product object for Supabase:', newProduct);
  
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([newProduct])
      .select()
      .single();
    
    if (error) throw error;
    incrementStoredProductListingCount(1);
    if (window.ISOKO_DEBUG === true) console.log('✓ Product saved to Supabase with ID:', data.id);
    return data;
  } catch (err) {
    console.error('✗ Error saving product to Supabase:', err?.message || err);
    throw err;
  }
}

async function updateProductStatus(id, status) {
  if (!supabase) return;
  
  const { error } = await supabase
    .from('products')
    .update({ status })
    .eq('id', id);
  
  if (error) throw error;
}

/**
 * Update product fields. Accepts camelCase keys and converts to snake_case for the DB.
 * Example: updateProductData(id, { isAd: false, adRequested: false })
 */
async function updateProductData(id, changes = {}) {
  if (!id) throw new Error('Product id required');
  if (!supabase) return null;

  // Convert camelCase to snake_case for common fields
  const convertKey = (key) => key.replace(/([A-Z])/g, '_$1').toLowerCase();
  const payload = {};
  Object.keys(changes || {}).forEach((k) => {
    const v = changes[k];
    const dbKey = convertKey(k);
    payload[dbKey] = v;
  });

  // If updating the Househub flag, ensure exclude_from_browse follows it
  try {
    if (Object.prototype.hasOwnProperty.call(payload, 'is_househub')) {
      payload.exclude_from_browse = payload.is_househub === true;
    }
  } catch (e) {
    // ignore
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    try { window.dispatchEvent(new CustomEvent('product:updated', { detail: data })); } catch (e) { /* ignore */ }
    return data;
  } catch (err) {
    console.error('Error updating product data:', err?.message || err);
    throw err;
  }
}

async function deleteProduct(id) {
  if (!supabase) return;
  
  // Get product data to delete associated files
  const product = await fetchProductById(id);
  if (product) {
    // Delete images from storage
    if (Array.isArray(product.image) && product.image.length > 0) {
      for (const imageUrl of product.image) {
        await deleteFileFromBucket(imageUrl, 'product-images');
      }
    }
    
    // Delete video from storage if exists
    if (product.video_url) {
      await deleteFileFromBucket(product.video_url, 'house-videos');
    }
  }
  
  // Delete product record from database
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  if (window.ISOKO_DEBUG === true) console.log('✓ Product and associated files deleted');
}

/**
 * Delete file from Supabase Storage bucket
 * @param {string} fileUrl - Full URL of the file or just the path
 * @param {string} bucketName - Name of the bucket (product-images, house-videos)
 */
async function deleteFileFromBucket(fileUrl, bucketName) {
  if (!supabase || !fileUrl) return;
  
  try {
    // Extract file path from URL
    const filePath = extractFilePathFromUrl(fileUrl);
    if (!filePath) {
      console.warn('Could not extract file path:', fileUrl);
      return;
    }
    
    const { error } = await supabase
      .storage
      .from(bucketName)
      .remove([filePath]);
    
    if (error) {
      console.error(`Error deleting ${filePath} from ${bucketName}:`, error);
      return false;
    }
    
    if (window.ISOKO_DEBUG === true) console.log(`✓ Deleted: ${filePath} from ${bucketName}`);
    return true;
  } catch (err) {
    console.error('Error in deleteFileFromBucket:', err);
    return false;
  }
}

/**
 * Extract file path from Supabase Storage URL
 * Converts: https://xxx.supabase.co/storage/v1/object/public/product-images/abc123.jpg
 * To: abc123.jpg
 */
function extractFilePathFromUrl(url) {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Path format: /storage/v1/object/public/bucket-name/file-path
    const pathParts = pathname.split('/');
    const bucketIndex = pathParts.indexOf('public');
    
    if (bucketIndex === -1) return null;
    
    // Get everything after 'public' and bucket name
    const filePath = pathParts.slice(bucketIndex + 2).join('/');
    return decodeURIComponent(filePath);
  } catch (err) {
    console.error('Error extracting file path:', err);
    return null;
  }
}

/**
 * Delete multiple files from bucket
 * @param {array} fileUrls - Array of file URLs
 * @param {string} bucketName - Bucket name
 */
async function deleteMultipleFilesFromBucket(fileUrls, bucketName) {
  if (!supabase || !Array.isArray(fileUrls)) return;
  
  const filePaths = fileUrls
    .map(url => extractFilePathFromUrl(url))
    .filter(path => path !== null);
  
  if (filePaths.length === 0) return;
  
  try {
    const { error } = await supabase
      .storage
      .from(bucketName)
      .remove(filePaths);
    
    if (error) {
      console.error(`Error deleting files from ${bucketName}:`, error);
      return false;
    }
    
    if (window.ISOKO_DEBUG === true) console.log(`✓ Deleted ${filePaths.length} files from ${bucketName}`);
    return true;
  } catch (err) {
    console.error('Error in deleteMultipleFilesFromBucket:', err);
    return false;
  }
}

/**
 * Auth Logic (localStorage sync with Supabase)
 */
function getCurrentUser() {
  const userStr = localStorage.getItem(CURRENT_USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
}

function getStoredUserProfiles() {
  try {
    const profilesStr = localStorage.getItem('isokoHubUserProfiles');
    if (!profilesStr) return [];
    const parsed = JSON.parse(profilesStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function saveStoredUserProfiles(profiles) {
  try {
    localStorage.setItem('isokoHubUserProfiles', JSON.stringify(profiles));
  } catch (err) {
    console.warn('Could not save local user profiles:', err);
  }
}

function upsertStoredUserProfile(profile) {
  const profiles = getStoredUserProfiles();
  const index = profiles.findIndex(item => item.id === profile.id);
  if (index >= 0) {
    profiles[index] = { ...profiles[index], ...profile };
  } else {
    profiles.unshift(profile);
  }
  saveStoredUserProfiles(profiles);
  return profiles;
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

/**
 * Fetch user profiles for admin management
 */
async function fetchUserProfiles() {
  showAppLoader('Loading users...');
  try {
    const storedProfiles = getStoredUserProfiles();
    hideAppLoader();
    return storedProfiles;
  } catch (err) {
    hideAppLoader();
    return getStoredUserProfiles();
  }
}

/**
 * Update user profile role (e.g., promote to admin or seller)
 */
async function updateUserProfileRole(userId, newRole) {
  const localProfile = getStoredUserProfiles().find(item => item.id === userId);
  if (localProfile) {
    upsertStoredUserProfile({ ...localProfile, role: newRole });
  }

  if (!supabase) return true;

  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      const isMissingTable = error?.status === 404 || error?.message?.includes('does not exist') || error?.message?.includes('not found') || error?.code === '42P01';
      if (!isMissingTable) throw error;
    }
    return true;
  } catch (err) {
    return true;
  }
}

/**
 * Delete user profile record from `user_profiles` (does NOT delete auth user)
 */
async function deleteUserProfile(userId) {
  const profiles = getStoredUserProfiles().filter(item => item.id !== userId);
  saveStoredUserProfiles(profiles);

  if (!supabase) return true;

  try {
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      const isMissingTable = error?.status === 404 || error?.message?.includes('does not exist') || error?.message?.includes('not found') || error?.code === '42P01';
      if (!isMissingTable) throw error;
    }
    return true;
  } catch (err) {
    return true;
  }
}

