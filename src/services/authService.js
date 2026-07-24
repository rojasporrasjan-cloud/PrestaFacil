/* ═══════════════════════════════════════════
   Auth Service — Google Sign-In
   ═══════════════════════════════════════════ */

import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';

// Utilidad para evitar que Firestore se quede colgado si no hay conexión
const withTimeout = (promise, ms = 3000) => {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve({ _isTimeout: true }), ms))
  ]);
};

/**
 * Inicia sesión con Google
 * @returns {Promise<object>} Usuario autenticado
 */
export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Crear/actualizar documento del usuario en Firestore
  const userRef = doc(db, 'users', user.uid);
  
  try {
    const userSnap = await withTimeout(getDoc(userRef));
    
    if (userSnap && userSnap._isTimeout) {
      console.warn('Firebase network timeout (HMR/Offline). Profiling skip.');
      return user; // Retornamos sin actualizar perfil para no romper el flujo
    }

    if (!userSnap.exists()) {
      // Primera vez: crear perfil
      const createRes = await withTimeout(setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        availableCash: 0,
        appName: 'PrestaFácil',
        theme: 'dark',
        onboarded: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }));
      if (createRes && createRes._isTimeout) console.warn('Network timeout while creating profile.');
    } else {
      // Actualizar último login
      const updateRes = await withTimeout(setDoc(userRef, { updatedAt: serverTimestamp() }, { merge: true }));
      if (updateRes && updateRes._isTimeout) console.warn('Network timeout while updating profile.');
    }
  } catch (error) {
    console.warn('Could not update user profile due to network/offline status:', error);
  }

  return user;
}

/**
 * Cierra sesión
 */
export async function logout() {
  return signOut(auth);
}

/**
 * Escucha cambios en el estado de autenticación
 * @param {function} callback - Recibe (user | null)
 * @returns {function} Unsubscribe
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Obtiene el perfil del usuario desde Firestore
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
export async function getUserProfile(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await withTimeout(getDoc(userRef));
    
    if (userSnap && userSnap._isTimeout) {
      return null;
    }
    
    if (userSnap && userSnap.exists && userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    }
  } catch (error) {
    console.warn('Network issue fetching profile, falling back to cache:', error.message);
  }
  return null;
}

/**
 * Suscribe a los cambios en tiempo real del perfil
 * @param {string} userId
 * @param {function} callback
 * @returns {function} unsubscribe function
 */
export function subscribeToUserProfile(userId, callback) {
  const userRef = doc(db, 'users', userId);
  return onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() });
    } else {
      callback(null);
    }
  }, (error) => {
    console.warn('Network issue in profile subscription:', error.message);
  });
}

/**
 * Actualiza el perfil del usuario
 * @param {string} userId
 * @param {object} data
 */
export async function updateUserProfile(userId, data) {
  try {
    const userRef = doc(db, 'users', userId);
    const res = await withTimeout(setDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp()
    }, { merge: true }), 5000); // 5 seconds timeout
    
    if (res && res._isTimeout) {
      throw new Error('Timeout connecting to Firebase. Please check your connection.');
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}
