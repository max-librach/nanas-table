// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA0fC63UesvLCEdLbuEkq2BQeM_QvaykJM",
  authDomain: "nana-s-table.firebaseapp.com",
  projectId: "nana-s-table",
  storageBucket: "nana-s-table.firebasestorage.app",
  messagingSenderId: "740667372243",
  appId: "1:740667372243:web:feacd78045d862bc22526",
  measurementId: "G-XJB6FBLL5K"
};

// Log config to verify it's being used
console.log('Firebase config loaded:', { 
  apiKey: firebaseConfig.apiKey.substring(0, 10) + '...', 
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Configure auth settings for better reliability
auth.useDeviceLanguage();

// Log auth instance to verify initialization
console.log('Firebase auth initialized:', !!auth);
console.log('Firebase storage initialized:', !!storage);
console.log('Current origin:', window.location.origin);
console.log('Storage bucket from config:', storage.app.options.storageBucket);
console.log('Actual storage bucket:', storage.bucket);

console.log('Firebase config in use:', firebaseConfig);

export default app;