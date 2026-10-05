import { AlertTriangle, Trash2, X } from 'lucide-react';

/**
 * Reusable confirmation dialog.
 *
 * Props:
 *  - title       string  — Dialog heading
 *  - message     string  — Body text
 *  - confirmLabel string — Label for the confirm button (default "Delete")
 *  - variant     'danger' | 'warning'  (default 'danger')
 *  - onConfirm   () => void
 *  - onClose     () => void
 *  - isLoading   bool    — Shows spinner & disables button while mutation runs
 */
export default function ConfirmDialog({
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  variant = 'danger',
  onConfirm,
  onClose,
  isLoading = false,
}) {
  const isDanger = variant === 'danger';

  const colors = isDanger
    ? {
        iconBg: 'rgba(239,68,68,0.12)',
        iconColor: '#ef4444',
        btn: 'linear-gradient(135deg, #ef4444, #dc2626)',
        btnShadow: 'rgba(239,68,68,0.35)',
        btnHover: 'linear-gradient(135deg, #f87171, #ef4444)',
        border: 'rgba(239,68,68,0.2)',
      }
    : {
        iconBg: 'rgba(245,158,11,0.12)',
        iconColor: '#f59e0b',
        btn: 'linear-gradient(135deg, #f59e0b, #d97706)',
        btnShadow: 'rgba(245,158,11,0.35)',
        btnHover: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
        border: 'rgba(245,158,11,0.2)',
      };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 200 }}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 420 }}
      >
        {/* Header */}
        <div className="modal-header" style={{ border: 'none', paddingBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            {/* Icon */}
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: colors.iconBg,
              border: `1px solid ${colors.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={22} color={colors.iconColor} />
            </div>
            <div className="modal-title">{title}</div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} disabled={isLoading}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ paddingTop: '0.5rem', paddingBottom: '0.25rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            className="btn btn-ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            disabled={isLoading}
            onClick={onConfirm}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
              padding: '0.6rem 1.25rem', borderRadius: 10,
              fontSize: '0.875rem', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer',
              border: 'none', color: 'white',
              background: isLoading ? 'rgba(239,68,68,0.4)' : colors.btn,
              boxShadow: `0 4px 15px ${colors.btnShadow}`,
              transition: 'all 0.2s ease',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <>
                <span style={{
                  width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)',
                  borderTopColor: 'white', borderRadius: '50%',
                  display: 'inline-block', animation: 'spin 0.7s linear infinite',
                }} />
                Processing…
              </>
            ) : (
              <>
                <Trash2 size={14} />
                {confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Spin keyframe (injected once) */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
