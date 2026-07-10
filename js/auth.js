// Handle login and signup logic with Firebase
function saveUserProfile(userId, userData) {
  if (typeof db === 'undefined' || !db) return Promise.resolve();

  const profileDoc = {
    ...userData,
    uid: userId,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  return Promise.all([
    db.collection('users').doc(userId).set(profileDoc, { merge: true }),
    db.collection('userProfiles').doc(userId).set(profileDoc, { merge: true })
  ]);
}

async function importUsersFromJson(usersArray) {
  if (!Array.isArray(usersArray) || typeof db === 'undefined' || !db) {
    throw new Error('A valid user JSON array is required.');
  }

  const operations = usersArray.map((userItem) => {
    const userId = userItem.uid || userItem.id || userItem.email;
    if (!userId) return Promise.resolve();

    return saveUserProfile(userId, {
      name: userItem.name || userItem.fullName || userItem.email || 'User',
      email: userItem.email || '',
      role: userItem.role || 'seller',
      phone: userItem.phone || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  });

  await Promise.all(operations);
  return { imported: operations.filter(Boolean).length };
}

document.addEventListener('DOMContentLoaded', () => {
  const errorMsg = document.getElementById('error-msg');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const adminEmail = 'yvesniyonkuru2022@gmail.com';

  // Firebase Auth State Listener
  if (typeof firebase !== 'undefined') {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        // User is signed in, sync with local storage for app consistency
        const userData = {
          id: user.uid,
          email: user.email,
          name: user.displayName || 'User'
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
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const termsAccepted = document.getElementById('accept-terms-login').checked;
      if (!termsAccepted) {
        errorMsg.textContent = 'You must accept the Terms and Conditions to log in.';
        errorMsg.classList.remove('d-none');
        return;
      }

      const email = document.getElementById('email').value;
      const pw = document.getElementById('password').value;
      
      firebase.auth().signInWithEmailAndPassword(email, pw)
        .catch((error) => {
          errorMsg.textContent = error.message;
          errorMsg.classList.remove('d-none');
        });
    });
  }

  const googleLoginBtn = document.getElementById('google-login-btn');
  const googleSignupBtn = document.getElementById('google-signup-btn');

  const handleGoogleSignIn = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
      .then((result) => {
        const user = result.user;
        if (typeof db === 'undefined') return;

        const userRole = user.email === adminEmail ? 'admin' : 'seller';

        return saveUserProfile(user.uid, {
          name: user.displayName || user.email,
          email: user.email,
          role: userRole,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      })
      .catch((error) => {
        console.error('Google sign-in error:', error);
        if (error.code === 'auth/popup-blocked-request' || error.code === 'auth/cancelled-popup-request') {
          firebase.auth().signInWithRedirect(provider);
          return;
        }
        errorMsg.textContent = error.message || 'Google sign-in failed. Please try again.';
        errorMsg.classList.remove('d-none');
      });
  };

  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', handleGoogleSignIn);
  }
  if (googleSignupBtn) {
    googleSignupBtn.addEventListener('click', handleGoogleSignIn);
  }

  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
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
      
      firebase.auth().createUserWithEmailAndPassword(email, pw)
        .then((userCredential) => {
          const user = userCredential.user;
          // Step 1: Update Auth Profile
          return user.updateProfile({ displayName: name }).then(() => {
            // Step 2: Create Firestore User Document
            if (typeof db !== 'undefined') {
              return saveUserProfile(user.uid, {
                name: name,
                email: email,
                role: email === 'yvesniyonkuru2022@gmail.com' ? 'admin' : 'seller', // Auto-set admin for Yves
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
              });
            }
          });
        })
        .catch((error) => {
          errorMsg.textContent = error.message;
          errorMsg.classList.remove('d-none');
        });
    });
  }
});
