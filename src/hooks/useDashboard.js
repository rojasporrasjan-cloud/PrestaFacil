import { useMemo } from 'react';
import { calcularMetricasDashboard, obtenerProximosPagos } from '../utils/calculations';

export function useDashboard(loans, availableCash) {
  const metrics = useMemo(
    () => calcularMetricasDashboard(loans, availableCash),
    [loans, availableCash]
  );

  const upcomingPayments = useMemo(
    () => obtenerProximosPagos(loans, 5),
    [loans]
  );

  return { metrics, upcomingPayments };
}
