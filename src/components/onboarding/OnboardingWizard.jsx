import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { updateUserProfile } from '../../services/authService';
import './OnboardingWizard.css';

export default function OnboardingWizard() {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  
  // State for forms
  const [appName, setAppName] = useState('PrestaFácil');
  const [cash, setCash] = useState('');
  const [theme, setTheme] = useState('dark');
  const [isSaving, setIsSaving] = useState(false);

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, {
        appName: appName.trim() || 'PrestaFácil',
        availableCash: Number(cash) || 0,
        theme,
        onboarded: true
      });
      
      // Apply theme immediately
      localStorage.setItem('prestafacil-theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      await refreshProfile();
    } catch (err) {
      console.error(err);
      alert('Error guardando la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  if (isSaving) {
    return (
      <div className="onboarding-overlay">
        <div className="onboarding-card card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <h2 style={{ marginBottom: 'var(--space-2)' }}>Preparando tu espacio...</h2>
          <p className="text-muted">Guardando preferencias y ajustando todo mágicamente ✨</p>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card card animate-fade-in-up">
        {step === 1 && (
          <div className="onboarding-step">
            <h1 className="onboarding-title">¡Bienvenido! 👋</h1>
            <p className="onboarding-text">
              Para empezar, vamos a ponerle un nombre a tu negocio. 
              Este nombre aparecerá en la aplicación, en los recibos PDF y en los recordatorios de WhatsApp.
            </p>
            <div className="input-group" style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
              <label className="input-label">Nombre del negocio</label>
              <input 
                type="text" 
                className="input-field" 
                value={appName} 
                onChange={e => setAppName(e.target.value)} 
                placeholder="Ej: Préstamos Fernanda" 
              />
            </div>
            <button className="btn btn--primary btn--block" onClick={() => setStep(2)}>
              Continuar ➔
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-step">
            <h2 className="onboarding-title">Capital Inicial 💰</h2>
            <p className="onboarding-text">
              ¿Con cuánto dinero en efectivo cuentas actualmente para empezar a prestar? 
              <br/><br/>
              (Puedes empezar en cero y agregarlo después si lo deseas).
            </p>
            <div className="input-group" style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
              <label className="input-label">Monto disponible (₡)</label>
              <input 
                type="number" 
                className="input-field" 
                value={cash} 
                onChange={e => setCash(e.target.value)} 
                placeholder="Ej: 500000" 
                min="0"
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button className="btn btn--secondary btn--block" onClick={() => setStep(1)}>
                Volver
              </button>
              <button className="btn btn--primary btn--block" onClick={() => setStep(3)}>
                Continuar ➔
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-step">
            <h2 className="onboarding-title">Tu Estilo Visual 🎨</h2>
            <p className="onboarding-text">
              Elige cómo quieres que se vea la aplicación. Podrás cambiar esto más tarde.
            </p>
            
            <div className="theme-options" style={{ display: 'flex', gap: 'var(--space-3)', margin: 'var(--space-6) 0' }}>
              <div 
                className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme('dark')}
              >
                <div className="theme-preview dark-preview">
                  <span className="theme-icon">🌙</span>
                </div>
                <p>Modo Oscuro</p>
              </div>
              <div 
                className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
              >
                <div className="theme-preview light-preview">
                  <span className="theme-icon">☀️</span>
                </div>
                <p>Modo Claro</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button className="btn btn--secondary btn--block" onClick={() => setStep(2)}>
                Volver
              </button>
              <button className="btn btn--primary btn--block" onClick={handleFinish} style={{ background: 'var(--success)' }}>
                ¡Comenzar a Prestar! 🚀
              </button>
            </div>
          </div>
        )}
        
        {/* Step dots indicator */}
        <div className="onboarding-dots">
          <div className={`dot ${step === 1 ? 'active' : ''}`}></div>
          <div className={`dot ${step === 2 ? 'active' : ''}`}></div>
          <div className={`dot ${step === 3 ? 'active' : ''}`}></div>
        </div>
      </div>
    </div>
  );
}
