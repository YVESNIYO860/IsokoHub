// Supabase Storage configuration
// Replace these values with your Supabase project settings.
const SUPABASE_URL = 'https://foxfyzytxcuxsncaawwb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_pDzdVJiRND0MDnD67oTAZw_F0NlKI7P';

const supabaseSdk = window.supabase || window.Supabase;
if (!supabaseSdk || typeof supabaseSdk.createClient !== 'function') {
  throw new Error('Supabase SDK is not loaded. Make sure the CDN script is included before js/supabase-config.js.');
}

const supabase = supabaseSdk.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
