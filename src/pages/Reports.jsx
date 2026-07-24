import { useMemo } from 'react';
import { useLoans } from '../hooks/useLoans';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, toDate } from '../utils/formatters';
import { LOAN_STATUS } from '../utils/constants';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import './Reports.css';

const PIE_COLORS = ['#6366f1', '#10b981', '#ef4444'];

export default function Reports() {
  const { loans, loading } = useLoans();
  const { userProfile } = useAuth();

  // Calculate report data
  const reportData = useMemo(() => {
    if (!loans.length) return null;

    // Total earnings (interest collected from paid loans)
    const totalEarnings = loans
      .filter(l => l.status === LOAN_STATUS.PAID)
      .reduce((sum, l) => sum + ((l.totalPaid || 0) - (l.amount || 0)), 0);

    // Monthly cash flow (payments received by month)
    const monthlyData = {};
    loans.forEach(loan => {
      const date = loan.createdAt ? toDate(loan.createdAt) : new Date();
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      if (!monthlyData[key]) {
        monthlyData[key] = {
          month: `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`,
          prestado: 0,
          cobrado: 0,
        };
      }
      monthlyData[key].prestado += loan.amount || 0;
      monthlyData[key].cobrado += loan.totalPaid || 0;
    });

    const cashFlowData = Object.values(monthlyData).slice(-6);

    // Pie chart data
    const activeCount = loans.filter(l => l.status === LOAN_STATUS.ACTIVE).length;
    const paidCount = loans.filter(l => l.status === LOAN_STATUS.PAID).length;
    const overdueCount = loans.filter(l => l.status === LOAN_STATUS.OVERDUE).length;

    const pieData = [
      { name: 'Activos', value: activeCount },
      { name: 'Pagados', value: paidCount },
      { name: 'Atrasados', value: overdueCount },
    ].filter(d => d.value > 0);

    // Total capital and expected
    const totalCapital = loans.reduce((s, l) => s + (l.amount || 0), 0);
    const totalExpected = loans.reduce((s, l) => s + (l.totalAmount || 0), 0);
    const totalCollected = loans.reduce((s, l) => s + (l.totalPaid || 0), 0);

    return {
      totalEarnings,
      cashFlowData,
      pieData,
      totalCapital,
      totalExpected,
      totalCollected,
      totalLoans: loans.length,
    };
  }, [loans]);

  if (loading) return <LoadingSpinner size="lg" text="Cargando reportes..." />;

  return (
    <div className="page">
      <div className="page-header animate-fade-in">
        <h1 className="page-title">Reportes</h1>
        <p className="page-subtitle">Resumen de tu actividad</p>
      </div>

      {!reportData || !loans.length ? (
        <div className="report-empty">
          <p className="text-muted">Registra préstamos para ver tus reportes</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid-2 animate-fade-in-up">
            <div className="report-card card">
              <p className="report-card-label">Capital total</p>
              <p className="report-card-value">{formatCurrency(reportData.totalCapital)}</p>
            </div>
            <div className="report-card card">
              <p className="report-card-label">Total cobrado</p>
              <p className="report-card-value status-paid">{formatCurrency(reportData.totalCollected)}</p>
            </div>
            <div className="report-card card">
              <p className="report-card-label">Ganancias</p>
              <p className="report-card-value" style={{ color: 'var(--primary)' }}>{formatCurrency(reportData.totalEarnings)}</p>
            </div>
            <div className="report-card card">
              <p className="report-card-label">Préstamos</p>
              <p className="report-card-value">{reportData.totalLoans}</p>
            </div>
          </div>

          {/* Cash Flow Chart */}
          {reportData.cashFlowData.length > 0 && (
            <div className="section animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <h2 className="section-title">Flujo de Caja</h2>
              <div className="chart-card card">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={reportData.cashFlowData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                    <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₡${(v/1000).toFixed(0)}K`} />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '13px',
                      }}
                    />
                    <Bar dataKey="prestado" name="Prestado" fill="var(--primary-light)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cobrado" name="Cobrado" fill="var(--success)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Loan Distribution */}
          {reportData.pieData.length > 0 && (
            <div className="section animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <h2 className="section-title">Distribución de Préstamos</h2>
              <div className="chart-card card">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={reportData.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {reportData.pieData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{value}</span>}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '13px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
