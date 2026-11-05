import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { PageLoader } from './components/common';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/customers/CustomerList';
import CustomerForm from './pages/customers/CustomerForm';
import CustomerDetails from './pages/customers/CustomerDetails';
import LeadList from './pages/leads/LeadList';
import LeadForm from './pages/leads/LeadForm';
import LeadDetails from './pages/leads/LeadDetails';
import ConvertLead from './pages/leads/ConvertLead';
import OpportunityList from './pages/opportunities/OpportunityList';
import OpportunityForm from './pages/opportunities/OpportunityForm';
import OpportunityDetails from './pages/opportunities/OpportunityDetails';
import FollowUpList from './pages/followups/FollowUpList';
import FollowUpForm from './pages/followups/FollowUpForm';
import FollowUpDetails from './pages/followups/FollowUpDetails';
import Reports from './pages/reports/Reports';
import Users from './pages/admin/Users';
import AuditLogs from './pages/admin/AuditLogs';

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="customers" element={<CustomerList />} />
        <Route path="customers/new" element={<CustomerForm />} />
        <Route path="customers/:id" element={<CustomerDetails />} />
        <Route path="customers/:id/edit" element={<CustomerForm />} />
        <Route path="leads" element={<LeadList />} />
        <Route path="leads/new" element={<LeadForm />} />
        <Route path="leads/:id" element={<LeadDetails />} />
        <Route path="leads/:id/edit" element={<LeadForm />} />
        <Route path="leads/:id/convert" element={<ConvertLead />} />
        <Route path="opportunities" element={<OpportunityList />} />
        <Route path="opportunities/new" element={<OpportunityForm />} />
        <Route path="opportunities/:id" element={<OpportunityDetails />} />
        <Route path="opportunities/:id/edit" element={<OpportunityForm />} />
        <Route path="followups" element={<FollowUpList />} />
        <Route path="followups/new" element={<FollowUpForm />} />
        <Route path="followups/:id" element={<FollowUpDetails />} />
        <Route path="followups/:id/edit" element={<FollowUpForm />} />
        <Route path="reports" element={<ProtectedRoute roles={['Admin', 'Manager']}><Reports /></ProtectedRoute>} />
        <Route path="admin/users" element={<ProtectedRoute roles={['Admin']}><Users /></ProtectedRoute>} />
        <Route path="admin/audit-logs" element={<ProtectedRoute roles={['Admin']}><AuditLogs /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
