import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getTodayClasses, getAttendanceSummary, getNotifications } from '../../services/api';
import StatCard from '../../components/StatCard';

export default function Dashboard() {
  const { user } = useAuth();
  const socket = useSocket();
  const [todayData, setTodayData] = useState({ day: '', classes: [] });
  const [attData, setAttData] = useState({ subjects: [], overall: { total: 0, attended: 0, percentage: 0 } });
  const [notifData, setNotifData] = useState({ notifications: [], recent_attendance: [] });

  useEffect(() => {
    getTodayClasses().then(r => setTodayData(r.data)).catch(() => {});
    getAttendanceSummary().then(r => setAttData(r.data)).catch(() => {});
    getNotifications().then(r => setNotifData(r.data)).catch(() => {});
  }, []);

  // Listen for real-time attendance events
  useEffect(() => {
    if (!socket) return;
    socket.on('attendance:new', () => {
      getAttendanceSummary().then(r => setAttData(r.data)).catch(() => {});
      getNotifications().then(r => setNotifData(r.data)).catch(() => {});
    });
    return () => socket.off('attendance:new');
  }, [socket]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 5) return 'Good Night! 🌙';
    if (h < 12) return 'Good Morning! ☀️';
    if (h < 17) return 'Good Afternoon! 🌤️';
    if (h < 21) return 'Good Evening! 🌇';
    return 'Good Night! 🌙';
  };

  const initial = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const alerts = attData.subjects.filter(s => s.percentage < 75);
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="page-wrapper">
      <div className="dashboard-layout">
        {/* LEFT SIDEBAR */}
        <aside className="left-sidebar">
          <div className="sidebar-scroll">
            <div className="greet-card">
              <div className="greet-time">{getGreeting()}</div>
              <div className="greet-name">Hi, {user?.name?.split(' ')[0]}!</div>
              <div className="greet-msg">Have a great day at college.</div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title"><div className="icon">📚</div> Today's Classes</div>
                <span className="badge badge-primary">{todayData.day}</span>
              </div>
              {todayData.classes.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">🎉</div><h3>No classes today!</h3></div>
              ) : (
                todayData.classes.map(cls => {
                  const [sh, sm] = cls.start_time.split(':').map(Number);
                  const [eh, em] = cls.end_time.split(':').map(Number);
                  const isNow = nowMins >= sh * 60 + sm - 10 && nowMins <= eh * 60 + em;
                  const isDone = nowMins > eh * 60 + em;
                  return (
                    <div key={cls.id} className={`course-card ${isNow ? 'ongoing' : ''}`}>
                      {isNow && (
                        <div style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span className="live-dot"></span> ONGOING
                        </div>
                      )}
                      <div className="course-name" style={isDone ? { opacity: 0.5 } : {}}>{cls.subject_name}</div>
                      <div className="course-time">🕐 {cls.start_time} – {cls.end_time}</div>
                      <div className="course-meta"><span>📖 {cls.subject_code}</span></div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '5px' }}>📍 {cls.room} | 👤 {cls.faculty_name}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <StatCard icon="📊" iconClass="primary" value={`${attData.overall.percentage}%`} label="Overall Attendance" />
            <StatCard icon="✅" iconClass="success" value={attData.overall.attended} label="Classes Attended" delay="0.1s" />
            <StatCard icon="❌" iconClass="danger" value={attData.overall.total - attData.overall.attended} label="Classes Missed" delay="0.2s" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Profile card */}
            <div className="profile-card fade-in" style={{ animationDelay: '0.15s' }}>
              <div className="profile-avatar">{initial}</div>
              <div className="profile-name">{user?.name}</div>
              <div className="profile-enrollment">{user?.enrollment_no}</div>
              <span className="badge badge-success" style={{ margin: '0.5rem auto 0', display: 'inline-flex' }}>● Active</span>
              <div className="profile-details">
                <div className="profile-detail-row">🏫 <strong>Branch</strong><span>{user?.branch} Engineering</span></div>
                <div className="profile-detail-row">📅 <strong>Semester</strong><span>Semester {user?.semester}</span></div>
                <div className="profile-detail-row">📧 <strong>Email</strong><span style={{ fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</span></div>
              </div>
            </div>

            {/* Attendance alerts */}
            <div className="card fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="card-header">
                <div className="card-title"><div className="icon">⚠️</div> Attendance Alert</div>
              </div>
              {alerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <div style={{ fontSize: '2rem' }}>✅</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600, marginTop: '0.5rem' }}>Attendance is on track!</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>All subjects above 75%</div>
                </div>
              ) : (
                alerts.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Need {Math.ceil((0.75 * s.total_classes - s.attended) / 0.25)} more classes</div>
                    </div>
                    <span className="badge badge-danger">{s.percentage}%</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Subject-wise Attendance */}
          <div className="card fade-in" style={{ animationDelay: '0.25s' }}>
            <div className="card-header">
              <div className="card-title"><div className="icon">📚</div> Subject-wise Attendance</div>
              <Link to="/attendance" className="btn btn-outline btn-sm">View Details →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
              {attData.subjects.map(s => (
                <Link to={`/attendance?subject=${s.id}`} key={s.id} className="subject-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="subject-header">
                    <div>
                      <div className="subject-code">{s.code}</div>
                      <div className="subject-name">{s.name}</div>
                      <div className="subject-faculty">👤 {s.faculty_name}</div>
                    </div>
                    <div className={`attendance-pct pct-${s.status}`}>{s.percentage}%</div>
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-fill ${s.status}`} style={{ width: `${s.percentage}%` }}></div>
                  </div>
                  <div className="attendance-counts">
                    <span>✅ {s.attended} Present</span>
                    <span>❌ {s.absent} Absent</span>
                    <span>📚 {s.total_classes} Total</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="right-sidebar">
          <div className="sidebar-scroll">
            <div className="card" style={{ marginBottom: '1rem', background: 'linear-gradient(135deg, rgba(13,148,136,0.12), rgba(6,182,212,0.06))' }}>
              <div className="card-title" style={{ marginBottom: '0.75rem' }}><div className="icon">📡</div> RFID System</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Your attendance is automatically marked when you tap your RFID card on the ESP8266 reader at class entry.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--success)' }}>
                <span className="live-dot"></span> System Online
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title"><div className="icon">🔔</div> Recent Activity</div>
                <span className="badge badge-primary">{notifData.recent_attendance.length + notifData.notifications.length}</span>
              </div>
              {notifData.recent_attendance.length + notifData.notifications.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">🔔</div><h3>No recent activity</h3></div>
              ) : (
                <>
                  {notifData.recent_attendance.map((a, i) => {
                    const statusIcon = a.status === 'Present' ? '✅' : a.status === 'Late' ? '⚠️' : '❌';
                    return (
                      <div key={`att-${i}`} className="notification-item">
                        <div className="notification-date">{formatDate(a.date)}</div>
                        <div className="notification-title">{statusIcon} {a.subject_name}</div>
                        <div className="notification-msg">Marked {a.status} at {a.time_in || 'N/A'} via RFID</div>
                      </div>
                    );
                  })}
                  {notifData.notifications.map((n, i) => (
                    <div key={`notif-${i}`} className="notification-item">
                      <div className="notification-date">{formatDate(n.createdAt?.split('T')[0])}</div>
                      <div className="notification-title">🔔 {n.title}</div>
                      <div className="notification-msg">{n.message}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
