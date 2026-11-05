import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { PageLoader, StatusBadge, fmtDate, fmt } from '../../components/common';
import { RiArrowLeftLine, RiArrowRightLine, RiPencilLine } from 'react-icons/ri';

export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/leads/${id}`)
      .then((r) => setLead(r.data.data))
      .catch((err) => toast.error(err.response?.data?.message || 'Lead not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader />;
  if (!lead) return <div className="text-danger">Lead not found.</div>;

  const fields = [
    ['Code', lead.leadCode],
    ['Name', lead.leadName],
    ['Email', lead.email],
    ['Phone', lead.phone],
    ['Company', lead.companyName || '—'],
    ['Source', lead.source],
    ['Expected Value', fmt(lead.expectedValue)],
    ['Assigned To', lead.assignedTo?.fullName || '—'],
    ['Created', fmtDate(lead.createdAt)],
    ['Notes', lead.notes || '—'],
  ];

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1>{lead.leadName}</h1>
          <p className="subtitle">{lead.leadCode}</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline" onClick={() => navigate('/leads')}><RiArrowLeftLine /> Back</button>
          <button className="btn btn-primary" onClick={() => navigate(`/leads/${id}/edit`)}><RiPencilLine /> Edit</button>
          {lead.status !== 'Converted' && (
            <button className="btn btn-success" onClick={() => navigate(`/leads/${id}/convert`)}><RiArrowRightLine /> Convert</button>
          )}
        </div>
      </div>
      <div className="card" style={{ maxWidth: 760 }}>
        <div className="card-header">Lead <StatusBadge status={lead.status} /></div>
        <div className="card-body detail-grid">
          {fields.map(([label, value]) => (
            <div key={label}>
              <div className="form-label">{label}</div>
              <div>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
