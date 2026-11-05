import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/index.js";
import { ApiError } from "../../api/client.js";
import useAsync from "../../hooks/useAsync.js";
import Button from "../../components/Button.jsx";
import Card from "../../components/Card.jsx";
import DataTable from "../../components/DataTable.jsx";
import FormField from "../../components/FormField.jsx";
import Loading from "../../components/Loading.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import StatusPill from "../../components/StatusPill.jsx";

const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time

export function SmsMonitoring() {
  const navigate = useNavigate();
  const [date, setDate] = useState(today);
  const [page, setPage] = useState(1);
  const stats = useAsync(() => api.adminSmsStats(date), [date]);
  const log = useAsync(() => api.adminAlerts({ date, page }), [date, page]);
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
      <div style={{ maxWidth: 220 }}>
        <FormField
          label="Date"
          type="date"
          value={date}
          max={today()}
          onChange={(e) => {
            setDate(e.target.value || today());
            setPage(1);
          }}
        />
      </div>
      {stats.data ? (
        <div className="grid grid-4">
          {stats.data.map((tile) => (
            <StatCard key={tile.label} {...tile} />
          ))}
        </div>
      ) : (
        <Loading error={stats.error} onRetry={stats.reload} />
      )}
      <Card title="Alert delivery log" subtitle="Traceable by farmer, farm, API, gateway status and feedback">
        {log.data ? (
          <div className="stack">
            <DataTable
              columns={columns}
              rows={log.data.rows}
              onRowClick={(row) => navigate(`/admin/sms/${row.id}`)}
              empty="No alerts were sent on this date."
            />
            {log.data.totalPages > 1 ? (
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="muted small">
                  Page {log.data.page} of {log.data.totalPages} • {log.data.count} alerts
                </span>
                <div className="row">
                  <Button variant="secondary" disabled={page <= 1 || log.loading} onClick={() => setPage(page - 1)}>
                    Previous
                  </Button>
                  <Button variant="secondary" disabled={page >= log.data.totalPages || log.loading} onClick={() => setPage(page + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <Loading error={log.error} onRetry={log.reload} />
        )}
      </Card>
    </div>
  );
}

export function AlertDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: alert, loading, error, reload } = useAsync(() => api.adminAlertDetail(id), [id]);
  if (error instanceof ApiError && error.status === 404) return <p className="notice notice-warning">Alert not found.</p>;
  if (loading || !alert) return <Loading error={error} onRetry={reload} />;

  // The alert only has the farmer's code, but the farmer page opens by ID, so look it up in the list.
  async function openFarmer() {
    try {
      const farmers = await api.adminFarmers();
      const farmer = farmers.find((row) => row.code === alert.farmerCode);
      navigate(farmer ? `/admin/farmers/${farmer.id}` : "/admin/farmers");
    } catch {
      navigate("/admin/farmers");
    }
  }

  return (
    <div className="stack">
      <PageHeader title="Automated alert delivery detail" subtitle="Read-only delivery investigation: no manual SMS control" />
      <Card title={`Alert ${alert.id}`}>
        <div className="kv">
          <span>
            Weather {alert.api} · Forecast event {alert.forecastEventId} · Farmer {alert.farmerCode}
            {alert.farmerName ? ` (${alert.farmerName})` : ""}
          </span>
          <span>
            Farm {alert.farmCode}
            {alert.farmName ? ` (${alert.farmName})` : ""}
            {alert.smsId ? ` · SMS ${alert.smsId} · Gateway message ID ${alert.gatewayMessageId}` : ""}
          </span>
          <div>
            Status: <StatusPill>{alert.status}</StatusPill>
            {alert.failureReason ? <span className="error-text"> {alert.failureReason}</span> : null}
          </div>
          {alert.sentAt ? <span className="muted small">Sent: {alert.sentAt}</span> : null}
        </div>
      </Card>
      <Card title="Recovery">
        <div className="kv">
          {alert.recovery ? (
            <>
              <span className="notice notice-warning">{alert.recovery}</span>
              <span className="muted small">Send attempts: {alert.attempts}</span>
            </>
          ) : (
            <span className="muted">This advisory was not sent by SMS.</span>
          )}
          <span>
            <button type="button" className="link-button" onClick={openFarmer}>
              Open farmer
            </button>
            {" | "}
            <Link className="link-button" to="/admin/reports">
              Open API comparison
            </Link>
          </span>
        </div>
      </Card>
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
                    {item.value} / {item.percentLabel ?? `${item.percent}%`}
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
