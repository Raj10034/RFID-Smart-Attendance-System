import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginStudent, loginAdmin } from '../services/api';

export default function Login() {
  const [tab, setTab] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, role, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate(role === 'admin' ? '/admin' : '/dashboard', { replace: true });
  }, [user, role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'student') {
        const { data } = await loginStudent(email, password);
        login(data.student, 'student');
        navigate('/dashboard');
      } else {
        const { data } = await loginAdmin(adminUser, adminPass);
        login(data.admin, 'admin');
        navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      {/* Left panel */}
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-brand">
            <div className="login-brand-icon">🎓</div>
            <div>
              <div className="login-brand-name">RF Attendance</div>
              <div className="login-brand-sub">Smart RFID System</div>
            </div>
          </div>
          <h1 className="login-headline">
            Track attendance<br /><span>in real time</span>
          </h1>
          <p className="login-sub">
            Automated RFID-based attendance with live dashboard updates, subject-wise analytics, and timetable integration.
          </p>
          <div className="login-features">
            <div className="login-feature">
              <div className="login-feature-icon">📡</div>
              <div className="login-feature-text"><strong>RFID Scanning</strong> — Tap your card, attendance is instant</div>
            </div>
            <div className="login-feature">
              <div className="login-feature-icon">⚡</div>
              <div className="login-feature-text"><strong>Real-time Updates</strong> — Live Socket.IO dashboard</div>
            </div>
            <div className="login-feature">
              <div className="login-feature-icon">📊</div>
              <div className="login-feature-text"><strong>Analytics</strong> — Subject-wise attendance tracking</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-logo">
            <div className="logo-icon">🎓</div>
            <h1>Welcome Back</h1>
            <p>Sign in to continue</p>
          </div>

          <div className="login-tabs">
            <button className={`login-tab ${tab === 'student' ? 'active' : ''}`} onClick={() => { setTab('student'); setError(''); }}>Student</button>
            <button className={`login-tab ${tab === 'admin' ? 'active' : ''}`} onClick={() => { setTab('admin'); setError(''); }}>Admin</button>
          </div>

          <form onSubmit={handleSubmit}>
            {tab === 'student' ? (
              <>
                <div className="form-group">
                  <label className="form-label">📧 Email Address</label>
                  <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="student@student.edu" autoComplete="email" />
                </div>
                <div className="form-group">
                  <label className="form-label">🔒 Password</label>
                  <input className="form-control" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">👤 Username</label>
                  <input className="form-control" type="text" value={adminUser} onChange={e => setAdminUser(e.target.value)} placeholder="admin" autoComplete="username" />
                </div>
                <div className="form-group">
                  <label className="form-label">🔒 Password</label>
                  <input className="form-control" type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)} placeholder="Enter admin password" autoComplete="current-password" />
                </div>
              </>
            )}
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? <><span className="spinner"></span> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
            <div className="section-title">Demo Credentials</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className="badge badge-primary">Student</span>
                <span>aarav@student.edu</span>
                <span style={{ color: 'var(--border)' }}>•</span>
                <span>student123</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className="badge badge-warning">Admin</span>
                <span>admin</span>
                <span style={{ color: 'var(--border)' }}>•</span>
                <span>admin123</span>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--danger)' }}>
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
