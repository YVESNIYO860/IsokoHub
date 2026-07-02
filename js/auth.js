// Handle login and signup logic with Firebase
document.addEventListener('DOMContentLoaded', () => {
  const errorMsg = document.getElementById('error-msg');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');

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
