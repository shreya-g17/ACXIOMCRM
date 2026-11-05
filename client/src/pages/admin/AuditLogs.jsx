import { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Pagination, EmptyState, fmtDate } from '../../components/common';
import { RiSearchLine, RiShieldLine } from 'react-icons/ri';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/audit-logs', { params: { search, page, limit: 15 } });
      setLogs(data.data); setTotal(data.total); setTotalPages(data.totalPages);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load audit logs.'); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1><RiShieldLine style={{ marginRight: 8 }} />Audit Logs</h1>
          <p className="subtitle">{total} append-only events</p>
        </div>
      </div>
      <div className="filter-bar">
        <div className="search-input" style={{ position: 'relative' }}>
          <RiSearchLine style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-control" style={{ paddingLeft: 36 }} placeholder="Search action, entity, or description" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>When</th><th>User</th><th>Action</th><th>Entity</th><th>Description</th><th>IP</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}><span className="spinner" style={{ margin: '0 auto' }} /></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon={<RiShieldLine />} message="No audit events yet. Sign in and change a record to create one." /></td></tr>
              ) : logs.map((log) => (
                <tr key={log._id}>
                  <td className="text-muted">{fmtDate(log.createdAt)} {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{log.user?.fullName || '—'}</td>
                  <td><span className="badge badge-blue">{log.action}</span></td>
                  <td>{log.entityName || '—'}</td>
                  <td className="text-muted">{log.description || log.newValue || '—'}</td>
                  <td className="text-muted">{log.ipAddress || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
