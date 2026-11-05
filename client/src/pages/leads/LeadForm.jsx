import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { PageLoader } from '../../components/common';

const SOURCES  = ['Website','Referral','SocialMedia','ColdCall','Email','Advertisement','Other'];
const STATUSES = ['New','Contacted','Qualified','Unqualified','Lost'];
const EMPTY = { leadName:'', email:'', phone:'', companyName:'', source:'Website', status:'New', expectedValue:'', notes:'', assignedTo:'' };

export default function LeadForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm]   = useState(EMPTY);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving]   = useState(false);
  const [errors, setErrors]   = useState({});

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data.data)).catch(() => {});
    if (isEdit) {
      api.get(`/leads/${id}`).then(r => {
        const l = r.data.data;
        setForm({ leadName: l.leadName, email: l.email, phone: l.phone, companyName: l.companyName || '', source: l.source, status: l.status, expectedValue: l.expectedValue || '', notes: l.notes || '', assignedTo: l.assignedTo?._id || '' });
      }).catch(() => toast.error('Failed to load lead.')).finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const validate = () => {
    const e = {};
    if (!form.leadName.trim()) e.leadName = 'Name is required.';
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Valid email is required.';
    if (!form.phone.trim()) e.phone = 'Phone is required.';
    if (form.expectedValue !== '' && Number(form.expectedValue) < 0) e.expectedValue = 'Must be a positive number.';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, expectedValue: Number(form.expectedValue) || 0 };
      if (isEdit) { await api.put(`/leads/${id}`, payload); toast.success('Lead updated!'); }
      else        { await api.post('/leads', payload);       toast.success('Lead created!'); }
      navigate('/leads');
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed.'); }
    finally { setSaving(false); }
  };

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  if (loading) return <PageLoader />;

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit Lead' : 'New Lead'}</h1>
          <nav style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:4 }}>
            <span style={{ cursor:'pointer', color:'var(--accent-blue)' }} onClick={() => navigate('/leads')}>Leads</span>
            {' / '}{isEdit ? 'Edit' : 'Create'}
          </nav>
        </div>
      </div>
      <div className="card" style={{ maxWidth:760 }}>
        <div className="card-header">Lead Information</div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Lead Name *</label>
                <input className="form-control" placeholder="Contact Person" value={form.leadName} onChange={e => set('leadName', e.target.value)} />
                {errors.leadName && <div className="form-error">{errors.leadName}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Company</label>
                <input className="form-control" placeholder="Company Name" value={form.companyName} onChange={e => set('companyName', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-control" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
                {errors.email && <div className="form-error">{errors.email}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input className="form-control" placeholder="9876543210" value={form.phone} onChange={e => set('phone', e.target.value)} />
                {errors.phone && <div className="form-error">{errors.phone}</div>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Source</label>
                <select className="form-control" value={form.source} onChange={e => set('source', e.target.value)}>
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
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
                <label className="form-label">Expected Value (₹)</label>
                <input className="form-control" type="number" min="0" placeholder="0" value={form.expectedValue} onChange={e => set('expectedValue', e.target.value)} />
                {errors.expectedValue && <div className="form-error">{errors.expectedValue}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Assigned To</label>
                <select className="form-control" value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)}>
                  <option value="">(Assign to me)</option>
                  {users.map(u => <option key={u._id} value={u._id}>{u.fullName}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows={3} placeholder="Additional notes..." value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? <span className="spinner" /> : (isEdit ? 'Update Lead' : 'Save Lead')}
              </button>
              <button className="btn btn-outline" type="button" onClick={() => navigate('/leads')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
