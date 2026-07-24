import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLoans } from '../hooks/useLoans';
import { useClients } from '../hooks/useClients';
import { subscribeToPayments, addPayment, deletePayment } from '../services/paymentService';
import { formatCurrency, formatDate, toDate, formatPercent } from '../utils/formatters';
import { calcularProximaFechaDePago, calcularCuota } from '../utils/calculations';
import { getWhatsAppReminderLink } from '../utils/whatsapp';
import { generarReciboPago } from '../utils/pdfGenerator';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import './LoanDetail.css';

export default function LoanDetail() {
  const { loanId } = useParams();
  const navigate = useNavigate();
  const { userId, userProfile } = useAuth();
  const appName = userProfile?.appName || 'PrestaFácil';
  const { loans, deleteLoan } = useLoans();
  const { clients } = useClients();
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNote, setPaymentNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [showDeleteLoanDialog, setShowDeleteLoanDialog] = useState(false);

  const loan = loans.find(l => l.id === loanId);
  const client = loan ? clients.find(c => c.id === loan.clientId) : null;

  // Cálculos para la UI
  const startStr = loan?.startDate?.seconds ? new Date(loan.startDate.seconds * 1000).toISOString().split('T')[0] : (loan?.startDate?.split('T')[0] || '');
  const dueStr = loan?.dueDate?.seconds ? new Date(loan.dueDate.seconds * 1000).toISOString().split('T')[0] : (loan?.dueDate?.split('T')[0] || '');
  const cuota = loan ? calcularCuota(loan.totalAmount, startStr, dueStr, loan.frequency) : { amount: 0 };
  const nextPayment = loan ? (calcularProximaFechaDePago(loan) || toDate(loan.dueDate)) : null;
  const amountToCollect = loan ? Math.min(cuota.amount, loan.remainingBalance) : 0;

  useEffect(() => {
    if (!userId || !loanId) return;
    setPaymentsLoading(true);
    const unsub = subscribeToPayments(userId, loanId, (data) => {
      setPayments(data);
      setPaymentsLoading(false);
    });
    return unsub;
  }, [userId, loanId]);

  if (!loan) {
    return <LoadingSpinner size="lg" text="Cargando préstamo..." />;
  }

  const progress = loan.totalAmount > 0
    ? Math.min(100, (loan.totalPaid / loan.totalAmount) * 100)
    : 0;

  const handleAddPayment = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) return;
    
    // Ejecución optimista: cerramos el modal de inmediato
    setShowPaymentModal(false);
    const amountToSave = Number(paymentAmount);
    const dateToSave = paymentDate;
    const noteToSave = paymentNote;
    
    setPaymentAmount('');
    setPaymentNote('');
    
    try {
      await addPayment(userId, loanId, {
        amount: amountToSave,
        date: dateToSave,
        note: noteToSave,
      }, loan.totalAmount, loan.totalPaid);
    } catch (err) {
      console.error('Error adding payment:', err);
      // Podríamos mostrar un Toast de error aquí si Firebase falla definitivamente
    }
  };

  const confirmDeletePayment = async () => {
    if (!paymentToDelete) return;
    try {
      await deletePayment(userId, loanId, paymentToDelete.id, loan.totalAmount, loan.totalPaid, paymentToDelete.amount);
    } catch (err) {
      console.error('Error deleting payment:', err);
    }
  };

  const confirmDeleteLoan = async () => {
    try {
      await deleteLoan(loanId, loan.amount, loan.totalPaid);
      navigate('/loans');
    } catch (err) {
      console.error('Error deleting loan:', err);
    }
  };

  return (
    <div className="page">
      {/* Back Button */}
      <button className="back-button" onClick={() => navigate(-1)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Volver
      </button>

      {/* Loan Summary */}
      <div className="detail-header animate-fade-in">
        <div className="detail-header-top">
          <div>
            <h1 className="page-title">{loan.clientName}</h1>
            <p className="page-subtitle">
              Creado el {loan.createdAt ? formatDate(loan.createdAt) : formatDate(new Date())}
            </p>
          </div>
          <StatusBadge status={loan.status} />
        </div>
      </div>

      {/* Amounts Card */}
      <div className="detail-card card animate-fade-in-up">
        <div className="detail-amounts">
          <div className="detail-amount">
            <span className="detail-amount-label">Capital</span>
            <span className="detail-amount-value">{formatCurrency(loan.amount)}</span>
          </div>
          <div className="detail-amount">
            <span className="detail-amount-label">Interés</span>
            <span className="detail-amount-value status-active">{formatPercent(loan.interestRate)}</span>
          </div>
          <div className="detail-amount">
            <span className="detail-amount-label">Total</span>
            <span className="detail-amount-value font-bold">{formatCurrency(loan.totalAmount)}</span>
          </div>
        </div>

        <div className="divider" />

        <div className="detail-balance">
          <div>
            <p className="detail-balance-label">Pagado</p>
            <p className="detail-balance-value status-paid">{formatCurrency(loan.totalPaid)}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="detail-balance-label">Restante</p>
            <p className="detail-balance-value">{formatCurrency(loan.remainingBalance)}</p>
          </div>
        </div>

        <div className="progress-bar" style={{ marginTop: 'var(--space-3)' }}>
          <div
            className="progress-bar-fill"
            style={{
              width: `${progress}%`,
              background: loan.status === 'paid' ? 'var(--success)' : 'var(--primary)',
            }}
          />
        </div>
        <p className="text-xs text-muted" style={{ marginTop: 'var(--space-1)', textAlign: 'right' }}>
          {Math.round(progress)}% completado
        </p>
      </div>

      {/* Details */}
      <div className="detail-info card animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="detail-info-row">
          <span className="text-muted">Frecuencia</span>
          <span className="font-medium">
            {loan.frequency === 'weekly' ? 'Semanal' :
             loan.frequency === 'biweekly' ? 'Quincenal' :
             loan.frequency === 'monthly' ? 'Mensual' : loan.frequency}
          </span>
        </div>
        <div className="detail-info-row">
          <span className="text-muted">Tipo de interés</span>
          <span className="font-medium">{loan.interestType === 'simple' ? 'Simple' : loan.interestType}</span>
        </div>
        <div className="detail-info-row">
          <span className="text-muted">Inicio</span>
          <span className="font-medium">
            {loan.startDate ? formatDate(toDate(loan.startDate)) : '—'}
          </span>
        </div>
        <div className="detail-info-row">
          <span className="text-muted">Vencimiento</span>
          <span className="font-medium">
            {loan.dueDate ? formatDate(toDate(loan.dueDate)) : '—'}
          </span>
        </div>
        <div className="detail-info-row">
          <span className="text-muted">Ganancia</span>
          <span className="font-medium status-active">
            {formatCurrency(loan.totalAmount - loan.amount)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="detail-actions animate-fade-in-up" style={{ animationDelay: '150ms' }}>
        <button
          className="btn btn--primary btn--block"
          onClick={() => setShowPaymentModal(true)}
          disabled={loan.status === 'paid'}
        >
          💵 Registrar Pago
        </button>
        {client?.phone && loan.status !== 'paid' && (
          <button
            className="btn btn--block"
            style={{ backgroundColor: '#25D366', color: 'white' }}
            onClick={() => {
              const link = getWhatsAppReminderLink(
                client.phone, 
                loan.clientName, 
                formatCurrency(amountToCollect), 
                nextPayment ? formatDate(nextPayment) : 'N/A',
                appName
              );
              window.open(link, '_blank');
            }}
          >
            <span style={{ fontSize: '1.2em', marginRight: '4px' }}>💬</span> Enviar Recordatorio
          </button>
        )}
        <button className="btn btn--danger btn--block btn--sm" onClick={() => setShowDeleteLoanDialog(true)}>
          Eliminar Préstamo
        </button>
      </div>

      {/* Payments History */}
      <div className="section" style={{ marginTop: 'var(--space-6)' }}>
        <h2 className="section-title">Historial de Pagos</h2>

        {paymentsLoading ? (
          <LoadingSpinner size="sm" />
        ) : payments.length === 0 ? (
          <p className="text-sm text-muted" style={{ padding: 'var(--space-4) 0' }}>
            No hay pagos registrados
          </p>
        ) : (
          <div className="payments-list">
            {payments.map((payment, i) => (
              <div key={payment.id} className="payment-item animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="payment-dot" />
                <div className="payment-info">
                  <div className="payment-top">
                    <span className="payment-amount">{formatCurrency(payment.amount)}</span>
                    <span className="payment-date">
                      {payment.date ? formatDate(toDate(payment.date)) : '—'}
                    </span>
                  </div>
                  {payment.note && (
                    <p className="payment-note">{payment.note}</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                  <button
                    className="payment-action-btn"
                    title="Descargar Recibo PDF"
                    onClick={() => generarReciboPago(payment, loan.clientName, loan, appName)}
                    style={{ color: 'var(--info)' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/>
                    </svg>
                  </button>
                  <button
                    className="payment-delete payment-action-btn"
                    onClick={() => setPaymentToDelete(payment)}
                    aria-label="Eliminar pago"
                    title="Eliminar Pago"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Registrar Pago"
      >
        <div className="input-group">
          <label className="input-label">Monto del pago</label>
          <input
            type="number"
            className="input-field"
            placeholder="₡0"
            value={paymentAmount}
            onChange={e => setPaymentAmount(e.target.value)}
            min="0"
            id="payment-amount-input"
          />
          {amountToCollect > 0 && loan.remainingBalance > 0 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button 
                type="button"
                style={{ fontSize: '0.85em', padding: '6px 12px', background: 'var(--primary-bg)', color: 'var(--primary)', border: '1px solid var(--primary-light)', borderRadius: '16px', cursor: 'pointer', fontWeight: '500' }}
                onClick={() => setPaymentAmount(Math.round(amountToCollect).toString())}
              >
                Cuota Exacta ({formatCurrency(amountToCollect)})
              </button>
              {loan.remainingBalance > amountToCollect && (
                <button 
                  type="button"
                  style={{ fontSize: '0.85em', padding: '6px 12px', background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success)', borderRadius: '16px', cursor: 'pointer', fontWeight: '500' }}
                  onClick={() => setPaymentAmount(Math.round(loan.remainingBalance).toString())}
                >
                  Liquidar Todo ({formatCurrency(loan.remainingBalance)})
                </button>
              )}
            </div>
          )}
        </div>

        <div className="input-group">
          <label className="input-label">Fecha del pago</label>
          <input
            type="date"
            className="input-field"
            value={paymentDate}
            onChange={e => setPaymentDate(e.target.value)}
            id="payment-date-input"
          />
        </div>

        <div className="input-group">
          <label className="input-label">Nota (opcional)</label>
          <input
            type="text"
            className="input-field"
            placeholder="Ej: Abono parcial"
            value={paymentNote}
            onChange={e => setPaymentNote(e.target.value)}
            id="payment-note-input"
          />
        </div>

        <button
          className="btn btn--primary btn--block"
          onClick={handleAddPayment}
          disabled={submitting || !paymentAmount}
          id="payment-submit-button"
        >
          {submitting ? 'Guardando...' : 'Guardar Pago'}
        </button>
      </Modal>

      <ConfirmDialog
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={confirmDeletePayment}
        title="Eliminar Pago"
        message="¿Estás seguro de que deseas eliminar este pago? El saldo del préstamo se recalculará automáticamente."
        confirmText="Sí, eliminar"
        isDanger={true}
      />

      <ConfirmDialog
        isOpen={showDeleteLoanDialog}
        onClose={() => setShowDeleteLoanDialog(false)}
        onConfirm={confirmDeleteLoan}
        title="Eliminar Préstamo"
        message="¿Estás seguro de que deseas eliminar este préstamo por completo? Esta acción también eliminará todos los pagos asociados de forma permanente."
        confirmText="Sí, eliminar préstamo"
        isDanger={true}
      />
    </div>
  );
}
