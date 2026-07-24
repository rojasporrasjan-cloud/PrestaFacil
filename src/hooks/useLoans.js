import { useState, useEffect } from 'react';
import { subscribeToLoans, addLoan as addLoanService, updateLoan as updateLoanService, deleteLoan as deleteLoanService } from '../services/loanService';
import { useAuth } from './useAuth';
import { determinarStatus } from '../utils/calculations';
import { toDate } from '../utils/formatters';

export function useLoans() {
  const { userId } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoans([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    let isMounted = true;
    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 500);

    const unsubscribe = subscribeToLoans(userId, (data) => {
      clearTimeout(fallbackTimer);
      if (!isMounted) return;
      // Auto-detectar mora al leer los datos
      const processed = data.map(loan => {
        const dueDate = loan.dueDate ? toDate(loan.dueDate) : null;
        const remainingBalance = loan.remainingBalance || 0;

        // Solo recalcular status si NO está marcado como "paid"
        let status = loan.status;
        if (remainingBalance <= 0.01) {
          status = 'paid';
        } else if (status !== 'paid' && dueDate) {
          status = determinarStatus(dueDate, remainingBalance);
        }

        return { ...loan, status };
      });

      setLoans(processed);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, [userId]);

  const addLoan = async (data) => {
    if (!userId) return;
    return addLoanService(userId, data);
  };

  const updateLoan = async (loanId, data) => {
    if (!userId) return;
    return updateLoanService(userId, loanId, data);
  };

  const deleteLoan = async (loanId, loanAmount = 0, totalPaid = 0) => {
    if (!userId) return;
    return deleteLoanService(userId, loanId, loanAmount, totalPaid);
  };

  return { loans, loading, addLoan, updateLoan, deleteLoan };
}
