import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { StatusBadge, ConfirmModal, Pagination, EmptyState, fmtDate, fmt } from '../../components/common';
import { RiAddLine, RiPencilLine, RiDeleteBinLine, RiEyeLine, RiSearchLine, RiFilterLine, RiArrowRightLine } from 'react-icons/ri';

const STATUSES = ['New','Contacted','Qualified','Unqualified','Converted','Lost'];

export default function LeadList() {
  const navigate = useNavigate();
  const [leads, setLeads]         = useState([]);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [status, setStatus]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/leads', { params: { search, status, page, limit: 10 } });
      setLeads(data.data); setTotal(data.total); setTotalPages(data.totalPages);
    } catch { toast.error('Failed to load leads.'); }
    finally { setLoading(false); }
  }, [search, status, page]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/leads/${confirmId}`);
      toast.success('Lead deleted.'); setConfirmId(null); fetchLeads();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed.'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1><RiFilterLine style={{ marginRight:8 }} />Leads</h1>
          <p className="subtitle">{total} total records</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/leads/new')}><RiAddLine /> New Lead</button>
      </div>

      <div className="filter-bar">
        <div className="search-input" style={{ position:'relative' }}>
          <RiSearchLine style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
          <input className="form-control" style={{ paddingLeft:36 }} placeholder="Search name, email, company..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="form-control" style={{ width:160 }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(search || status) && <button className="btn btn-outline btn-sm" onClick={() => { setSearch(''); setStatus(''); setPage(1); }}>Reset</button>}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Code</th><th>Name</th><th>Source</th><th>Status</th><th>Expected Value</th><th>Assigned</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign:'center', padding:40 }}><span className="spinner" style={{ margin:'0 auto' }} /></td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon={<RiFilterLine />} message="No leads found." action={<button className="btn btn-primary btn-sm" onClick={() => navigate('/leads/new')}>Add Lead</button>} /></td></tr>
              ) : leads.map(l => (
                <tr key={l._id}>
                  <td><span className="badge badge-gray">{l.leadCode}</span></td>
                  <td>
                    <strong>{l.leadName}</strong>
                    {l.companyName && <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{l.companyName}</div>}
                  </td>
                  <td><span className="badge badge-teal">{l.source}</span></td>
                  <td><StatusBadge status={l.status} /></td>
                  <td><strong className="text-success">{fmt(l.expectedValue)}</strong></td>
                  <td><span className="text-muted">{l.assignedTo?.fullName || '—'}</span></td>
                  <td><span className="text-muted">{fmtDate(l.createdAt)}</span></td>
                  <td>
                    <div className="d-flex gap-2">
                      <button className="btn-icon" title="View" onClick={() => navigate(`/leads/${l._id}`)}><RiEyeLine /></button>
                      <button className="btn-icon" title="Edit" onClick={() => navigate(`/leads/${l._id}/edit`)}><RiPencilLine /></button>
                      {l.status !== 'Converted' && (
                        <button className="btn-icon" title="Convert to Customer" style={{ color:'var(--accent-green)', borderColor:'rgba(16,185,129,0.3)' }} onClick={() => navigate(`/leads/${l._id}/convert`)}><RiArrowRightLine /></button>
                      )}
                      <button className="btn-icon" title="Delete" style={{ color:'var(--accent-red)', borderColor:'rgba(239,68,68,0.3)' }} onClick={() => setConfirmId(l._id)}><RiDeleteBinLine /></button>
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
        <ConfirmModal title="Delete Lead" message="Permanently delete this lead? This action cannot be undone."
          onConfirm={handleDelete} onCancel={() => setConfirmId(null)} loading={deleting} />
      )}
    </div>
  );
}
