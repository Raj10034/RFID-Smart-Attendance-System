import { useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { getAdminStats, getAdminAttendance } from '../../services/api';
import StatCard from '../../components/StatCard';

export default function AdminDashboard() {
  const socket = useSocket();
  const [stats, setStats] = useState({ totalStudents: 0, totalSubjects: 0, todayAttendance: 0, totalAttendance: 0, devices: [] });
  const [todayLog, setTodayLog] = useState([]);
  const [liveRecords, setLiveRecords] = useState([]);

  const loadStats = () => getAdminStats().then(r => setStats(r.data)).catch(() => {});
  const loadToday = () => {
    const today = new Date().toISOString().split('T')[0];
    getAdminAttendance({ date: today }).then(r => setTodayLog(r.data)).catch(() => {});
  };

  useEffect(() => { loadStats(); loadToday(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('attendance:new', (record) => {
      setLiveRecords(prev => [record, ...prev].slice(0, 10));
      loadStats();
      loadToday();
    });
    return () => socket.off('attendance:new');
  }, [socket]);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';
  const displayRecords = liveRecords.length > 0 ? [...liveRecords, ...todayLog] : todayLog;

  return (
    <div className="page-wrapper">
      <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }} className="fade-in">📊 Admin Dashboard</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatCard icon="👥" iconClass="primary" value={stats.totalStudents} label="Total Students" />
          <StatCard icon="📚" iconClass="info" value={stats.totalSubjects} label="Subjects" delay="0.05s" />
          <StatCard icon="✅" iconClass="success" value={stats.todayAttendance} label="Today's Markings" delay="0.1s" />
          <StatCard icon="📡" iconClass="warning" value={stats.totalAttendance} label="Total Records" delay="0.15s" />
        </div>

        {/* ESP8266 API Info */}
        <div className="card fade-in" style={{ animationDelay: '0.2s', marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title"><div className="icon">📡</div> ESP8266 RFID Endpoint</div>
            <span className="badge badge-success"><span className="live-dot"></span> Active</span>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--primary-light)', overflowX: 'auto' }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>// POST Request from ESP8266:</div>
            <div>POST <span style={{ color: 'var(--accent)' }}>http://YOUR_SERVER_IP:3000/api/attendance/mark</span></div>
            <div style={{ marginTop: '0.5rem' }}>Content-Type: application/json</div>
            <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>{'{'}</div>
            <div style={{ paddingLeft: '1rem' }}>"rfid_tag": <span style={{ color: 'var(--warning)' }}>"RFID001"</span>,</div>
            <div style={{ paddingLeft: '1rem' }}>"device_id": <span style={{ color: 'var(--warning)' }}>"ESP01"</span>,</div>
            <div style={{ paddingLeft: '1rem' }}>"secret_key": <span style={{ color: 'var(--warning)' }}>"esp8266_secret_key_2024"</span></div>
            <div>{'}'}</div>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            The ESP8266 sends this request after reading an RFID card. The server automatically determines the current class and marks attendance. Real-time updates appear here via Socket.IO.
          </div>
        </div>

        {/* Live feed indicator */}
        {liveRecords.length > 0 && (
          <div className="card fade-in" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(14,165,233,0.05))', borderColor: 'var(--success-border)' }}>
            <div className="card-header">
              <div className="card-title"><div className="icon">⚡</div> Live RFID Feed</div>
              <span className="badge badge-success"><span className="live-dot"></span> {liveRecords.length} new</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Time</th><th>Student</th><th>Subject</th><th>Status</th></tr></thead>
                <tbody>
                  {liveRecords.map((r, i) => (
                    <tr key={`live-${i}`} style={{ animation: 'fadeIn 0.3s ease' }}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--primary-light)' }}>{r.time_in}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.student_name}</td>
                      <td>{r.subject_name} <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{r.subject_code}</span></td>
                      <td><span className={`badge ${r.status === 'Present' ? 'badge-success' : r.status === 'Late' ? 'badge-warning' : 'badge-danger'}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Today's log */}
        <div className="card fade-in" style={{ animationDelay: '0.25s' }}>
          <div className="card-header">
            <div className="card-title"><div className="icon">📋</div> Today's Attendance Log</div>
          </div>
          {todayLog.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📋</div><h3>No attendance marked today yet</h3></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Time</th><th>Student</th><th>Enrollment</th><th>Subject</th><th>Status</th></tr></thead>
                <tbody>
                  {todayLog.slice(0, 15).map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--primary-light)' }}>{r.time_in || '–'}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.student_name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{r.enrollment_no}</td>
                      <td>{r.subject_name} <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{r.subject_code}</span></td>
                      <td><span className={`badge ${r.status === 'Present' ? 'badge-success' : r.status === 'Late' ? 'badge-warning' : 'badge-danger'}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
