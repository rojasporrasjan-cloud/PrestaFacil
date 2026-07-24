import { useAuth } from '../hooks/useAuth';
import { useLoans } from '../hooks/useLoans';
import { useDashboard } from '../hooks/useDashboard';
import { formatCurrency, formatRelativeDate, formatDate, getInitials, getAvatarColor, toDate } from '../utils/formatters';
import { calcularProximaFechaDePago } from '../utils/calculations';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
  const { userProfile } = useAuth();
  const { loans, loading } = useLoans();
  const { metrics, upcomingPayments } = useDashboard(loans, userProfile?.availableCash || 0);
  const navigate = useNavigate();

  if (loading) return <LoadingSpinner size="lg" text="Cargando datos..." />;

  const firstName = userProfile?.displayName?.split(' ')[0] || 'Usuario';

  return (
    <div className="page">
      <div className="page-header animate-fade-in">
        <p className="dashboard-greeting">Hola, {firstName} 👋</p>
        <h1 className="page-title">Tu Resumen</h1>
      </div>

      {/* Stat Cards Grid */}
      <div className="section">
        <div className="grid-2">
          <div className="stat-card stat-card--primary animate-fade-in-up stagger-1">
            <div className="stat-card-icon">💰</div>
            <p className="stat-card-label">Disponible</p>
            <p className="stat-card-value">{formatCurrency(metrics.availableCash)}</p>
          </div>

          <div className="stat-card stat-card--info animate-fade-in-up stagger-2">
            <div className="stat-card-icon">📉</div>
            <p className="stat-card-label">Prestado</p>
            <p className="stat-card-value">{formatCurrency(metrics.totalLent)}</p>
          </div>

          <div className="stat-card stat-card--success animate-fade-in-up stagger-3">
            <div className="stat-card-icon">📈</div>
            <p className="stat-card-label">Ganancia esperada</p>
            <p className="stat-card-value">{formatCurrency(metrics.expectedProfit)}</p>
          </div>

          <div className="stat-card stat-card--warning animate-fade-in-up stagger-4">
            <div className="stat-card-icon">⏳</div>
            <p className="stat-card-label">Por cobrar</p>
            <p className="stat-card-value">{formatCurrency(metrics.pendingToCollect)}</p>
          </div>
        </div>

        {/* Overdue Card */}
        {metrics.overdueCount > 0 && (
          <div className="stat-card stat-card--danger stat-card--full animate-fade-in-up stagger-5">
            <div className="stat-card-row">
              <div>
                <div className="stat-card-icon">🚨</div>
                <p className="stat-card-label">Atrasados</p>
                <p className="stat-card-value">{formatCurrency(metrics.overdueAmount)}</p>
              </div>
              <div className="stat-card-count">
                <span className="stat-card-count-number">{metrics.overdueCount}</span>
                <span className="stat-card-count-label">préstamos</span>
              </div>
            </div>
          </div>
        )}

        {/* Recommended Funds Card */}
        <div className="fund-card animate-fade-in-up stagger-6">
          <div className="fund-card-header">
            <span className="fund-card-icon">🎯</span>
            <span className="fund-card-title">Fondos recomendados para prestar</span>
          </div>
          <p className="fund-card-value">{formatCurrency(metrics.recommendedFunds)}</p>
          <p className="fund-card-desc">
            Basado en tu balance actual menos el dinero en riesgo
          </p>
          <div className="fund-card-details">
            <div className="fund-card-detail">
              <span className="text-muted">Recuperado</span>
              <span className="font-semibold">{formatCurrency(metrics.totalRecovered)}</span>
            </div>
            <div className="fund-card-detail">
              <span className="text-muted">En riesgo</span>
              <span className="font-semibold status-overdue">{formatCurrency(metrics.moneyAtRisk)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Payments */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Próximos Pagos</h2>
          {upcomingPayments.length > 0 && (
            <button className="section-link" onClick={() => navigate('/loans')}>
              Ver todos →
            </button>
          )}
        </div>

        {upcomingPayments.length === 0 ? (
          <EmptyState
            icon="📅"
            title="Sin pagos pendientes"
            description="Cuando registres préstamos, los próximos pagos aparecerán aquí"
          />
        ) : (
          <div className="upcoming-list">
            {upcomingPayments.map((loan, i) => {
              const nextDate = calcularProximaFechaDePago(loan) || toDate(loan.dueDate);
              
              return (
                <div
                  key={loan.id}
                  className="upcoming-item card card--interactive animate-fade-in-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                  onClick={() => navigate(`/loans/${loan.id}`)}
                >
                  <div
                    className="avatar"
                    style={{ background: getAvatarColor(loan.clientName) }}
                  >
                    {getInitials(loan.clientName)}
                  </div>
                  <div className="upcoming-info">
                    <p className="upcoming-name">{loan.clientName}</p>
                    <div className="upcoming-date" style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                      <span>
                        Próx. pago: {nextDate ? formatDate(nextDate) : 'Sin fecha'} 
                        {nextDate && <span className="text-muted"> ({formatRelativeDate(nextDate)})</span>}
                      </span>
                      <span className="text-muted" style={{ fontSize: '0.85em' }}>
                        Creado: {loan.createdAt ? formatDate(loan.createdAt) : formatDate(new Date())}
                      </span>
                    </div>
                  </div>
                  <div className="upcoming-right">
                    <p className="upcoming-amount">{formatCurrency(loan.remainingBalance)}</p>
                    <StatusBadge status={loan.status} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
