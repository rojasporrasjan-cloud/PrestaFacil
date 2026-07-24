import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import './MobileHeader.css';

export default function MobileHeader() {
  const { userProfile, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const appName = userProfile?.appName || 'PrestaFácil';

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout();
    }
  };

  return (
    <header className="mobile-header">
      <div className="mobile-header-logo">
        <div className="mobile-header-icon">PF</div>
        <span className="mobile-header-text">{appName}</span>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          className="mobile-header-logout"
          onClick={toggleTheme}
          title={isDark ? "Modo Claro" : "Modo Oscuro"}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
        <button 
          className="mobile-header-logout" 
          onClick={handleLogout}
          title="Cerrar sesión"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    </header>
  );
}
