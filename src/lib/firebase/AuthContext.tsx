'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from './config';

/**
 * Firebase Authentication Context
 *
 * This manages the authentication state for the entire app.
 * It provides:
 * - current user
 * - loading state
 * - sign in function
 * - sign out function
 */

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        const email = user.email || '';

        // CHECK: Only allow @8020rei.com emails
        if (email.endsWith('@8020rei.com')) {
          setUser(user);
          console.log('[Firebase Auth] User signed in:', email);
        } else {
          // Not a company email - sign them out
          console.log('[Firebase Auth] Non-company email blocked:', email);
          await firebaseSignOut(auth);
          setUser(null);
          alert('Access denied. Only @8020rei.com email addresses are allowed.');
        }
      } else {
        // User is signed out
        setUser(null);
        console.log('[Firebase Auth] User signed out');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Force account selection every time
      provider.setCustomParameters({
        prompt: 'select_account',
      });
      await signInWithPopup(auth, provider);
      // The onAuthStateChanged listener will handle the rest
    } catch (error: any) {
      console.error('[Firebase Auth] Sign in error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        // User closed popup - no need to show error
        return;
      }
      // Show the actual Firebase error
      const errorMessage = error.message || 'Sign in failed. Please try again.';
      const errorCode = error.code || '';
      alert(`Sign in failed: ${errorCode}\n\n${errorMessage}`);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('[Firebase Auth] Sign out error:', error);
      alert('Sign out failed. Please try again.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
