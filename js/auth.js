// Handle login and signup logic with Firebase
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
        localStorage.setItem('easyMarketCurrentUser', JSON.stringify(userData));

        // If on auth pages, redirect to dashboard
        if (window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html')) {
          window.location.href = 'dashboard.html';
        }
      } else {
        localStorage.removeItem('easyMarketCurrentUser');
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
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

        const userRef = db.collection('users').doc(user.uid);
        const userRole = user.email === adminEmail ? 'admin' : 'seller';

        return userRef.set({
          name: user.displayName || user.email,
          email: user.email,
          role: userRole,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
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
              return db.collection('users').doc(user.uid).set({
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
