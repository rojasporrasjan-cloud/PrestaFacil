/* ═══════════════════════════════════════════
   Client Service — CRUD Firestore
   ═══════════════════════════════════════════ */

import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, setDoc
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Referencia a la colección de clientes del usuario
 */
function clientsRef(userId) {
  return collection(db, 'users', userId, 'clients');
}

/**
 * Suscripción real-time a los clientes
 * @param {string} userId
 * @param {function} callback - Recibe array de clientes
 * @returns {function} Unsubscribe
 */
export function subscribeToClients(userId, callback) {
  const q = query(clientsRef(userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const clients = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(clients);
  });
}

/**
 * Agregar un cliente
 * @param {string} userId
 * @param {object} data - { name, phone, notes }
 * @returns {Promise<string>} ID del documento creado
 */
export async function addClient(userId, data) {
  const newClientRef = doc(clientsRef(userId));
  
  // Ejecución optimista background (no await)
  setDoc(newClientRef, {
    name: data.name || '',
    phone: data.phone || '',
    notes: data.notes || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }).catch(err => console.error("Error optimista addClient:", err));

  return newClientRef.id;
}

/**
 * Actualizar un cliente
 * @param {string} userId
 * @param {string} clientId
 * @param {object} data
 */
export async function updateClient(userId, clientId, data) {
  const ref = doc(db, 'users', userId, 'clients', clientId);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Eliminar un cliente
 * @param {string} userId
 * @param {string} clientId
 */
export async function deleteClient(userId, clientId) {
  const ref = doc(db, 'users', userId, 'clients', clientId);
  await deleteDoc(ref);
}
