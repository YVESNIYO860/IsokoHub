// Firebase Configuration
// Replace the placeholder values with your real Firebase Project configuration
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_ACTUAL_API_KEY",
  authDomain: "easy-market-e1370.firebaseapp.com",
  projectId: "easy-market-e1370",
  storageBucket: "easy-market-e1370.appspot.com",
  messagingSenderId: "REPLACE_WITH_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_APP_ID"
};

let auth = null;
let db = null;

if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);

  auth = firebase.auth();
  db = firebase.firestore();

  const useLocalEmulator = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (useLocalEmulator) {
    try {
      auth.useEmulator('http://127.0.0.1:9099');
      db.useEmulator('127.0.0.1', 8080);
      console.info('Firebase local emulators enabled for Auth and Firestore.');
    } catch (err) {
      console.warn('Could not connect to Firebase emulators:', err);
    }
  }
} else {
  console.warn("Firebase SDK not loaded yet. Make sure to include the script tags in your HTML.");
}
