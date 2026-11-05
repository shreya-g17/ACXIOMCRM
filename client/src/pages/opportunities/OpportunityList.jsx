import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { StatusBadge, ConfirmModal, Pagination, EmptyState, fmtDate, fmt } from '../../components/common';
import { RiAddLine, RiPencilLine, RiDeleteBinLine, RiEyeLine, RiSearchLine, RiTrophyLine } from 'react-icons/ri';

const STAGES = ['Qualification','Proposal','Negotiation','Won','Lost'];

export default function OpportunityList() {
  const navigate = useNavigate();
  const [opps, setOpps]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pipeline, setPipeline]   = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [stage, setStage]         = useState('');
  const [loading, setLoading]     = useState(true);
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  const fetchOpps = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/opportunities', { params: { search, stage, page, limit: 10 } });
      setOpps(data.data); setTotal(data.total); setTotalPages(data.totalPages); setPipeline(data.pipelineValue);
    } catch { toast.error('Failed to load opportunities.'); }
    finally { setLoading(false); }
  }, [search, stage, page]);

  useEffect(() => { fetchOpps(); }, [fetchOpps]);

  const handleDelete = async () => {
    setDeleting(true);
    try { await api.delete(`/opportunities/${confirmId}`); toast.success('Deleted.'); setConfirmId(null); fetchOpps(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed.'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1><RiTrophyLine style={{ marginRight:8 }} />Opportunities</h1>
          <p className="subtitle">{total} records · Pipeline: <strong className="text-success">{fmt(pipeline)}</strong></p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/opportunities/new')}><RiAddLine /> New Opportunity</button>
      </div>

      <div className="filter-bar">
        <div className="search-input" style={{ position:'relative' }}>
          <RiSearchLine style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
          <input className="form-control" style={{ paddingLeft:36 }} placeholder="Search opportunity..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="form-control" style={{ width:160 }} value={stage} onChange={(e) => { setStage(e.target.value); setPage(1); }}>
          <option value="">All Stages</option>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(search || stage) && <button className="btn btn-outline btn-sm" onClick={() => { setSearch(''); setStage(''); setPage(1); }}>Reset</button>}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Customer</th><th>Amount</th><th>Stage</th><th>Probability</th><th>Close Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign:'center', padding:40 }}><span className="spinner" style={{ margin:'0 auto' }} /></td></tr>
              ) : opps.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon={<RiTrophyLine />} message="No opportunities found." action={<button className="btn btn-primary btn-sm" onClick={() => navigate('/opportunities/new')}>Add Opportunity</button>} /></td></tr>
              ) : opps.map(o => {
                const isOverdue = new Date(o.expectedCloseDate) < new Date() && o.status === 'Open';
                return (
                  <tr key={o._id}>
                    <td><strong>{o.opportunityName}</strong></td>
                    <td><span className="text-muted">{o.customer?.customerName || '—'}</span></td>
                    <td><strong className="text-success">{fmt(o.amount)}</strong></td>
                    <td><StatusBadge status={o.stage} /></td>
                    <td>
                      <div className="d-flex align-center gap-2">
                        <div className="progress-bar" style={{ width:80 }}><div className="progress-fill" style={{ width:`${o.probability}%` }} /></div>
                        <small>{o.probability}%</small>
                      </div>
                    </td>
                    <td><span className={isOverdue ? 'text-danger' : ''}>{fmtDate(o.expectedCloseDate)}</span></td>
                    <td><StatusBadge status={o.status} /></td>
                    <td>
                      <div className="d-flex gap-2">
                        <button className="btn-icon" onClick={() => navigate(`/opportunities/${o._id}`)}><RiEyeLine /></button>
                        <button className="btn-icon" onClick={() => navigate(`/opportunities/${o._id}/edit`)}><RiPencilLine /></button>
                        <button className="btn-icon" style={{ color:'var(--accent-red)', borderColor:'rgba(239,68,68,0.3)' }} onClick={() => setConfirmId(o._id)}><RiDeleteBinLine /></button>
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
      {confirmId && <ConfirmModal title="Delete Opportunity" message="Permanently delete this opportunity?" onConfirm={handleDelete} onCancel={() => setConfirmId(null)} loading={deleting} />}
    </div>
  );
}
