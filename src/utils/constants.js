/* ═══════════════════════════════════════════
   Constants — Enums y configuración
   ═══════════════════════════════════════════ */

export const LOAN_STATUS = {
  ACTIVE: 'active',
  PAID: 'paid',
  OVERDUE: 'overdue',
};

export const FREQUENCY = {
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom',
};

export const FREQUENCY_LABELS = {
  [FREQUENCY.WEEKLY]: 'Semanal',
  [FREQUENCY.BIWEEKLY]: 'Quincenal',
  [FREQUENCY.MONTHLY]: 'Mensual',
  [FREQUENCY.CUSTOM]: 'Personalizado',
};

export const RISK_LEVEL = {
  GOOD: 'bueno',
  REGULAR: 'regular',
  RISKY: 'riesgoso',
};

export const RISK_LABELS = {
  [RISK_LEVEL.GOOD]: { label: 'Buen pagador', color: 'var(--success)' },
  [RISK_LEVEL.REGULAR]: { label: 'Regular', color: 'var(--warning)' },
  [RISK_LEVEL.RISKY]: { label: 'Riesgoso', color: 'var(--danger)' },
};

export const STATUS_LABELS = {
  [LOAN_STATUS.ACTIVE]: { label: 'Activo', color: 'var(--primary)' },
  [LOAN_STATUS.PAID]: { label: 'Pagado', color: 'var(--success)' },
  [LOAN_STATUS.OVERDUE]: { label: 'Atrasado', color: 'var(--danger)' },
};

// Colores para avatares (ciclo por index)
export const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#a855f7', '#e11d48',
];
