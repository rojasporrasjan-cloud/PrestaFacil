/* ═══════════════════════════════════════════
   Payment Service — CRUD Firestore
   Subcollection: users/{userId}/loans/{loanId}/payments
   ═══════════════════════════════════════════ */

import {
  collection, doc, addDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp,
  Timestamp, updateDoc, getDocs, writeBatch, increment
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Referencia a la subcollection de pagos
 */
function paymentsRef(userId, loanId) {
  return collection(db, 'users', userId, 'loans', loanId, 'payments');
}

/**
 * Suscripción real-time a los pagos de un préstamo
 * @param {string} userId
 * @param {string} loanId
 * @param {function} callback
 * @returns {function} Unsubscribe
 */
export function subscribeToPayments(userId, loanId, callback) {
  const q = query(paymentsRef(userId, loanId), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const payments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(payments);
  });
}

/**
 * Registrar un pago parcial
 * 1. Crea el documento de pago
 * 2. Actualiza totalPaid y remainingBalance en el loan directamente
 *
 * @param {string} userId
 * @param {string} loanId
 * @param {object} paymentData - { amount, date, note }
 * @param {number} loanTotalAmount - Total del préstamo para recalcular
 * @param {number} currentTotalPaid - Total pagado actualmente
 */
export async function addPayment(userId, loanId, paymentData, loanTotalAmount, currentTotalPaid = 0) {
  const amount = Number(paymentData.amount) || 0;
  const newTotalPaid = currentTotalPaid + amount;
  const remainingBalance = Math.max(0, loanTotalAmount - newTotalPaid);
  const status = remainingBalance <= 0.01 ? 'paid' : undefined;

  const batch = writeBatch(db);

  // 1. Referencia para el nuevo pago
  const newPaymentRef = doc(paymentsRef(userId, loanId));
  batch.set(newPaymentRef, {
    amount,
    date: paymentData.date
      ? Timestamp.fromDate(new Date(paymentData.date))
      : serverTimestamp(),
    note: paymentData.note || '',
    createdAt: serverTimestamp(),
  });

  // 2. Referencia para actualizar el préstamo
  const loanRef = doc(db, 'users', userId, 'loans', loanId);
  const updateData = {
    totalPaid: newTotalPaid,
    remainingBalance,
    updatedAt: serverTimestamp(),
  };
  if (status) {
    updateData.status = status;
  }
  
  batch.update(loanRef, updateData);
  // 3. Referencia para actualizar el disponible del usuario
  const userRef = doc(db, 'users', userId);
  batch.update(userRef, {
    availableCash: increment(amount)
  });

  // Ejecutamos el batch: actualiza la caché local al instante y queda en cola si estamos offline
  await batch.commit();
}

/**
 * Eliminar un pago y recalcular
 * @param {string} userId
 * @param {string} loanId
 * @param {string} paymentId
 * @param {number} loanTotalAmount
 * @param {number} currentTotalPaid
 * @param {number} paymentAmount - Monto del pago que se está eliminando
 */
export async function deletePayment(userId, loanId, paymentId, loanTotalAmount, currentTotalPaid = 0, paymentAmount = 0) {
  const newTotalPaid = Math.max(0, currentTotalPaid - paymentAmount);
  const remainingBalance = Math.max(0, loanTotalAmount - newTotalPaid);
  // Si el balance sube por encima de cero y estaba pagado, lo volvemos a poner activo
  const status = remainingBalance > 0 ? 'active' : 'paid';

  const batch = writeBatch(db);

  // 1. Eliminar el pago
  const paymentRef = doc(db, 'users', userId, 'loans', loanId, 'payments', paymentId);
  batch.delete(paymentRef);

  // 2. Actualizar el préstamo
  const loanRef = doc(db, 'users', userId, 'loans', loanId);
  batch.update(loanRef, {
    totalPaid: newTotalPaid,
    remainingBalance,
    status,
    updatedAt: serverTimestamp(),
  });
  // 3. Referencia para actualizar el disponible del usuario (restar el pago eliminado)
  const userRef = doc(db, 'users', userId);
  batch.update(userRef, {
    availableCash: increment(-paymentAmount)
  });

  await batch.commit();
}
