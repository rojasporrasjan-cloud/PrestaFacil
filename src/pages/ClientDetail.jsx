import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClients } from '../hooks/useClients';
import { useLoans } from '../hooks/useLoans';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, formatDate, toDate, getInitials, getAvatarColor } from '../utils/formatters';
import { calcularRiesgoCliente } from '../utils/calculations';
import { RISK_LABELS } from '../utils/constants';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoanForm from '../components/forms/LoanForm';
import { getWhatsAppClientLink } from '../utils/whatsapp';
import './ClientDetail.css';

export default function ClientDetail() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const appName = userProfile?.appName || 'PrestaFácil';
  const { clients, updateClient, deleteClient } = useClients();
  const { loans } = useLoans();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const client = clients.find(c => c.id === clientId);
  const clientLoans = useMemo(
    () => loans.filter(l => l.clientId === clientId),
    [loans, clientId]
  );
  const risk = useMemo(() => calcularRiesgoCliente(clientLoans), [clientLoans]);
  const riskConfig = RISK_LABELS[risk];

  if (!client) return <LoadingSpinner size="lg" text="Cargando cliente..." />;

  const openEdit = () => {
    setEditName(client.name);
    setEditPhone(client.phone || '');
    setEditNotes(client.notes || '');
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    // Ejecución optimista
    setShowEditModal(false);
    
    try {
      await updateClient(clientId, { name: editName, phone: editPhone, notes: editNotes });
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteClient(clientId);
      navigate('/clients');
    } catch (err) {
      console.error(err);
    }
  };

  const totalLent = clientLoans.reduce((s, l) => s + (l.amount || 0), 0);
  const totalPaid = clientLoans.reduce((s, l) => s + (l.totalPaid || 0), 0);

  return (
    <div className="page">
      <button className="back-button" onClick={() => navigate(-1)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Volver
      </button>

      {/* Client Profile */}
      <div className="client-profile animate-fade-in">
        <div className="avatar avatar--lg" style={{ background: getAvatarColor(client.name) }}>
          {getInitials(client.name)}
        </div>
        <h1 className="client-profile-name">{client.name}</h1>
        <p className="client-profile-phone">{client.phone || 'Sin teléfono'}</p>
        <span className="client-risk-badge" style={{ color: riskConfig?.color, background: `${riskConfig?.color}15` }}>
          {riskConfig?.label}
        </span>
      </div>

      {/* Stats */}
      <div className="grid-2" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <p className="text-xs text-muted" style={{ marginBottom: '4px' }}>Total prestado</p>
          <p className="font-bold text-lg">{formatCurrency(totalLent)}</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p className="text-xs text-muted" style={{ marginBottom: '4px' }}>Total pagado</p>
          <p className="font-bold text-lg status-paid">{formatCurrency(totalPaid)}</p>
        </div>
      </div>

      {/* Notes */}
      {client.notes && (
        <div className="card animate-fade-in-up" style={{ marginBottom: 'var(--space-4)' }}>
          <p className="text-xs text-muted font-medium" style={{ marginBottom: '4px' }}>NOTAS</p>
          <p className="text-sm">{client.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
        {client.phone && (
          <button 
            className="btn btn--block btn--sm" 
            style={{ backgroundColor: '#25D366', color: 'white' }}
            onClick={() => window.open(getWhatsAppClientLink(client.phone, client.name, appName), '_blank')}
          >
            <span style={{ fontSize: '1.2em', marginRight: '4px' }}>💬</span> WhatsApp
          </button>
        )}
        <button className="btn btn--secondary btn--block btn--sm" onClick={openEdit}>✏️ Editar</button>
        <button className="btn btn--danger btn--block btn--sm" onClick={() => setShowDeleteDialog(true)}>🗑️ Eliminar</button>
      </div>

      {/* Client Loans */}
      <div className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Préstamos ({clientLoans.length})</h2>
          <button 
            className="btn btn--sm btn--primary" 
            onClick={() => setShowLoanForm(true)}
          >
            + Nuevo
          </button>
        </div>
        
        {clientLoans.length === 0 ? (
          <p className="text-sm text-muted" style={{ padding: 'var(--space-4) 0' }}>
            Este cliente no tiene préstamos
          </p>
        ) : (
          <div className="loans-list">
            {clientLoans.map(loan => {
              const dueDate = loan.dueDate ? toDate(loan.dueDate) : null;
              return (
                <div
                  key={loan.id}
                  className="card card--interactive"
                  style={{ padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-2)' }}
                  onClick={() => navigate(`/loans/${loan.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p className="font-semibold">{formatCurrency(loan.amount)}</p>
                      <p className="text-xs text-muted">
                        {dueDate ? formatDate(dueDate) : 'Sin fecha'}
                        {' · '}{loan.interestRate}%
                      </p>
                    </div>
                    <StatusBadge status={loan.status} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Editar Cliente">
        <div className="input-group">
          <label className="input-label">Nombre</label>
          <input className="input-field" value={editName} onChange={e => setEditName(e.target.value)} id="edit-client-name" />
        </div>
        <div className="input-group">
          <label className="input-label">Teléfono</label>
          <input className="input-field" value={editPhone} onChange={e => setEditPhone(e.target.value)} id="edit-client-phone" />
        </div>
        <div className="input-group">
          <label className="input-label">Notas</label>
          <textarea className="input-field" rows={3} value={editNotes} onChange={e => setEditNotes(e.target.value)} id="edit-client-notes" />
        </div>
        <button className="btn btn--primary btn--block" onClick={handleUpdate} disabled={submitting || !editName.trim()}>
          {submitting ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Eliminar Cliente"
        message={`¿Estás seguro que deseas eliminar a ${client.name}? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        isDanger={true}
      />

      <LoanForm 
        isOpen={showLoanForm} 
        onClose={() => setShowLoanForm(false)} 
        initialClientId={client.id}
      />
    </div>
  );
}
