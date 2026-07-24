/* ═══════════════════════════════════════════
   Formatters — Formato de moneda y fechas
   ═══════════════════════════════════════════ */

import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, isPast } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea un monto en colones costarricenses
 * @param {number} amount
 * @returns {string} ej: "₡1.250.000"
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '₡0';
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formatea un monto compacto (para cards)
 * @param {number} amount
 * @returns {string} ej: "₡1.2M" o "₡500K"
 */
export function formatCurrencyCompact(amount) {
  if (amount == null || isNaN(amount)) return '₡0';
  if (Math.abs(amount) >= 1000000) {
    return `₡${(amount / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 100000) {
    return `₡${(amount / 1000).toFixed(0)}K`;
  }
  return formatCurrency(amount);
}

/**
 * Formatea una fecha
 * @param {Date|string|object} date - Fecha, string, o Firestore Timestamp
 * @returns {string} ej: "22 jul 2026"
 */
export function formatDate(date) {
  if (!date) return '';
  const d = toDate(date);
  return format(d, "d MMM yyyy", { locale: es });
}

/**
 * Formatea una fecha corta
 * @param {Date|string|object} date
 * @returns {string} ej: "22 jul"
 */
export function formatDateShort(date) {
  if (!date) return '';
  const d = toDate(date);
  return format(d, "d MMM", { locale: es });
}

/**
 * Formatea fecha relativa
 * @param {Date|string|object} date
 * @returns {string} ej: "En 3 días", "Hace 2 días", "Hoy", "Mañana"
 */
export function formatRelativeDate(date) {
  if (!date) return '';
  const d = toDate(date);
  
  if (isToday(d)) return 'Hoy';
  if (isTomorrow(d)) return 'Mañana';
  if (isYesterday(d)) return 'Ayer';
  
  return formatDistanceToNow(d, { addSuffix: true, locale: es });
}

/**
 * Verifica si una fecha ya pasó
 * @param {Date|string|object} date
 * @returns {boolean}
 */
export function isOverdue(date) {
  if (!date) return false;
  const d = toDate(date);
  d.setHours(23, 59, 59, 999);
  return isPast(d);
}

/**
 * Convierte varios formatos de fecha a Date
 * @param {Date|string|object} date - Fecha, string, o Firestore Timestamp
 * @returns {Date}
 */
export function toDate(date) {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (date.toDate && typeof date.toDate === 'function') return date.toDate();
  if (date.seconds) return new Date(date.seconds * 1000);
  return new Date(date);
}

/**
 * Formatea un porcentaje
 * @param {number} value
 * @returns {string} ej: "10%"
 */
export function formatPercent(value) {
  if (value == null || isNaN(value)) return '0%';
  return `${Number(value).toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

/**
 * Obtiene iniciales de un nombre
 * @param {string} name
 * @returns {string} ej: "ML" para "María López"
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Genera un color de avatar consistente basado en el nombre
 * @param {string} name
 * @returns {string} Color hex
 */
export function getAvatarColor(name) {
  if (!name) return '#6366f1';
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#06b6d4', '#3b82f6', '#a855f7', '#e11d48',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
