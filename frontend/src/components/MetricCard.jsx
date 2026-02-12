export default function MetricCard({ label, value, accent }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ color: accent || "#4f46e5" }}>
        {value}
      </div>
    </div>
  );
}