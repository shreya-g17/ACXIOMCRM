import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { PageLoader } from '../../components/common';

const TYPES = ['Call', 'Meeting', 'Email', 'Task'];
const STATUSES = ['Planned', 'Completed', 'Missed', 'Cancelled'];
const today = () => new Date().toISOString().split('T')[0];
const EMPTY = { subject: '', followUpDate: today(), followUpType: 'Call', status: 'Planned', notes: '', customer: '', lead: '', assignedTo: '' };

export default function FollowUpForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(EMPTY);
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    api.get('/customers?limit=200').then((r) => setCustomers(r.data.data)).catch(() => {});
    api.get('/leads?limit=200').then((r) => setLeads(r.data.data)).catch(() => {});
    api.get('/users').then((r) => setUsers(r.data.data)).catch(() => {});
    if (isEdit) {
      api.get(`/followups/${id}`).then((r) => {
        const f = r.data.data;
        setForm({
          subject: f.subject,
          followUpDate: f.followUpDate?.split('T')[0] || today(),
          followUpType: f.followUpType,
          status: f.status,
          notes: f.notes || '',
          customer: f.customer?._id || '',
          lead: f.lead?._id || '',
          assignedTo: f.assignedTo?._id || '',
        });
      }).catch(() => toast.error('Failed to load follow-up.')).finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const validate = () => {
    const e = {};
    if (!form.subject.trim()) e.subject = 'Subject is required.';
    if (!form.followUpDate) e.followUpDate = 'Date is required.';
    else if (form.status === 'Planned' && form.followUpDate < today()) e.followUpDate = 'Planned follow-ups cannot be in the past.';
    if (!form.customer && !form.lead) e.link = 'Link this follow-up to a customer or a lead.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.customer) delete payload.customer;
      if (!payload.lead) delete payload.lead;
      if (!payload.assignedTo) delete payload.assignedTo;
      if (isEdit) { await api.put(`/followups/${id}`, payload); toast.success('Follow-up updated!'); }
      else { await api.post('/followups', payload); toast.success('Follow-up created!'); }
      navigate('/followups');
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed.'); }
    finally { setSaving(false); }
  };

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: '', link: '' })); };
  if (loading) return <PageLoader />;

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit Follow-Up' : 'New Follow-Up'}</h1>
          <nav style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
            <span style={{ cursor: 'pointer', color: 'var(--accent-blue)' }} onClick={() => navigate('/followups')}>Follow-Ups</span>
            {' / '}{isEdit ? 'Edit' : 'Create'}
          </nav>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 760 }}>
        <div className="card-header">Follow-Up Details</div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Subject *</label>
              <input className="form-control" value={form.subject} onChange={(e) => set('subject', e.target.value)} placeholder="Call to discuss proposal" />
              {errors.subject && <div className="form-error">{errors.subject}</div>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input className="form-control" type="date" value={form.followUpDate} min={form.status === 'Planned' ? today() : undefined} onChange={(e) => set('followUpDate', e.target.value)} />
                {errors.followUpDate && <div className="form-error">{errors.followUpDate}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-control" value={form.followUpType} onChange={(e) => set('followUpType', e.target.value)}>
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status} onChange={(e) => set('status', e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assigned To</label>
                <select className="form-control" value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)}>
                  <option value="">(Assign to me)</option>
                  {users.map((u) => <option key={u._id} value={u._id}>{u.fullName}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Customer</label>
                <select className="form-control" value={form.customer} onChange={(e) => set('customer', e.target.value)}>
                  <option value="">(None)</option>
                  {customers.map((c) => <option key={c._id} value={c._id}>{c.customerName}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Lead</label>
                <select className="form-control" value={form.lead} onChange={(e) => set('lead', e.target.value)}>
                  <option value="">(None)</option>
                  {leads.map((l) => <option key={l._id} value={l._id}>{l.leadName}</option>)}
                </select>
              </div>
            </div>
            {errors.link && <div className="form-error" style={{ marginBottom: 12 }}>{errors.link}</div>}
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? <span className="spinner" /> : (isEdit ? 'Update Follow-Up' : 'Save Follow-Up')}
              </button>
              <button className="btn btn-outline" type="button" onClick={() => navigate('/followups')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
