import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { PageLoader } from '../../components/common';

const STAGES    = ['Qualification','Proposal','Negotiation','Won','Lost'];
const STATUSES  = ['Open','Closed','OnHold'];
const tomorrow  = () => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; };
const today = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().split('T')[0];
};

export default function OpportunityForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({ opportunityName:'', customer:'', amount:'', stage:'Qualification', status:'Open', probability:50, expectedCloseDate:tomorrow(), description:'' });
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(isEdit);
  const [saving, setSaving]       = useState(false);
  const [errors, setErrors]       = useState({});

  useEffect(() => {
    api.get('/customers?limit=200').then(r => setCustomers(r.data.data)).catch(() => {});
    if (isEdit) {
      api.get(`/opportunities/${id}`).then(r => {
        const o = r.data.data;
        setForm({ opportunityName: o.opportunityName, customer: o.customer?._id || '', amount: o.amount, stage: o.stage, status: o.status, probability: o.probability, expectedCloseDate: o.expectedCloseDate?.split('T')[0] || tomorrow(), description: o.description || '' });
      }).catch(() => toast.error('Failed to load.')).finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const validate = () => {
    const e = {};
    if (!form.opportunityName.trim()) e.opportunityName = 'Name is required.';
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Amount must be > 0.';
    if (!form.expectedCloseDate) e.expectedCloseDate = 'Date is required.';
    else if (form.expectedCloseDate < today()) e.expectedCloseDate = 'Date cannot be in the past.';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount), probability: Number(form.probability) };
      if (!payload.customer) delete payload.customer;
      if (isEdit) { await api.put(`/opportunities/${id}`, payload); toast.success('Updated!'); }
      else        { await api.post('/opportunities', payload);       toast.success('Created!'); }
      navigate('/opportunities');
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed.'); }
    finally { setSaving(false); }
  };

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]:'' })); };

  if (loading) return <PageLoader />;

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit Opportunity' : 'New Opportunity'}</h1>
          <nav style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:4 }}>
            <span style={{ cursor:'pointer', color:'var(--accent-blue)' }} onClick={() => navigate('/opportunities')}>Opportunities</span>
            {' / '}{isEdit ? 'Edit' : 'Create'}
          </nav>
        </div>
      </div>
      <div className="card" style={{ maxWidth:760 }}>
        <div className="card-header">Opportunity Details</div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Opportunity Name *</label>
              <input className="form-control" placeholder="e.g. Acme ERP Deal" value={form.opportunityName} onChange={e => set('opportunityName', e.target.value)} />
              {errors.opportunityName && <div className="form-error">{errors.opportunityName}</div>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Customer</label>
                <select className="form-control" value={form.customer} onChange={e => set('customer', e.target.value)}>
                  <option value="">(No customer yet)</option>
                  {customers.map(c => <option key={c._id} value={c._id}>{c.customerName}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input className="form-control" type="number" min="0.01" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} />
                {errors.amount && <div className="form-error">{errors.amount}</div>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Stage</label>
                <select className="form-control" value={form.stage} onChange={e => set('stage', e.target.value)}>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Probability: {form.probability}%</label>
                <input type="range" min="0" max="100" value={form.probability} onChange={e => set('probability', e.target.value)}
                  style={{ width:'100%', marginTop:8, accentColor:'var(--accent-blue)' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Expected Close Date *</label>
                <input className="form-control" type="date" value={form.expectedCloseDate} min={today()} onChange={e => set('expectedCloseDate', e.target.value)} />
                {errors.expectedCloseDate && <div className="form-error">{errors.expectedCloseDate}</div>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? <span className="spinner" /> : (isEdit ? 'Update' : 'Create Opportunity')}
              </button>
              <button className="btn btn-outline" type="button" onClick={() => navigate('/opportunities')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
