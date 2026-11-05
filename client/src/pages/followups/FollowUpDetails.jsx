import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { PageLoader, StatusBadge, fmtDate } from '../../components/common';
import { RiArrowLeftLine, RiPencilLine } from 'react-icons/ri';

export default function FollowUpDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/followups/${id}`)
      .then((r) => setItem(r.data.data))
      .catch((err) => toast.error(err.response?.data?.message || 'Follow-up not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader />;
  if (!item) return <div className="text-danger">Follow-up not found.</div>;

  const fields = [
    ['Subject', item.subject],
    ['Type', item.followUpType],
    ['Date', fmtDate(item.followUpDate)],
    ['Customer', item.customer?.customerName || '—'],
    ['Lead', item.lead?.leadName || '—'],
    ['Assigned To', item.assignedTo?.fullName || '—'],
    ['Notes', item.notes || '—'],
  ];

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1>{item.subject}</h1>
          <p className="subtitle">{fmtDate(item.followUpDate)}</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline" onClick={() => navigate('/followups')}><RiArrowLeftLine /> Back</button>
          <button className="btn btn-primary" onClick={() => navigate(`/followups/${id}/edit`)}><RiPencilLine /> Edit</button>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 760 }}>
        <div className="card-header">Follow-Up <StatusBadge status={item.status} /></div>
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
