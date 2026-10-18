// tone: "good" | "bad" colours the note line.
export default function StatCard({ label, value, note, tone }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {note ? <div className={`stat-note ${tone || ""}`.trim()}>{note}</div> : null}
    </div>
  );
}
