# Configure CORS for Firebase Storage

## Option 1: Using Google Cloud Shell (Recommended - No Installation Required)

1. **Open Google Cloud Shell:**
   - In the Google Cloud Console (where you are now), click the **Cloud Shell** icon (>_) in the top-right toolbar
   - This will open a terminal at the bottom of your browser

2. **Run the CORS configuration command:**
   ```bash
   # First, make sure you're in the right project
   gcloud config set project nana-s-table
   
   # Apply the CORS configuration
   gsutil cors set gs://nana-s-table.firebasestorage.app << 'EOF'
   [
     {
       "origin": [
         "https://www.nanastable.me",
         "https://nanastable.me", 
         "https://nana-s-table.firebaseapp.com",
         "https://nana-s-table.web.app",
         "http://localhost:5173",
         "http://localhost:3000"
       ],
       "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
       "maxAgeSeconds": 3600,
       "responseHeader": [
         "Content-Type",
         "Authorization",
         "Content-Length", 
         "User-Agent",
         "x-goog-*",
         "x-firebase-*"
       ]
     }
   ]
   EOF
   ```

3. **Verify the CORS configuration:**
   ```bash
   gsutil cors get gs://nana-s-table.firebasestorage.app
   ```

## Option 2: Using Local gsutil (If you have Google Cloud SDK installed)

If you have Google Cloud SDK installed on your computer:

1. **Authenticate:**
   ```bash
   gcloud auth login
   gcloud config set project nana-s-table
   ```

2. **Create the CORS file locally:**
   Save the CORS configuration to a file called `cors.json` (we already created this file in your project)

3. **Apply the CORS configuration:**
   ```bash
   gsutil cors set cors.json gs://nana-s-table.firebasestorage.app
   ```

## Option 3: Alternative - Test Without Photos First

If CORS setup is complex, let's test the basic memory creation without photos first:

1. **Try creating a memory without uploading any photos**
2. **Check if the basic functionality works**
3. **Then tackle the photo upload CORS issue separately**

## What to do after CORS is configured:

1. **Wait 5-10 minutes** for the changes to propagate
2. **Try uploading a photo** in your app
3. **Check the browser console** for any remaining errors

## If CORS still doesn't work:

We can also try updating the Firebase Storage Security Rules to be more permissive temporarily:

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