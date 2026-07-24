/* ═══════════════════════════════════════════
   Loan Service — CRUD Firestore
   ═══════════════════════════════════════════ */

import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, Timestamp, setDoc,
  writeBatch, increment
} from 'firebase/firestore';
import { db } from './firebase';
import { calcularTotalConInteres } from '../utils/calculations';

/**
 * Referencia a la colección de préstamos del usuario
 */
function loansRef(userId) {
  return collection(db, 'users', userId, 'loans');
}

/**
 * Suscripción real-time a los préstamos
 * @param {string} userId
 * @param {function} callback - Recibe array de préstamos
 * @returns {function} Unsubscribe
 */
export function subscribeToLoans(userId, callback) {
  const q = query(loansRef(userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const loans = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(loans);
  });
}

/**
 * Agregar un préstamo
 * Todos los campos son configurables — nada hardcodeado
 * @param {string} userId
 * @param {object} data
 * @returns {Promise<string>} ID del préstamo
 */
export async function addLoan(userId, data) {
  const amount = Number(data.amount) || 0;
  const interestRate = Number(data.interestRate) || 0;
  const interestType = data.interestType || 'simple';
  const totalAmount = calcularTotalConInteres(amount, interestRate, interestType);

  const newLoanRef = doc(loansRef(userId));

  const batch = writeBatch(db);

  batch.set(newLoanRef, {
    clientId: data.clientId,
    clientName: data.clientName || '',
    amount,
    interestRate,
    interestType,
    totalAmount,
    totalPaid: 0,
    remainingBalance: totalAmount,
    frequency: data.frequency || 'monthly',
    startDate: data.startDate ? Timestamp.fromDate(new Date(data.startDate)) : serverTimestamp(),
    dueDate: data.dueDate ? Timestamp.fromDate(new Date(data.dueDate)) : null,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Descontar el capital prestado del disponible del usuario
  const userRef = doc(db, 'users', userId);
  batch.update(userRef, {
    availableCash: increment(-amount)
  });

  // Ejecución optimista background
  batch.commit().catch(err => console.error("Error optimista addLoan:", err));

  return newLoanRef.id;
}

/**
 * Actualizar un préstamo
 * @param {string} userId
 * @param {string} loanId
 * @param {object} data
 */
export async function updateLoan(userId, loanId, data) {
  const ref = doc(db, 'users', userId, 'loans', loanId);
  const updateData = { ...data, updatedAt: serverTimestamp() };

  // Si se actualiza monto o interés, recalcular total
  if (data.amount !== undefined || data.interestRate !== undefined) {
    const amount = Number(data.amount) || 0;
    const interestRate = Number(data.interestRate) || 0;
    const interestType = data.interestType || 'simple';
    updateData.totalAmount = calcularTotalConInteres(amount, interestRate, interestType);
    updateData.remainingBalance = updateData.totalAmount - (data.totalPaid || 0);
  }

  // Convertir fechas a Timestamps
  if (data.startDate) {
    updateData.startDate = Timestamp.fromDate(new Date(data.startDate));
  }
  if (data.dueDate) {
    updateData.dueDate = Timestamp.fromDate(new Date(data.dueDate));
  }

  await updateDoc(ref, updateData);
}

/**
 * Eliminar un préstamo
 * @param {string} userId
 * @param {string} loanId
 * @param {number} loanAmount
 * @param {number} totalPaid
 */
export async function deleteLoan(userId, loanId, loanAmount = 0, totalPaid = 0) {
  const batch = writeBatch(db);

  const loanRef = doc(db, 'users', userId, 'loans', loanId);
  batch.delete(loanRef);

  // Devolver el capital prestado al disponible restando lo que ya se había sumado como pago
  // Fórmula: capitalPrestado - totalPagado
  const netRefund = loanAmount - totalPaid;
  if (netRefund !== 0) {
    const userRef = doc(db, 'users', userId);
    batch.update(userRef, {
      availableCash: increment(netRefund)
    });
  }

  await batch.commit();
}
