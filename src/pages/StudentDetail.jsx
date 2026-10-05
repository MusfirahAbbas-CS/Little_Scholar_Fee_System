import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft, Plus, Banknote, Calendar, FileText, X,
  CheckCircle2, AlertCircle, Clock, ArrowUpRight, Receipt,
  CreditCard, Landmark, Wallet, Download, Edit, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { studentsApi, feeSlipsApi, paymentsApi, classesApi, analyticsApi } from '../api/client';
import { formatCurrency, formatMonth, statusConfig, getInitials, getAvatarColor, printFeeSlip } from '../utils/helpers';
import ConfirmDialog from '../components/ConfirmDialog';
import EditSlipModal from '../components/EditSlipModal';

// ---- Payment Drawer ----
function PaymentDrawer({ slip, onClose, onSuccess }) {
  const [form, setForm] = useState({
    amount_paid: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    notes: '',
  });
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const outstanding = slip.total_amount - slip.paid_amount;

  const mutation = useMutation({
    mutationFn: () => paymentsApi.recordPayment(slip.id, {
      ...form,
      amount_paid: Number(form.amount_paid),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-slips'] });
      toast.success('Payment recorded!');
      onSuccess();
    },
    onError: e => setError(e.message),
  });

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.amount_paid || Number(form.amount_paid) <= 0) {
      setError('Enter a valid payment amount');
      return;
    }
    if (Number(form.amount_paid) > outstanding) {
      setError(`Cannot exceed outstanding balance of ${formatCurrency(outstanding)}`);
      return;
    }
    mutation.mutate();
  }

  const methods = [
    { value: 'cash', label: 'Cash', icon: Wallet },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: Landmark },
    { value: 'cheque', label: 'Cheque', icon: CreditCard },
  ];

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                Record Payment
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {formatMonth(slip.billing_month)}
              </div>
            </div>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        <div className="drawer-body">
          {/* Balance Summary */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(109,40,217,0.1))',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: 14, padding: '1.125rem', marginBottom: '1.5rem',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { label: 'Total Amount', value: formatCurrency(slip.total_amount), color: 'var(--text-primary)' },
                { label: 'Already Paid', value: formatCurrency(slip.paid_amount), color: '#10b981' },
                { label: 'Outstanding', value: formatCurrency(outstanding), color: '#ef4444' },
                { label: 'Prev. Arrears', value: formatCurrency(slip.previous_arrears), color: '#f59e0b' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.125rem' }}>{label}</div>
                  <div style={{ fontWeight: 700, color, fontSize: '0.95rem' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Amount */}
            <div className="form-group">
              <label className="form-label">Payment Amount (Rs.)</label>
              <div style={{ position: 'relative' }}>
                <Banknote size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  max={outstanding}
                  placeholder={`Max: ${outstanding}`}
                  style={{ paddingLeft: '2.25rem' }}
                  value={form.amount_paid}
                  onChange={e => setForm(f => ({ ...f, amount_paid: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.375rem' }}>
                {[0.5, 0.75, 1].map(pct => (
                  <button key={pct} type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                    onClick={() => setForm(f => ({ ...f, amount_paid: Math.floor(outstanding * pct) }))}
                  >
                    {pct === 1 ? 'Full' : `${pct * 100}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {methods.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, payment_method: value }))}
                    style={{
                      padding: '0.625rem',
                      borderRadius: 10,
                      border: `1px solid ${form.payment_method === value ? 'rgba(139,92,246,0.5)' : 'var(--border)'}`,
                      background: form.payment_method === value ? 'rgba(139,92,246,0.15)' : 'var(--bg-base)',
                      color: form.payment_method === value ? '#a78bfa' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      transition: 'all 0.15s',
                    }}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div className="form-group">
              <label className="form-label">Payment Date</label>
              <input
                className="form-input"
                type="date"
                value={form.payment_date}
                onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
              />
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="e.g. Paid by cheque No. 1234"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 10, padding: '0.625rem 0.875rem',
                color: '#f87171', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Processing...' : 'Record Payment'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

// ---- Fee Slip Card ----
function SlipCard({ slip, classes, onPayClick, onEditClick, onDeleteClick }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig(slip.status);
  const outstanding = slip.total_amount - slip.paid_amount;
  const paidPct = slip.total_amount > 0 ? Math.round((slip.paid_amount / slip.total_amount) * 100) : 0;

  const StatusIcon = slip.status === 'paid' ? CheckCircle2 : slip.status === 'partially_paid' ? Clock : AlertCircle;

  return (
    <div className="card" style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: `${cfg.bg}`, border: `1px solid ${cfg.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <StatusIcon size={20} className={cfg.text} style={{ color: cfg.text.replace('text-', '#') }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              {formatMonth(slip.billing_month)}
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              <span>Total: <strong style={{ color: 'var(--text-secondary)' }}>{formatCurrency(slip.total_amount)}</strong></span>
              {slip.previous_arrears > 0 && (
                <span style={{ color: '#f59e0b' }}>Arrears: {formatCurrency(slip.previous_arrears)}</span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={`badge ${cfg.bg} ${cfg.text}`} style={{ border: `1px solid ${cfg.border}` }}>
            <span className={`badge-dot ${cfg.dot}`} />
            {cfg.label}
          </span>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={e => { e.stopPropagation(); printFeeSlip(slip, classes); }}
            title="Download Fee Slip"
          >
            <Download size={15} />
          </button>
          {slip.status === 'unpaid' && (
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={e => { e.stopPropagation(); onEditClick(slip); }}
              title="Edit Slip"
            >
              <Edit size={15} />
            </button>
          )}
          {slip.status === 'unpaid' && (
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={e => { e.stopPropagation(); onDeleteClick(slip); }}
              title="Delete Slip"
              style={{ color: '#ef4444' }}
            >
              <Trash2 size={15} />
            </button>
          )}
          {slip.status !== 'paid' && (
            <button
              className="btn btn-primary btn-sm"
              onClick={e => { e.stopPropagation(); onPayClick(slip); }}
            >
              <Banknote size={13} /> Pay
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
          <span>Payment Progress</span>
          <span>{paidPct}% ({formatCurrency(slip.paid_amount)} / {formatCurrency(slip.total_amount)})</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${paidPct}%`,
              background: slip.status === 'paid' ? 'linear-gradient(90deg, #10b981, #059669)' :
                          slip.status === 'partially_paid' ? 'linear-gradient(90deg, #f59e0b, #d97706)' :
                          'linear-gradient(90deg, #ef4444, #dc2626)',
            }}
          />
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{
          marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)',
          animation: 'fadeIn 0.15s ease',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                Fee Breakdown
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Base Tuition</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(slip.tuition_amount)}</span>
                </div>
                {(slip.items || []).map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.title}</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                {slip.previous_arrears > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: '#f59e0b' }}>Previous Arrears</span>
                    <span style={{ fontWeight: 600, color: '#f59e0b' }}>{formatCurrency(slip.previous_arrears)}</span>
                  </div>
                )}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem',
                  paddingTop: '0.375rem', borderTop: '1px solid var(--border)', marginTop: '0.25rem',
                  fontWeight: 700,
                }}>
                  <span>Total</span>
                  <span>{formatCurrency(slip.total_amount)}</span>
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                Payment History
              </div>
              {(slip.payments || []).length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No payments yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {(slip.payments || []).map(p => (
                    <div key={p.id} style={{
                      display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem',
                      background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)',
                      borderRadius: 8, padding: '0.375rem 0.625rem',
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#10b981' }}>{formatCurrency(p.amount_paid)}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {p.payment_date} · {p.payment_method?.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentDetail() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [paySlip, setPaySlip] = useState(null);
  const [editSlip, setEditSlip] = useState(null);
  const [deleteSlip, setDeleteSlip] = useState(null);

  const { data: student } = useQuery({
    queryKey: ['student', studentId],
    queryFn: async () => {
      const all = await studentsApi.getAll();
      return all.find(s => s.id === studentId);
    },
  });

  const { data: allClasses = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: classesApi.getAll,
  });

  const { data: slips = [], isLoading } = useQuery({
    queryKey: ['student-slips', studentId],
    queryFn: () => feeSlipsApi.getByStudent(studentId),
  });

  const cls = allClasses.find(c => c.id === student?.class_id);
  const initials = student ? getInitials(student.first_name, student.last_name) : '';
  const avatarGrad = getAvatarColor(student?.first_name || '');

  const updateMutation = useMutation({
    mutationFn: (items) => feeSlipsApi.update(editSlip.id, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-slips', studentId] });
      toast.success('Slip updated!');
      setEditSlip(null);
    },
    onError: e => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => feeSlipsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-slips', studentId] });
      toast.success('Slip deleted!');
      setDeleteSlip(null);
    },
    onError: e => toast.error(e.message),
  });

  const totalBilled = slips.reduce((s, sl) => s + sl.total_amount, 0);
  const totalPaid = slips.reduce((s, sl) => s + sl.paid_amount, 0);
  const totalOutstanding = totalBilled - totalPaid;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}>
            <ChevronLeft size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className={`student-avatar bg-gradient-to-br ${avatarGrad}`} style={{ width: 52, height: 52, borderRadius: 14, fontSize: '1rem' }}>
              {initials}
            </div>
            <div>
              <h1 className="page-title" style={{ fontSize: '1.5rem' }}>
                {student ? `${student.first_name} ${student.last_name}` : 'Loading...'}
              </h1>
              <p className="page-subtitle">
                {student?.roll_number} · {cls ? `${cls.name} - Section ${cls.section}` : ''}
              </p>
            </div>
          </div>
        </div>
        {student && !student.is_active && (
          <span className="badge" style={{ background: 'rgba(100,116,139,0.2)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.3)' }}>
            Inactive
          </span>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Billed', value: formatCurrency(totalBilled), color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)' },
          { label: 'Total Paid', value: formatCurrency(totalPaid), color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
          { label: 'Outstanding', value: formatCurrency(totalOutstanding), color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.25rem' }}>{label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color, fontFamily: 'Plus Jakarta Sans' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Fee Slips */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
          Fee Slip History
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.72rem' }}>
          {[
            { label: 'Paid', count: slips.filter(s => s.status === 'paid').length, color: '#10b981' },
            { label: 'Partial', count: slips.filter(s => s.status === 'partially_paid').length, color: '#f59e0b' },
            { label: 'Unpaid', count: slips.filter(s => s.status === 'unpaid').length, color: '#ef4444' },
          ].map(({ label, count, color }) => (
            <span key={label} style={{
              background: `${color}1a`, color, border: `1px solid ${color}33`,
              borderRadius: 999, padding: '0.2rem 0.6rem', fontWeight: 600,
            }}>
              {count} {label}
            </span>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100 }} />)}
        </div>
      ) : slips.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon"><Receipt size={28} /></div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No Fee Slips</h3>
          <p style={{ fontSize: '0.875rem' }}>Generate fee slips from the Fee Slips page</p>
        </div>
      ) : (
        slips
          .sort((a, b) => b.billing_month.localeCompare(a.billing_month))
          .map(slip => (
            <SlipCard
              key={slip.id}
              slip={slip}
              classes={allClasses}
              onPayClick={setPaySlip}
              onEditClick={setEditSlip}
              onDeleteClick={setDeleteSlip}
            />
          ))
      )}

      {/* Payment Drawer */}
      {paySlip && (
        <PaymentDrawer
          slip={paySlip}
          onClose={() => setPaySlip(null)}
          onSuccess={() => setPaySlip(null)}
        />
      )}

      {editSlip && (
        <EditSlipModal
          slip={editSlip}
          onClose={() => setEditSlip(null)}
          onSave={(items) => updateMutation.mutate(items)}
        />
      )}

      {deleteSlip && (
        <ConfirmDialog
          title="Delete Fee Slip"
          message="Are you sure you want to delete this fee slip? This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={() => deleteMutation.mutate(deleteSlip.id)}
          onClose={() => setDeleteSlip(null)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
