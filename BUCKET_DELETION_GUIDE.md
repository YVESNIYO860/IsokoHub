# Supabase Storage Deletion Guide

## Overview
Delete files from Supabase Storage buckets (images and videos) directly from your JavaScript code.

---

## Available Functions

### 1. **deleteFileFromBucket()** - Delete Single File

```javascript
/**
 * Delete one file from Supabase Storage
 * @param {string} fileUrl - Full URL or file path
 * @param {string} bucketName - 'product-images' or 'house-videos'
 */
await deleteFileFromBucket(fileUrl, bucketName);
```

**Example - Delete image:**
```javascript
await deleteFileFromBucket(
  'https://xxx.supabase.co/storage/v1/object/public/product-images/abc123.jpg',
  'product-images'
);
```

**Example - Delete video:**
```javascript
await deleteFileFromBucket(
  'https://xxx.supabase.co/storage/v1/object/public/house-videos/xyz789.mp4',
  'house-videos'
);
```

---

### 2. **deleteMultipleFilesFromBucket()** - Delete Multiple Files

```javascript
/**
 * Delete multiple files at once
 * @param {array} fileUrls - Array of file URLs
 * @param {string} bucketName - Bucket name
 */
await deleteMultipleFilesFromBucket(fileUrls, bucketName);
```

**Example - Delete all images from product:**
```javascript
const productImages = [
  'https://xxx.supabase.co/storage/v1/object/public/product-images/img1.jpg',
  'https://xxx.supabase.co/storage/v1/object/public/product-images/img2.jpg',
  'https://xxx.supabase.co/storage/v1/object/public/product-images/img3.jpg'
];

await deleteMultipleFilesFromBucket(productImages, 'product-images');
```

---

### 3. **deleteProduct()** - Delete Product + All Files (AUTOMATIC)

```javascript
/**
 * Delete product AND automatically delete all associated images/videos
 * @param {string} id - Product ID
 */
await deleteProduct(id);
```

**What it does:**
1. ✅ Fetches product data (with image URLs)
2. ✅ Deletes ALL images from storage
3. ✅ Deletes video (if exists)
4. ✅ Deletes product record from database

**Example:**
```javascript
await deleteProduct('prod-123-abc');
```

---

### 4. **extractFilePathFromUrl()** - Extract File Path

```javascript
/**
 * Convert full URL to file path
 * Input: https://xxx.supabase.co/storage/v1/object/public/product-images/file.jpg
 * Output: file.jpg
 */
const filePath = extractFilePathFromUrl(url);
```

---

## 🎯 Real-World Examples

### Delete Single Product Image
```javascript
const imageUrl = 'https://xxx.supabase.co/storage/v1/object/public/product-images/photo1.jpg';
await deleteFileFromBucket(imageUrl, 'product-images');
console.log('Image deleted');
```

### Delete All Images When User Removes Product
```javascript
async function removeProductImages(product) {
  if (product.image && Array.isArray(product.image)) {
    await deleteMultipleFilesFromBucket(product.image, 'product-images');
    console.log('All images deleted from storage');
  }
}
```

### Complete Product Deletion (Database + Storage)
```javascript
async function completelyRemoveProduct(productId) {
  try {
    // This automatically deletes product + all files
    await deleteProduct(productId);
    
    // Show success message
    alert('Product and all images deleted successfully!');
    
    // Redirect or refresh
    window.location.reload();
  } catch (err) {
    console.error('Deletion failed:', err);
    alert('Failed to delete product. Please try again.');
  }
}
```

---

## 📋 Usage in Your App

### In Dashboard (User Deletes Own Product)
```javascript
// js/dashboard.js
window.deleteItem = async function(id) {
  if(confirm('Delete this listing? All images will be removed.')) {
    try {
      await deleteProduct(id);
      alert('Product deleted successfully');
      await renderDashboard(); // Refresh list
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  }
};
```

### In Admin (Admin Deletes/Rejects Product)
```javascript
// js/admin.js
window.handleReject = async function(id) {
  if (confirm('Delete this listing? All images will be removed.')) {
    try {
      await deleteProduct(id);
      await renderAdmin(); // Refresh list
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  }
};
```

---

## ⚠️ Bucket Names

Use these exact bucket names:

| Purpose | Bucket Name |
|---------|------------|
| Product Images | `product-images` |
| Housing Videos | `house-videos` |

---

## 🔒 Permissions Required

To delete files, your Supabase Storage policies must allow it. Your current policies should include:

```sql
-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (auth.uid() = owner);
```

---

## 🧪 Test It

### Test Deleting Single File
```javascript
// Open browser console and run:
const testUrl = 'https://[your-project].supabase.co/storage/v1/object/public/product-images/test.jpg';
await deleteFileFromBucket(testUrl, 'product-images');
console.log('Done!');
```

### Check Results
Go to **Supabase Dashboard** → **Storage** → **product-images** bucket
- ✅ File should be gone if deletion succeeded
- ❌ File still there if deletion failed

---

## 💡 Pro Tips

1. **Always delete storage files when deleting products** - Prevents storage waste
2. **Use deleteProduct()** - It handles everything automatically
3. **Wrap in try-catch** - Handle network errors gracefully
4. **Show loading state** - Let users know deletion is in progress
5. **Confirm before deleting** - Products cannot be recovered!

---

## Error Handling

```javascript
async function safeDeleteProduct(id) {
  try {
    console.log('Deleting product...', id);
    await deleteProduct(id);
    console.log('✓ Product deleted');
  } catch (err) {
    if (err.message.includes('404')) {
      console.error('Product not found');
    } else if (err.message.includes('permission')) {
      console.error('No permission to delete');
    } else {
      console.error('Unknown error:', err);
    }
  }
}
```

---

## Summary

Your app now has complete deletion functionality:

| What | How | Where |
|-----|-----|-------|
| Delete single image | `deleteFileFromBucket(url, bucket)` | Anywhere |
| Delete multiple images | `deleteMultipleFilesFromBucket(urls, bucket)` | Anywhere |
| Delete product + files | `deleteProduct(id)` | Dashboard, Admin |
| Extract file path | `extractFilePathFromUrl(url)` | Utility function |

All functions are in **js/data.js** and ready to use! 🚀
