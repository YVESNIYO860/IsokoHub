// ============================================
// SUPABASE AUTHENTICATION HANDLER
// ============================================

/**
 * Check if user is currently authenticated
 */
async function isUserAuthenticated() {
  if (!supabase || !supabase.auth) return false;
  const { data: { session } } = await supabase.auth.getSession();
  return !!session?.user;
}

/**
 * Get current authenticated user
 */
async function getCurrentAuthUser() {
  if (!supabase || !supabase.auth) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
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
        console.error('Logout error:', error);
        return false;
      }
    }
    localStorage.removeItem('isokoHubCurrentUser');
    console.log('User logged out');
    return true;
  } catch (err) {
    console.error('Error in logoutSupabaseUser:', err);
    return false;
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
        const userData = {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || 'User'
        };
        localStorage.setItem('isokoHubCurrentUser', JSON.stringify(userData));
        console.log('User logged in:', user.email);

        // If on auth pages, redirect to dashboard
        const currentPath = window.location.pathname.toLowerCase();
        if (currentPath.includes('login.html') || currentPath.includes('signup.html')) {
          // Prevent redirect loop
          if (window.location.hostname !== 'localhost' || window.location.port !== '3000') {
            window.location.href = 'dashboard.html';
          } else if (currentPath.includes('login') && !currentPath.includes('signup')) {
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 500);
          } else if (currentPath.includes('signup')) {
            // Don't redirect immediately on signup - wait for email confirmation message
          }
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
          setTimeout(() => { window.location.href = 'login.html'; }, 500);
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
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard.html'
        }
      });

      if (error) {
        console.error('Google sign-in error:', error);
        errorMsg.textContent = error.message || 'Google sign-in failed. Please try again.';
        errorMsg.classList.remove('d-none');
      } else {
        console.log('Google OAuth initiated');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      errorMsg.textContent = 'Google sign-in failed. Please try again.';
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
