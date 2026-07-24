import { useState } from 'react';
import './FAB.css';

export default function FAB({ onNewLoan, onNewClient }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);
  const close = () => setIsOpen(false);

  const handleNewLoan = () => {
    close();
    onNewLoan?.();
  };

  const handleNewClient = () => {
    close();
    onNewClient?.();
  };

  return (
    <>
      {isOpen && <div className="fab-backdrop" onClick={close} />}

      <div className="fab-container">
        {isOpen && (
          <div className="fab-menu animate-fade-in-up">
            <button className="fab-menu-item" onClick={handleNewLoan}>
              <span className="fab-menu-icon">💸</span>
              <span className="fab-menu-label">Nuevo Préstamo</span>
            </button>
            <button className="fab-menu-item" onClick={handleNewClient}>
              <span className="fab-menu-icon">👤</span>
              <span className="fab-menu-label">Nuevo Cliente</span>
            </button>
          </div>
        )}

        <button
          className={`fab-button ${isOpen ? 'fab-button--open' : ''}`}
          onClick={toggle}
          aria-label="Acciones rápidas"
          id="fab-main-button"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
    </>
  );
}
