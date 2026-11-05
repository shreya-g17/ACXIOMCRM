import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  RiDashboardLine, RiUserLine, RiFilterLine, RiTrophyLine,
  RiCalendarCheckLine, RiBarChartLine, RiShieldLine, RiLogoutBoxLine,
  RiSettings3Line,
} from 'react-icons/ri';

const NAV = [
  { label: 'Main', items: [
    { to: '/',             icon: <RiDashboardLine />,    label: 'Dashboard' },
    { to: '/customers',   icon: <RiUserLine />,          label: 'Customers' },
    { to: '/leads',       icon: <RiFilterLine />,        label: 'Leads' },
    { to: '/opportunities', icon: <RiTrophyLine />,      label: 'Opportunities' },
    { to: '/followups',   icon: <RiCalendarCheckLine />, label: 'Follow-Ups' },
  ]},
  { label: 'Insights', roles: ['Admin', 'Manager'], items: [
    { to: '/reports',     icon: <RiBarChartLine />,      label: 'Reports' },
  ]},
  { label: 'Admin', roles: ['Admin'], items: [
    { to: '/admin/users',      icon: <RiSettings3Line />, label: 'Manage Users' },
    { to: '/admin/audit-logs', icon: <RiShieldLine />,    label: 'Audit Logs' },
  ]},
];

export default function Sidebar({ open, onNavigate }) {
  const { user, logout, isRole } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo" style={{ cursor:'pointer' }} onClick={() => navigate('/')}>
        <div className="sidebar-logo-icon">A</div>
        <div className="sidebar-logo-text">Acxiom<span>CRM</span></div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV.map((section) => {
          if (section.roles && !isRole(...section.roles)) return null;
          return (
            <div key={section.label}>
              <div className="nav-section-label">{section.label}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to} to={item.to} end={item.to === '/'}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                  onClick={onNavigate}
                >
                  {item.icon}{item.label}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="user-avatar">{user?.fullName?.[0]?.toUpperCase()}</div>
        <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
          <div className="user-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.fullName}</div>
          <div className="user-role">{user?.role}</div>
        </div>
        <button className="btn-icon" onClick={logout} title="Logout">
          <RiLogoutBoxLine />
        </button>
      </div>
    </aside>
  );
}
