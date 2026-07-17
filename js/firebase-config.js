// ============================================
// FIRESTORE CONFIGURATION (Product Database)
// Authentication is now handled by Supabase
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyBB27-mdZSTNBW4AsgZa98vOPAyAwTFZtA",
  projectId: "easy-market-f7645"
};

let db = null;

if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);

  if (typeof firebase.firestore === 'function') {
    db = firebase.firestore();
  } else {
    db = null;
  }
} else {
  console.warn("Firebase SDK not loaded yet. Make sure to include the script tags in your HTML.");
}
