import { api } from "../../api/index.js";
import useAsync from "../../hooks/useAsync.js";
import Card from "../../components/Card.jsx";
import DataTable from "../../components/DataTable.jsx";
import Loading from "../../components/Loading.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import StatusPill from "../../components/StatusPill.jsx";

export default function AdminOverview() {
  const { data, loading, error, reload } = useAsync(api.adminOverview);
  if (loading || !data) return <Loading error={error} onRetry={reload} />;

  const apiColumns = [
    { key: "api", label: "API" },
    { key: "farmers", label: "Farmers" },
    { key: "alerts", label: "Alerts" },
    { key: "delivered", label: "Delivered" },
    { key: "failed", label: "Failed" },
    { key: "pending", label: "Pending" },
    { key: "accuracy", label: "Accuracy" },
  ];
  const activityColumns = [
    { key: "time", label: "Time" },
    { key: "event", label: "Event" },
    { key: "record", label: "Record" },
    { key: "api", label: "API" },
    { key: "status", label: "Status", render: (row) => <StatusPill>{row.status}</StatusPill> },
  ];

  return (
    <div className="stack">
      <PageHeader
        title="Operations overview"
        subtitle="Tomato farmers only • Pilot comparison • Live operations sample"
        actions={<span className="card" style={{ padding: "8px 14px" }}>{data.dateLabel}</span>}
      />

      <div className="grid grid-4">
        {data.stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-main-side">
        <Card title="Weather API pilot performance" subtitle="Comparable groups • delivery is not forecast accuracy">
          <DataTable columns={apiColumns} rows={data.apiPerformance} />
        </Card>
        <Card title="Requires attention" subtitle="Operational issues to investigate">
          <div className="stack">
            {data.attention.map((item) => (
              <div key={item.id} className="kv">
                <div>
                  <StatusPill tone={item.tone}>{item.label}</StatusPill>
                </div>
                <span>{item.detail}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-main-side">
        <Card title="Recent system activity" subtitle="Traceable events with farmer, farm and provider identifiers">
          <DataTable columns={activityColumns} rows={data.activity} />
        </Card>
        <Card title="Pilot decision readiness" subtitle="Use multiple signals, not SMS delivery alone">
          <div className="kv">
            <div>
              <div className="small muted">Forecast accuracy</div>
              <strong>{data.readiness.accuracy}</strong>
            </div>
            <div>
              <div className="small muted">Feedback sample</div>
              <strong>{data.readiness.feedbackSample}</strong>
            </div>
            <div>
              <div className="small muted">Decision status</div>
              <StatusPill tone="warning">{data.readiness.decision}</StatusPill>
            </div>
            <span className="muted small">{data.readiness.note}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
