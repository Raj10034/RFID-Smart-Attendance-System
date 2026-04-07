import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getFullTimetable } from '../../services/api';

export default function Timetable() {
  const { user } = useAuth();
  const [allClasses, setAllClasses] = useState([]);
  const [activeDay, setActiveDay] = useState('All');

  useEffect(() => {
    getFullTimetable().then(({ data }) => {
      setAllClasses(data);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = days[new Date().getDay()];
      if (data.some(c => c.day_of_week === today)) setActiveDay(today);
    }).catch(() => {});
  }, []);

  const dayTabs = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const filtered = activeDay === 'All' ? allClasses : allClasses.filter(c => c.day_of_week === activeDay);

  const renderTable = (classes) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();

    return (
      <table className="data-table">
        <thead>
          <tr><th>Time</th><th>Subject</th><th>Code</th><th>Faculty</th><th>Room</th><th>Status</th></tr>
        </thead>
        <tbody>
          {classes.map((c, i) => {
            const [sh, sm] = c.start_time.split(':').map(Number);
            const [eh, em] = c.end_time.split(':').map(Number);
            const isToday = c.day_of_week === today;
            const isNow = isToday && nowMins >= sh * 60 + sm - 10 && nowMins <= eh * 60 + em;
            const isDone = isToday && nowMins > eh * 60 + em;
            return (
              <tr key={i} style={isNow ? { background: 'rgba(13,148,136,0.08)' } : {}}>
                <td style={{ fontWeight: 600, color: 'var(--primary-light)', whiteSpace: 'nowrap' }}>{c.start_time} – {c.end_time}</td>
                <td style={{ fontWeight: 600, color: isDone ? 'var(--text-muted)' : 'var(--text-primary)' }}>{c.subject_name}</td>
                <td><span className="badge badge-primary">{c.subject_code}</span></td>
                <td style={{ color: 'var(--text-muted)' }}>👤 {c.faculty_name}</td>
                <td style={{ color: 'var(--text-muted)' }}>📍 {c.room}</td>
                <td>
                  {isNow ? <span className="badge badge-success" style={{ animation: 'pulse 1.5s ease infinite' }}>🔴 Live</span> :
                    isDone ? <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>✓ Done</span> :
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>⏳ Upcoming</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  const renderContent = () => {
    if (filtered.length === 0) {
      return <div className="empty-state"><div className="empty-icon">🎉</div><h3>No classes on this day!</h3></div>;
    }

    if (activeDay === 'All') {
      const byDay = {};
      filtered.forEach(c => { if (!byDay[c.day_of_week]) byDay[c.day_of_week] = []; byDay[c.day_of_week].push(c); });
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      return dayOrder.filter(d => byDay[d]).map(d => (
        <div key={d} style={{ marginBottom: '1.5rem' }}>
          <div className="section-title">{d}</div>
          {renderTable(byDay[d])}
        </div>
      ));
    }

    return renderTable(filtered);
  };

  return (
    <div className="page-wrapper">
      <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }} className="fade-in">
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>📅 Weekly Timetable</h1>
          <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Your class schedule for the week</p>
        </div>

        <div className="tab-buttons">
          {dayTabs.map(d => (
            <button key={d} className={`tab-btn ${activeDay === d ? 'active' : ''}`} onClick={() => setActiveDay(d)}>
              {d === 'All' ? 'All Days' : d.slice(0, 3)}
            </button>
          ))}
        </div>

        <div className="card fade-in">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
