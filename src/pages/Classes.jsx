import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, BookOpen, Pencil, Trash2, ChevronRight, GraduationCap, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { classesApi } from '../api/client';
import { formatCurrency } from '../utils/helpers';
import ConfirmDialog from '../components/ConfirmDialog';

function ClassModal({ cls, onClose, onSave }) {
  const [form, setForm] = useState({
    name: cls?.name || '',
    section: cls?.section || '',
    base_tuition_fee: cls?.base_tuition_fee || '',
  });
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Class name is required';
    if (!form.section.trim()) e.section = 'Section is required';
    if (!form.base_tuition_fee || Number(form.base_tuition_fee) <= 0) e.base_tuition_fee = 'Fee must be greater than 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSave({ ...form, base_tuition_fee: Number(form.base_tuition_fee) });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{cls ? 'Edit Class' : 'Create New Class'}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {cls ? 'Update class details' : 'Add a new class to the system'}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Class Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Class 1, Nursery"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Section</label>
                <input
                  className="form-input"
                  placeholder="e.g. A, B, C"
                  value={form.section}
                  onChange={e => setForm(f => ({ ...f, section: e.target.value }))}
                />
                {errors.section && <span className="form-error">{errors.section}</span>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Base Monthly Tuition Fee (Rs.)</label>
              <input
                className="form-input"
                type="number"
                min="0"
                placeholder="e.g. 5000"
                value={form.base_tuition_fee}
                onChange={e => setForm(f => ({ ...f, base_tuition_fee: e.target.value }))}
              />
              {errors.base_tuition_fee && <span className="form-error">{errors.base_tuition_fee}</span>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {cls ? 'Update Class' : 'Create Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Classes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // class pending confirmation

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: classesApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: classesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class created successfully!');
      setShowModal(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => classesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class updated!');
      setShowModal(false);
      setEditTarget(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: classesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class removed successfully');
      setDeleteTarget(null);
    },
    onError: (e) => {
      toast.error(e.message);
      setDeleteTarget(null);
    },
  });

  function handleSave(data) {
    if (editTarget) updateMutation.mutate({ id: editTarget.id, data });
    else createMutation.mutate(data);
  }

  // Group by class name
  const grouped = classes.reduce((acc, cls) => {
    if (!acc[cls.name]) acc[cls.name] = [];
    acc[cls.name].push(cls);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Classes & Rosters</h1>
          <p className="page-subtitle">Manage class sections and navigate to student rosters</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTarget(null); setShowModal(true); }}>
          <Plus size={16} /> New Class
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 160 }} />)}
        </div>
      ) : classes.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon"><GraduationCap size={28} /></div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No Classes Yet</h3>
          <p style={{ fontSize: '0.875rem' }}>Create your first class to get started</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowModal(true)}>
            <Plus size={16} /> Create Class
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {Object.entries(grouped).map(([name, sections]) => (
            <div key={name}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'linear-gradient(135deg, rgba(30,58,138,0.15), rgba(26,35,126,0.08))',
                  border: '1px solid rgba(30,58,138,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <BookOpen size={16} color="#1e3a8a" />
                </div>
                <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  {name}
                </h2>
                <span style={{
                  background: 'rgba(30,58,138,0.08)', color: '#1e3a8a',
                  borderRadius: 999, padding: '0.125rem 0.625rem',
                  fontSize: '0.7rem', fontWeight: 600, border: '1px solid rgba(30,58,138,0.2)',
                }}>
                  {sections.length} section{sections.length > 1 ? 's' : ''}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {sections.map(cls => (
                  <div key={cls.id} className="card" style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                    onClick={() => navigate(`/classes/${cls.id}/students`)}
                  >
                    {/* Gradient orb */}
                    <div style={{
                      position: 'absolute', top: -30, right: -30, width: 120, height: 120,
                      borderRadius: '50%', background: 'rgba(30,58,138,0.06)',
                      pointerEvents: 'none',
                    }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 15px rgba(30,58,138,0.3)',
                      }}>
                        <GraduationCap size={22} color="white" />
                      </div>
                      <div style={{ display: 'flex', gap: '0.375rem' }} onClick={e => e.stopPropagation()}>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => { setEditTarget(cls); setShowModal(true); }}
                        ><Pencil size={14} /></button>
                        <button
                          className="btn btn-danger btn-icon btn-sm"
                          onClick={() => setDeleteTarget(cls)}
                          title="Delete class"
                        ><Trash2 size={14} /></button>
                      </div>
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                        {cls.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                        Section {cls.section}
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(30,58,138,0.06)', borderRadius: 10,
                      padding: '0.625rem 0.875rem', marginBottom: '1rem',
                      border: '1px solid rgba(30,58,138,0.1)',
                    }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>Base Monthly Fee</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e3a8a', fontFamily: 'Plus Jakarta Sans' }}>
                        {formatCurrency(cls.base_tuition_fee)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        <Users size={14} />
                        <span>View Students</span>
                      </div>
                      <ChevronRight size={16} color="var(--text-muted)" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ClassModal
          cls={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={`Delete "${deleteTarget.name} — Section ${deleteTarget.section}"?`}
          message="This will permanently remove the class. Students in this class will lose their class association. This action cannot be undone."
          confirmLabel="Delete Class"
          variant="danger"
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
