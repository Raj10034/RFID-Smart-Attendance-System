import { useEffect, useState } from 'react';
import { getAdminDevices, addAdminDevice } from '../../services/api';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';

export default function AdminDevices() {
  const [devices, setDevices] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ device_id: '', location: '', secret_key: 'esp8266_secret_key_2024' });
  const showToast = useToast();

  const load = () => getAdminDevices().then(r => setDevices(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    try {
      const { data } = await addAdminDevice(form);
      if (data.success) {
        setShowAdd(false);
        showToast('Device added!', 'success');
        setForm({ device_id: '', location: '', secret_key: 'esp8266_secret_key_2024' });
        load();
      }
    } catch (err) {
      showToast('Error: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never';

  return (
    <div className="page-wrapper">
      <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }} className="fade-in">
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>📡 RFID Devices</h1>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Device</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {devices.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📡</div><h3>No devices registered</h3></div>
          ) : devices.map(d => (
            <div key={d._id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: '48px', height: '48px', background: 'rgba(13,148,136,0.15)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📡</div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{d.device_id}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.location}</div>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                <strong style={{ color: 'var(--text-secondary)' }}>Key:</strong> <code style={{ color: 'var(--primary-light)' }}>{d.secret_key}</code>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text-secondary)' }}>Last seen:</strong> {formatDate(d.last_seen)}
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <span className={`badge badge-${d.status === 'active' ? 'success' : 'danger'}`}>{d.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="+ Add ESP8266 Device">
        <div className="form-group"><label className="form-label">Device ID</label><input className="form-control" value={form.device_id} onChange={e => setForm({ ...form, device_id: e.target.value })} placeholder="ESP02" /></div>
        <div className="form-group"><label className="form-label">Location</label><input className="form-control" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Lab Block - Room 201" /></div>
        <div className="form-group"><label className="form-label">Secret Key</label><input className="form-control" value={form.secret_key} onChange={e => setForm({ ...form, secret_key: e.target.value })} placeholder="unique_secret_key" /></div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAdd}>Add Device</button>
        </div>
      </Modal>
    </div>
  );
}
