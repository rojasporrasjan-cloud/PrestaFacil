import Modal from './Modal';

export default function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar', 
  isDanger = false 
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div style={{ padding: 'var(--space-2) 0' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
          <button className="btn btn--ghost" onClick={onClose}>
            {cancelText}
          </button>
          <button 
            className={`btn ${isDanger ? 'btn--danger' : 'btn--primary'}`} 
            onClick={() => { 
              onConfirm(); 
              onClose(); 
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
