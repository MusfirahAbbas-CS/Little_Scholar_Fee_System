import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet, AlertCircle, CheckCircle2,
  Clock, Users, BarChart3, RefreshCw, Calendar,
} from 'lucide-react';
import { analyticsApi } from '../api/client';
import { formatCurrency, shortMonthLabel } from '../utils/helpers';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

function StatCard({ title, value, subtitle, icon: Icon, trend, colorClass, iconBg }) {
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className="stat-icon" style={{ background: iconBg }}>
        <Icon size={22} color="white" />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{title}</div>
      {subtitle && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {trend === 'up' && <TrendingUp size={12} color="#10b981" />}
          {trend === 'down' && <TrendingDown size={12} color="#ef4444" />}
          {subtitle}
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '0.875rem 1rem', fontSize: '0.8rem',
      }}>
        <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, marginBottom: '0.25rem' }}>
            {p.name}: <strong>{formatCurrency(p.value)}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState('');

  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ['dashboard', selectedMonth],
    queryFn: () => analyticsApi.getDashboard(selectedMonth || null),
  });

  const { data: months = [] } = useQuery({
    queryKey: ['months'],
    queryFn: analyticsApi.getAvailableMonths,
  });

  if (isLoading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <div className="skeleton" style={{ width: 220, height: 32, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 160, height: 16 }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 140 }} />)}
        </div>
      </div>
    );
  }

  const { totalBilled, totalCollected, totalOutstanding, collectionRate,
          paidCount, partialCount, unpaidCount, classBrk = [], monthlyTrend = [] } = analytics || {};

  const pieData = [
    { name: 'Paid', value: paidCount },
    { name: 'Partial', value: partialCount },
    { name: 'Unpaid', value: unpaidCount },
  ];

  const trendData = monthlyTrend.map(m => ({
    name: shortMonthLabel(m.month),
    Billed: m.billed,
    Collected: m.collected,
    Outstanding: m.billed - m.collected,
  }));

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Dashboard</h1>
          <p className="page-subtitle">Real-time overview of fee collection and outstanding balances</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Calendar size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <select
              className="form-select"
              style={{ paddingLeft: '2rem', width: 180 }}
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
            >
              <option value="">All Months</option>
              {months.map(m => (
                <option key={m} value={m}>{shortMonthLabel(m)}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => refetch()} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
        <StatCard
          title="Total Billed"
          value={formatCurrency(totalBilled)}
          subtitle={`${(paidCount + partialCount + unpaidCount)} fee slips`}
          icon={Wallet} colorClass="purple" trend={null}
          iconBg="linear-gradient(135deg, #1e3a8a, #2563eb)"
        />
        <StatCard
          title="Revenue Collected"
          value={formatCurrency(totalCollected)}
          subtitle={`${collectionRate}% collection rate`}
          icon={TrendingUp} colorClass="green" trend="up"
          iconBg="linear-gradient(135deg, #10b981, #059669)"
        />
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(totalOutstanding)}
          subtitle={`${unpaidCount} unpaid slips`}
          icon={AlertCircle} colorClass="red" trend="down"
          iconBg="linear-gradient(135deg, #ef4444, #dc2626)"
        />
        <StatCard
          title="Collection Rate"
          value={`${collectionRate}%`}
          subtitle={`${paidCount} fully paid`}
          icon={BarChart3} colorClass="blue" trend="up"
          iconBg="linear-gradient(135deg, #3b82f6, #2563eb)"
        />
      </div>

      {/* Status Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Paid Slips', count: paidCount, icon: CheckCircle2, color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
          { label: 'Partially Paid', count: partialCount, icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
          { label: 'Unpaid Slips', count: unpaidCount, icon: AlertCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
        ].map(({ label, count, icon: Icon, color, bg, border }) => (
          <div key={label} style={{
            background: bg, border: `1px solid ${border}`, borderRadius: 14,
            padding: '1.125rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={22} color={color} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color, fontFamily: 'Plus Jakarta Sans', letterSpacing: '-0.03em' }}>{count}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Monthly Trend */}
        <div className="card">
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              Monthly Collection Trend
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Billed vs. Collected (last 4 months)</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradBilled" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,138,0.06)" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              <Area type="monotone" dataKey="Billed"    stroke="#1e3a8a" strokeWidth={2} fill="url(#gradBilled)" />
              <Area type="monotone" dataKey="Collected" stroke="#10b981" strokeWidth={2} fill="url(#gradCollected)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              Payment Status
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Slip distribution by status</p>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                {pieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            {pieData.map((d, i) => (
              <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i] }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{d.name}</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: COLORS[i] }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Class-wise Breakdown */}
      <div className="card">
        <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              Class-wise Recovery
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Collection performance per class</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.72rem' }}>
            {[['#10b981','Collected'],['rgba(255,255,255,0.1)','Outstanding']].map(([c,l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                <span style={{ color: 'var(--text-muted)' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {classBrk.map(cls => (
            <div key={cls.class_name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', minWidth: 90 }}>{cls.class_name}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatCurrency(cls.collected)} / {formatCurrency(cls.billed)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 6,
                    background: cls.recovery_pct >= 75 ? 'rgba(16,185,129,0.15)' : cls.recovery_pct >= 50 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                    color: cls.recovery_pct >= 75 ? '#10b981' : cls.recovery_pct >= 50 ? '#f59e0b' : '#ef4444',
                  }}>
                    {cls.recovery_pct}%
                  </span>
                </div>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${cls.recovery_pct}%`,
                    background: cls.recovery_pct >= 75 ? 'linear-gradient(90deg, #10b981, #059669)' :
                                cls.recovery_pct >= 50 ? 'linear-gradient(90deg, #f59e0b, #d97706)' :
                                                          'linear-gradient(90deg, #ef4444, #dc2626)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
