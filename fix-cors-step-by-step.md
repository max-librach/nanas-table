# Fix Photo Upload CORS Issue - Step by Step

## Step 1: Open Google Cloud Shell

1. In your current Google Cloud Console window, look for the **Cloud Shell** icon (>_) in the top-right toolbar
2. Click it to open a terminal at the bottom of your browser
3. Wait for it to initialize (may take 30 seconds)

## Step 2: Set the Correct Project

In the Cloud Shell terminal, run:
```bash
gcloud config set project nana-s-table
```

## Step 3: Apply CORS Configuration

Copy and paste this entire command into Cloud Shell:

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

## Step 4: Verify CORS Configuration

Run this command to check if CORS was applied:
```bash
gsutil cors get gs://nana-s-table.firebasestorage.app
```

You should see the CORS configuration printed out.

## Step 5: Test Photo Upload

1. **Wait 5-10 minutes** for the CORS changes to propagate globally
2. **Try creating a memory with a photo** in your app
3. **Check the browser console** for any remaining errors

## If CORS Still Doesn't Work

If you still get CORS errors after following the above steps, we can try:

### Option A: Update Firebase Storage Rules
Go to Firebase Console > Storage > Rules and replace with:
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

## Expected Result

After CORS is properly configured, you should be able to:
1. ✅ Create memories without photos (already working)
2. ✅ Create memories with photos (should work after CORS fix)
3. ✅ View all memories on the timeline
4. ✅ Add photos to existing memories

Let me know what happens when you try the Cloud Shell commands!