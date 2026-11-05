import { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Pagination, StatusBadge, EmptyState } from '../../components/common';
import { RiUserAddLine, RiSearchLine } from 'react-icons/ri';

const ROLES = ['Admin', 'Manager', 'Sales Executive'];
const EMPTY = { fullName: '', email: '', password: '', role: 'Sales Executive', department: '' };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [resetFor, setResetFor] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { search, page, limit: 10 } });
      setUsers(data.data); setTotal(data.total); setTotalPages(data.totalPages);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load users.'); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const createUser = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || form.password.length < 6) {
      toast.error('Name, email, and a password of at least 6 characters are required.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/auth/register', form);
      toast.success('User created.');
      setForm(EMPTY); setShowForm(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not create user.'); }
    finally { setSaving(false); }
  };

  const changeRole = async (user, role) => {
    try {
      await api.put(`/admin/users/${user._id}`, { role });
      toast.success(`${user.fullName} is now ${role}.`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed.'); }
  };

  const toggle = async (user) => {
    try {
      const { data } = await api.patch(`/admin/users/${user._id}/toggle`);
      toast.success(data.message);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed.'); }
  };

  const resetPassword = async () => {
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    try {
      const { data } = await api.patch(`/admin/users/${resetFor._id}/reset-password`, { newPassword });
      toast.success(data.message);
      setResetFor(null); setNewPassword('');
    } catch (err) { toast.error(err.response?.data?.message || 'Reset failed.'); }
  };

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1>Manage Users</h1>
          <p className="subtitle">{total} accounts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}><RiUserAddLine /> New User</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16, maxWidth: 760 }}>
          <div className="card-header">Create User</div>
          <div className="card-body">
            <form onSubmit={createUser}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-control" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-control" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input className="form-control" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-control" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-control" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </div>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? <span className="spinner" /> : 'Create User'}</button>
            </form>
          </div>
        </div>
      )}

      <div className="filter-bar">
        <div className="search-input" style={{ position: 'relative' }}>
          <RiSearchLine style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-control" style={{ paddingLeft: 36 }} placeholder="Search name or email" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40 }}><span className="spinner" style={{ margin: '0 auto' }} /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5}><EmptyState icon="👤" message="No users found." /></td></tr>
              ) : users.map((u) => (
                <tr key={u._id}>
                  <td><strong>{u.fullName}</strong><div className="text-muted" style={{ fontSize: '0.75rem' }}>{u.department || ''}</div></td>
                  <td>{u.email}</td>
                  <td>
                    <select className="form-control" style={{ width: 160 }} value={u.role} onChange={(e) => changeRole(u, e.target.value)}>
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td><StatusBadge status={u.isActive ? 'Active' : 'Inactive'} /></td>
                  <td>
                    <div className="d-flex gap-2">
                      <button className="btn btn-outline btn-sm" onClick={() => toggle(u)}>{u.isActive ? 'Deactivate' : 'Activate'}</button>
                      <button className="btn btn-outline btn-sm" onClick={() => { setResetFor(u); setNewPassword(''); }}>Reset Password</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {resetFor && (
        <div className="modal-overlay" onClick={() => setResetFor(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Reset password</div>
            <div className="modal-body">Set a new password for {resetFor.fullName}. It is stored with bcrypt and is never kept in plain text.</div>
            <input className="form-control" type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="btn btn-outline" onClick={() => setResetFor(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={resetPassword}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
