import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../../api/index.js";
import { FEEDBACK_LABELS } from "../../api/adapters.js";
import useAsync from "../../hooks/useAsync.js";
import Button from "../../components/Button.jsx";
import Card from "../../components/Card.jsx";
import DataTable from "../../components/DataTable.jsx";
import FormField from "../../components/FormField.jsx";
import Loading from "../../components/Loading.jsx";
import Modal from "../../components/Modal.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatusPill, { ratingTone } from "../../components/StatusPill.jsx";


function directiveTone(directive) {
  const key = directive.toLowerCase();
  if (key === "safe to spray") return "success";
  if (key === "do not spray") return "danger";
  return "warning";
}

// Advisory › Daily Feedback: advisories fetched in the last 24 hours, with their feedback status.
export function DailyFeedback() {
  const { data, loading, error, reload } = useAsync(api.agentDailyFeedback);
  const [changes, setChanges] = useState({});
  const [problem, setProblem] = useState("");
  if (loading || !data) return <Loading error={error} onRetry={reload} />;

  // Saves as soon as the agent picks a status; puts the old one back if the save fails.
  async function changeFeedback(row, value) {
    const previous = changes[row.id] || row.feedback;
    setProblem("");
    setChanges((current) => ({ ...current, [row.id]: value }));
    try {
      const updated = await api.agentUpdateFeedback(row.id, value);
      setChanges((current) => ({ ...current, [row.id]: updated.feedback }));
    } catch (err) {
      setChanges((current) => ({ ...current, [row.id]: previous }));
      setProblem(
        err.status === 404
          ? `The advisory for ${row.farmId} is more than 24 hours old and can no longer be updated. Refresh the list.`
          : "The feedback could not be saved. Please try again.",
      );
    }
  }

  const columns = [
    {
      key: "farm",
      label: "Farm / farmer",
      render: (row) => (
        <div>
          <strong>
            {row.farm} • {row.farmId}
          </strong>
          <div>
            <Link className="link-button small" to={`/agent/advisory/farm?farm=${row.farmId}`}>
              View advisory details
            </Link>
          </div>
        </div>
      ),
    },
    {
      key: "directive",
      label: "Advisory",
      render: (row) => <StatusPill tone={directiveTone(row.directive)}>{row.directive}</StatusPill>,
    },
    { key: "fetched", label: "Fetched" },
    {
      key: "feedback",
      label: "Feedback status",
      render: (row) => (
        <FormField
          kind="select"
          aria-label={`Feedback status for ${row.farmId}`}
          value={changes[row.id] || row.feedback}
          onChange={(e) => changeFeedback(row, e.target.value)}
          options={Object.entries(FEEDBACK_LABELS).map(([value, label]) => ({ value, label }))}
        />
      ),
    },
  ];

  return (
    <div className="stack">
      <PageHeader bar="Agent" title="Daily Feedback" subtitle="Advisories fetched in the last 24 hours. Update the feedback status for each advisory." />
      <Card
        title="24-hour advisory window"
        subtitle={`Showing ${data.length} advisories`}
        actions={
          <Button variant="soft" onClick={reload}>
            Refresh list
          </Button>
        }
      >
        {problem ? <p className="notice notice-danger">{problem}</p> : null}
        <DataTable columns={columns} rows={data} empty="No advisories were fetched in the last 24 hours." />
        <p className="hint" style={{ marginTop: 12 }}>
          Status options: Not collected • Accurate • Inaccurate
        </p>
      </Card>
    </div>
  );
}

// Advisory › Farm-Specific Advisory: the latest advisory for one farm, and sending it by SMS.
export function FarmAdvisory() {
  const { data, loading, error, reload } = useAsync(api.agentAdvisories);
  const [searchParams] = useSearchParams();
  const [farmId, setFarmId] = useState(searchParams.get("farm") || "");
  const [sent, setSent] = useState(false);
  const [unchangedOpen, setUnchangedOpen] = useState(false);
  if (loading || !data) return <Loading error={error} onRetry={reload} />;

  const selected = data.find((item) => item.farmId === farmId) || data[0];

  function sendSms() {
    // The backend decides whether the advisory changed since the last SMS.
    if (selected.unchanged) setUnchangedOpen(true);
    else setSent(true);
  }

  return (
    <div className="stack">
      <PageHeader bar="Agent" title="Farm-Specific Advisory" subtitle="Retrieve the latest advisory for one farm and send it to the farmer by SMS." />
      <div className="grid grid-main-side">
        <Card title="Farm-specific guidance">
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
              <StatusPill tone={directiveTone(selected.directive)}>{selected.directive.toUpperCase()}</StatusPill>
            </div>
            <h3>Forecast confidence: {selected.confidence}</h3>
            <p className="muted">Check conditions before sharing this guidance with the farmer.</p>
            <div>
              <div className="small muted">Farmer</div>
              <strong>Assigned farmer • {selected.farmerPhone}</strong>
            </div>
            {sent ? <p className="notice notice-success">Advisory SMS submitted for {selected.label}.</p> : null}
            <div>
              <Button onClick={sendSms} disabled={sent}>
                Send advisory SMS
              </Button>
            </div>
          </div>
        </Card>
        <Card title="Advisory summary">
          <div className="kv">
            <span className="small muted">Directive</span>
            <strong>{selected.directive}</strong>
            <span className="small muted">Confidence</span>
            <span>
              <StatusPill tone={ratingTone(selected.confidence)}>{selected.confidence}</StatusPill>
            </span>
            <span className="small muted">Last SMS</span>
            <span>{sent ? "Submitted just now" : selected.lastSms}</span>
          </div>
          <p className="notice notice-info" style={{ marginTop: 16 }}>
            <strong>SMS validation</strong>
            <br />
            Backend checks whether the advisory has changed since the last SMS.
          </p>
        </Card>
      </div>

      <Modal
        open={unchangedOpen}
        title="Advisory Unchanged"
        onClose={() => setUnchangedOpen(false)}
        actions={<Button onClick={() => setUnchangedOpen(false)}>OK</Button>}
      >
        <p>Advisory unchanged from last SMS sent.</p>
        <p>New SMS will not be sent.</p>
        <p>Ask farmer to stick to last SMS advisory.</p>
      </Modal>
    </div>
  );
}

// SMS history: every spray advisory SMS sent in the last 24 hours.
export function SmsHistory() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(api.agentSmsMessages);
  if (loading || !data) return <Loading error={error} onRetry={reload} />;
  const columns = [
    { key: "message", label: "Message" },
    {
      key: "farm",
      label: "Farm / farmer",
      render: (row) => (
        <span>
          {row.farm} • {row.farmId}
          <div className="small muted">{row.farmer}</div>
        </span>
      ),
    },
    { key: "sentAt", label: "Sent" },
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
      <PageHeader bar="Agent" title="SMS history" subtitle="Spray advisory SMS sent in the last 24 hours" />
      <Card title="SMS sent in last 24 hours" subtitle="Status: Delivered, Failed, Submitted or Pending">
        <DataTable columns={columns} rows={data} empty="No SMS has been sent in the last 24 hours." />
      </Card>
    </div>
  );
}

// SMS details: the advisory in one SMS and its delivery status.
export function SmsDetails() {
  const { id } = useParams();
  const { data, loading, error, reload } = useAsync(api.agentSmsMessages);
  if (loading || !data) return <Loading error={error} onRetry={reload} />;
  const message = data.find((item) => item.id === id);
  if (!message) return <p className="notice notice-warning">Message not found.</p>;
  return (
    <div className="stack">
      <PageHeader bar="Agent" title="SMS details" subtitle="The advisory sent in this SMS and its status" />
      <div>
        <Button variant="secondary" as={Link} to="/agent/sms">
          ‹ Back to SMS list
        </Button>
      </div>
      <Card title={message.message} subtitle={`${message.sentLong} • ${message.farm} (${message.farmId}) • ${message.farmer}`}>
        <div className="stack">
          <div>
            <StatusPill>{message.status}</StatusPill>
          </div>
          <div>
            <div className="small muted">Message</div>
            <p>{message.text}</p>
          </div>
          <div className="row" style={{ gap: 32 }}>
            <div>
              <div className="small muted">Directive</div>
              <strong>{message.directive}</strong>
            </div>
            <div>
              <div className="small muted">Rating</div>
              <StatusPill tone={ratingTone(message.rating)}>{message.rating}</StatusPill>
            </div>
          </div>
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
    { key: "rating", label: "Rating", render: (row) => <StatusPill tone={ratingTone(row.rating)}>{row.rating}</StatusPill> },
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
