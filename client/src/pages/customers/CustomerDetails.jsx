import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { PageLoader, StatusBadge, fmtDate } from '../../components/common';
import { RiArrowLeftLine, RiPencilLine } from 'react-icons/ri';

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/customers/${id}`)
      .then((r) => setCustomer(r.data.data))
      .catch((err) => toast.error(err.response?.data?.message || 'Customer not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader />;
  if (!customer) return <div className="text-danger">Customer not found.</div>;

  const fields = [
    ['Code', customer.customerCode],
    ['Name', customer.customerName],
    ['Email', customer.email],
    ['Phone', customer.phone],
    ['Company', customer.companyName || '—'],
    ['Address', customer.address || '—'],
    ['City', customer.city || '—'],
    ['State', customer.state || '—'],
    ['Owner', customer.owner?.fullName || '—'],
    ['Created', fmtDate(customer.createdAt)],
  ];

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1>{customer.customerName}</h1>
          <p className="subtitle">{customer.customerCode}</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline" onClick={() => navigate('/customers')}><RiArrowLeftLine /> Back</button>
          <button className="btn btn-primary" onClick={() => navigate(`/customers/${id}/edit`)}><RiPencilLine /> Edit</button>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 760 }}>
        <div className="card-header">Customer <StatusBadge status={customer.status} /></div>
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
