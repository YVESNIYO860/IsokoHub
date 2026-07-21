npm run // ============================================
// SUPABASE CONFIGURATION
// Primary system for: Authentication, User Management, File Storage
// ============================================

const SUPABASE_URL = 'https://foxfyzytxcuxsncaawwb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_pDzdVJiRND0MDnD67oTAZw_F0NlKI7P';

// Storage buckets for media files
const SUPABASE_IMAGE_BUCKET = 'product-images';
const SUPABASE_VIDEO_BUCKET = 'house-videos';

// User profiles table (in Supabase PostgreSQL)
const SUPABASE_USER_PROFILES_TABLE = 'user_profiles';

// Initialize Supabase client
let isokoSupabaseClient = null;

function getSupabaseClient() {
  if (isokoSupabaseClient && typeof isokoSupabaseClient.from === 'function') return isokoSupabaseClient;
  if (window.supabaseClient && typeof window.supabaseClient.from === 'function') return window.supabaseClient;
  if (window.supabase && typeof window.supabase.from === 'function' && typeof window.supabase.createClient === 'function') return window.supabase;
  return null;
}

try {
  // Supabase CDN exposes window.supabase
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('Supabase SDK not loaded or window.supabase is invalid:', window.supabase);
    throw new Error('Supabase SDK is not loaded or window.supabase is invalid. Check that the CDN script loaded successfully.');
  }

  isokoSupabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.supabaseClient = isokoSupabaseClient;
  window.supabase = isokoSupabaseClient;
  console.log('✓ Supabase initialized successfully');
  
  // Supabase auth listener - keep user session in localStorage
  if (isokoSupabaseClient && isokoSupabaseClient.auth) {
    isokoSupabaseClient.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        localStorage.setItem('isokoHubCurrentUser', JSON.stringify({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || 'User',
          role: session.user.email === 'yvesniyonkuru2022@gmail.com' ? 'admin' : 'seller'
        }));
      } else {
        localStorage.removeItem('isokoHubCurrentUser');
      }
    });
  }
} catch (err) {
  console.error('Failed to initialize Supabase:', err);
}
