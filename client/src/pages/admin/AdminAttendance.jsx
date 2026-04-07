import { useEffect, useState } from 'react';
import { getAdminAttendance, getAdminStudents, getAdminSubjects, markManualAttendance } from '../../services/api';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';

export default function AdminAttendance() {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ student_id: '', subject_id: '', date: '', status: 'Present' });
  const showToast = useToast();

  useEffect(() => {
    getAdminStudents().then(r => setStudents(r.data)).catch(() => {});
    getAdminSubjects().then(r => setSubjects(r.data)).catch(() => {});
  }, []);

  const loadLogs = () => {
    const params = {};
    if (dateFilter) params.date = dateFilter;
    if (studentFilter) params.student_id = studentFilter;
    getAdminAttendance(params).then(r => setRecords(r.data)).catch(() => {});
  };

  useEffect(() => {
    if (dateFilter || studentFilter) loadLogs();
  }, [dateFilter, studentFilter]);

  const clearFilters = () => {
    setDateFilter('');
    setStudentFilter('');
    setRecords([]);
  };

  const handleManual = async () => {
    try {
      const { data } = await markManualAttendance(manualForm);
      if (data.success) {
        setShowManual(false);
        showToast('Attendance marked!', 'success');
        loadLogs();
      }
    } catch (err) {
      showToast('Error: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

  return (
    <div className="page-wrapper">
      <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }} className="fade-in">
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>📋 Attendance Logs</h1>
          <button className="btn btn-outline btn-sm" onClick={() => { setManualForm({ ...manualForm, date: new Date().toISOString().split('T')[0] }); setShowManual(true); }}>✏️ Mark Manual</button>
        </div>

        <div className="card fade-in">
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input type="date" className="form-control" style={{ width: '160px' }} value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
            <select className="form-control" style={{ width: '200px' }} value={studentFilter} onChange={e => setStudentFilter(e.target.value)}>
              <option value="">All Students</option>
              {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.enrollment_no})</option>)}
            </select>
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>✕ Clear</button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>Student</th><th>Enrollment</th><th>Subject</th><th>Time In</th><th>Status</th><th>Marked By</th></tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Select filters to load records</td></tr>
                ) : records.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{formatDate(r.date)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.student_name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{r.enrollment_no}</td>
                    <td>{r.subject_name} <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{r.subject_code}</span></td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--primary-light)' }}>{r.time_in || '–'}</td>
                    <td><span className={`badge ${r.status === 'Present' ? 'badge-success' : r.status === 'Late' ? 'badge-warning' : 'badge-danger'}`}>{r.status}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>📡 {r.marked_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={showManual} onClose={() => setShowManual(false)} title="✏️ Manual Attendance">
        <div className="form-group">
          <label className="form-label">Student</label>
          <select className="form-control" value={manualForm.student_id} onChange={e => setManualForm({ ...manualForm, student_id: e.target.value })}>
            <option value="">Select student</option>
            {students.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Subject</label>
          <select className="form-control" value={manualForm.subject_id} onChange={e => setManualForm({ ...manualForm, subject_id: e.target.value })}>
            <option value="">Select subject</option>
            {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Date</label>
          <input type="date" className="form-control" value={manualForm.date} onChange={e => setManualForm({ ...manualForm, date: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-control" value={manualForm.status} onChange={e => setManualForm({ ...manualForm, status: e.target.value })}>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Absent">Absent</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => setShowManual(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleManual}>Mark Attendance</button>
        </div>
      </Modal>
    </div>
  );
}
