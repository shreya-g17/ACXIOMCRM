import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import api from '../services/api';
import { KPICard, PageLoader, fmtDate, fmt } from '../components/common';
import { RiUserLine, RiFilterLine, RiTrophyLine, RiCalendarCheckLine, RiLineChartLine, RiErrorWarningLine, RiCheckLine } from 'react-icons/ri';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

const CHART_OPTS = {
  plugins: { legend: { labels: { color: '#8892a4', font: { family: 'Inter' }, usePointStyle: true } } },
  scales:  { x: { ticks: { color: '#8892a4' }, grid: { color: '#2a3350' } }, y: { ticks: { color: '#8892a4' }, grid: { color: '#2a3350' }, beginAtZero: true } },
  responsive: true, maintainAspectRatio: false,
};

export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!data)   return <div className="text-danger">Failed to load dashboard.</div>;

  const { kpi, charts, upcomingFollowUps } = data;

  // Build monthly revenue chart data
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthly = charts.monthlyRevenue || [];
  const monthlyLabels = monthly.map(r => `${months[r._id.month - 1]} ${r._id.year}`);
  const monthlyValues = monthly.map(r => r.total);

  // Lead status doughnut
  const leadColors = ['#6366f1','#f59e0b','#10b981','#ef4444','#06b6d4','#8b5cf6'];
  const leadDoughnut = {
    labels: charts.leadStatus.map(l => l._id),
    datasets: [{ data: charts.leadStatus.map(l => l.count), backgroundColor: leadColors, borderWidth: 2, borderColor: '#1e2435' }],
  };

  // Opportunity stage bar
  const stageBar = {
    labels: charts.opportunityStage.map(s => s._id),
    datasets: [{ label: 'Pipeline Value (₹)', data: charts.opportunityStage.map(s => s.total), backgroundColor: ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6'], borderRadius: 6 }],
  };

  // Monthly revenue line
  const revLine = {
    labels: monthlyLabels,
    datasets: [{ label: 'Revenue (₹)', data: monthlyValues, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4, pointBackgroundColor: '#10b981' }],
  };

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="subtitle">Welcome back — here's what's happening today</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        <KPICard icon={<RiUserLine />}          label="Total Customers"      value={kpi.totalCustomers}    colorClass="blue" />
        <KPICard icon={<RiFilterLine />}         label="Open Leads"          value={kpi.openLeads}         colorClass="orange" />
        <KPICard icon={<RiTrophyLine />}         label="Won Deals"           value={kpi.wonOpportunities}  colorClass="green" />
        <KPICard icon={<RiLineChartLine />}      label="Pipeline Value"      value={fmt(kpi.pipelineValue)} colorClass="purple" />
        <KPICard icon={<RiCalendarCheckLine />}  label="Follow-Ups Planned"  value={kpi.totalFollowUps}    colorClass="teal" />
        <KPICard icon={<RiErrorWarningLine />}   label="Overdue Follow-Ups"  value={kpi.overdueFollowUps}  colorClass="red" />
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">📊 Monthly Revenue (Won Deals)</div>
          <div style={{ height: 200 }}><Line data={revLine} options={{ ...CHART_OPTS, plugins: { legend: { display: false } } }} /></div>
        </div>
        <div className="chart-card">
          <div className="chart-title">🎯 Leads by Status</div>
          <div style={{ height: 200 }}><Doughnut data={leadDoughnut} options={{ ...CHART_OPTS, cutout: '60%', scales: undefined, plugins: { legend: { position: 'right', labels: { color: '#8892a4', font: { family: 'Inter' } } } } }} /></div>
        </div>
        <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
          <div className="chart-title">🏆 Pipeline by Stage</div>
          <div style={{ height: 200 }}><Bar data={stageBar} options={{ ...CHART_OPTS, plugins: { legend: { display: false } } }} /></div>
        </div>
      </div>

      {/* Upcoming Follow-Ups */}
      <div className="card">
        <div className="card-header">
          <span><RiCalendarCheckLine style={{ marginRight: 8 }} />Upcoming Follow-Ups</span>
        </div>
        {upcomingFollowUps.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <RiCheckLine style={{ fontSize:'2rem', margin:'0 auto 8px', opacity:0.4 }} />No upcoming follow-ups
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Subject</th><th>Type</th><th>Date</th><th>Linked To</th></tr></thead>
              <tbody>
                {upcomingFollowUps.map(f => (
                  <tr key={f._id}>
                    <td><strong>{f.subject}</strong></td>
                    <td><span className="badge badge-blue">{f.followUpType}</span></td>
                    <td>{fmtDate(f.followUpDate)}</td>
                    <td><span className="text-muted">{f.customer?.customerName || f.lead?.leadName || '—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
