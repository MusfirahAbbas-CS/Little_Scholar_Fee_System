import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { formatMonth } from '../utils/helpers';

export default function EditSlipModal({ slip, onClose, onSave }) {
  const [items, setItems] = useState(slip.items || []);
  const [error, setError] = useState('');

  function addItem() { setItems(prev => [...prev, { title: '', amount: '' }]); }
  function removeItem(idx) { setItems(prev => prev.filter((_, i) => i !== idx)); }
  function updateItem(idx, field, value) { setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it)); }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const validItems = items.filter(it => it.title.trim() && it.amount);
    onSave(validItems);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Edit Fee Slip</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Modify miscellaneous charges for {formatMonth(slip.billing_month)}
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Miscellaneous Charges</label>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addItem}>
                <Plus size={14} /> Add Item
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.5rem', alignItems: 'center' }}>
                  <input className="form-input" placeholder="e.g. Lab Fee" value={item.title} onChange={e => updateItem(idx, 'title', e.target.value)} />
                  <input className="form-input" type="number" min="0" placeholder="Amount" style={{ width: 120 }} value={item.amount} onChange={e => updateItem(idx, 'amount', e.target.value)} />
                  <button type="button" className="btn btn-danger btn-icon btn-sm" onClick={() => removeItem(idx)}><X size={14} /></button>
                </div>
              ))}
            </div>
            {error && <div style={{ marginTop: 10, color: '#f87171', fontSize: '0.8rem' }}>{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
