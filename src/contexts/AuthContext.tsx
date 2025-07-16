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
    
    const initializePersistence = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        console.log('Using local persistence for all browsers');
      } catch (err) {
        console.error('Failed to set auth persistence:', (err as Error));
      }
    };
    
    initializePersistence();
    
    // Handle redirect result on page load
    const handleRedirectResult = async () => {
      try {
        console.log('Checking for redirect result...');
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          console.log('Redirect sign-in successful:', result.user.email);
          setAuthAttempted(true);
          setLoading(false);
        }
      } catch (err) {
        setError('Failed to complete sign in. Please try again.');
        setLoading(false);
        setAuthAttempted(true);
        console.error('Redirect result error:', (err as Error));
      }
    };

    handleRedirectResult();
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
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
  }, []);

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
      } catch (err) {
        console.warn('Popup sign-in failed, falling back to redirect:', (err as Error));
        // Fallback to redirect
        await signInWithRedirect(auth, provider);
      }
    } catch (err) {
      setError('Failed to sign in. Please try again.');
      setLoading(false);
      setAuthAttempted(true);
      console.error('Sign in error:', (err as Error));
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