# Supabase Setup Guide for IsokoHub

## Step 1: Enable Email/Password Authentication
1. Go to **Supabase Dashboard** → Your Project
2. Click **Authentication** in left sidebar
3. Click **Providers**
4. Find **Email** provider and toggle it **ON**
5. Keep defaults and click **Save**

## Step 2: Configure Google OAuth
1. In **Authentication** → **Providers**
2. Click **Google**
3. Get your Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new OAuth 2.0 Web Application
   - Authorized redirect URIs: 
     ```
     https://foxfyzytxcuxsncaawwb.supabase.co/auth/v1/callback
     ```
   - Copy **Client ID** and **Client Secret**
4. Paste in Supabase Google provider settings
5. Click **Save**

## Step 3: Set Redirect URLs
1. In **Authentication** → **URL Configuration**
2. Add Redirect URLs:
   - `http://localhost:3000/dashboard.html` (local dev)
   - `http://localhost:3000/login.html`
   - `http://localhost:3000/signup.html`
   - Add your production domain when ready
3. Click **Save**

## Step 4: Create User Profiles Table
1. Go to **SQL Editor**
2. Run this SQL to create the `user_profiles` table:

```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'seller',
  phone VARCHAR(20),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow insert during signup
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

3. Click **Run**

## Step 5: Test Sign In Locally
1. Run dev server:
   ```bash
   npm run dev
   ```
2. Go to `http://localhost:3000/login.html`
3. Try:
   - Email/Password signup
   - Email/Password login
   - Google OAuth sign-in

## Troubleshooting

### "Email provider not found"
- Make sure Email provider is enabled in Authentication → Providers

### "Google OAuth redirect mismatch"
- Ensure redirect URL in Supabase matches exactly:
  ```
  https://foxfyzytxcuxsncaawwb.supabase.co/auth/v1/callback
  ```

### "user_profiles table error"
- Run the SQL in Step 4 to create the table
- Check that table exists in Database → Tables

### Sign-in not redirecting to dashboard
- Check browser console for errors (F12 → Console)
- Make sure redirect URL is added in Step 3

## Configuration Files
- **Supabase config**: `js/supabase-config.js`
- **Auth logic**: `js/auth.js`
- **Login form**: `login.html`
- **Signup form**: `signup.html`
- **Admin panel**: `admin.html`

All code is ready! Just complete the Supabase setup above.

---

## Admin Dashboard - Product Management

### Access the Admin Panel
- Go to: `http://localhost:3000/admin.html` (local) or `https://yourdomain.com/admin.html` (production)
- Only users with `role: 'admin'` can access

### Admin Features

**View Pending Products**
- List shows all pending products awaiting approval
- Each product displays: Name, Price, Category, Seller, Status

**Product Actions**
For each product, admins can:

1. **Approve** ✓
   - Moves product status from `pending` → `approved`
   - Product becomes visible to public on marketplace

2. **Reject** ✗
   - Changes status to `rejected`
   - Seller notified via email (configure in Firebase)

3. **View Details** 👁️
   - See full product description
   - View all product images
   - Check seller contact info

4. **Delete** 🗑️
   - Remove inappropriate or duplicate listings
   - Cannot be undone

### Admin Permissions in Firestore
- Only admins can change `status` field
- Only admins can delete products
- Admins can see all products (approved/pending/rejected)

### Making a User Admin
1. Go to **Firebase Console** → **Firestore Database**
2. Navigate to **users** collection
3. Find the user document (use their uid)
4. Set field: `role: "admin"`
5. User now has admin access

Example user document:
```json
{
  "email": "admin@example.com",
  "full_name": "Admin Name",
  "role": "admin",
  "phone": "+250..."
}
```

### Admin Default User
Default admin email: `yvesniyonkuru2022@gmail.com`
- Automatically set as admin on first signup

