import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Calendar, Filter, X, ChevronDown,
  FileText, Zap, Users, AlertCircle, CheckCircle2,
  Clock, Banknote, Eye, Download, Edit, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { feeSlipsApi, classesApi, studentsApi, paymentsApi, analyticsApi } from '../api/client';
import { formatCurrency, formatMonth, statusConfig, getInitials, getAvatarColor, shortMonthLabel, printFeeSlip } from '../utils/helpers';
import ConfirmDialog from '../components/ConfirmDialog';
import EditSlipModal from '../components/EditSlipModal';

// ---- Generate Slip Modal ----
function GenerateModal({ classes, onClose, onGenerate }) {
  const [mode, setMode] = useState('single'); // 'single' | 'batch'
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().slice(0, 7));
  const [items, setItems] = useState([{ title: '', amount: '' }]);
  const [error, setError] = useState('');

  const { data: students = [] } = useQuery({
    queryKey: ['students', selectedClass],
    queryFn: () => selectedClass ? studentsApi.getByClass(selectedClass) : Promise.resolve([]),
    enabled: !!selectedClass,
  });

  function addItem() {
    setItems(prev => [...prev, { title: '', amount: '' }]);
  }

  function removeItem(idx) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx, field, value) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!billingMonth) { setError('Select a billing month'); return; }
    if (mode === 'single' && !selectedStudent) { setError('Select a student'); return; }
    if (mode === 'batch' && !selectedClass) { setError('Select a class'); return; }

    const validItems = items.filter(it => it.title.trim() && it.amount);
    onGenerate({ mode, selectedClass, selectedStudent, billingMonth, items: validItems });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Generate Fee Slips</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Create monthly fee invoices with dynamic charges
            </div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Mode Toggle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
              {[
                { value: 'single', label: 'Single Student', icon: FileText, desc: 'For one student' },
                { value: 'batch', label: 'Batch — Entire Class', icon: Users, desc: 'For all active students' },
              ].map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  style={{
                    padding: '0.875rem',
                    borderRadius: 12,
                    border: `1px solid ${mode === value ? 'rgba(139,92,246,0.5)' : 'var(--border)'}`,
                    background: mode === value ? 'rgba(139,92,246,0.12)' : 'var(--bg-base)',
                    color: mode === value ? '#a78bfa' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    textAlign: 'left', transition: 'all 0.15s',
                  }}
                >
                  <Icon size={18} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{label}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>{desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Class selector */}
            <div className="form-group">
              <label className="form-label">Class</label>
              <select className="form-select" value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedStudent(''); }}>
                <option value="">Select class...</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} — Section {c.section}</option>
                ))}
              </select>
            </div>

            {/* Student selector (single mode) */}
            {mode === 'single' && (
              <div className="form-group">
                <label className="form-label">Student</label>
                <select className="form-select" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
                  disabled={!selectedClass}>
                  <option value="">Select student...</option>
                  {students.filter(s => s.is_active).map(s => (
                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.roll_number})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Billing Month */}
            <div className="form-group">
              <label className="form-label">Billing Month</label>
              <input className="form-input" type="month" value={billingMonth}
                onChange={e => setBillingMonth(e.target.value)} />
            </div>

            {/* Misc Items */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Miscellaneous Charges (optional)</label>
                <button type="button" className="btn btn-ghost btn-sm" onClick={addItem}>
                  <Plus size={14} /> Add Item
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {items.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      className="form-input"
                      placeholder="e.g. Lab Fee, Sports Fee"
                      value={item.title}
                      onChange={e => updateItem(idx, 'title', e.target.value)}
                    />
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      placeholder="Amount"
                      style={{ width: 120 }}
                      value={item.amount}
                      onChange={e => updateItem(idx, 'amount', e.target.value)}
                    />
                    <button type="button" className="btn btn-danger btn-icon btn-sm" onClick={() => removeItem(idx)}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '0.625rem 0.875rem', color: '#f87171', fontSize: '0.8rem' }}>
                {error}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {mode === 'batch' ? <><Zap size={15} /> Generate for Class</> : <><FileText size={15} /> Generate Slip</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Slip Row ----
function SlipRow({ slip, classes, onPayClick, onEditClick, onDeleteClick, onViewStudent }) {
  const cfg = statusConfig(slip.status);
  const outstanding = slip.total_amount - slip.paid_amount;
  const initials = slip.student ? getInitials(slip.student.first_name, slip.student.last_name) : '??';
  const grad = getAvatarColor(slip.student?.first_name || '');

  return (
    <tr>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className={`student-avatar bg-gradient-to-br ${grad}`}>{initials}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
              {slip.student ? `${slip.student.first_name} ${slip.student.last_name}` : slip.student_id}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{slip.student?.roll_number}</div>
          </div>
        </div>
      </td>
      <td><span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{formatMonth(slip.billing_month)}</span></td>
      <td><span style={{ fontWeight: 600 }}>{formatCurrency(slip.total_amount)}</span></td>
      <td>
        {slip.previous_arrears > 0
          ? <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.85rem' }}>{formatCurrency(slip.previous_arrears)}</span>
          : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
        }
      </td>
      <td>
        {slip.status !== 'unpaid'
          ? <span style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(slip.paid_amount)}</span>
          : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
        }
      </td>
      <td>
        <span className={`badge ${cfg.bg} ${cfg.text}`} style={{ border: `1px solid ${cfg.border}` }}>
          <span className={`badge-dot ${cfg.dot}`} />
          {cfg.label}
        </span>
      </td>
      <td>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.375rem' }}>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => printFeeSlip(slip, classes)} title="Download Fee Slip">
            <Download size={14} />
          </button>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onViewStudent} title="View student">
            <Eye size={14} />
          </button>
          {slip.status === 'unpaid' && (
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onEditClick(slip)} title="Edit Slip">
              <Edit size={14} />
            </button>
          )}
          {slip.status === 'unpaid' && (
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onDeleteClick(slip)} title="Delete Slip" style={{ color: '#ef4444' }}>
              <Trash2 size={14} />
            </button>
          )}
          {slip.status !== 'paid' && (
            <button className="btn btn-primary btn-sm" onClick={() => onPayClick(slip)}>
              <Banknote size={13} /> Pay
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ---- Payment Drawer (inline) ----
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
    mutationFn: () => paymentsApi.recordPayment(slip.id, { ...form, amount_paid: Number(form.amount_paid) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-slips'] });
      toast.success('Payment recorded!');
      onSuccess();
    },
    onError: e => setError(e.message),
  });

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '1.05rem' }}>Record Payment</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {slip.student ? `${slip.student.first_name} ${slip.student.last_name}` : ''} · {formatMonth(slip.billing_month)}
              </div>
            </div>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
          </div>
        </div>
        <div className="drawer-body">
          <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, padding: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { l: 'Total', v: formatCurrency(slip.total_amount), c: 'var(--text-primary)' },
                { l: 'Paid', v: formatCurrency(slip.paid_amount), c: '#10b981' },
                { l: 'Outstanding', v: formatCurrency(outstanding), c: '#ef4444' },
                { l: 'Arrears', v: formatCurrency(slip.previous_arrears), c: '#f59e0b' },
              ].map(({ l, v, c }) => (
                <div key={l}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{l}</div>
                  <div style={{ fontWeight: 700, color: c }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Amount (Rs.)</label>
              <input className="form-input" type="number" min="1" max={outstanding}
                placeholder={`Max: ${outstanding}`} value={form.amount_paid}
                onChange={e => setForm(f => ({ ...f, amount_paid: e.target.value }))} />
              <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.375rem' }}>
                {[0.5, 0.75, 1].map(pct => (
                  <button key={pct} type="button" className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.7rem' }}
                    onClick={() => setForm(f => ({ ...f, amount_paid: Math.floor(outstanding * pct) }))}>
                    {pct === 1 ? 'Full' : `${pct * 100}%`}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Method</label>
              <select className="form-select" value={form.payment_method}
                onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-input" type="date" value={form.payment_date}
                onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" rows={2} value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes..." />
            </div>
            {error && <div style={{ color: '#f87171', fontSize: '0.8rem', background: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: '0.5rem 0.75rem' }}>{error}</div>}
            <button className="btn btn-primary" disabled={mutation.isPending}
              onClick={() => mutation.mutate()}>
              {mutation.isPending ? 'Processing...' : 'Record Payment'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function FeeSlips() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showGenModal, setShowGenModal] = useState(false);
  const [paySlip, setPaySlip] = useState(null);
  const [editSlip, setEditSlip] = useState(null);
  const [deleteSlip, setDeleteSlip] = useState(null);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: classesApi.getAll });
  const { data: months = [] } = useQuery({ queryKey: ['months'], queryFn: analyticsApi.getAvailableMonths });

  const { data: slips = [], isLoading } = useQuery({
    queryKey: ['fee-slips', filterMonth],
    queryFn: () => feeSlipsApi.getAll(filterMonth || null),
  });

  const generateMutation = useMutation({
    mutationFn: async ({ mode, selectedClass, selectedStudent, billingMonth, items }) => {
      if (mode === 'batch') return feeSlipsApi.generateBatch(selectedClass, billingMonth, items);
      return feeSlipsApi.generate(selectedStudent, billingMonth, items);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['fee-slips'] });
      if (Array.isArray(result)) {
        const ok = result.filter(r => r.success).length;
        const fail = result.filter(r => !r.success).length;
        toast.success(`Generated ${ok} slips${fail > 0 ? `, ${fail} skipped (duplicates)` : ''}`);
      } else {
        toast.success('Fee slip generated!');
      }
      setShowGenModal(false);
    },
    onError: e => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (items) => feeSlipsApi.update(editSlip.id, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-slips'] });
      toast.success('Slip updated!');
      setEditSlip(null);
    },
    onError: e => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => feeSlipsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-slips'] });
      toast.success('Slip deleted!');
      setDeleteSlip(null);
    },
    onError: e => toast.error(e.message),
  });

  const filtered = slips.filter(sl => {
    const q = search.toLowerCase();
    const nameMatch = sl.student
      ? `${sl.student.first_name} ${sl.student.last_name} ${sl.student.roll_number}`.toLowerCase().includes(q)
      : true;
    const statusMatch = !filterStatus || sl.status === filterStatus;
    return nameMatch && statusMatch;
  });

  const statusCounts = {
    paid: slips.filter(s => s.status === 'paid').length,
    partially_paid: slips.filter(s => s.status === 'partially_paid').length,
    unpaid: slips.filter(s => s.status === 'unpaid').length,
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Fee Slips</h1>
          <p className="page-subtitle">Generate, view, and collect monthly fee invoices</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowGenModal(true)}>
          <Plus size={16} /> Generate Slips
        </button>
      </div>

      {/* Summary Pills */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { key: '', label: 'All', count: slips.length, color: '#8b5cf6' },
          { key: 'paid', label: 'Paid', count: statusCounts.paid, color: '#10b981' },
          { key: 'partially_paid', label: 'Partial', count: statusCounts.partially_paid, color: '#f59e0b' },
          { key: 'unpaid', label: 'Unpaid', count: statusCounts.unpaid, color: '#ef4444' },
        ].map(({ key, label, count, color }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1rem', borderRadius: 999, cursor: 'pointer',
              border: `1px solid ${filterStatus === key ? color + '66' : 'var(--border)'}`,
              background: filterStatus === key ? color + '1a' : 'var(--bg-card)',
              color: filterStatus === key ? color : 'var(--text-secondary)',
              fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s',
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
            {label}
            <span style={{ background: color + '33', color, borderRadius: 999, padding: '0 6px', fontSize: '0.7rem' }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="search-input-wrapper" style={{ flex: 1, minWidth: 220, maxWidth: 360 }}>
          <Search className="search-icon" size={15} />
          <input className="form-input search-input" placeholder="Search student..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ position: 'relative' }}>
          <Calendar size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <select className="form-select" style={{ paddingLeft: '2rem', width: 180 }} value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}>
            <option value="">All Months</option>
            {months.map(m => <option key={m} value={m}>{shortMonthLabel(m)}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 60 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon"><FileText size={28} /></div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No Fee Slips Found</h3>
          <p style={{ fontSize: '0.875rem' }}>Generate fee slips or adjust your filters</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Billing Month</th>
                <th>Total Amount</th>
                <th>Arrears</th>
                <th>Paid</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(slip => (
                <SlipRow
                  key={slip.id}
                  slip={slip}
                  classes={classes}
                  onPayClick={setPaySlip}
                  onEditClick={setEditSlip}
                  onDeleteClick={setDeleteSlip}
                  onViewStudent={() => navigate(`/students/${slip.student_id}`)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showGenModal && (
        <GenerateModal
          classes={classes}
          onClose={() => setShowGenModal(false)}
          onGenerate={(data) => generateMutation.mutate(data)}
        />
      )}

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
