// ============================================
// SUPABASE AUTHENTICATION HANDLER
// ============================================

/**
 * Check if user is currently authenticated
 */
function isUserAuthenticated() {
  if (!supabase || !supabase.auth) return false;
  const session = supabase.auth.session();
  return !!session?.user;
}

/**
 * Get current authenticated user
 */
function getCurrentAuthUser() {
  if (!supabase || !supabase.auth) return null;
  const session = supabase.auth.session();
  return session?.user || null;
}

function getInitialsFromName(name, fallback = 'U') {
  const trimmed = (name || '').trim();
  if (!trimmed) return fallback;

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase();
}

function createInitialsAvatarUrl(name = '', email = '') {
  const initials = getInitialsFromName(name, email ? email.charAt(0).toUpperCase() : 'U');
  const seed = `${name}${email}`.toLowerCase();
  const hash = Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const background = ['#2563eb', '#0f766e', '#7c3aed', '#dc2626', '#ca8a04', '#475569'][hash % 6];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
      <rect width="240" height="240" rx="120" fill="${background}" />
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="92" font-weight="700" fill="#ffffff">${initials}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/**
 * Generate Gravatar avatar URL from email
 */
function getGravatarUrl(email) {
  if (!email) return createInitialsAvatarUrl('', '');
  const emailHash = md5(email.toLowerCase().trim());
  return `https://www.gravatar.com/avatar/${emailHash}?d=identicon&s=200`;
}

/**
 * Get user avatar from database or current auth session
 */
async function getUserAvatar(userId) {
  const authUser = getCurrentAuthUser();
  const googleAvatar = authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.picture || authUser?.user_metadata?.profile_image || authUser?.avatar_url || null;
  if (googleAvatar) return googleAvatar;

  if (!supabase) {
    const currentUser = getCurrentUser();
    return createInitialsAvatarUrl(currentUser?.name || currentUser?.full_name || '', currentUser?.email || '');
  }
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('avatar_url, full_name, email')
      .eq('id', userId)
      .single();
    
    if (error || !data?.avatar_url) {
      return createInitialsAvatarUrl(data?.full_name || authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || '', data?.email || authUser?.email || '');
    }
    return data.avatar_url;
  } catch (err) {
    console.error('Error fetching avatar:', err);
    const currentUser = getCurrentUser();
    return createInitialsAvatarUrl(currentUser?.name || currentUser?.full_name || '', currentUser?.email || '');
  }
}

/**
 * MD5 hash function for Gravatar (simple implementation)
 */
function md5(str) {
  return Array.from(new TextEncoder().encode(str)).reduce((hash, byte) => {
    return ((hash << 5) - hash) + byte;
  }, 5381).toString(16).slice(-32);
}

/**
 * Save or update user profile in user_profiles table
 */
async function saveUserProfile(userId, userData) {
  if (!supabase) {
    console.warn('Supabase not initialized');
    return Promise.resolve();
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        ...userData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.error('Error saving user profile:', error);
    } else {
      console.log('User profile saved successfully');
    }
    return { data, error };
  } catch (err) {
    console.error('Error in saveUserProfile:', err);
    return { data: null, error: err };
  }
}

/**
 * Logout current user
 */
async function logoutSupabaseUser() {
  try {
    if (supabase && supabase.auth) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase logout error:', error);
        // Still clear local storage even if Supabase logout fails
        localStorage.removeItem('isokoHubCurrentUser');
        return true;
      }
    }
    localStorage.removeItem('isokoHubCurrentUser');
    console.log('✓ User logged out successfully');
    return true;
  } catch (err) {
    console.error('Error in logoutSupabaseUser:', err);
    // Always clear localStorage as fallback
    localStorage.removeItem('isokoHubCurrentUser');
    return true;
  }
}

/**
 * Import users from JSON array (admin function)
 */
async function importUsersFromJson(usersArray) {
  if (!Array.isArray(usersArray) || !supabase) {
    throw new Error('A valid user JSON array is required.');
  }

  const results = [];
  for (const userItem of usersArray) {
    const userId = userItem.uid || userItem.id || userItem.email;
    if (!userId) continue;

    const result = await saveUserProfile(userId, {
      email: userItem.email || '',
      full_name: userItem.name || userItem.fullName || userItem.email || 'User',
      role: userItem.role || 'seller',
      phone: userItem.phone || '',
      avatar_url: userItem.avatar_url || null,
      created_at: new Date().toISOString()
    });
    results.push(result);
  }

  return { imported: results.length };
}

document.addEventListener('DOMContentLoaded', () => {
  const errorMsg = document.getElementById('error-msg');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const adminEmail = 'yvesniyonkuru2022@gmail.com';

  // Supabase Auth State Listener
  if (supabase && supabase.auth) {
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      
      if (session && session.user) {
        // User is signed in
        const user = session.user;
        const profileName = user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.preferred_username || 'User';
        const profilePhone = user.user_metadata?.phone || user.user_metadata?.telephone || user.user_metadata?.phone_number || '';
        const profileAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || user.user_metadata?.profile_image || '';
        const userData = {
          id: user.id,
          email: user.email,
          name: profileName,
          phone: profilePhone,
          avatarUrl: profileAvatar
        };
        localStorage.setItem('isokoHubCurrentUser', JSON.stringify(userData));
        saveUserProfile(user.id, {
          email: user.email,
          full_name: profileName,
          phone: profilePhone,
          avatar_url: profileAvatar || null,
          role: user.email === adminEmail ? 'admin' : 'seller',
          created_at: new Date().toISOString()
        });
        console.log('User logged in:', user.email);

        // If on auth pages, redirect to dashboard
        const currentPath = window.location.pathname.toLowerCase();
        if (currentPath.includes('login.html') || currentPath.includes('signup.html')) {
          // Redirect to dashboard on current domain
          const dashboardUrl = window.location.protocol + '//' + window.location.host + '/dashboard.html';
          setTimeout(() => { window.location.href = dashboardUrl; }, 500);
        }
      } else {
        // User is signed out
        localStorage.removeItem('isokoHubCurrentUser');
        console.log('User logged out');
        
        // If on protected page, redirect to login
        const currentPath = window.location.pathname.toLowerCase();
        const protectedPages = ['dashboard', 'sell', 'admin', 'product-details', 'admin-profile'];
        const isProtected = protectedPages.some(page => currentPath.includes(page));
        
        if (isProtected && !currentPath.includes('index.html') && !currentPath.includes('/')) {
          console.log('Redirecting to login - page is protected');
          const loginUrl = window.location.protocol + '//' + window.location.host + '/login.html';
          setTimeout(() => { window.location.href = loginUrl; }, 500);
        }
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Logging in...';
      
      const termsAccepted = document.getElementById('accept-terms-login').checked;
      if (!termsAccepted) {
        errorMsg.textContent = 'You must accept the Terms and Conditions to log in.';
        errorMsg.classList.remove('d-none');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }

      const email = document.getElementById('email').value;
      const pw = document.getElementById('password').value;

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: pw
        });

        if (error) {
          errorMsg.textContent = error.message || 'Login failed. Please check your credentials.';
          errorMsg.classList.remove('d-none');
          console.error('Login error:', error);
        } else {
          // Clear error message on success
          errorMsg.classList.add('d-none');
          console.log('Login successful for:', email);
          // Redirect happens automatically via auth state listener
        }
      } catch (error) {
        errorMsg.textContent = 'Login failed. Please try again.';
        errorMsg.classList.remove('d-none');
        console.error('Login error:', error);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  const googleLoginBtn = document.getElementById('google-login-btn');
  const googleSignupBtn = document.getElementById('google-signup-btn');

  const handleGoogleSignIn = async (e) => {
    e.preventDefault();
    const btn = e.currentTarget;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Connecting to Google...';
    
    try {
      // Supabase v1.35.7 uses signIn with provider option
      if (!supabase || !supabase.auth) {
        throw new Error('Supabase not initialized');
      }

      console.log('Attempting Google sign-in with Supabase v1.35.7...');
      
      // Get redirect URL based on current domain
      const redirectUrl = window.location.protocol + '//' + window.location.host + '/dashboard.html';
      
      const { error } = await supabase.auth.signIn({
        provider: 'google'
      });

      if (error) {
        console.error('Google sign-in error:', error);
        errorMsg.textContent = error.message || 'Google sign-in failed. Please try again.';
        errorMsg.classList.remove('d-none');
      } else {
        console.log('Google OAuth initiated successfully');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      errorMsg.textContent = error.message || 'Google sign-in failed. Please try again.';
      errorMsg.classList.remove('d-none');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  };

  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', handleGoogleSignIn);
  }
  if (googleSignupBtn) {
    googleSignupBtn.addEventListener('click', handleGoogleSignIn);
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = signupForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';
      
      const termsAccepted = document.getElementById('accept-terms-signup').checked;
      if (!termsAccepted) {
        errorMsg.textContent = 'You must accept the Terms and Conditions to sign up.';
        errorMsg.classList.remove('d-none');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }

      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const phone = document.getElementById('phone').value.trim();
      const pw = document.getElementById('password').value;

      try {
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: pw,
          options: {
            data: {
              full_name: name
            }
          }
        });

        if (error) {
          errorMsg.textContent = error.message || 'Sign up failed. Please try again.';
          errorMsg.classList.remove('d-none');
          console.error('Signup error:', error);
        } else if (data.user) {
          // Save user profile
          const userRole = email === adminEmail ? 'admin' : 'seller';
          const { data: profileData, error: profileError } = await saveUserProfile(data.user.id, {
            email: email,
            full_name: name,
            role: userRole,
            phone: phone,
            avatar_url: null,
            created_at: new Date().toISOString()
          });
          
          if (profileError) {
            console.error('Error saving profile:', profileError);
          }

          errorMsg.textContent = 'Sign up successful! Please check your email to confirm your account.';
          errorMsg.style.color = '#28a745';
          errorMsg.classList.remove('d-none');

          // Clear form
          signupForm.reset();
          console.log('User registered:', email);
        }
      } catch (error) {
        errorMsg.textContent = 'Sign up failed. Please try again.';
        errorMsg.classList.remove('d-none');
        console.error('Signup error:', error);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
});
