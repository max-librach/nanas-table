# Firebase Storage Security Rules

Copy and paste these rules into your Firebase Console:

**Firebase Console > Storage > Rules**

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Allow anyone to read files (for viewing photos)
    match /{allPaths=**} {
      allow read: if true;
    }
    
    // Allow authenticated family members to upload to memories folder
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
    
    // Fallback: allow any authenticated user to write (temporary)
    match /{allPaths=**} {
      allow write: if request.auth != null;
    }
  }
}
```

## Steps to Apply:

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: "nana-s-table"
3. **Go to Storage** in the left sidebar
4. **Click on "Rules" tab**
5. **Replace the existing rules** with the code above
6. **Click "Publish"**

## What this does:

- ✅ Allows anyone to **read/view** photos (so they display properly)
- ✅ Allows authenticated family members to **upload** photos to the memories folder
- ✅ Has a fallback rule that allows any authenticated user to upload (temporary safety net)

## After updating the rules:

1. **Wait 2-3 minutes** for the rules to take effect
2. **Try uploading a photo** again
3. **The permission errors should be resolved**

If you still get errors after updating the rules, let me know and we can try a more permissive temporary rule while we debug further.