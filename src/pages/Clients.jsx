import { useState, useMemo } from 'react';
import { useClients } from '../hooks/useClients';
import { useLoans } from '../hooks/useLoans';
import { useNavigate } from 'react-router-dom';
import { getInitials, getAvatarColor } from '../utils/formatters';
import { calcularRiesgoCliente } from '../utils/calculations';
import { RISK_LABELS } from '../utils/constants';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import './Clients.css';

export default function Clients() {
  const { clients, loading } = useClients();
  const { loans } = useLoans();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  // Enrich clients with risk based on their loans
  const enrichedClients = useMemo(() => {
    return clients.map(client => {
      const clientLoans = loans.filter(l => l.clientId === client.id);
      const risk = calcularRiesgoCliente(clientLoans);
      return { ...client, risk, loanCount: clientLoans.length };
    });
  }, [clients, loans]);

  const filtered = search
    ? enrichedClients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.toLowerCase().includes(search.toLowerCase())
      )
    : enrichedClients;

  if (loading) return <LoadingSpinner size="lg" text="Cargando clientes..." />;

  return (
    <div className="page">
      <div className="page-header animate-fade-in">
        <h1 className="page-title">Clientes</h1>
        <p className="page-subtitle">{clients.length} clientes registrados</p>
      </div>

      {/* Search */}
      {clients.length > 0 && (
        <div className="search-bar animate-fade-in">
          <svg className="search-bar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="search-bar-input"
            placeholder="Buscar cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="client-search-input"
          />
        </div>
      )}

      {/* Client List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="👤"
          title={search ? 'Sin resultados' : 'Sin clientes'}
          description={search ? 'Intenta con otro nombre' : 'Usa el botón + para agregar un cliente'}
        />
      ) : (
        <div className="clients-list">
          {filtered.map((client, i) => {
            const riskConfig = RISK_LABELS[client.risk];
            return (
              <div
                key={client.id}
                className="client-item card card--interactive animate-fade-in-up"
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <div
                  className="avatar"
                  style={{ background: getAvatarColor(client.name) }}
                >
                  {getInitials(client.name)}
                </div>
                <div className="client-info">
                  <p className="client-name">{client.name}</p>
                  <p className="client-phone">{client.phone || 'Sin teléfono'}</p>
                </div>
                <div className="client-right">
                  <span
                    className="client-risk-badge"
                    style={{ color: riskConfig?.color, background: `${riskConfig?.color}15` }}
                  >
                    {riskConfig?.label}
                  </span>
                  <span className="client-loan-count">
                    {client.loanCount} préstamo{client.loanCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
