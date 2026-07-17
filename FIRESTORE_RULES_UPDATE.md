# Firestore Rules Deployment Guide

## The Problem
Product uploads fail with **"Missing or insufficient permissions"** error because the Firestore Security Rules in your Firebase Console haven't been updated yet.

## Solution: Deploy Updated Rules

### Option 1: Using Firebase CLI (Recommended)

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize your project** (if not already done):
   ```bash
   firebase init
   ```
   - Select "Firestore" when prompted
   - Choose your existing Firebase project
   - Keep defaults for other options

4. **Deploy the rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

5. **Verify deployment**:
   ```
   ✔ Deploy complete!
   ```

---

### Option 2: Manual Update in Firebase Console

1. **Go to Firebase Console**:
   - Visit: https://console.firebase.google.com
   - Select your project
   - Click **Firestore Database** in left sidebar
   - Click **Rules** tab

2. **Copy the new rules**:
   - Open the local file: `firestore.rules`
   - Copy ALL content starting from `rules_version = '2';`

3. **Paste in Firebase Console**:
   - Clear existing rules completely
   - Paste the new rules
   - Click **Publish**

4. **Wait for deployment**:
   ```
   Rules published successfully.
   ```

---

## What the Updated Rules Allow

✅ **Create Product**: Any authenticated user can create a product as long as `sellerId` matches their UID

✅ **Read Product**: 
- Public: Anyone can read `status: 'approved'` products
- Authenticated: Users can read their own products

✅ **Update Product**: Seller can update own products, admins can update any

✅ **Delete Product**: Only admins can delete

---

## Troubleshooting

### Still getting "Permission Denied"?

1. **Check the error in browser console** (F12 → Console):
   - If it says "Invalid UID" → User not authenticated
   - If it says "Missing fields" → Product data incomplete
   - If it says "Invalid rules" → Rules deployment failed

2. **Verify authentication**:
   ```javascript
   // Open browser console and run:
   supabase.auth.session()  // Should return user object with .id
   ```

3. **Verify Firestore rules published**:
   - Go to Firebase Console → Firestore → Rules tab
   - Should see `rules_version = '2'` at top
   - Should NOT see old rules with `request.resource.data.isAd == false`

4. **Verify product data has required fields**:
   - All fields in productData must be present:
     - `name`, `price`, `category`, `image` (array)
     - `description`, `condition`, `sellerPhone`, `district`
     - `isAd: false`, `adRequested: false`

### Rules validation shows errors?

- Make sure you copy the ENTIRE rules file (lines 1-60)
- Don't manually edit the rules unless you understand Firestore security
- If stuck, delete all rules and paste fresh copy from `firestore.rules`

---

## After Successful Deployment

Once rules are deployed:

1. ✅ Go to http://localhost:3000/sell.html
2. ✅ Fill the form with product details
3. ✅ Upload 3+ images
4. ✅ Click "List Product"
5. ✅ Check Firebase Console → Firestore → products collection
6. ✅ New product should appear with `status: 'pending'`

**Next step**: Go to admin dashboard to approve the product! 🎉
