import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { PageLoader, fmt } from '../../components/common';

const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; };

export default function ConvertLead() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [form, setForm] = useState({ customerName:'', customerCode:'', city:'', state:'', opportunityName:'', amount:'', probability:50, expectedCloseDate: tomorrow() });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    api.get(`/leads/${id}`).then(r => {
      const l = r.data.data;
      setLead(l);
      setForm(f => ({
        ...f,
        customerName: l.leadName,
        customerCode: `CUS-${Date.now().toString().slice(-4)}`,
        opportunityName: `${l.leadName} - Opportunity`,
        amount: l.expectedValue || '',
      }));
    }).catch(() => toast.error('Lead not found.')).finally(() => setLoading(false));
  }, [id]);

  const validate = () => {
    const e = {};
    if (!form.customerName.trim()) e.customerName = 'Customer name is required.';
    if (!form.customerCode.trim()) e.customerCode = 'Customer code is required.';
    if (!form.opportunityName.trim()) e.opportunityName = 'Opportunity name is required.';
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Amount must be greater than 0.';
    if (!form.expectedCloseDate) e.expectedCloseDate = 'Close date is required.';
    else if (new Date(form.expectedCloseDate) < new Date(new Date().toDateString())) e.expectedCloseDate = 'Date cannot be in the past.';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await api.post(`/leads/${id}/convert`, { ...form, amount: Number(form.amount), probability: Number(form.probability) });
      toast.success('Lead successfully converted to Customer & Opportunity!');
      navigate('/customers');
    } catch (err) { toast.error(err.response?.data?.message || 'Conversion failed.'); }
    finally { setSaving(false); }
  };

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  if (loading) return <PageLoader />;
  if (!lead)   return <div className="text-danger">Lead not found.</div>;

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1>Convert Lead</h1>
          <nav style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:4 }}>
            <span style={{ cursor:'pointer', color:'var(--accent-blue)' }} onClick={() => navigate('/leads')}>Leads</span>
            {' / Convert'}
          </nav>
        </div>
      </div>

      {/* Lead summary */}
      <div className="card" style={{ marginBottom:20, borderColor:'var(--accent-orange)' }}>
        <div className="card-header" style={{ background:'rgba(245,158,11,0.06)' }}>
          ⚡ Converting: <strong style={{ color:'var(--accent-orange)', marginLeft:8 }}>{lead.leadName}</strong>
        </div>
        <div className="card-body" style={{ display:'flex', gap:40, flexWrap:'wrap', fontSize:'0.875rem', color:'var(--text-muted)' }}>
          <span>📧 {lead.email}</span><span>📞 {lead.phone}</span>
          <span>🏢 {lead.companyName || '—'}</span><span>💰 {fmt(lead.expectedValue)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          {/* New Customer */}
          <div className="card">
            <div className="card-header" style={{ color:'var(--accent-blue)' }}>👤 New Customer Record</div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Customer Code *</label>
                <input className="form-control" value={form.customerCode} onChange={e => set('customerCode', e.target.value)} />
                {errors.customerCode && <div className="form-error">{errors.customerCode}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Customer Name *</label>
                <input className="form-control" value={form.customerName} onChange={e => set('customerName', e.target.value)} />
                {errors.customerName && <div className="form-error">{errors.customerName}</div>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="form-control" placeholder="Mumbai" value={form.city} onChange={e => set('city', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input className="form-control" placeholder="Maharashtra" value={form.state} onChange={e => set('state', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* New Opportunity */}
          <div className="card">
            <div className="card-header" style={{ color:'var(--accent-green)' }}>🏆 New Opportunity</div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Opportunity Name *</label>
                <input className="form-control" value={form.opportunityName} onChange={e => set('opportunityName', e.target.value)} />
                {errors.opportunityName && <div className="form-error">{errors.opportunityName}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input className="form-control" type="number" min="1" value={form.amount} onChange={e => set('amount', e.target.value)} />
                {errors.amount && <div className="form-error">{errors.amount}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Probability: {form.probability}%</label>
                <input type="range" min="0" max="100" value={form.probability} onChange={e => set('probability', e.target.value)}
                  style={{ width:'100%', accentColor:'var(--accent-blue)' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Expected Close Date *</label>
                <input className="form-control" type="date" value={form.expectedCloseDate} min={new Date().toISOString().split('T')[0]} onChange={e => set('expectedCloseDate', e.target.value)} />
                {errors.expectedCloseDate && <div className="form-error">{errors.expectedCloseDate}</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex gap-2" style={{ marginTop:20 }}>
          <button className="btn btn-success" type="submit" disabled={saving} style={{ padding:'12px 24px', fontSize:'0.95rem' }}>
            {saving ? <span className="spinner" /> : '⚡ Convert Lead'}
          </button>
          <button className="btn btn-outline" type="button" onClick={() => navigate('/leads')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
