import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { FAMILY_MEMBERS } from '../constants';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authAttempted, setAuthAttempted] = useState(false);

  useEffect(() => {
    console.log('AuthProvider mounted, auth instance:', !!auth);
    console.log('Current domain:', window.location.hostname);
    console.log('Auth domain configured:', auth.app.options.authDomain);
    
    // Set persistence based on device type
    const initializePersistence = async () => {
      try {
        // Use different persistence strategies based on browser capabilities
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        let persistence;
        if (isMobile && isSafari) {
          // Safari mobile has the most restrictions, use in-memory
          persistence = inMemoryPersistence;
          console.log('Using in-memory persistence for Safari mobile');
        } else if (isMobile) {
          // Other mobile browsers, use session
          persistence = browserSessionPersistence;
          console.log('Using session persistence for mobile');
        } else {
          // Desktop, use local
          persistence = browserLocalPersistence;
          console.log('Using local persistence for desktop');
        }
        
        await setPersistence(auth, persistence);
      } catch (err) {
        console.error('Failed to set auth persistence:', err);
        // If persistence fails, continue anyway
      }
    };
    
    initializePersistence();
    
    // Handle redirect result on page load
    const handleRedirectResult = async () => {
      try {
        console.log('Checking for redirect result...');
        const result = await getRedirectResult(auth);
        if (result) {
          const email = result.user.email;
          console.log('Redirect result:', email);
          
          if (!email || !(email in FAMILY_MEMBERS)) {
            await firebaseSignOut(auth);
            setError('Sorry, this site is private to the Librach/Nagar family.');
            setAuthAttempted(true);
            return;
          }
          
          console.log('Successful redirect authentication, reloading auth state');
          setAuthAttempted(true);
        } else {
          console.log('No redirect result found');
        }
      } catch (err) {
        console.error('Redirect result error:', err);
        setAuthAttempted(true);
        
        // Handle specific error cases
        if (err.message?.includes('missing initial state')) {
          console.log('Missing initial state - likely a page refresh, not showing error');
          // This often happens on page refresh and isn't a real error
        } else if (err.message?.includes('popup-closed-by-user')) {
          setError('Sign-in was cancelled. Please try again.');
        } else if (err.message?.includes('network-request-failed')) {
          setError('Network error. Please check your connection and try again.');
        } else {
          setError('Authentication failed. Please try again.');
        }
      }
    };

    handleRedirectResult();
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('Auth state changed:', !!firebaseUser, firebaseUser?.email);

      if (firebaseUser) {
        const email = firebaseUser.email;
        if (email && email in FAMILY_MEMBERS) {
          setUser({
            id: firebaseUser.uid,
            email: email,
            displayName: FAMILY_MEMBERS[email as keyof typeof FAMILY_MEMBERS],
            photoURL: firebaseUser.photoURL || undefined
          });
          setError(null);
          setAuthAttempted(true);
          console.log('User authenticated successfully:', email);
        } else {
          setUser(null);
          setError('Sorry, this site is private to the Librach/Nagar family.');
          setAuthAttempted(true);
          console.log('User not authorized:', email);
        }
      } else {
        setUser(null);
        // Only clear error if we haven't attempted auth yet
        if (!authAttempted) {
          setError(null);
        }
        console.log('No user authenticated');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [authAttempted]);

  // Detect if we're on mobile
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Detect if we're on Safari
  const isSafari = () => {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || 
           /iPad|iPhone|iPod/.test(navigator.userAgent);
  };

  // Detect if we're in a restrictive browser environment
  const isRestrictiveBrowser = () => {
    const mobile = isMobile();
    const safari = isSafari();
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInAppBrowser = /FBAN|FBAV|Instagram|Twitter|Line|WhatsApp|Snapchat/.test(navigator.userAgent);
    
    return mobile || safari || isIOS || isInAppBrowser;
  };

  const signIn = async () => {
    try {
      console.log('Starting sign in process...');
      setError(null);
      setLoading(true);
      setAuthAttempted(false);
      
      const provider = new GoogleAuthProvider();
      
      provider.setCustomParameters({
        prompt: 'select_account',
      });
      
      console.log('Browser info:', { 
        mobile: isMobile(), 
        safari: isSafari(),
        userAgent: navigator.userAgent.substring(0, 50)
      });
      
      // Try popup first for ALL browsers
      console.log('Trying popup authentication...');
      try {
        const result = await signInWithPopup(auth, provider);
        console.log('Popup sign-in successful:', result.user.email);
        setAuthAttempted(true);
        setLoading(false);
        return;
      } catch (popupError: any) {
        console.log('Popup failed, trying redirect fallback:', popupError.code);
        
        // If popup fails, try redirect as fallback
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request') {
          
          console.log('Using redirect as fallback...');
          try {
            // Clear auth state before redirect
            if (auth.currentUser) {
              await firebaseSignOut(auth);
            }
            
            // Clear cached auth state
            try {
              localStorage.removeItem('firebase:authUser:' + auth.app.options.apiKey + ':[DEFAULT]');
              sessionStorage.clear();
            } catch (storageError) {
              console.warn('Could not clear storage:', storageError);
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
            await signInWithRedirect(auth, provider);
            return;
          } catch (redirectError) {
            console.error('Redirect also failed:', redirectError);
            setAuthAttempted(true);
            throw redirectError;
          }
        } else {
          // Other popup errors
          setAuthAttempted(true);
          throw popupError;
        }
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setAuthAttempted(true);
      setLoading(false);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Simplified error handling
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection and try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popups are blocked. Please allow popups for this site and try again.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Domain not authorized. Please contact support.');
      } else {
        // Generic error with browser-specific advice
        if (isSafari()) {
          setError('Safari authentication failed. Try: 1) Safari Settings → Privacy → Turn OFF "Prevent Cross-Site Tracking" 2) Clear website data 3) Try Chrome browser');
        } else if (isMobile()) {
          setError('Mobile authentication failed. Try: 1) Use Chrome browser 2) Clear browser data 3) Disable private browsing 4) Enable cookies');
        } else {
          setError('Authentication failed. Try: 1) Allow popups 2) Clear browser data 3) Disable ad blockers 4) Enable cookies');
        }
      }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};