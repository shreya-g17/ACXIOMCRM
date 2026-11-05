import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { StatusBadge, ConfirmModal, Pagination, EmptyState, fmtDate } from '../../components/common';
import { RiAddLine, RiPencilLine, RiDeleteBinLine, RiEyeLine, RiSearchLine, RiUserLine } from 'react-icons/ri';

const STATUSES = ['Active', 'Inactive', 'Prospect', 'Churned'];

export default function CustomerList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [status, setStatus]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [deleting, setDeleting]   = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/customers', { params: { search, status, page, limit: 10 } });
      setCustomers(data.data); setTotal(data.total); setTotalPages(data.totalPages);
    } catch { toast.error('Failed to load customers.'); }
    finally { setLoading(false); }
  }, [search, status, page]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleDelete = async () => {
    setDeleting(confirmId);
    try {
      await api.delete(`/customers/${confirmId}`);
      toast.success('Customer deleted.'); setConfirmId(null); fetchCustomers();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed.'); }
    finally { setDeleting(null); }
  };

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p className="subtitle">{total} total records</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/customers/new')}>
          <RiAddLine /> New Customer
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input" style={{ position:'relative' }}>
          <RiSearchLine style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
          <input className="form-control" style={{ paddingLeft:36 }} placeholder="Search name, email, phone..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="form-control" style={{ width:160 }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(search || status) && (
          <button className="btn btn-outline btn-sm" onClick={() => { setSearch(''); setStatus(''); setPage(1); }}>Reset</button>
        )}
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Code</th><th>Name</th><th>Email</th><th>Phone</th><th>Company</th><th>Status</th><th>Owner</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign:'center', padding:40 }}><span className="spinner" style={{ margin:'0 auto' }} /></td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={9}><EmptyState icon={<RiUserLine />} message="No customers found." action={<button className="btn btn-primary btn-sm" onClick={() => navigate('/customers/new')}>Add Customer</button>} /></td></tr>
              ) : customers.map(c => (
                <tr key={c._id}>
                  <td><span className="badge badge-gray">{c.customerCode}</span></td>
                  <td><strong>{c.customerName}</strong></td>
                  <td><a href={`mailto:${c.email}`} style={{ color:'var(--accent-blue)' }}>{c.email}</a></td>
                  <td>{c.phone}</td>
                  <td><span className="text-muted">{c.companyName || '—'}</span></td>
                  <td><StatusBadge status={c.status} /></td>
                  <td><span className="text-muted">{c.owner?.fullName || '—'}</span></td>
                  <td><span className="text-muted">{fmtDate(c.createdAt)}</span></td>
                  <td>
                    <div className="d-flex gap-2">
                      <button className="btn-icon" title="View" onClick={() => navigate(`/customers/${c._id}`)}><RiEyeLine /></button>
                      <button className="btn-icon" title="Edit" onClick={() => navigate(`/customers/${c._id}/edit`)}><RiPencilLine /></button>
                      <button className="btn-icon" title="Delete" style={{ color:'var(--accent-red)', borderColor:'rgba(239,68,68,0.3)' }} onClick={() => setConfirmId(c._id)}><RiDeleteBinLine /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {confirmId && (
        <ConfirmModal title="Delete Customer" message={`Are you sure you want to permanently delete this customer? This action cannot be undone.`}
          onConfirm={handleDelete} onCancel={() => setConfirmId(null)} loading={!!deleting} />
      )}
    </div>
  );
}
