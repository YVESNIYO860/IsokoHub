// Supabase Authentication Handler
async function saveUserProfile(userId, userData) {
  if (!supabase) return Promise.resolve();

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        ...userData,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving user profile:', error);
    }
    return { data, error };
  } catch (err) {
    console.error('Error in saveUserProfile:', err);
  }
}

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
  if (supabase) {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // User is signed in
        const user = session.user;
        const userData = {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || 'User'
        };
        localStorage.setItem('isokoHubCurrentUser', JSON.stringify(userData));

        // If on auth pages, redirect to dashboard
        if (window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html')) {
          window.location.href = 'dashboard.html';
        }
      } else {
        localStorage.removeItem('isokoHubCurrentUser');
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const termsAccepted = document.getElementById('accept-terms-login').checked;
      if (!termsAccepted) {
        errorMsg.textContent = 'You must accept the Terms and Conditions to log in.';
        errorMsg.classList.remove('d-none');
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
          errorMsg.textContent = error.message;
          errorMsg.classList.remove('d-none');
        }
      } catch (error) {
        errorMsg.textContent = 'Login failed. Please try again.';
        errorMsg.classList.remove('d-none');
        console.error('Login error:', error);
      }
    });
  }

  const googleLoginBtn = document.getElementById('google-login-btn');
  const googleSignupBtn = document.getElementById('google-signup-btn');

  const handleGoogleSignIn = async () => {
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
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      errorMsg.textContent = 'Google sign-in failed. Please try again.';
      errorMsg.classList.remove('d-none');
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
      const termsAccepted = document.getElementById('accept-terms-signup').checked;
      if (!termsAccepted) {
        errorMsg.textContent = 'You must accept the Terms and Conditions to sign up.';
        errorMsg.classList.remove('d-none');
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
          errorMsg.textContent = error.message;
          errorMsg.classList.remove('d-none');
        } else if (data.user) {
          // Save user profile
          const userRole = email === adminEmail ? 'admin' : 'seller';
          await saveUserProfile(data.user.id, {
            email: email,
            full_name: name,
            role: userRole,
            created_at: new Date().toISOString()
          });

          errorMsg.textContent = 'Sign up successful! Please check your email to confirm your account.';
          errorMsg.style.color = '#28a745';
          errorMsg.classList.remove('d-none');

          // Clear form
          signupForm.reset();
        }
      } catch (error) {
        errorMsg.textContent = 'Sign up failed. Please try again.';
        errorMsg.classList.remove('d-none');
        console.error('Signup error:', error);
      }
    });
  }
});
