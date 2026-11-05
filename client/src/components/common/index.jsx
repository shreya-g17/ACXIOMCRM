/* Reusable KPI card */
export function KPICard({ icon, label, value, colorClass = 'blue' }) {
  return (
    <div className="kpi-card">
      <div className={`kpi-icon ${colorClass}`}>{icon}</div>
      <div>
        <div className="kpi-value">{value ?? '—'}</div>
        <div className="kpi-label">{label}</div>
      </div>
    </div>
  );
}

/* Status badge helper */
const BADGE_MAP = {
  // Lead
  New: 'badge-blue', Contacted: 'badge-orange', Qualified: 'badge-green',
  Unqualified: 'badge-gray', Converted: 'badge-teal', Lost: 'badge-red',
  // Opportunity stage
  Qualification: 'badge-blue', Proposal: 'badge-orange', Negotiation: 'badge-purple',
  Won: 'badge-green',
  // Status
  Active: 'badge-green', Inactive: 'badge-gray', Prospect: 'badge-teal', Churned: 'badge-red',
  Open: 'badge-green', Closed: 'badge-gray', OnHold: 'badge-orange',
  // FollowUp
  Planned: 'badge-blue', Completed: 'badge-green', Missed: 'badge-red', Cancelled: 'badge-gray',
  // User
  Admin: 'badge-red', Manager: 'badge-orange', 'Sales Executive': 'badge-blue',
};

export function StatusBadge({ status }) {
  return <span className={`badge ${BADGE_MAP[status] || 'badge-gray'}`}>{status}</span>;
}

/* Confirm delete modal */
export function ConfirmModal({ title, message, onConfirm, onCancel, loading }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title" style={{ color: 'var(--accent-red)' }}>⚠ {title}</div>
        <div className="modal-body">{message}</div>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Pagination */
export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <span className="page-info">Page {page} of {totalPages}</span>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => onPageChange(p)}>{p}</button>
      ))}
    </div>
  );
}

/* Full-page loading spinner */
export function PageLoader() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:16 }}>
      <div className="spinner" style={{ width:36, height:36, borderWidth:4 }} />
      <span style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>Loading...</span>
    </div>
  );
}

/* Empty state */
export function EmptyState({ icon, message, action }) {
  return (
    <div className="empty-state">
      <div style={{ fontSize:'3rem', marginBottom:12, opacity:0.4 }}>{icon}</div>
      <div style={{ marginBottom: action ? 16 : 0 }}>{message}</div>
      {action}
    </div>
  );
}

/* Format currency */
export const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
/* Format date */
export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';
