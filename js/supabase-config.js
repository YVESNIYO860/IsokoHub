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
let isokoSupabaseClient = null;

function getSupabaseClient() {
  if (isokoSupabaseClient && typeof isokoSupabaseClient.from === 'function') return isokoSupabaseClient;
  if (window.supabaseClient && typeof window.supabaseClient.from === 'function') return window.supabaseClient;
  if (window.supabase && typeof window.supabase.from === 'function') return window.supabase;
  return null;
}

try {
  const sdk = window.supabase;
  const hasSdk = sdk && typeof sdk.createClient === 'function';
  const hasClient = sdk && typeof sdk.from === 'function';

  if (hasClient) {
    isokoSupabaseClient = sdk;
    console.log('✓ Supabase client already available on window.supabase');
  } else if (hasSdk) {
    isokoSupabaseClient = sdk.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✓ Supabase client created from SDK');
  } else if (window.supabaseClient && typeof window.supabaseClient.from === 'function') {
    isokoSupabaseClient = window.supabaseClient;
    console.log('✓ Supabase client loaded from window.supabaseClient fallback');
  }

  if (!isokoSupabaseClient) {
    console.error('Supabase initialization failed. window.supabase:', window.supabase, 'window.supabaseClient:', window.supabaseClient);
    throw new Error('Supabase SDK failed to initialize. Confirm the SDK script loaded successfully and that the remote host can access the CDN.');
  }

  window.supabaseClient = isokoSupabaseClient;
  window.supabase = isokoSupabaseClient;
  window.isokoSupabaseClient = isokoSupabaseClient;

  // Supabase auth listener - keep user session in localStorage
  if (isokoSupabaseClient.auth && typeof isokoSupabaseClient.auth.onAuthStateChange === 'function') {
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
