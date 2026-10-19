import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/index.js";
import useAsync from "../../hooks/useAsync.js";
import Button from "../../components/Button.jsx";
import Card from "../../components/Card.jsx";
import DataTable from "../../components/DataTable.jsx";
import FormField from "../../components/FormField.jsx";
import Loading from "../../components/Loading.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatusPill from "../../components/StatusPill.jsx";

export function SprayAdvisory() {
  const { data, loading, error, reload } = useAsync(api.agentAdvisories);
  const [farmId, setFarmId] = useState("");
  const [sent, setSent] = useState(false);
  if (loading || !data) return <Loading error={error} onRetry={reload} />;

  const selected = data.find((item) => item.farmId === (farmId || data[0].farmId));
  const safe = selected.directive === "Safe to spray";

  return (
    <div className="stack">
      <PageHeader bar="Agent" title="Spray advisory" subtitle="Safety directive and forecast confidence are separate" />
      <div className="grid grid-main-side">
        <Card title="Farm-specific spray guidance">
          <div className="stack">
            <FormField
              label="Choose farm"
              kind="select"
              value={selected.farmId}
              onChange={(e) => {
                setFarmId(e.target.value);
                setSent(false);
              }}
              options={data.map((item) => ({ value: item.farmId, label: item.label }))}
            />
            <div>
              <StatusPill tone={safe ? "success" : "danger"}>{selected.directive.toUpperCase()}</StatusPill>
            </div>
            <h3>Forecast confidence: {selected.confidence}</h3>
            <p className="muted">Check conditions before sharing with farmers.</p>
            <div>
              <Button onClick={() => setSent(true)} disabled={sent}>
                Send advisory SMS
              </Button>
            </div>
          </div>
        </Card>
        <Card title="Safety note" subtitle="Use the directive shown for the selected farm">
          <div className="kv">
            <strong>Directive: {selected.directive}</strong>
            <span>Confidence: {selected.confidence}</span>
            <span className="muted">SMS delivery: {sent ? "Queued" : selected.smsStatus}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function SmsHistory() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(api.agentSmsMessages);
  if (loading || !data) return <Loading error={error} onRetry={reload} />;
  const columns = [
    { key: "message", label: "Message" },
    { key: "date", label: "Date" },
    { key: "recipients", label: "Recipients" },
    { key: "status", label: "Status", render: (row) => <StatusPill>{row.status}</StatusPill> },
    {
      key: "action",
      label: "Action",
      render: (row) => (
        <button type="button" className="link-button" onClick={() => navigate(`/agent/sms/${row.id}`)}>
          View
        </button>
      ),
    },
  ];
  return (
    <div className="stack">
      <PageHeader bar="Agent" title="SMS history" subtitle="View message delivery status and return to the list" />
      <Card>
        <DataTable columns={columns} rows={data} empty="No SMS messages have been sent yet." />
      </Card>
    </div>
  );
}

export function SmsDetails() {
  const { id } = useParams();
  const { data, loading, error, reload } = useAsync(api.agentSmsMessages);
  if (loading || !data) return <Loading error={error} onRetry={reload} />;
  const message = data.find((item) => item.id === id);
  if (!message) return <p className="notice notice-warning">Message not found.</p>;
  return (
    <div className="stack">
      <PageHeader bar="Agent" title="SMS details" subtitle="Message details and delivery outcomes" />
      <div>
        <Button variant="secondary" as={Link} to="/agent/sms">
          ‹ Back to SMS list
        </Button>
      </div>
      <Card title={message.message} subtitle={`${message.dateLong} • ${message.recipients} recipients`}>
        <div className="stack">
          <div>
            <StatusPill>{message.status}</StatusPill>
          </div>
          <div>
            <div className="small muted">Message</div>
            <p>{message.text}</p>
          </div>
          <strong>
            Delivered: {message.delivered} · Pending: {message.pending} · Failed: {message.failed}
          </strong>
        </div>
      </Card>
    </div>
  );
}

// NOT IN THE DESIGN: the sidebar lists "Alert Monitoring" but no screen was provided.
// This placeholder reuses the recent advisory activity until the designer supplies one.
export function AlertMonitoring() {
  const { data, loading, error, reload } = useAsync(api.agentOverview);
  if (loading || !data) return <Loading error={error} onRetry={reload} />;
  const columns = [
    { key: "farmer", label: "Farmer" },
    { key: "farmId", label: "Farm ID" },
    { key: "risk", label: "Weather risk", render: (row) => <StatusPill>{row.risk}</StatusPill> },
    { key: "sms", label: "SMS status", render: (row) => <StatusPill>{row.sms}</StatusPill> },
    { key: "sentAt", label: "Sent at" },
  ];
  return (
    <div className="stack">
      <PageHeader bar="Agent" title="Alert monitoring" subtitle="Placeholder screen: no design provided yet" />
      <Card>
        <DataTable columns={columns} rows={data.recent} empty="No recent alert activity." />
      </Card>
    </div>
  );
}
