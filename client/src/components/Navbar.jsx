import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const initial = user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  const isAdmin = role === 'admin';

  const studentLinks = [
    { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/attendance', icon: '📊', label: 'Attendance' },
    { to: '/timetable', icon: '📅', label: 'Timetable' },
  ];

  const adminLinks = [
    { to: '/admin', icon: '📊', label: 'Dashboard' },
    { to: '/admin/students', icon: '👥', label: 'Students' },
    { to: '/admin/attendance', icon: '📋', label: 'Attendance' },
    { to: '/admin/devices', icon: '📡', label: 'Devices' },
  ];

  const links = isAdmin ? adminLinks : studentLinks;

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await logout();
    }
  };

  return (
    <nav className="navbar">
      <Link to={isAdmin ? '/admin' : '/dashboard'} className="navbar-brand">
        <div className="brand-icon">{isAdmin ? '⚙️' : '🎓'}</div>
        <div className="brand-text">
          <span className="brand-name">{isAdmin ? 'Admin Panel' : 'RF Attendance'}</span>
          <span className="brand-sub">{isAdmin ? 'RF Attendance System' : 'Smart RFID System'}</span>
        </div>
      </Link>

      <ul className="navbar-nav">
        {links.map(link => (
          <li key={link.to}>
            <Link
              to={link.to}
              className={location.pathname === link.to ? 'active' : ''}
            >
              {link.icon} {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="navbar-user" onClick={handleLogout}>
        <div className="avatar">{initial}</div>
        <div className="user-info">
          <span className="user-name">{user.name?.split(' ')[0]}</span>
          <span className="user-role">{isAdmin ? 'Administrator' : 'Student'}</span>
        </div>
        <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>⏻</span>
      </div>
    </nav>
  );
}
