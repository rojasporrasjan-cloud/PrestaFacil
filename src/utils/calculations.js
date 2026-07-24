/* ═══════════════════════════════════════════
   Calculations — Lógica financiera pura
   Nada hardcodeado, todo parametrizado
   ═══════════════════════════════════════════ */

import { LOAN_STATUS } from './constants';

/**
 * Calcula el total con interés (simple)
 * @param {number} amount - Monto principal
 * @param {number} interestRate - Porcentaje de interés (ej: 10 = 10%)
 * @param {string} interestType - Tipo de interés ('simple')
 * @returns {number} Total a pagar
 */
export function calcularTotalConInteres(amount, interestRate, interestType = 'simple') {
  if (!amount || !interestRate) return amount || 0;
  
  if (interestType === 'simple') {
    return amount * (1 + interestRate / 100);
  }
  // Extensible para interés compuesto en el futuro
  return amount * (1 + interestRate / 100);
}

/**
 * Calcula la ganancia (interés) de un préstamo
 * @param {number} amount - Monto principal
 * @param {number} interestRate - Porcentaje de interés
 * @returns {number} Ganancia esperada
 */
export function calcularGanancia(amount, interestRate) {
  if (!amount || !interestRate) return 0;
  return amount * (interestRate / 100);
}

/**
 * Calcula el balance restante
 * @param {number} totalAmount - Total con interés
 * @param {Array} payments - Array de pagos [{amount: number}]
 * @returns {number} Balance restante
 */
export function calcularBalanceRestante(totalAmount, payments = []) {
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  return Math.max(0, totalAmount - totalPaid);
}

/**
 * Calcula el total pagado
 * @param {Array} payments - Array de pagos
 * @returns {number} Suma de todos los pagos
 */
export function calcularTotalPagado(payments = []) {
  return payments.reduce((sum, p) => sum + (p.amount || 0), 0);
}

/**
 * Determina el status de un préstamo basado en datos reales
 * @param {Date|string} dueDate - Fecha de vencimiento
 * @param {number} remainingBalance - Balance restante
 * @returns {string} Status: 'paid' | 'overdue' | 'active'
 */
export function determinarStatus(dueDate, remainingBalance) {
  if (remainingBalance <= 0) return LOAN_STATUS.PAID;
  
  const now = new Date();
  const due = new Date(dueDate);
  // Normalizar a medianoche para comparar solo fechas
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  if (due < now) return LOAN_STATUS.OVERDUE;
  return LOAN_STATUS.ACTIVE;
}

/**
 * Calcula el riesgo de un cliente basado en su historial
 * @param {Array} loans - Préstamos del cliente
 * @returns {string} 'bueno' | 'regular' | 'riesgoso'
 */
export function calcularRiesgoCliente(loans = []) {
  if (loans.length === 0) return 'bueno'; // Sin historial = neutro
  
  const totalLoans = loans.length;
  const paidOnTime = loans.filter(l => l.status === LOAN_STATUS.PAID).length;
  const overdue = loans.filter(l => l.status === LOAN_STATUS.OVERDUE).length;
  
  // Si tiene préstamos en mora activos
  if (overdue > 0) return 'riesgoso';
  
  const ratio = paidOnTime / totalLoans;
  if (ratio >= 0.8) return 'bueno';
  if (ratio >= 0.5) return 'regular';
  return 'riesgoso';
}

/**
 * Calcula las métricas del dashboard
 * @param {Array} loans - Todos los préstamos
 * @param {number} availableCash - Dinero en caja
 * @returns {object} Métricas calculadas
 */
export function calcularMetricasDashboard(loans = [], availableCash = 0) {
  const activeLoans = loans.filter(l => l.status === LOAN_STATUS.ACTIVE || l.status === LOAN_STATUS.OVERDUE);
  const overdueLoans = loans.filter(l => l.status === LOAN_STATUS.OVERDUE);
  const paidLoans = loans.filter(l => l.status === LOAN_STATUS.PAID);

  // Total prestado (capital en la calle — solo activos/mora)
  const totalLent = activeLoans.reduce((sum, l) => sum + (l.amount || 0), 0);

  // Total recuperado (pagos de todos los préstamos)
  const totalRecovered = loans.reduce((sum, l) => sum + (l.totalPaid || 0), 0);

  // Ganancia esperada (intereses de préstamos activos)
  const expectedProfit = activeLoans.reduce((sum, l) => sum + ((l.totalAmount || 0) - (l.amount || 0)), 0);

  // Ganancia realizada (intereses de préstamos pagados)
  const realizedProfit = paidLoans.reduce((sum, l) => sum + ((l.totalPaid || 0) - (l.amount || 0)), 0);

  // Por cobrar (balance restante de activos + mora)
  const pendingToCollect = activeLoans.reduce((sum, l) => sum + (l.remainingBalance || 0), 0);

  // Dinero en riesgo (balance restante de préstamos en mora)
  const moneyAtRisk = overdueLoans.reduce((sum, l) => sum + (l.remainingBalance || 0), 0);

  // Fondos recomendados para prestar
  // = disponible - dinero en riesgo (conservador)
  const recommendedFunds = Math.max(0, availableCash - moneyAtRisk);

  return {
    availableCash,
    totalLent,
    totalRecovered,
    expectedProfit,
    realizedProfit,
    pendingToCollect,
    moneyAtRisk,
    recommendedFunds,
    overdueCount: overdueLoans.length,
    overdueAmount: overdueLoans.reduce((sum, l) => sum + (l.remainingBalance || 0), 0),
    activeCount: activeLoans.length,
    paidCount: paidLoans.length,
    totalLoans: loans.length,
  };
}

/**
 * Obtiene los próximos pagos (préstamos activos ordenados por próximo pago)
 * @param {Array} loans - Préstamos con datos de cliente
 * @param {number} limit - Máximo de items
 * @returns {Array} Préstamos ordenados por proximidad de pago
 */
export function obtenerProximosPagos(loans = [], limit = 5) {
  return loans
    .filter(l => l.status === LOAN_STATUS.ACTIVE || l.status === LOAN_STATUS.OVERDUE)
    .sort((a, b) => {
      const nextA = calcularProximaFechaDePago(a);
      const nextB = calcularProximaFechaDePago(b);
      if (!nextA) return 1;
      if (!nextB) return -1;
      return nextA - nextB;
    })
    .slice(0, limit);
}

function _toDate(d) {
  if (!d) return new Date();
  if (d instanceof Date) return d;
  if (d.toDate && typeof d.toDate === 'function') return d.toDate();
  if (d.seconds) return new Date(d.seconds * 1000);
  return new Date(d);
}

/**
 * Calcula la fecha del próximo pago de un préstamo.
 * Si es mensual y de 2 meses, y no ha pagado nada, el próximo pago es en 1 mes.
 */
export function calcularProximaFechaDePago(loan) {
  if (!loan || loan.status === LOAN_STATUS.PAID || loan.remainingBalance <= 0) return null;
  
  const startD = _toDate(loan.startDate);
  const dueD = loan.dueDate ? _toDate(loan.dueDate) : null;
  
  if (loan.frequency === 'custom' || loan.frequency === 'at_maturity') return dueD;
  if (!loan.amount || !loan.totalAmount) return dueD;

  const startStr = startD.toISOString().split('T')[0];
  const dueStr = dueD ? dueD.toISOString().split('T')[0] : null;
  
  if (!dueStr) return null;

  const cuota = calcularCuota(loan.totalAmount, startStr, dueStr, loan.frequency);
  if (cuota.amount <= 0 || cuota.installments <= 1) return dueD;

  const installmentsPaid = Math.floor((loan.totalPaid || 0) / cuota.amount);
  if (installmentsPaid >= cuota.installments) return dueD;
  
  const nextInstallment = installmentsPaid + 1;
  const nextDate = new Date(startStr);
  nextDate.setMinutes(nextDate.getMinutes() + nextDate.getTimezoneOffset());
  
  switch (loan.frequency) {
    case 'daily': nextDate.setDate(nextDate.getDate() + nextInstallment); break;
    case 'weekly': nextDate.setDate(nextDate.getDate() + (nextInstallment * 7)); break;
    case 'biweekly': nextDate.setDate(nextDate.getDate() + (nextInstallment * 15)); break;
    case 'monthly': nextDate.setMonth(nextDate.getMonth() + nextInstallment); break;
  }
  
  const finalDue = new Date(dueStr);
  finalDue.setMinutes(finalDue.getMinutes() + finalDue.getTimezoneOffset());
  
  if (nextDate > finalDue) return finalDue;
  return nextDate;
}

/**
 * Calcula dinámicamente una fecha de vencimiento sumando un plazo a una fecha base.
 * @param {string} startDateStr - Fecha inicial en formato YYYY-MM-DD
 * @param {number} termValue - Cantidad de tiempo
 * @param {string} termUnit - Unidad ('days', 'weeks', 'biweekly', 'months', 'years')
 * @returns {string} Fecha de vencimiento YYYY-MM-DD
 */
export function calcularFechaVencimiento(startDateStr, termValue, termUnit) {
  if (!startDateStr || !termValue || isNaN(termValue)) return '';
  const date = new Date(startDateStr);
  
  // Como YYYY-MM-DD asume UTC, arreglamos para la zona local añadiendo el timezone offset
  // para que new Date() no retroceda un día dependiendo del país.
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());

  const val = Number(termValue);
  
  switch (termUnit) {
    case 'days':
      date.setDate(date.getDate() + val);
      break;
    case 'weeks':
      date.setDate(date.getDate() + (val * 7));
      break;
    case 'biweekly':
      date.setDate(date.getDate() + (val * 15)); // Quincena comercial común
      break;
    case 'months':
      date.setMonth(date.getMonth() + val);
      break;
    case 'years':
      date.setFullYear(date.getFullYear() + val);
      break;
  }
  
  
  return date.toISOString().split('T')[0];
}

/**
 * Calcula la cuota estimada de un préstamo basado en su frecuencia y duración
 * @param {number} totalAmount - Monto total a pagar
 * @param {string} startDateStr - Fecha inicial YYYY-MM-DD
 * @param {string} dueDateStr - Fecha vencimiento YYYY-MM-DD
 * @param {string} frequency - Frecuencia de cobro
 * @returns {object} { amount, installments }
 */
export function calcularCuota(totalAmount, startDateStr, dueDateStr, frequency) {
  if (!totalAmount || !startDateStr || !dueDateStr || !frequency) return { amount: 0, installments: 0 };
  
  const start = new Date(startDateStr);
  const end = new Date(dueDateStr);
  start.setMinutes(start.getMinutes() + start.getTimezoneOffset());
  end.setMinutes(end.getMinutes() + end.getTimezoneOffset());

  const diffTime = end - start;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return { amount: totalAmount, installments: 1 }; // Al final del plazo o fechas iguales

  let numInstallments = 1;
  switch (frequency) {
    case 'daily':
      numInstallments = diffDays;
      break;
    case 'weekly':
      numInstallments = Math.max(1, Math.round(diffDays / 7));
      break;
    case 'biweekly':
      numInstallments = Math.max(1, Math.round(diffDays / 15));
      break;
    case 'monthly':
      numInstallments = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      if (numInstallments <= 0) numInstallments = 1;
      break;
    default:
      numInstallments = 1; // Para "custom" o "al vencimiento" se asume 1 pago
      break;
  }
  
  return { 
    amount: totalAmount / numInstallments,
    installments: numInstallments 
  };
}
