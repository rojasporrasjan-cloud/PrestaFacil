import { useState, useEffect } from 'react';
import { useClients } from '../../hooks/useClients';
import { useAuth } from '../../hooks/useAuth';
import { useLoans } from '../../hooks/useLoans';
import { calcularTotalConInteres, calcularGanancia, calcularFechaVencimiento, calcularCuota } from '../../utils/calculations';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { FREQUENCY_LABELS } from '../../utils/constants';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';

export default function LoanForm({ isOpen, onClose, initialClientId = '' }) {
  const { userId } = useAuth();
  const { clients, addClient } = useClients();
  const { addLoan } = useLoans();

  const [clientId, setClientId] = useState(initialClientId);
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [termValue, setTermValue] = useState('');
  const [termUnit, setTermUnit] = useState('months');
  
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Calculadora automática de fechas
  useEffect(() => {
    if (termValue && Number(termValue) > 0 && startDate) {
      const newDueDate = calcularFechaVencimiento(startDate, termValue, termUnit);
      if (newDueDate) setDueDate(newDueDate);
    }
  }, [termValue, termUnit, startDate]);

  // Pre-cargar cliente si se provee
  useEffect(() => {
    if (isOpen && initialClientId) {
      setClientId(initialClientId);
    } else if (!isOpen) {
      // Limpiar formulario al cerrar si se desea (opcional, aunque ya manejado abajo)
    }
  }, [isOpen, initialClientId]);

  const numAmount = Number(amount) || 0;
  const numRate = Number(interestRate) || 0;
  const total = calcularTotalConInteres(numAmount, numRate);
  const profit = calcularGanancia(numAmount, numRate);
  const cuotaResult = calcularCuota(total, startDate, dueDate, frequency);
  const cuotaEstimada = cuotaResult.amount || 0;
  const cuotaInstallments = cuotaResult.installments || 0;

  const selectedClient = clients.find(c => c.id === clientId);

  const handleCloseRequest = () => {
    if (clientId || amount || interestRate || dueDate) {
      setShowConfirm(true);
    } else {
      forceClose();
    }
  };

  const forceClose = () => {
    setClientId('');
    setAmount('');
    setInterestRate('');
    setFrequency('monthly');
    setTermUnit('months');
    setNewClientName('');
    setNewClientPhone('');
    setShowConfirm(false);
    onClose();
  };

  const handleSubmit = async () => {
    if ((!clientId || (clientId === 'NEW_CLIENT' && !newClientName.trim())) || !amount || numAmount <= 0) return;
    setSubmitting(true);
    try {
      let finalClientId = clientId;
      let finalClientName = selectedClient?.name || '';

      // Crear cliente al vuelo si eligió esa opción
      if (clientId === 'NEW_CLIENT') {
        const newId = await addClient({ name: newClientName.trim(), phone: newClientPhone.trim() });
        if (!newId) throw new Error("Error creando cliente");
        finalClientId = newId;
        finalClientName = newClientName.trim();
      }

      const loanData = {
        clientId: finalClientId,
        clientName: finalClientName,
        amount: numAmount,
        interestRate: numRate,
        interestType: 'simple',
        frequency,
        startDate,
        dueDate: dueDate || null,
      };

      // Ejecución optimista: cerramos y limpiamos de inmediato
      addLoan(loanData).catch(err => {
        console.error('Error de red al guardar préstamo:', err);
      });

      forceClose();
    } catch (err) {
      console.error('Error procesando préstamo:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <Modal isOpen={isOpen} onClose={handleCloseRequest} title="Nuevo Préstamo">
      {/* Client selector */}
      <div className="input-group">
        <label className="input-label">Cliente *</label>
        <select
          className="select-field"
          value={clientId}
          onChange={e => setClientId(e.target.value)}
          id="loan-client-select"
        >
          <option value="">Seleccionar cliente...</option>
          <option value="NEW_CLIENT" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Agregar Nuevo Cliente</option>
          <optgroup label="Clientes Existentes">
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Formulario Inline para Nuevo Cliente */}
      {clientId === 'NEW_CLIENT' && (
        <div className="card" style={{ background: 'var(--bg-color)', border: '1px dashed var(--border-color)', marginBottom: 'var(--space-4)', padding: 'var(--space-3)' }}>
          <div className="input-group">
            <label className="input-label">Nombre del nuevo cliente *</label>
            <input
              type="text"
              className="input-field"
              placeholder="Ej: Juan Pérez"
              value={newClientName}
              onChange={e => setNewClientName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Teléfono (Opcional)</label>
            <input
              type="tel"
              className="input-field"
              placeholder="Ej: 8888-8888"
              value={newClientPhone}
              onChange={e => setNewClientPhone(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Amount */}
      <div className="input-group">
        <label className="input-label">Monto a prestar (₡) *</label>
        <input
          type="number"
          className="input-field"
          placeholder="Ej: 100000"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          min="0"
          id="loan-amount-input"
        />
      </div>

      {/* Interest Rate — 100% libre */}
      <div className="input-group">
        <label className="input-label">Tasa de interés (%)</label>
        <input
          type="number"
          className="input-field"
          placeholder="Ej: 10"
          value={interestRate}
          onChange={e => setInterestRate(e.target.value)}
          min="0"
          step="0.1"
          id="loan-interest-input"
        />
      </div>

      {/* Auto Calculator */}
      <div className="input-group">
        <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Plazo del préstamo (Calculadora Auto)</span>
          <span className="text-xs text-muted" style={{ fontWeight: 'normal' }}>¡Nuevo! 🚀</span>
        </label>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <input
            type="number"
            className="input-field"
            placeholder="Ej: 6"
            value={termValue}
            onChange={e => setTermValue(e.target.value)}
            min="1"
            style={{ flex: '1' }}
          />
          <select
            className="select-field"
            value={termUnit}
            onChange={e => {
              const newUnit = e.target.value;
              setTermUnit(newUnit);
              
              // Sincronización pro: auto-ajustar la frecuencia de pago para que tenga sentido lógico
              if (newUnit === 'days') setFrequency('daily');
              if (newUnit === 'weeks') setFrequency('weekly');
              if (newUnit === 'biweekly') setFrequency('biweekly');
              if (newUnit === 'months' || newUnit === 'years') setFrequency('monthly');
            }}
            style={{ flex: '1' }}
          >
            <option value="days">Días</option>
            <option value="weeks">Semanas</option>
            <option value="biweekly">Quincenas</option>
            <option value="months">Meses</option>
            <option value="years">Años</option>
          </select>
        </div>
      </div>

      {/* Frequency */}
      <div className="input-group">
        <label className="input-label">Frecuencia de pago</label>
        <select
          className="select-field"
          value={frequency}
          onChange={e => setFrequency(e.target.value)}
          id="loan-frequency-select"
        >
          {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        <div className="input-group">
          <label className="input-label">Fecha inicio</label>
          <input
            type="date"
            className="input-field"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            id="loan-start-date"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Fecha vencimiento</label>
          <input
            type="date"
            className="input-field"
            value={dueDate}
            onChange={e => {
              setDueDate(e.target.value);
              setTermValue(''); // Desactivar auto-cálculo si eligen fecha manual
            }}
            id="loan-due-date"
          />
        </div>
      </div>

      {/* Live Preview */}
      {numAmount > 0 && (
        <div className="card" style={{
          background: 'var(--primary-bg)',
          border: '1px solid var(--primary)',
          marginBottom: 'var(--space-4)',
          padding: 'var(--space-3) var(--space-4)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <span className="text-sm text-secondary">Total a pagar</span>
            <span className="font-bold">{formatCurrency(total)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <span className="text-sm text-secondary">Ganancia esperada</span>
            <span className="font-bold status-active">+{formatCurrency(profit)}</span>
          </div>
          {cuotaEstimada > 0 && frequency !== 'custom' && (
            <>
              <div className="divider" style={{ margin: 'var(--space-2) 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-sm text-secondary" style={{ fontWeight: '500' }}>
                  Cuota estimada ({cuotaInstallments} {cuotaInstallments === 1 ? 'pago' : 'pagos'} {FREQUENCY_LABELS[frequency]?.toLowerCase()})
                </span>
                <span className="font-bold" style={{ color: 'var(--primary)', fontSize: '1.1em' }}>
                  {formatCurrency(cuotaEstimada)}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      <button
        className="btn btn--primary btn--block"
        onClick={handleSubmit}
        disabled={submitting || (!clientId || (clientId === 'NEW_CLIENT' && !newClientName.trim())) || numAmount <= 0}
        id="loan-submit-button"
      >
        {submitting ? 'Creando...' : 'Crear Préstamo'}
      </button>
    </Modal>
    <ConfirmDialog
      isOpen={showConfirm}
      onClose={() => setShowConfirm(false)}
      onConfirm={forceClose}
      title="Descartar cambios"
      message="Tienes datos sin guardar. ¿Estás seguro de que deseas salir y perder esta información?"
      confirmText="Sí, descartar"
      cancelText="Volver"
      isDanger={true}
    />
    </>
  );
}
