# Fix CORS for Firebase Storage - Final Solution

## The Problem
The Firebase Storage bucket URL is `nana-s-table.firebasestorage.app`. We need to ensure CORS is applied to this bucket only.

## Solution: Apply CORS to the Correct Bucket

### Step 1: Open Google Cloud Shell
1. In your Google Cloud Console, click the **Cloud Shell** icon (>_) in the top-right toolbar
2. Wait for it to initialize

### Step 2: Set the Correct Project
```bash
gcloud config set project nana-s-table
```

### Step 3: Apply CORS to the Storage Bucket URL
Copy and paste this command into Cloud Shell:

```bash
gsutil cors set /dev/stdin gs://nana-s-table.firebasestorage.app << 'EOF'
[
  {
    "origin": [
      "https://www.nanastable.me",
      "https://nanastable.me",
      "https://nana-s-table.firebaseapp.com", 
      "https://nana-s-table.web.app",
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173"
    ],
    "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": [
      "Content-Type",
      "Authorization",
      "Content-Length",
      "User-Agent", 
      "x-goog-*",
      "x-firebase-*",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Methods", 
      "Access-Control-Allow-Headers"
    ]
  }
]
EOF
```

### Step 4: Verify CORS Configuration
```bash
gsutil cors get gs://nana-s-table.firebasestorage.app
```

## After Running These Commands:

1. **Wait 5-10 minutes** for CORS changes to propagate
2. **Try uploading a photo** again
3. **The CORS errors should be resolved**

## If CORS Still Doesn't Work:

We can try a temporary workaround by updating the Firebase Storage Security Rules to be more permissive:

1. Go to Firebase Console > Storage > Rules
2. Replace with:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

This will allow any authenticated user to upload files, which should bypass CORS issues temporarily.