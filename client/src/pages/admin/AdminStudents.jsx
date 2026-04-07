import { useEffect, useState } from 'react';
import { getAdminStudents, addAdminStudent, updateStudentRfid, deleteAdminStudent } from '../../services/api';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showRfid, setShowRfid] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [rfidValue, setRfidValue] = useState('');
  const [form, setForm] = useState({ name: '', enrollment_no: '', email: '', password: '', rfid_tag: '', branch: '', semester: 6, phone: '' });
  const showToast = useToast();

  const load = () => getAdminStudents().then(r => setStudents(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.enrollment_no.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const { data } = await addAdminStudent({ ...form, semester: parseInt(form.semester), year: new Date().getFullYear() });
      if (data.success) {
        setShowAdd(false);
        showToast('Student added successfully!', 'success');
        setForm({ name: '', enrollment_no: '', email: '', password: '', rfid_tag: '', branch: '', semester: 6, phone: '' });
        load();
      }
    } catch (err) {
      showToast('Error: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  const handleRfid = async () => {
    if (!rfidValue.trim()) return showToast('Enter a valid RFID tag', 'error');
    try {
      const { data } = await updateStudentRfid(editingStudent._id, rfidValue.trim().toUpperCase());
      if (data.success) {
        setShowRfid(false);
        showToast('RFID assigned!', 'success');
        load();
      }
    } catch (err) {
      showToast('Error: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student? This action cannot be undone.')) return;
    await deleteAdminStudent(id);
    showToast('Student deleted', 'info');
    load();
  };

  return (
    <div className="page-wrapper">
      <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }} className="fade-in">
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>👥 Student Management</h1>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Student</button>
        </div>

        <div className="card fade-in">
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div className="search-box" style={{ flex: 1 }}>
              🔍 <input type="text" placeholder="Search by name, enrollment, or email..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Name</th><th>Enrollment</th><th>Email</th><th>Branch/Sem</th><th>RFID Tag</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No students found</td></tr>
                ) : filtered.map((s, i) => (
                  <tr key={s._id}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</td>
                    <td style={{ color: 'var(--primary-light)', fontWeight: 600 }}>{s.enrollment_no}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{s.email}</td>
                    <td><span className="badge badge-primary">{s.branch}</span> Sem {s.semester}</td>
                    <td>
                      {s.rfid_tag
                        ? <span className="badge badge-success">📡 {s.rfid_tag}</span>
                        : <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>Not assigned</span>}
                    </td>
                    <td><span className={`badge badge-${s.status === 'Active' ? 'success' : 'danger'}`}>{s.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => { setEditingStudent(s); setRfidValue(''); setShowRfid(true); }}>📡 RFID</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id)}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="+ Add New Student">
        <form onSubmit={handleAdd}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group"><label className="form-label">Full Name *</label><input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Aarav Mehta" /></div>
            <div className="form-group"><label className="form-label">Enrollment No *</label><input className="form-control" value={form.enrollment_no} onChange={e => setForm({ ...form, enrollment_no: e.target.value })} required placeholder="23BSCS01" /></div>
            <div className="form-group"><label className="form-label">Email *</label><input className="form-control" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="student@college.edu" /></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" /></div>
            <div className="form-group"><label className="form-label">Branch *</label><input className="form-control" value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} required placeholder="CS" /></div>
            <div className="form-group"><label className="form-label">Semester *</label><input className="form-control" type="number" min="1" max="8" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">RFID Tag</label><input className="form-control" value={form.rfid_tag} onChange={e => setForm({ ...form, rfid_tag: e.target.value })} placeholder="RFID004" /></div>
            <div className="form-group"><label className="form-label">Password</label><input className="form-control" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="student123 (default)" /></div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Student</button>
          </div>
        </form>
      </Modal>

      {/* Edit RFID Modal */}
      <Modal isOpen={showRfid} onClose={() => setShowRfid(false)} title="📡 Assign RFID Tag">
        <p style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>Assigning RFID to: <strong style={{ color: 'var(--primary-light)' }}>{editingStudent?.name}</strong></p>
        <div className="form-group">
          <label className="form-label">RFID Tag</label>
          <input className="form-control" value={rfidValue} onChange={e => setRfidValue(e.target.value)} placeholder="e.g. RFID004 or hex code" />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => setShowRfid(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleRfid}>Save</button>
        </div>
      </Modal>
    </div>
  );
}
