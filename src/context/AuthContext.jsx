/* ═══════════════════════════════════════════
   AuthContext — Provider de autenticación
   ═══════════════════════════════════════════ */

import { createContext, useState, useEffect, useCallback } from 'react';
import { onAuthChange, loginWithGoogle, logout as logoutService, getUserProfile, subscribeToUserProfile } from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    // Safety fallback: if Firebase doesn't respond quickly, force loading to false
    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 1000);

    let profileUnsubscribe = null;

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          
          // Suscripción en tiempo real al perfil
          if (profileUnsubscribe) profileUnsubscribe();
          profileUnsubscribe = subscribeToUserProfile(firebaseUser.uid, (profile) => {
            if (isMounted) setUserProfile(profile);
          });
          
        } else {
          if (isMounted) {
            setUser(null);
            setUserProfile(null);
          }
          if (profileUnsubscribe) {
            profileUnsubscribe();
            profileUnsubscribe = null;
          }
        }
      } catch (error) {
        console.error('Error processing auth state change:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
          clearTimeout(fallbackTimer);
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      unsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, []);

  const login = useCallback(async () => {
    const firebaseUser = await loginWithGoogle();
    const profile = await getUserProfile(firebaseUser.uid);
    setUserProfile(profile);
    return firebaseUser;
  }, []);

  const logout = useCallback(async () => {
    await logoutService();
    setUser(null);
    setUserProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    }
  }, [user]);

  const value = {
    user,
    userProfile,
    loading,
    login,
    logout,
    refreshProfile,
    userId: user?.uid || null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
