import { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import api from '../../services/api';
import { KPICard, PageLoader, fmt, StatusBadge } from '../../components/common';
import { RiUserLine, RiFilterLine, RiTrophyLine, RiMoneyDollarCircleLine, RiDownloadLine } from 'react-icons/ri';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const downloadCsv = (filename, rows) => {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('totalRevenue');
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.get('/reports').then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!data) return <div className="text-danger">Failed to load reports.</div>;

  const { summary, charts, topPerformers } = data;
  const filtered = [...(topPerformers || [])]
    .filter((u) => !query || u.fullName?.toLowerCase().includes(query.toLowerCase()) || u.role?.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0));

  const sourceChart = {
    labels: charts.leadSource.map((s) => s._id || 'Unknown'),
    datasets: [{ data: charts.leadSource.map((s) => s.count), backgroundColor: ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#8b5cf6', '#94a3b8'], borderWidth: 2, borderColor: '#1e2435' }],
  };
  const stageChart = {
    labels: charts.opportunityStage.map((s) => s._id),
    datasets: [{ label: 'Value (₹)', data: charts.opportunityStage.map((s) => s.total), backgroundColor: '#6366f1', borderRadius: 6 }],
  };

  const exportReport = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Customers', summary.totalCustomers],
      ['Leads', summary.totalLeads],
      ['Won Deals', summary.totalWon],
      ['Revenue', summary.totalRevenue],
      ['Lost', summary.totalLost],
      ['Open Opportunities', summary.totalOpen],
      [],
      ['Name', 'Role', 'Customers', 'Open Deals', 'Won Deals', 'Revenue'],
      ...filtered.map((u) => [u.fullName, u.role, u.customerCount, u.openOpportunities, u.wonDeals, u.totalRevenue]),
    ];
    downloadCsv('acxiomcrm-report.csv', rows);
  };

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p className="subtitle">Pipeline, lead sources, and team performance</p>
        </div>
        <button className="btn btn-outline" onClick={exportReport}><RiDownloadLine /> Export CSV</button>
      </div>

      <div className="kpi-grid">
        <KPICard icon={<RiUserLine />} label="Customers" value={summary.totalCustomers} colorClass="blue" />
        <KPICard icon={<RiFilterLine />} label="Leads" value={summary.totalLeads} colorClass="orange" />
        <KPICard icon={<RiTrophyLine />} label="Won Deals" value={summary.totalWon} colorClass="green" />
        <KPICard icon={<RiMoneyDollarCircleLine />} label="Revenue" value={fmt(summary.totalRevenue)} colorClass="purple" />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Leads by Source</div>
          <div style={{ height: 220 }}>
            <Doughnut data={sourceChart} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#8892a4' } } } }} />
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Opportunity Value by Stage</div>
          <div style={{ height: 220 }}>
            <Bar data={stageChart} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#8892a4' }, grid: { color: '#2a3350' } }, y: { ticks: { color: '#8892a4' }, grid: { color: '#2a3350' }, beginAtZero: true } } }} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span>Team Performance</span>
          <div className="d-flex gap-2">
            <input className="form-control" style={{ width: 180 }} placeholder="Filter name or role" value={query} onChange={(e) => setQuery(e.target.value)} />
            <select className="form-control" style={{ width: 160 }} value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
              <option value="totalRevenue">Sort by revenue</option>
              <option value="wonDeals">Sort by won deals</option>
              <option value="customerCount">Sort by customers</option>
              <option value="openOpportunities">Sort by open deals</option>
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Role</th><th>Customers</th><th>Open</th><th>Won</th><th>Revenue</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-muted" style={{ padding: 24 }}>No matching users.</td></tr>
              ) : filtered.map((u) => (
                <tr key={u._id}>
                  <td><strong>{u.fullName}</strong></td>
                  <td><StatusBadge status={u.role} /></td>
                  <td>{u.customerCount}</td>
                  <td>{u.openOpportunities}</td>
                  <td>{u.wonDeals}</td>
                  <td className="text-success">{fmt(u.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
