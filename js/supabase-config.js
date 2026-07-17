// ============================================
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
const supabaseSdk = window.supabase || window.Supabase;
if (!supabaseSdk || typeof supabaseSdk.createClient !== 'function') {
  throw new Error('Supabase SDK is not loaded. Make sure the CDN script is included before js/supabase-config.js.');
}

const supabase = supabaseSdk.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Supabase auth listener - keep user session in localStorage
if (supabase && supabase.auth) {
  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      localStorage.setItem('isokoHubCurrentUser', JSON.stringify({
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.full_name || 'User'
      }));
    } else {
      localStorage.removeItem('isokoHubCurrentUser');
    }
  });
}
