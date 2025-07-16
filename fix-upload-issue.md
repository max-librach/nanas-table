# Fix Photo Upload CORS Issue - Complete Solution

## Current Problem
The console shows CORS errors when trying to upload photos. The storage bucket is `nana-s-table.firebasestorage.app` and we need to ensure CORS is properly configured.

## Step 1: Apply CORS Configuration via Google Cloud Shell

1. **Open Google Cloud Shell** in your Google Cloud Console (click the >_ icon in the top toolbar)

2. **Set the correct project:**
```bash
gcloud config set project nana-s-table
```

3. **Apply CORS to the correct bucket:**
```bash
gsutil cors set cors.json gs://nana-s-table.firebasestorage.app
```

4. **Verify CORS configuration:**
```bash
gsutil cors get gs://nana-s-table.firebasestorage.app
```

## Step 2: Update Firebase Storage Security Rules

1. Go to **Firebase Console > Storage > Rules**
2. Replace the current rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to read any file
    match /{allPaths=**} {
      allow read: if request.auth != null;
    }
    // Allow family members to upload to memories folder
    match /memories/{memoryId}/media/{fileName} {
      allow write: if request.auth != null 
                   && request.auth.token.email in [
                     'maxlibrach@gmail.com',
                     'ashley.maheris@gmail.com', 
                     'glibrach@gmail.com',
                     'miriam.librach@gmail.com',
                     'erez.nagar@gmail.com'
                   ];
    }
  }
}
```

3. Click **Publish**

## Step 3: Wait and Test

1. **Wait 5-10 minutes** for CORS changes to propagate globally
2. **Refresh your browser** completely (Ctrl+F5 or Cmd+Shift+R)
3. **Try uploading a photo** again

## Step 4: If Still Not Working - Temporary Fix

If CORS is still causing issues, temporarily use more permissive Storage Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Expected Result

After following these steps, you should be able to:
- ✅ Upload photos without CORS errors
- ✅ Create memories with photos
- ✅ View uploaded photos in the timeline

## If Problems Persist

If you're still having issues after 10 minutes, let me know and we can:
1. Try a different upload approach
2. Debug the specific error messages
3. Implement a fallback upload method

The key is getting the CORS configuration applied to the correct storage bucket URL that your app is actually using: `nana-s-table.firebasestorage.app`.