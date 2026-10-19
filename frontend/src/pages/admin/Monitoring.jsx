import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/index.js";
import useAsync from "../../hooks/useAsync.js";
import Button from "../../components/Button.jsx";
import Card from "../../components/Card.jsx";
import DataTable from "../../components/DataTable.jsx";
import Loading from "../../components/Loading.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import StatusPill from "../../components/StatusPill.jsx";

// MOCK summary tiles from the design.
const SMS_TILES = [
  { label: "Generated", value: "1,000", note: "All alerts" },
  { label: "Delivered", value: "940", note: "94.0%" },
  { label: "Failed", value: "35", note: "3.5%" },
  { label: "Queued", value: "25", note: "2.5%" },
];

export function SmsMonitoring() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(api.adminAlerts);
  if (loading || !data) return <Loading error={error} onRetry={reload} />;
  const columns = [
    { key: "id", label: "Alert ID" },
    { key: "farm", label: "Farmer / Farm", render: (row) => `${row.farmerId} / ${row.farmId}` },
    { key: "api", label: "Source" },
    { key: "delivery", label: "Delivery status", render: (row) => <StatusPill>{row.delivery}</StatusPill> },
    { key: "feedback", label: "Farmer feedback", render: (row) => <StatusPill>{row.feedback}</StatusPill> },
    { key: "sentAt", label: "Sent at" },
  ];
  return (
    <div className="stack">
      <PageHeader title="SMS management" subtitle="Separate delivery facts from forecast performance" />
      <div className="grid grid-4">
        {SMS_TILES.map((tile) => (
          <StatCard key={tile.label} {...tile} />
        ))}
      </div>
      <Card title="Alert delivery log" subtitle="Traceable by farmer, farm, API, gateway status and feedback">
        <DataTable
          columns={columns}
          rows={data}
          onRowClick={(row) => navigate(`/admin/sms/${row.id}`)}
          empty="No alerts have been generated yet."
        />
      </Card>
    </div>
  );
}

export function AlertDetail() {
  const { id } = useParams();
  const { data, loading, error, reload } = useAsync(
    () => Promise.all([api.adminAlerts(), api.adminAlertDetail()]),
    [id],
  );
  if (loading || !data) return <Loading error={error} onRetry={reload} />;
  const [alerts, extra] = data;
  const alert = alerts.find((item) => item.id === id);
  if (!alert) return <p className="notice notice-warning">Alert not found.</p>;
  const detail = extra.id === alert.id ? extra : null;

  return (
    <div className="stack">
      <PageHeader title="Automated alert delivery detail" subtitle="Read-only delivery investigation: no manual SMS control" />
      <Card title={`Alert ${alert.id}`}>
        <div className="kv">
          <span>
            Weather {alert.api}
            {detail ? ` · Forecast event ${detail.forecastEventId}` : ""} · Farmer {alert.farmerId}
          </span>
          <span>
            Farm {alert.farmId}
            {detail ? ` · SMS ${detail.smsId} · Gateway message ID ${detail.gatewayMessageId}` : ""}
          </span>
          <div>
            Status: <StatusPill>{alert.delivery}</StatusPill>
            {detail ? <span className="error-text"> {detail.failureReason}</span> : null}
          </div>
          <span className="muted small">Sent: {alert.sentAt}</span>
        </div>
      </Card>
      {detail ? (
        <Card title="Recovery">
          <div className="kv">
            <span className="notice notice-warning">{detail.recovery}</span>
            <span>
              <Link className="link-button" to={`/admin/farmers/${alert.farmerId}`}>
                Open farmer
              </Link>
              {" | "}
              <Link className="link-button" to="/admin/reports">
                Open API comparison
              </Link>
            </span>
          </div>
        </Card>
      ) : (
        <p className="muted small">No further delivery detail in the sample data for this alert.</p>
      )}
      <div>
        <Button variant="secondary" as={Link} to="/admin/sms">
          Back to SMS management
        </Button>
      </div>
    </div>
  );
}

export function Reports() {
  const { data, loading, error, reload } = useAsync(api.adminReports);
  if (loading || !data) return <Loading error={error} onRetry={reload} />;
  const columns = [
    { key: "provider", label: "Provider" },
    { key: "assigned", label: "Assigned farmers" },
    { key: "sent", label: "Sent" },
    { key: "delivered", label: "Delivered" },
    { key: "failed", label: "Failed" },
    { key: "pending", label: "Pending" },
    { key: "feedback", label: "Feedback" },
    { key: "accuracy", label: "Reported accuracy" },
  ];
  return (
    <div className="stack">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Compare forecast quality, delivery and farmer-reported outcomes"
        actions={<span className="card" style={{ padding: "8px 14px" }}>{data.dateLabel}</span>}
      />
      <div className="grid grid-4">
        {data.stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <Card title="Provider comparison" subtitle="Accuracy is farmer-reported; validate against observed weather before final selection">
        <DataTable columns={columns} rows={data.providers} />
      </Card>
      <div className="grid grid-2">
        <Card title="Delivery outcomes" subtitle="SMS gateway outcomes are not forecast-quality outcomes">
          <div className="stack">
            {data.outcomes.map((item) => (
              <div key={item.label}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span>{item.label}</span>
                  <strong>
                    {item.value} / {item.percent}%
                  </strong>
                </div>
                <div className={`progress ${item.tone}`.trim()}>
                  <span style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Evaluation methodology" subtitle="How to interpret this pilot">
          <ol className="kv" style={{ paddingLeft: 18, margin: 0 }}>
            {data.methodology.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
