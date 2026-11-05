import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { PageLoader, StatusBadge, fmtDate, fmt } from '../../components/common';
import { RiArrowLeftLine, RiPencilLine } from 'react-icons/ri';

export default function OpportunityDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/opportunities/${id}`)
      .then((r) => setItem(r.data.data))
      .catch((err) => toast.error(err.response?.data?.message || 'Opportunity not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader />;
  if (!item) return <div className="text-danger">Opportunity not found.</div>;

  const fields = [
    ['Name', item.opportunityName],
    ['Customer', item.customer?.customerName || '—'],
    ['Amount', fmt(item.amount)],
    ['Probability', `${item.probability}%`],
    ['Expected Close', fmtDate(item.expectedCloseDate)],
    ['Actual Close', fmtDate(item.actualCloseDate)],
    ['Owner', item.owner?.fullName || '—'],
    ['Description', item.description || '—'],
  ];

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1>{item.opportunityName}</h1>
          <p className="subtitle">{fmt(item.amount)}</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline" onClick={() => navigate('/opportunities')}><RiArrowLeftLine /> Back</button>
          <button className="btn btn-primary" onClick={() => navigate(`/opportunities/${id}/edit`)}><RiPencilLine /> Edit</button>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 760 }}>
        <div className="card-header">
          <span className="d-flex gap-2 align-center"><StatusBadge status={item.stage} /><StatusBadge status={item.status} /></span>
        </div>
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
