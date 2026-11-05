import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { RiLockPasswordLine, RiMailLine, RiShieldCheckLine, RiTeamLine, RiLineChartLine } from 'react-icons/ri';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, pwd) => setForm({ email, password: pwd });

  return (
    <div className="login-page">
      {/* Brand panel */}
      <div className="login-brand">
        <div>
          <div className="login-brand-logo">Acxiom<span>CRM</span></div>
          <div className="login-brand-tagline">Enterprise CRM — Built for Modern Sales Teams</div>
          <div className="login-brand-features">
            {[
              { icon: <RiTeamLine />,       text: 'Role-based access for Admins, Managers & Sales Executives' },
              { icon: <RiLineChartLine />,  text: 'Live dashboard with KPIs & Chart.js analytics' },
              { icon: <RiShieldCheckLine />, text: 'JWT authentication + account lockout protection' },
              { icon: <RiLineChartLine />,  text: 'Atomic lead conversion — Customer + Opportunity in one click' },
            ].map((f, i) => (
              <div key={i} className="login-feature">
                <div className="login-feature-icon">{f.icon}</div>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="login-form-side">
        <div className="login-box">
          <h2>Sign In</h2>
          <p className="login-sub">Access your CRM workspace</p>

          {/* Demo credentials */}
          <div className="login-demo">
            <div style={{ marginBottom: 6, fontWeight: 600, color: 'var(--text-primary)' }}>Demo Credentials</div>
            {[
              { label: 'Admin',   email: 'admin@acxiomcrm.com',   pwd: 'Admin@123' },
              { label: 'Manager', email: 'manager@acxiomcrm.com', pwd: 'Manager@123' },
              { label: 'Sales',   email: 'sales@acxiomcrm.com',   pwd: 'Sales@123' },
            ].map((d) => (
              <span key={d.label}
                onClick={() => fillDemo(d.email, d.pwd)}
                style={{ marginRight: 10, cursor: 'pointer', textDecoration: 'underline' }}
              >
                <strong>{d.label}</strong>
              </span>
            ))}
            <span style={{ fontSize: '0.75rem' }}>(click to fill)</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                <RiMailLine style={{ marginRight: 4 }} />Email Address
              </label>
              <input className="form-control" type="email" placeholder="admin@acxiomcrm.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">
                <RiLockPasswordLine style={{ marginRight: 4 }} />Password
              </label>
              <input className="form-control" type="password" placeholder="••••••••"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '12px' }}>
              {loading ? <span className="spinner" /> : 'Sign In →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
