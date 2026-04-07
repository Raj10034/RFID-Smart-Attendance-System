export default function StatCard({ icon, iconClass, value, label, delay = '0s' }) {
  return (
    <div className="stat-card fade-in" style={{ animationDelay: delay }}>
      <div className={`stat-icon ${iconClass}`}>{icon}</div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
