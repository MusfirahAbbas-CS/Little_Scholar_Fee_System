import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  AlertTriangle, Download, TrendingDown, Calendar,
  Users, DollarSign, BarChart3,
} from 'lucide-react';
import { analyticsApi } from '../api/client';
import { formatCurrency, getInitials, getAvatarColor, shortMonthLabel } from '../utils/helpers';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '0.875rem 1rem', fontSize: '0.8rem',
      }}>
        <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, marginBottom: '0.2rem' }}>
            {p.name}: <strong>{formatCurrency(p.value)}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Reports() {
  const [exportLoading, setExportLoading] = useState(false);

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsApi.getDashboard(null),
  });

  const { data: defaulters = [], isLoading: loadingDefaulters } = useQuery({
    queryKey: ['defaulters'],
    queryFn: analyticsApi.getDefaulters,
  });

  function exportCSV() {
    setExportLoading(true);
    const headers = ['Student Name', 'Roll Number', 'Class', 'Overdue Cycles', 'Total Owed (Rs.)'];
    const rows = defaulters.map(d => [
      d.name, d.roll_number, d.class_name, d.overdue_cycles, d.total_owed,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `defaulters_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportLoading(false);
  }

  const classBrk = analytics?.classBrk || [];
  const monthlyTrend = analytics?.monthlyTrend || [];

  const barData = classBrk.map(c => ({
    name: c.class_name,
    Collected: c.collected,
    Outstanding: c.outstanding,
  }));

  const trendData = monthlyTrend.map(m => ({
    name: shortMonthLabel(m.month),
    Billed: m.billed,
    Collected: m.collected,
    Outstanding: m.billed - m.collected,
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Defaulter tracking, class-wise performance, and financial summaries</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={exportCSV}
          disabled={exportLoading || defaulters.length === 0}
        >
          <Download size={15} /> Export Defaulters CSV
        </button>
      </div>

      {/* Summary KPIs */}
      {!loadingAnalytics && analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Billed (All Time)', value: formatCurrency(analytics.totalBilled), color: '#1e3a8a', bg: 'rgba(30,58,138,0.08)', border: 'rgba(30,58,138,0.15)', icon: DollarSign },
            { label: 'Total Collected', value: formatCurrency(analytics.totalCollected), color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', icon: TrendingDown },
            { label: 'Total Outstanding', value: formatCurrency(analytics.totalOutstanding), color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', icon: AlertTriangle },
            { label: 'Collection Rate', value: `${analytics.collectionRate}%`, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', icon: BarChart3 },
          ].map(({ label, value, color, bg, border, icon: Icon }) => (
            <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: '1.125rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} color={color} />
              </div>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color, fontFamily: 'Plus Jakarta Sans' }}>{value}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Class-wise Bar Chart */}
        <div className="card">
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              Class-wise Collection
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Collected vs. Outstanding per class
            </p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,138,0.06)" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Outstanding" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trend */}
        <div className="card">
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              Monthly Trend
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Billing and collection over time
            </p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,138,0.06)" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="Billed" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Outstanding" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Defaulters Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              Defaulter List
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Students with pending dues spanning 1+ billing cycles
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              background: 'rgba(239,68,68,0.1)', color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 999, padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 600,
            }}>
              {defaulters.length} defaulters
            </span>
          </div>
        </div>

        {loadingDefaulters ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 56 }} />)}
          </div>
        ) : defaulters.length === 0 ? (
          <div className="empty-state" style={{ padding: '2.5rem' }}>
            <div className="empty-state-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
              <Users size={28} />
            </div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#10b981' }}>No Defaulters!</h3>
            <p style={{ fontSize: '0.875rem' }}>All students are up to date with payments</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Overdue Cycles</th>
                  <th>Total Owed</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {defaulters.map(d => {
                  const initials = d.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  const grad = getAvatarColor(d.name);
                  const severity = d.total_owed > 10000 ? 'High' : d.total_owed > 5000 ? 'Medium' : 'Low';
                  const sColors = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };
                  const sColor = sColors[severity];

                  return (
                    <tr key={d.student_id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className={`student-avatar bg-gradient-to-br ${grad}`}>{initials}</div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{d.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.roll_number}</div>
                          </div>
                        </div>
                      </td>
                      <td><span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{d.class_name}</span></td>
                      <td>
                        <span style={{
                          background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                          border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8,
                          padding: '0.2rem 0.625rem', fontSize: '0.8rem', fontWeight: 700,
                        }}>
                          {d.overdue_cycles} {d.overdue_cycles === 1 ? 'cycle' : 'cycles'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, color: '#ef4444', fontSize: '0.95rem', fontFamily: 'Plus Jakarta Sans' }}>
                          {formatCurrency(d.total_owed)}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          background: `${sColor}1a`, color: sColor,
                          border: `1px solid ${sColor}33`,
                          borderRadius: 999, padding: '0.2rem 0.6rem',
                          fontSize: '0.72rem', fontWeight: 700,
                        }}>
                          {severity}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
