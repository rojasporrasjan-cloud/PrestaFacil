import { useState } from 'react';
import { useLoans } from '../hooks/useLoans';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate, toDate } from '../utils/formatters';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import './Loans.css';

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Activos' },
  { key: 'paid', label: 'Pagados' },
  { key: 'overdue', label: 'Atrasados' },
];

export default function Loans() {
  const { loans, loading } = useLoans();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? loans
    : loans.filter(l => l.status === filter);

  if (loading) return <LoadingSpinner size="lg" text="Cargando préstamos..." />;

  return (
    <div className="page">
      <div className="page-header animate-fade-in">
        <h1 className="page-title">Préstamos</h1>
        <p className="page-subtitle">{loans.length} préstamos registrados</p>
      </div>

      {/* Filter Chips */}
      <div className="filter-chips">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`filter-chip ${filter === f.key ? 'filter-chip--active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loans List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="💸"
          title={filter === 'all' ? 'Sin préstamos' : `Sin préstamos ${FILTERS.find(f => f.key === filter)?.label.toLowerCase()}`}
          description="Usa el botón + para crear un nuevo préstamo"
        />
      ) : (
        <div className="loans-list">
          {filtered.map((loan, i) => {
            const progress = loan.totalAmount > 0
              ? Math.min(100, (loan.totalPaid / loan.totalAmount) * 100)
              : 0;
            const dueDate = loan.dueDate ? toDate(loan.dueDate) : null;

            return (
              <div
                key={loan.id}
                className="loan-card card card--interactive animate-fade-in-up"
                style={{ animationDelay: `${i * 50}ms` }}
                onClick={() => navigate(`/loans/${loan.id}`)}
              >
                <div className="loan-card-top">
                  <div className="loan-card-client">
                    <p className="loan-card-name">{loan.clientName || 'Sin cliente'}</p>
                    <p className="loan-card-date">
                      {dueDate ? `Vence: ${formatDate(dueDate)}` : 'Sin vencimiento'}
                    </p>
                  </div>
                  <StatusBadge status={loan.status} />
                </div>

                <div className="loan-card-amounts">
                  <div className="loan-card-amount">
                    <span className="loan-card-amount-label">Capital</span>
                    <span className="loan-card-amount-value">{formatCurrency(loan.amount)}</span>
                  </div>
                  <div className="loan-card-amount">
                    <span className="loan-card-amount-label">Interés</span>
                    <span className="loan-card-amount-value status-active">{loan.interestRate}%</span>
                  </div>
                  <div className="loan-card-amount">
                    <span className="loan-card-amount-label">Total</span>
                    <span className="loan-card-amount-value">{formatCurrency(loan.totalAmount)}</span>
                  </div>
                </div>

                <div className="loan-card-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${progress}%`,
                        background: loan.status === 'paid' ? 'var(--success)'
                          : loan.status === 'overdue' ? 'var(--danger)'
                          : 'var(--primary)',
                      }}
                    />
                  </div>
                  <div className="loan-card-progress-info">
                    <span className="text-muted text-xs">
                      Pagado: {formatCurrency(loan.totalPaid)}
                    </span>
                    <span className="text-muted text-xs">
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
