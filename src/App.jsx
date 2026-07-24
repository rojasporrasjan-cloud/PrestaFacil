import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import BottomNav from './components/layout/BottomNav';
import Sidebar from './components/layout/Sidebar';
import MobileHeader from './components/layout/MobileHeader';
import FAB from './components/layout/FAB';
import LoanForm from './components/forms/LoanForm';
import ClientForm from './components/forms/ClientForm';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Loans from './pages/Loans';
import LoanDetail from './pages/LoanDetail';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Reports from './pages/Reports';
import LoadingSpinner from './components/ui/LoadingSpinner';
import OnboardingWizard from './components/onboarding/OnboardingWizard';
import './App.css';

function ProtectedLayout() {
  const { user, userProfile, loading } = useAuth();
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Sync theme with user profile
  useEffect(() => {
    if (userProfile?.theme) {
      const current = localStorage.getItem('prestafacil-theme');
      if (current !== userProfile.theme) {
        localStorage.setItem('prestafacil-theme', userProfile.theme);
        if (userProfile.theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        // Force re-render of components using useTheme by reloading if it's the first sync
        if (!current) window.location.reload();
      }
    }
  }, [userProfile?.theme]);

  if (loading) {
    return (
      <div className="app-loading">
        <LoadingSpinner size="lg" text="Cargando PrestaFácil..." />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!userProfile || userProfile.onboarded !== true) {
    return <OnboardingWizard />;
  }

  return (
    <div 
      className="app-shell" 
      style={{ '--sidebar-width': isSidebarCollapsed ? '80px' : '240px' }}
    >
      <MobileHeader />
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/loans/:loanId" element={<LoanDetail />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:clientId" element={<ClientDetail />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>

      <FAB
        onNewLoan={() => setShowLoanForm(true)}
        onNewClient={() => setShowClientForm(true)}
      />
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      <BottomNav />

      <LoanForm isOpen={showLoanForm} onClose={() => setShowLoanForm(false)} />
      <ClientForm isOpen={showClientForm} onClose={() => setShowClientForm(false)} />
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <LoadingSpinner size="lg" text="Cargando..." />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
