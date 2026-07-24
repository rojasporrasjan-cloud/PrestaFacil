import { useState } from 'react';
import { useClients } from '../../hooks/useClients';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';

export default function ClientForm({ isOpen, onClose }) {
  const { addClient } = useClients();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCloseRequest = () => {
    if (name || phone || notes) {
      setShowConfirm(true);
    } else {
      forceClose();
    }
  };

  const forceClose = () => {
    setName('');
    setPhone('');
    setNotes('');
    setShowConfirm(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      // Ejecución optimista: no esperamos el servidor, cerramos inmediatamente
      addClient({ name: name.trim(), phone: phone.trim(), notes: notes.trim() }).catch(err => {
        console.error('Error de red al guardar cliente:', err);
      });
      
      forceClose();
    } catch (err) {
      console.error('Error procesando cliente:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <Modal isOpen={isOpen} onClose={handleCloseRequest} title="Nuevo Cliente">
      <div className="input-group">
        <label className="input-label">Nombre *</label>
        <input
          type="text"
          className="input-field"
          placeholder="Nombre completo"
          value={name}
          onChange={e => setName(e.target.value)}
          id="client-name-input"
        />
      </div>

      <div className="input-group">
        <label className="input-label">Teléfono</label>
        <input
          type="tel"
          className="input-field"
          placeholder="8888-1234"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          id="client-phone-input"
        />
      </div>

      <div className="input-group">
        <label className="input-label">Notas</label>
        <textarea
          className="input-field"
          rows={3}
          placeholder="Notas sobre el cliente..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          id="client-notes-input"
          style={{ resize: 'vertical' }}
        />
      </div>

      <button
        className="btn btn--primary btn--block"
        onClick={handleSubmit}
        disabled={submitting || !name.trim()}
        id="client-submit-button"
      >
        {submitting ? 'Guardando...' : 'Agregar Cliente'}
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
