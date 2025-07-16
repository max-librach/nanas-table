# How to Apply CORS Configuration for Firebase Storage

## Method 1: Using Google Cloud Shell (Recommended)

1. Go to https://console.cloud.google.com/
2. In the project selector at the top, look for "nana-s-table" 
3. If you don't see it:
   - Click "ALL" tab in the project selector
   - Search for "nana-s-table"
   - Or look for project ID: "nana-s-table"

## Method 2: Using gsutil Command Line (If you have Google Cloud SDK installed)

If you have Google Cloud SDK installed, run:
```bash
gsutil cors set cors.json gs://nana-s-table.firebasestorage.app
```

## Method 3: Alternative - Update Storage Rules Only

If CORS is too complex right now, let's try updating just the Storage Security Rules in Firebase Console:

1. Go to Firebase Console > Storage > Rules
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

## Method 4: Temporary Workaround - Disable File Uploads

If nothing else works, we can temporarily disable file uploads and focus on getting the basic memory creation working first.