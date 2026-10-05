import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, ChevronRight } from 'lucide-react';

function getBreadcrumb(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  const crumbs = [];

  if (parts[0] === 'dashboard') crumbs.push({ label: 'Dashboard', to: '/dashboard' });
  else if (parts[0] === 'classes') {
    crumbs.push({ label: 'Classes', to: '/classes' });
    if (parts[1] && parts[2] === 'students') crumbs.push({ label: 'Students', to: null });
  }
  else if (parts[0] === 'students') {
    crumbs.push({ label: 'Students', to: null });
    if (parts[1]) crumbs.push({ label: 'Student Detail', to: null });
  }
  else if (parts[0] === 'fee-slips') crumbs.push({ label: 'Fee Slips', to: '/fee-slips' });
  else if (parts[0] === 'reports')   crumbs.push({ label: 'Reports & Analytics', to: '/reports' });

  return crumbs;
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export default function Topbar() {
  const location = useLocation();
  const crumbs = getBreadcrumb(location.pathname);

  return (
    <header className="topbar">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Home</span>
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
            <span style={{
              fontSize: '0.8rem',
              color: c.to ? 'var(--text-secondary)' : 'var(--text-primary)',
              fontWeight: c.to ? 400 : 600,
            }}>
              {c.label}
            </span>
          </span>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{formatDate()}</span>
        </div>

        <button className="btn btn-ghost btn-icon" style={{ position: 'relative' }}>
          <Bell size={18} />
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 8, height: 8, borderRadius: '50%',
            background: '#8b5cf6',
            border: '2px solid var(--bg-surface)',
          }} />
        </button>

        {/* Admin Avatar */}
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'white', fontWeight: 700, fontSize: '0.8rem',
        }}>
          AD
        </div>
      </div>
    </header>
  );
}
