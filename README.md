# EASYMARKETPLACE

This is a Firebase-powered marketplace front-end project.

## Setup

1. Install dependencies:
   ```powershell
   npm install
   ```

2. Add your Firebase project configuration in `js/firebase-config.js`:
   ```js
   const firebaseConfig = {
     apiKey: "YOUR_REAL_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

3. Start the local frontend server:
   ```powershell
   npm run dev
   ```

4. If you want local emulator support for Auth and Firestore:
   ```powershell
   npm run emulators:start
   ```

## Firebase deployment

To connect to your real Firebase project and deploy online:

1. Install Firebase CLI globally or use the local package:
   ```powershell
   npm install -g firebase-tools
   ```

2. Log in with Firebase:
   ```powershell
   npx firebase login
   ```

3. Add or select your Firebase project:
   ```powershell
   npx firebase use --add
   ```

4. Deploy hosting (if configured):
   ```powershell
   npx firebase deploy
   ```

## GitHub push

1. Initialize git and commit:
   ```powershell
   git init
   git add .
   git commit -m "Initial project setup"
   ```

2. Create a GitHub repository online, then add the remote:
   ```powershell
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git branch -M main
   git push -u origin main
   ```

## Notes

- Replace all placeholder Firebase values in `js/firebase-config.js`.
- If you want a real online Firebase connection, use your own Firebase project ID and API keys.
- The `.firebaserc` file is ready for your Firebase project ID.
