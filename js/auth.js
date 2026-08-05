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
  const normalizedEmail = email.toLowerCase().trim();
  const hash = md5(normalizedEmail);
  return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=200`;
}

/**
 * MD5 hash function for Gravatar
 */
function md5(str) {
  function rotateLeft(lValue, iShiftBits) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }
  function addUnsigned(lX, lY) {
    const lX4 = lX & 0x40000000;
    const lY4 = lY & 0x40000000;
    const lX8 = lX & 0x80000000;
    const lY8 = lY & 0x80000000;
    const lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
    if (lX4 & lY4) {
      return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    }
    if (lX4 | lY4) {
      if (lResult & 0x40000000) {
        return lResult ^ 0xC0000000 ^ lX8 ^ lY8;
      }
      return lResult ^ 0x40000000 ^ lX8 ^ lY8;
    }
    return lResult ^ lX8 ^ lY8;
  }
  function F(x, y, z) { return (x & y) | (~x & z); }
  function G(x, y, z) { return (x & z) | (y & ~z); }
  function H(x, y, z) { return x ^ y ^ z; }
  function I(x, y, z) { return y ^ (x | ~z); }
  function FF(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function GG(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function HH(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function II(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function convertToWordArray(str) {
    const lWordCount = [];
    const lMessageLength = str.length;
    for (let i = 0; i < lMessageLength; i += 1) {
      lWordCount[i >> 2] |= (str.charCodeAt(i) & 0xFF) << ((i % 4) * 8);
    }
    lWordCount[lMessageLength >> 2] |= 0x80 << ((lMessageLength % 4) * 8);
    lWordCount[(((lMessageLength + 8) >> 6) << 4) + 14] = lMessageLength * 8;
    return lWordCount;
  }
  function wordToHex(lValue) {
    let wordToHexValue = '';
    for (let lCount = 0; lCount <= 3; lCount += 1) {
      const lByte = (lValue >>> (lCount * 8)) & 255;
      const lHex = `0${lByte.toString(16)}`;
      wordToHexValue += lHex.substr(lHex.length - 2, 2);
    }
    return wordToHexValue;
  }
  function utf8Encode(string) {
    string = string.replace(/\r\n/g, '\n');
    let utftext = '';
    for (let n = 0; n < string.length; n += 1) {
      const c = string.charCodeAt(n);
      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else if (c < 2048) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      } else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
    }
    return utftext;
  }

  const x = convertToWordArray(utf8Encode(str));
  let a = 0x67452301;
  let b = 0xEFCDAB89;
  let c = 0x98BADCFE;
  let d = 0x10325476;

  for (let k = 0; k < x.length; k += 16) {
    const AA = a;
    const BB = b;
    const CC = c;
    const DD = d;
    a = FF(a, b, c, d, x[k + 0], 7, 0xD76AA478);
    d = FF(d, a, b, c, x[k + 1], 12, 0xE8C7B756);
    c = FF(c, d, a, b, x[k + 2], 17, 0x242070DB);
    b = FF(b, c, d, a, x[k + 3], 22, 0xC1BDCEEE);
    a = FF(a, b, c, d, x[k + 4], 7, 0xF57C0FAF);
    d = FF(d, a, b, c, x[k + 5], 12, 0x4787C62A);
    c = FF(c, d, a, b, x[k + 6], 17, 0xA8304613);
    b = FF(b, c, d, a, x[k + 7], 22, 0xFD469501);
    a = FF(a, b, c, d, x[k + 8], 7, 0x698098D8);
    d = FF(d, a, b, c, x[k + 9], 12, 0x8B44F7AF);
    c = FF(c, d, a, b, x[k + 10], 17, 0xFFFF5BB1);
    b = FF(b, c, d, a, x[k + 11], 22, 0x895CD7BE);
    a = FF(a, b, c, d, x[k + 12], 7, 0x6B901122);
    d = FF(d, a, b, c, x[k + 13], 12, 0xFD987193);
    c = FF(c, d, a, b, x[k + 14], 17, 0xA679438E);
    b = FF(b, c, d, a, x[k + 15], 22, 0x49B40821);
    a = GG(a, b, c, d, x[k + 1], 5, 0xF61E2562);
    d = GG(d, a, b, c, x[k + 6], 9, 0xC040B340);
    c = GG(c, d, a, b, x[k + 11], 14, 0x265E5A51);
    b = GG(b, c, d, a, x[k + 0], 20, 0xE9B6C7AA);
    a = GG(a, b, c, d, x[k + 5], 5, 0xD62F105D);
    d = GG(d, a, b, c, x[k + 10], 9, 0x02441453);
    c = GG(c, d, a, b, x[k + 15], 14, 0xD8A1E681);
    b = GG(b, c, d, a, x[k + 4], 20, 0xE7D3FBC8);
    a = GG(a, b, c, d, x[k + 9], 5, 0x21E1CDE6);
    d = GG(d, a, b, c, x[k + 14], 9, 0xC33707D6);
    c = GG(c, d, a, b, x[k + 3], 14, 0xF4D50D87);
    b = GG(b, c, d, a, x[k + 8], 20, 0x455A14ED);
    a = GG(a, b, c, d, x[k + 13], 5, 0xA9E3E905);
    d = GG(d, a, b, c, x[k + 2], 9, 0xFCEFA3F8);
    c = GG(c, d, a, b, x[k + 7], 14, 0x676F02D9);
    b = GG(b, c, d, a, x[k + 12], 20, 0x8D2A4C8A);
    a = HH(a, b, c, d, x[k + 5], 4, 0xFFFA3942);
    d = HH(d, a, b, c, x[k + 8], 11, 0x8771F681);
    c = HH(c, d, a, b, x[k + 11], 16, 0x6D9D6122);
    b = HH(b, c, d, a, x[k + 14], 23, 0xFDE5380C);
    a = HH(a, b, c, d, x[k + 1], 4, 0xA4BEEA44);
    d = HH(d, a, b, c, x[k + 4], 11, 0x4BDECFA9);
    c = HH(c, d, a, b, x[k + 7], 16, 0xF6BB4B60);
    b = HH(b, c, d, a, x[k + 10], 23, 0xBEBFBC70);
    a = HH(a, b, c, d, x[k + 13], 4, 0x289B7EC6);
    d = HH(d, a, b, c, x[k + 0], 11, 0xEAA127FA);
    c = HH(c, d, a, b, x[k + 3], 16, 0xD4EF3085);
    b = HH(b, c, d, a, x[k + 6], 23, 0x04881D05);
    a = HH(a, b, c, d, x[k + 9], 4, 0xD9D4D039);
    d = HH(d, a, b, c, x[k + 12], 11, 0xE6DB99E5);
    c = HH(c, d, a, b, x[k + 15], 16, 0x1FA27CF8);
    b = HH(b, c, d, a, x[k + 2], 23, 0xC4AC5665);
    a = II(a, b, c, d, x[k + 0], 6, 0xF4292244);
    d = II(d, a, b, c, x[k + 7], 10, 0x432AFF97);
    c = II(c, d, a, b, x[k + 14], 15, 0xAB9423A7);
    b = II(b, c, d, a, x[k + 5], 21, 0xFC93A039);
    a = II(a, b, c, d, x[k + 12], 6, 0x655B59C3);
    d = II(d, a, b, c, x[k + 3], 10, 0x8F0CCC92);
    c = II(c, d, a, b, x[k + 10], 15, 0xFFEFF47D);
    b = II(b, c, d, a, x[k + 1], 21, 0x85845DD1);
    a = II(a, b, c, d, x[k + 8], 6, 0x6FA87E4F);
    d = II(d, a, b, c, x[k + 15], 10, 0xFE2CE6E0);
    c = II(c, d, a, b, x[k + 6], 15, 0xA3014314);
    b = II(b, c, d, a, x[k + 13], 21, 0x4E0811A1);
    a = II(a, b, c, d, x[k + 4], 6, 0xF7537E82);
    d = II(d, a, b, c, x[k + 11], 10, 0xBD3AF235);
    c = II(c, d, a, b, x[k + 2], 15, 0x2AD7D2BB);
    b = II(b, c, d, a, x[k + 9], 21, 0xEB86D391);
    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }
  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

/**
 * Get avatar URL for a given email address.
 */
async function getAvatarUrlByEmail(email) {
  if (!email) return createInitialsAvatarUrl('', '');
  const storedProfiles = typeof getStoredUserProfiles === 'function' ? getStoredUserProfiles() : [];
  const profile = storedProfiles.find((item) => item?.email?.toLowerCase?.() === email.toLowerCase());
  if (profile) {
    return profile.avatarUrl || profile.avatar_url || await getGravatarUrl(email);
  }
  return await getGravatarUrl(email);
}

/**
 * Get user avatar from database, auth session, or email.
 */
async function getUserAvatar(userId, email = null) {
  const authUser = getCurrentAuthUser();
  const googleAvatar = authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.picture || authUser?.user_metadata?.profile_image || authUser?.avatar_url || null;
  if (googleAvatar) return googleAvatar;

  const currentUser = getCurrentUser();
  const storedAvatar = currentUser?.avatarUrl || currentUser?.avatar_url || null;
  if (storedAvatar) return storedAvatar;

  if (email) return await getAvatarUrlByEmail(email);

  const storedProfiles = typeof getStoredUserProfiles === 'function' ? getStoredUserProfiles() : [];
  const profile = storedProfiles.find((item) => item?.id === userId || item?.email === currentUser?.email);
  if (profile) {
    return profile.avatarUrl || profile.avatar_url || await getAvatarUrlByEmail(profile.email || currentUser?.email || '');
  }

  if (currentUser?.email) return await getGravatarUrl(currentUser.email);
  if (authUser?.email) return await getGravatarUrl(authUser.email);
  return createInitialsAvatarUrl(currentUser?.name || currentUser?.full_name || authUser?.user_metadata?.name || '', currentUser?.email || authUser?.email || '');
}

/**
 * Save or update user profile in the Supabase user_profiles table.
 * Falls back to local storage when the table is unavailable.
 */
async function saveUserProfile(userId, userData) {
  const profile = {
    id: userId,
    ...userData,
    is_verified: userData.is_verified ?? false,
    verified_at: userData.verified_at || null,
    verified_by: userData.verified_by || null,
    updated_at: new Date().toISOString()
  };

  if (typeof upsertStoredUserProfile === 'function') {
    upsertStoredUserProfile(profile);
  }

  const profileTable = (typeof SUPABASE_USER_PROFILES_TABLE !== 'undefined' && SUPABASE_USER_PROFILES_TABLE)
    ? SUPABASE_USER_PROFILES_TABLE
    : 'user_profiles';

  const supabaseClient = (typeof window !== 'undefined' && window.supabaseClient && typeof window.supabaseClient.from === 'function')
    ? window.supabaseClient
    : (typeof supabase !== 'undefined' ? supabase : null);

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from(profileTable)
        .upsert(profile, { onConflict: 'id' })
        .select();

      if (!error) {
        return { data: data || [profile], error: null };
      }

      const isMissingTable = error?.status === 404
        || (error?.message && /not found|does not exist|relation .* does not exist/i.test(error.message))
        || error?.code === '42P01';

      if (isMissingTable) {
        console.warn('Supabase profile table is not ready yet; using local storage fallback.', error);
      } else {
        console.warn('Supabase profile upsert failed; using local storage fallback.', error);
      }
    } catch (err) {
      console.warn('Supabase profile upsert failed:', err);
    }
  }

  return Promise.resolve({ data: [profile], error: null });
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

  function redirectToDashboard() {
    const dashboardUrl = window.location.protocol + '//' + window.location.host + '/dashboard.html';
    window.location.href = dashboardUrl;
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
          setTimeout(redirectToDashboard, 500);
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
        if (typeof renderNavbar === 'function') {
          renderNavbar();
        }
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 300);
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
