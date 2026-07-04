// Firebase Configuration
// Your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBB27-mdZSTNBW4AsgZa98vOPAyAwTFZtA",
  authDomain: "easy-market-f7645.firebaseapp.com",
  projectId: "easy-market-f7645",
  storageBucket: "easy-market-f7645.firebasestorage.app",
  messagingSenderId: "505464419923",
  appId: "1:505464419923:web:a5ee7e6062f4b54de378a6"
};

let auth = null;
let db = null;
let storage = null;

if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);

  auth = firebase.auth();
  storage = firebase.storage();
  if (typeof firebase.firestore === 'function') {
    db = firebase.firestore();
  } else {
    db = null;
  }
}

else {
  console.warn("Firebase SDK not loaded yet. Make sure to include the script tags in your HTML.");
}
