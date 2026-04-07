import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAttendanceSummary, getSubjectAttendance } from '../../services/api';
import StatCard from '../../components/StatCard';

export default function Attendance() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [subjects, setSubjects] = useState([]);
  const [overall, setOverall] = useState({ total: 0, attended: 0, percentage: 0 });
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [monthFilter, setMonthFilter] = useState('');

  useEffect(() => {
    getAttendanceSummary().then(({ data }) => {
      setSubjects(data.subjects);
      setOverall(data.overall);
      const paramSubject = searchParams.get('subject');
      const firstId = paramSubject || (data.subjects[0]?.id);
      if (firstId) loadDetail(firstId);
    }).catch(() => {});
  }, []);

  const loadDetail = async (subjectId) => {
    setActiveSubjectId(subjectId);
    try {
      const { data } = await getSubjectAttendance(subjectId);
      setDetail(data);
    } catch {}
  };

  const getMonths = () => {
    const months = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      });
    }
    return months;
  };

  const filteredRecords = detail?.records?.filter(r => !monthFilter || r.date.startsWith(monthFilter)) || [];
  const present = filteredRecords.filter(r => r.status === 'Present').length;
  const late = filteredRecords.filter(r => r.status === 'Late').length;
  const absent = filteredRecords.filter(r => r.status === 'Absent').length;
  const subjectSummary = subjects.find(s => s.id === activeSubjectId);

  return (
    <div className="page-wrapper">
      <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }} className="fade-in">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>📊 Attendance Report</h1>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              Subject-wise Attendance – {user?.name} | {user?.enrollment_no} | Sem-{user?.semester}
            </p>
          </div>
          <select className="form-control" style={{ width: '160px' }} value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
            <option value="">All Time</option>
            {getMonths().map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatCard icon="📊" iconClass="primary" value={`${overall.percentage}%`} label="Overall %" />
          <StatCard icon="📚" iconClass="info" value={overall.total} label="Total Classes" delay="0.05s" />
          <StatCard icon="✅" iconClass="success" value={overall.attended} label="Attended" delay="0.1s" />
          <StatCard icon="❌" iconClass="danger" value={overall.total - overall.attended} label="Absent" delay="0.15s" />
        </div>

        <div className="card fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="card-header">
            <div className="card-title"><div className="icon">📚</div> Subject Details</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--success)' }}>■</span> Present
              <span style={{ color: 'var(--warning)' }}>■</span> Late
              <span style={{ color: 'var(--danger)' }}>■</span> Absent
            </div>
          </div>

          <div className="tab-buttons">
            {subjects.map(s => (
              <button key={s.id} className={`tab-btn ${s.id === activeSubjectId ? 'active' : ''}`} onClick={() => loadDetail(s.id)}>
                {s.code}
              </button>
            ))}
          </div>

          {detail ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '1rem', background: 'var(--bg-card-hover)', borderRadius: '14px' }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700 }}>{detail.subject?.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>👤 {detail.subject?.faculty_name}</div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--success)' }}>✅ {present} Present</span>
                  <span style={{ color: 'var(--warning)' }}>⚠️ {late} Late</span>
                  <span style={{ color: 'var(--danger)' }}>❌ {absent} Absent</span>
                  <span className={`badge badge-${subjectSummary?.status === 'good' ? 'success' : subjectSummary?.status === 'warning' ? 'warning' : 'danger'}`}>
                    {subjectSummary?.percentage || 0}%
                  </span>
                </div>
              </div>

              {filteredRecords.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">📋</div><h3>No attendance records found</h3></div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr><th>#</th><th>Date</th><th>Day</th><th>Time In</th><th>Status</th><th>Marked By</th></tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((r, i) => {
                        const d = new Date(r.date);
                        const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
                        const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                        const statusClass = r.status === 'Present' ? 'badge-success' : r.status === 'Late' ? 'badge-warning' : 'badge-danger';
                        const statusIcon = r.status === 'Present' ? '✅' : r.status === 'Late' ? '⚠️' : '❌';
                        return (
                          <tr key={r._id || i}>
                            <td style={{ color: 'var(--text-muted)' }}>{filteredRecords.length - i}</td>
                            <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{dateStr}</td>
                            <td style={{ color: 'var(--text-muted)' }}>{dayName}</td>
                            <td style={{ fontFamily: 'monospace', color: 'var(--primary-light)' }}>{r.time_in || '–'}</td>
                            <td><span className={`badge ${statusClass}`}>{statusIcon} {r.status}</span></td>
                            <td style={{ color: 'var(--text-muted)' }}>📡 {r.marked_by}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state"><div className="empty-icon">📊</div><h3>Select a subject above</h3></div>
          )}
        </div>
      </div>
    </div>
  );
}
