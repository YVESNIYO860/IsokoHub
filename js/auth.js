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

  const currentUser = getCurrentUser();
  return createInitialsAvatarUrl(currentUser?.name || currentUser?.full_name || '', currentUser?.email || '');
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
  const localProfile = {
    id: userId,
    ...userData,
    updated_at: new Date().toISOString()
  };

  if (typeof upsertStoredUserProfile === 'function') {
    upsertStoredUserProfile(localProfile);
  }

  return Promise.resolve({ data: [localProfile], error: null });
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

  // Message helper to replace the red-only error UI
  function showMessage(text, type = 'error') {
    if (!errorMsg) return;
    errorMsg.textContent = text;
    errorMsg.classList.remove('d-none');
    if (type === 'error') {
      errorMsg.style.background = '#fff4e5';
      errorMsg.style.color = '#663c00';
      errorMsg.style.border = '1px solid #ffd19a';
      errorMsg.style.padding = '10px';
      errorMsg.style.borderRadius = '6px';
    } else if (type === 'success') {
      errorMsg.style.background = '#e6ffed';
      errorMsg.style.color = '#1a7f37';
      errorMsg.style.border = '1px solid #a7f3d0';
      errorMsg.style.padding = '10px';
      errorMsg.style.borderRadius = '6px';
    } else {
      errorMsg.style.background = '';
      errorMsg.style.color = '';
      errorMsg.style.border = '';
      errorMsg.style.padding = '';
      errorMsg.style.borderRadius = '';
    }
  }

  function hideMessage() {
    if (!errorMsg) return;
    errorMsg.classList.add('d-none');
    errorMsg.textContent = '';
    errorMsg.style.background = '';
    errorMsg.style.color = '';
    errorMsg.style.border = '';
    errorMsg.style.padding = '';
    errorMsg.style.borderRadius = '';
  }

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
          avatarUrl: profileAvatar,
          role: user.email === adminEmail ? 'admin' : 'seller'
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
        showMessage('You must accept the Terms and Conditions to log in.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }

      const email = document.getElementById('email').value;
      const pw = document.getElementById('password').value;

      try {
        // Use v1-compatible signIn for email/password to avoid missing method errors
        const { user, session, error } = await supabase.auth.signIn({
          email: email,
          password: pw
        });

        if (error) {
          showMessage(error.message || 'Login failed. Please check your credentials.', 'error');
          console.error('Login error:', error);
        } else {
          // Clear message on success
          hideMessage();
          console.log('Login successful for:', email);
          // Redirect happens automatically via auth state listener
        }
      } catch (error) {
        showMessage('Login failed. Please try again.', 'error');
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
      if (!supabase || !supabase.auth) throw new Error('Supabase not initialized');
      console.log('Attempting Google sign-in with Supabase v1...');
      const { error } = await supabase.auth.signIn({ provider: 'google' });

      if (error) {
        showMessage(error.message || 'Google sign-in failed. Please try again.', 'error');
      } else {
        hideMessage();
        console.log('Google OAuth initiated successfully');
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      showMessage(err.message || 'Google sign-in failed. Please try again.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  };

  if (googleLoginBtn) googleLoginBtn.addEventListener('click', handleGoogleSignIn);
  if (googleSignupBtn) googleSignupBtn.addEventListener('click', handleGoogleSignIn);
  // Signup verification flow (client-only code generator)
  const sendCodeBtn = document.getElementById('send-code-btn');
  const verificationSection = document.getElementById('verification-section');
  const verifyCodeBtn = document.getElementById('verify-code-btn');
  const verificationCodeInput = document.getElementById('verification-code');
  const testCodeDisplay = document.getElementById('test-code-display');
  const signupFields = document.getElementById('signup-fields');

  // send-code now requests the server to email a verification code

  function startSendCooldown(btn, seconds = 60) {
    btn.disabled = true;
    let remaining = seconds;
    const origText = btn.textContent;
    btn.textContent = `Resend code (${remaining}s)`;
    const iv = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(iv);
        btn.disabled = false;
        btn.textContent = origText;
      } else {
        btn.textContent = `Resend code (${remaining}s)`;
      }
    }, 1000);
  }

  if (sendCodeBtn) {
    sendCodeBtn.addEventListener('click', async (e) => {
      const emailInput = document.getElementById('email');
      const email = (emailInput && emailInput.value || '').trim();
      if (!email) {
        showMessage('Please enter your email first.', 'error');
        return;
      }

      try {
        sendCodeBtn.disabled = true;
        sendCodeBtn.textContent = 'Sending...';
        const res = await fetch('/api/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        if (res.ok) {
          if (verificationSection) verificationSection.classList.remove('d-none');
          showMessage('Verification code sent to your email. Check your inbox.', 'success');
          startSendCooldown(sendCodeBtn, 60);
        } else if (res.status === 429) {
          showMessage('Too many requests. Please wait before requesting another code.', 'error');
          startSendCooldown(sendCodeBtn, 60);
        } else {
          const body = await res.json().catch(() => ({}));
          showMessage(body.error || body.message || 'Failed to send verification code.', 'error');
          sendCodeBtn.disabled = false;
          sendCodeBtn.textContent = 'Send verification code';
        }
      } catch (err) {
        console.error('Error sending verification code:', err);
        showMessage('Failed to send verification code. Try again later.', 'error');
        sendCodeBtn.disabled = false;
        sendCodeBtn.textContent = 'Send verification code';
      }
    });
  }

  if (verifyCodeBtn) {
    verifyCodeBtn.addEventListener('click', async (e) => {
      const emailInput = document.getElementById('email');
      const email = (emailInput && emailInput.value || '').trim();
      const entered = (verificationCodeInput && verificationCodeInput.value || '').trim();
      if (!email || !entered) {
        showMessage('Please provide both email and code.', 'error');
        return;
      }

      try {
        verifyCodeBtn.disabled = true;
        verifyCodeBtn.textContent = 'Verifying...';
        const res = await fetch('/api/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code: entered })
        });

        if (res.ok) {
          try { sessionStorage.setItem('isoko_verified_email', email); } catch (e) { }
          showMessage('Email verified. Please complete the signup form below.', 'success');
          if (signupFields) signupFields.classList.remove('d-none');
          if (verificationSection) verificationSection.classList.add('d-none');
          const nameInput = document.getElementById('name');
          if (nameInput) nameInput.focus();
        } else {
          const body = await res.json().catch(() => ({}));
          showMessage(body.error || body.message || 'Invalid code.', 'error');
        }
      } catch (err) {
        console.error('Error verifying code:', err);
        showMessage('Verification failed. Try again later.', 'error');
      } finally {
        verifyCodeBtn.disabled = false;
        verifyCodeBtn.textContent = 'Verify code';
      }
    });
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
        showMessage('You must accept the Terms and Conditions to sign up.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }

      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const phone = document.getElementById('phone').value.trim();
      const pw = document.getElementById('password').value;

      // Ensure email was verified via the code flow
      const verifiedEmail = sessionStorage.getItem('isoko_verified_email');
      if (!verifiedEmail || verifiedEmail !== email) {
        showMessage('Please verify your email first using the verification code.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }

      // Client-side cooldown to avoid spamming signup endpoint
      const lastSignup = parseInt(localStorage.getItem('isoko_last_signup') || '0', 10);
      const now = Date.now();
      const cooldownMs = 60 * 1000; // 60 seconds
      if (now - lastSignup < cooldownMs) {
        const secs = Math.ceil((cooldownMs - (now - lastSignup)) / 1000);
        showMessage(`Please wait ${secs} second(s) before trying again.`, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }
      // mark attempt time
      localStorage.setItem('isoko_last_signup', String(now));

      try {
        const { user, session, error } = await supabase.auth.signUp(
          { email: email, password: pw },
          { data: { full_name: name } }
        );

        if (error) {
          // Handle rate limit (429) specifically
          const statusCode = error?.status || (error?.response?.status) || null;
          if (statusCode === 429 || (error?.message && error.message.indexOf('429') !== -1)) {
            showMessage('Too many requests. Please wait a moment and try again.', 'error');
            // Extend client cooldown to avoid immediate retries
            localStorage.setItem('isoko_last_signup', String(Date.now()));
            submitBtn.disabled = true;
            setTimeout(() => {
              submitBtn.disabled = false;
              submitBtn.textContent = originalText;
            }, 10000);
          } else {
            showMessage(error.message || 'Sign up failed. Please try again.', 'error');
          }

          try {
            console.error('Signup error:', error, JSON.stringify(error));
          } catch (e) {
            console.error('Signup error (non-serializable):', error);
          }
        } else if (user) {
          const userRole = email === adminEmail ? 'admin' : 'seller';
          const { data: profileData, error: profileError } = await saveUserProfile(user.id, {
            email: email,
            full_name: name,
            role: userRole,
            phone: phone,
            avatar_url: null,
            created_at: new Date().toISOString()
          });

          if (profileError) console.error('Error saving profile:', profileError);

          showMessage('Sign up successful! Please check your email to confirm your account.', 'success');
          signupForm.reset();
          console.log('User registered:', email);
        }
      } catch (error) {
        showMessage('Sign up failed. Please try again.', 'error');
        console.error('Signup error:', error);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
});
