import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { StatusBadge, ConfirmModal, Pagination, EmptyState, fmtDate } from '../../components/common';
import { RiAddLine, RiPencilLine, RiDeleteBinLine, RiEyeLine, RiSearchLine, RiCalendarCheckLine } from 'react-icons/ri';

const STATUSES = ['Planned', 'Completed', 'Missed', 'Cancelled'];

export default function FollowUpList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/followups', { params: { search, status, page, limit: 10 } });
      setRows(data.data); setTotal(data.total); setTotalPages(data.totalPages);
    } catch { toast.error('Failed to load follow-ups.'); }
    finally { setLoading(false); }
  }, [search, status, page]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/followups/${confirmId}`);
      toast.success('Follow-up deleted.'); setConfirmId(null); fetchRows();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed.'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1><RiCalendarCheckLine style={{ marginRight: 8 }} />Follow-Ups</h1>
          <p className="subtitle">{total} total records</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/followups/new')}><RiAddLine /> New Follow-Up</button>
      </div>

      <div className="filter-bar">
        <div className="search-input" style={{ position: 'relative' }}>
          <RiSearchLine style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-control" style={{ paddingLeft: 36 }} placeholder="Search subject..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="form-control" style={{ width: 160 }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {(search || status) && <button className="btn btn-outline btn-sm" onClick={() => { setSearch(''); setStatus(''); setPage(1); }}>Reset</button>}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Subject</th><th>Type</th><th>Date</th><th>Status</th><th>Linked To</th><th>Assigned</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}><span className="spinner" style={{ margin: '0 auto' }} /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={<RiCalendarCheckLine />} message="No follow-ups found." action={<button className="btn btn-primary btn-sm" onClick={() => navigate('/followups/new')}>Add Follow-Up</button>} /></td></tr>
              ) : rows.map((f) => {
                const overdue = f.status === 'Planned' && new Date(f.followUpDate) < new Date(new Date().toDateString());
                return (
                  <tr key={f._id}>
                    <td><strong>{f.subject}</strong></td>
                    <td><span className="badge badge-teal">{f.followUpType}</span></td>
                    <td><span className={overdue ? 'text-danger' : ''}>{fmtDate(f.followUpDate)}</span></td>
                    <td><StatusBadge status={f.status} /></td>
                    <td><span className="text-muted">{f.customer?.customerName || f.lead?.leadName || '—'}</span></td>
                    <td><span className="text-muted">{f.assignedTo?.fullName || '—'}</span></td>
                    <td>
                      <div className="d-flex gap-2">
                        <button className="btn-icon" title="View" onClick={() => navigate(`/followups/${f._id}`)}><RiEyeLine /></button>
                        <button className="btn-icon" title="Edit" onClick={() => navigate(`/followups/${f._id}/edit`)}><RiPencilLine /></button>
                        <button className="btn-icon" title="Delete" style={{ color: 'var(--accent-red)', borderColor: 'rgba(239,68,68,0.3)' }} onClick={() => setConfirmId(f._id)}><RiDeleteBinLine /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
      {confirmId && (
        <ConfirmModal title="Delete Follow-Up" message="Permanently delete this follow-up?"
          onConfirm={handleDelete} onCancel={() => setConfirmId(null)} loading={deleting} />
      )}
    </div>
  );
}
