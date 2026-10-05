import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, FileText, BarChart3,
  GraduationCap, ChevronRight, Sparkles
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Classes',   icon: Building2,       to: '/classes' },
  { label: 'Fee Slips', icon: FileText,         to: '/fee-slips' },
  { label: 'Reports',   icon: BarChart3,        to: '/reports' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(139,92,246,0.4)',
            flexShrink: 0,
          }}>
            <GraduationCap size={20} color="white" />
          </div>
          <div>
            <div className="sidebar-logo-text">Little Scholar</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '-2px' }}>
              Fee Management System
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Main Menu</div>
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon className="nav-icon" />
            <span style={{ flex: 1 }}>{label}</span>
            <ChevronRight size={14} style={{ opacity: 0.4 }} />
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid var(--border)',
        margin: '0 0.75rem 0.75rem',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(109,40,217,0.1))',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 12,
          padding: '0.875rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
            <Sparkles size={14} color="#a78bfa" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a78bfa' }}>Academic Year</span>
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>2026 – 2027</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
            Session Active
          </div>
        </div>
      </div>
    </aside>
  );
}
