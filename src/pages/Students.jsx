import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, UserCheck, UserX, Pencil, ChevronLeft,
  GraduationCap, X, Phone, Tag, ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { studentsApi, classesApi } from '../api/client';
import { formatCurrency, getInitials, getAvatarColor } from '../utils/helpers';
import ConfirmDialog from '../components/ConfirmDialog';

function StudentModal({ student, classId, classes, onClose, onSave }) {
  const [form, setForm] = useState({
    first_name: student?.first_name || '',
    last_name: student?.last_name || '',
    roll_number: student?.roll_number || '',
    guardian_name: student?.guardian_name || '',
    guardian_phone: student?.guardian_phone || '',
    class_id: student?.class_id || classId || '',
    custom_tuition_fee: student?.custom_tuition_fee || '',
  });
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'Required';
    if (!form.last_name.trim()) e.last_name = 'Required';
    if (!form.roll_number.trim()) e.roll_number = 'Required';
    if (!form.class_id) e.class_id = 'Required';
    if (form.custom_tuition_fee && Number(form.custom_tuition_fee) < 0) e.custom_tuition_fee = 'Must be ≥ 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    const data = {
      ...form,
      custom_tuition_fee: form.custom_tuition_fee ? Number(form.custom_tuition_fee) : null,
    };
    onSave(data);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{student ? 'Edit Student' : 'Enroll New Student'}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {student ? 'Update student profile' : 'Add a student to the class roster'}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input className="form-input" placeholder="e.g. Ayesha" value={form.first_name}
                  onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
                {errors.first_name && <span className="form-error">{errors.first_name}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className="form-input" placeholder="e.g. Khan" value={form.last_name}
                  onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
                {errors.last_name && <span className="form-error">{errors.last_name}</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Roll Number</label>
                <input className="form-input" placeholder="e.g. 1A-001" value={form.roll_number}
                  onChange={e => setForm(f => ({ ...f, roll_number: e.target.value }))} />
                {errors.roll_number && <span className="form-error">{errors.roll_number}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Class</label>
                <select className="form-select" value={form.class_id}
                  onChange={e => setForm(f => ({ ...f, class_id: e.target.value }))}>
                  <option value="">Select class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - Section {c.section}</option>
                  ))}
                </select>
                {errors.class_id && <span className="form-error">{errors.class_id}</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Guardian Name</label>
                <input className="form-input" placeholder="e.g. Tariq Khan" value={form.guardian_name}
                  onChange={e => setForm(f => ({ ...f, guardian_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Guardian Phone</label>
                <input className="form-input" placeholder="e.g. 0312-3456789" value={form.guardian_phone}
                  onChange={e => setForm(f => ({ ...f, guardian_phone: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Custom Tuition Fee (leave blank to use class default)</label>
              <input className="form-input" type="number" min="0" placeholder="e.g. 3000 (optional override)"
                value={form.custom_tuition_fee}
                onChange={e => setForm(f => ({ ...f, custom_tuition_fee: e.target.value }))} />
              {errors.custom_tuition_fee && <span className="form-error">{errors.custom_tuition_fee}</span>}
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Use for scholarships or discounted tuition rates
              </span>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {student ? 'Update Student' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Students() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: cls } = useQuery({
    queryKey: ['classes'],
    queryFn: classesApi.getAll,
    select: data => data.find(c => c.id === classId),
  });

  const { data: allClasses = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: classesApi.getAll,
  });

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students', classId],
    queryFn: () => studentsApi.getByClass(classId),
  });

  const createMutation = useMutation({
    mutationFn: studentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', classId] });
      toast.success('Student enrolled!');
      setShowModal(false);
    },
    onError: e => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => studentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', classId] });
      toast.success('Student updated!');
      setShowModal(false);
      setEditTarget(null);
    },
    onError: e => toast.error(e.message),
  });

  const deactivateMutation = useMutation({
    mutationFn: studentsApi.deactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', classId] });
      toast.success('Student deactivated');
      setDeactivateTarget(null);
    },
    onError: e => {
      toast.error(e.message);
      setDeactivateTarget(null);
    },
  });

  const activateMutation = useMutation({
    mutationFn: studentsApi.activate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', classId] });
      toast.success('Student reactivated');
    },
    onError: e => toast.error(e.message),
  });

  function handleSave(data) {
    if (editTarget) updateMutation.mutate({ id: editTarget.id, data });
    else createMutation.mutate(data);
  }

  const filtered = students
    .filter(s => statusFilter === 'all' || (statusFilter === 'active' ? s.is_active : !s.is_active))
    .filter(s => {
      const q = search.toLowerCase();
      return `${s.first_name} ${s.last_name} ${s.roll_number}`.toLowerCase().includes(q);
    });

  const activeCount = students.filter(s => s.is_active).length;
  const inactiveCount = students.filter(s => !s.is_active).length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/classes')}>
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">
              {cls ? `${cls.name} — Section ${cls.section}` : 'Student Roster'}
            </h1>
            <p className="page-subtitle">
              {cls ? `Base Fee: ${formatCurrency(cls.base_tuition_fee)} / month` : ''} &nbsp;·&nbsp;
              {activeCount} active, {inactiveCount} inactive
            </p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTarget(null); setShowModal(true); }}>
          <Plus size={16} /> Enroll Student
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="search-input-wrapper" style={{ flex: 1, minWidth: 220, maxWidth: 380 }}>
          <Search className="search-icon" size={15} />
          <input
            className="form-input search-input"
            placeholder="Search by name or roll number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'active', 'inactive'].map(f => (
            <button
              key={f}
              className={`btn btn-sm ${statusFilter === f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStatusFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'active' && <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 999, padding: '0 6px', marginLeft: 4, fontSize: '0.7rem' }}>{activeCount}</span>}
              {f === 'inactive' && <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 999, padding: '0 6px', marginLeft: 4, fontSize: '0.7rem' }}>{inactiveCount}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 60 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon"><GraduationCap size={28} /></div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No Students Found</h3>
          <p style={{ fontSize: '0.875rem' }}>
            {search ? 'Try a different search term' : 'Enroll the first student to get started'}
          </p>
          {!search && (
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowModal(true)}>
              <Plus size={16} /> Enroll Student
            </button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll No.</th>
                <th>Guardian</th>
                <th>Monthly Fee</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(student => {
                const initials = getInitials(student.first_name, student.last_name);
                const avatarGrad = getAvatarColor(student.first_name);
                const fee = student.custom_tuition_fee || cls?.base_tuition_fee;

                return (
                  <tr key={student.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className={`student-avatar bg-gradient-to-br ${avatarGrad}`}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {student.first_name} {student.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontFamily: 'monospace', fontSize: '0.8rem',
                        background: 'rgba(30,58,138,0.08)', color: '#1e3a8a',
                        padding: '0.2rem 0.5rem', borderRadius: 6,
                        border: '1px solid rgba(30,58,138,0.15)',
                      }}>
                        {student.roll_number}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem' }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{student.guardian_name || '—'}</div>
                        {student.guardian_phone && (
                          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.125rem' }}>
                            <Phone size={11} /> {student.guardian_phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600 }}>{formatCurrency(fee)}</div>
                        {student.custom_tuition_fee && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: '#f59e0b', marginTop: '0.125rem' }}>
                            <Tag size={10} /> Custom Rate
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${student.is_active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                        <span className={`badge-dot ${student.is_active ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                        {student.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button className="btn btn-ghost btn-icon btn-sm" title="View fee slips"
                          onClick={() => navigate(`/students/${student.id}`)}>
                          <ArrowRight size={14} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Edit"
                          onClick={() => { setEditTarget(student); setShowModal(true); }}>
                          <Pencil size={14} />
                        </button>
                        {student.is_active ? (
                          <button className="btn btn-danger btn-icon btn-sm" title="Deactivate"
                            onClick={() => setDeactivateTarget(student)}>
                            <UserX size={14} />
                          </button>
                        ) : (
                          <button className="btn btn-secondary btn-icon btn-sm" title="Reactivate"
                            onClick={() => activateMutation.mutate(student.id)}>
                            <UserCheck size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <StudentModal
          student={editTarget}
          classId={classId}
          classes={allClasses}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSave={handleSave}
        />
      )}

      {deactivateTarget && (
        <ConfirmDialog
          isOpen={true}
          title="Deactivate Student?"
          message={`Are you sure you want to deactivate ${deactivateTarget.first_name} ${deactivateTarget.last_name}? Their status will be set to inactive.`}
          confirmLabel="Deactivate Student"
          confirmVariant="danger"
          loading={deactivateMutation.isPending}
          onConfirm={() => deactivateMutation.mutate(deactivateTarget.id)}
          onCancel={() => setDeactivateTarget(null)}
        />
      )}
    </div>
  );
}
