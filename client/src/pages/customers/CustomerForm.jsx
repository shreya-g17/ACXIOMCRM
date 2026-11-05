import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { PageLoader } from '../../components/common';

const STATUSES = ['Active', 'Inactive', 'Prospect', 'Churned'];
const EMPTY = { customerName:'', email:'', phone:'', companyName:'', address:'', city:'', state:'', status:'Active', ownerId:'' };

export default function CustomerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm]       = useState(EMPTY);
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving]   = useState(false);
  const [errors, setErrors]   = useState({});

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data.data)).catch(() => {});
    if (isEdit) {
      api.get(`/customers/${id}`).then(r => {
        const c = r.data.data;
        setForm({ customerName: c.customerName, email: c.email, phone: c.phone, companyName: c.companyName || '', address: c.address || '', city: c.city || '', state: c.state || '', status: c.status, ownerId: c.owner?._id || '' });
      }).catch(() => toast.error('Failed to load customer.')).finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const validate = () => {
    const e = {};
    if (!form.customerName.trim()) e.customerName = 'Name is required.';
    if (!form.email.trim())        e.email = 'Email is required.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email format.';
    if (!form.phone.trim())        e.phone = 'Phone is required.';
    if (!/^\+?[0-9]{7,15}$/.test(form.phone)) e.phone = 'Phone must be 7–15 digits.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/customers/${id}`, form);
        toast.success('Customer updated!');
      } else {
        await api.post('/customers', form);
        toast.success('Customer created!');
      }
      navigate('/customers');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  if (loading) return <PageLoader />;

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit Customer' : 'New Customer'}</h1>
          <nav style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:4 }}>
            <span style={{ cursor:'pointer', color:'var(--accent-blue)' }} onClick={() => navigate('/customers')}>Customers</span>
            {' / '}{isEdit ? 'Edit' : 'Create'}
          </nav>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 760 }}>
        <div className="card-header">Customer Information</div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-control" placeholder="John Doe" value={form.customerName} onChange={e => set('customerName', e.target.value)} />
                {errors.customerName && <div className="form-error">{errors.customerName}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-control" type="email" placeholder="john@company.com" value={form.email} onChange={e => set('email', e.target.value)} />
                {errors.email && <div className="form-error">{errors.email}</div>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input className="form-control" placeholder="9876543210" value={form.phone} onChange={e => set('phone', e.target.value)} />
                {errors.phone && <div className="form-error">{errors.phone}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input className="form-control" placeholder="Acme Corp" value={form.companyName} onChange={e => set('companyName', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-control" placeholder="123 Main Street" value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-control" placeholder="Mumbai" value={form.city} onChange={e => set('city', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input className="form-control" placeholder="Maharashtra" value={form.state} onChange={e => set('state', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Assigned To</label>
              <select className="form-control" value={form.ownerId} onChange={e => set('ownerId', e.target.value)}>
                <option value="">(Assign to me)</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.fullName} ({u.role})</option>)}
              </select>
            </div>
            <div className="d-flex gap-2" style={{ marginTop: 8 }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? <span className="spinner" /> : (isEdit ? 'Update Customer' : 'Save Customer')}
              </button>
              <button className="btn btn-outline" type="button" onClick={() => navigate('/customers')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
