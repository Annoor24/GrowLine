import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/index.js";
import { ApiError } from "../../api/client.js";
import Conversation from "../../components/Conversation.jsx";
import useAsync from "../../hooks/useAsync.js";
import Button from "../../components/Button.jsx";
import Card from "../../components/Card.jsx";
import DataTable from "../../components/DataTable.jsx";
import FormField from "../../components/FormField.jsx";
import Loading from "../../components/Loading.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import StatusPill from "../../components/StatusPill.jsx";

export function Notifications() {
  const { data, loading, error, reload } = useAsync(api.agentNotifications);
  if (loading || !data) return <Loading error={error} onRetry={reload} />;
  return (
    <div className="stack">
      <PageHeader bar="Agent" title="Notifications" subtitle="Messages from GrowLine Super Admin" />
      {data.map((item) => (
        <Card key={item.id} title={item.title} subtitle={`${item.when} • From ${item.from}`}>
          <p>{item.body}</p>
        </Card>
      ))}
    </div>
  );
}

const PREVIEW_ROWS = 4;
const STATUS_FILTERS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Open" },
  { value: "on_going", label: "In progress" },
  { value: "closed", label: "Resolved" },
];
const HELP_TOPICS = [
  { title: "GPS capture", text: "Location access and accuracy" },
  { title: "Farmer & farm records", text: "Adding farms to existing farmers" },
  { title: "Weather alerts", text: "Automated SMS and delivery" },
];
const pad = (n) => String(n ?? 0).padStart(2, "0");

export function Complaints() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showAll, setShowAll] = useState(false);

  // Wait until the agent stops typing before searching.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const stats = useAsync(api.agentComplaintStats);
  const list = useAsync(
    () => api.agentMyComplaints({ search, status, limit: showAll ? undefined : PREVIEW_ROWS }),
    [search, status, showAll],
  );

  const columns = [
    {
      key: "subject",
      label: "Ticket / subject",
      render: (row) => (
        <div>
          <div className="small muted">{row.ticket}</div>
          <strong>{row.subject}</strong>
        </div>
      ),
    },
    { key: "created", label: "Created" },
    { key: "priority", label: "Priority" },
    { key: "status", label: "Status", render: (row) => <StatusPill>{row.status}</StatusPill> },
  ];

  const cards = stats.data
    ? [
        { label: "Total submitted", value: pad(stats.data.total_submitted), note: "All-time tickets" },
        { label: "Open tickets", value: pad(stats.data.open), note: "Awaiting support" },
        { label: "In progress", value: pad(stats.data.in_progress), note: "Being investigated" },
        { label: "Resolved", value: pad(stats.data.resolved), note: "Closed successfully" },
      ]
    : [];

  return (
    <div className="stack">
      <PageHeader
        crumb="Extension agent / Support"
        title="Complaints & Help"
        subtitle="Raise an issue, track a complaint, or find answers to common questions."
        actions={
          <Button as={Link} to="/agent/complaints/new">
            + New complaint
          </Button>
        }
      />

      {stats.data ? (
        <div className="grid grid-4">
          {cards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      ) : (
        <Loading error={stats.error} onRetry={stats.reload} />
      )}

      <div className="grid grid-main-side">
        <Card title="My complaints" subtitle="Track issues reported by your agent account">
          <div className="stack">
            <div className="row">
              <div style={{ flex: 2, minWidth: 200 }}>
                <FormField
                  aria-label="Search complaints"
                  type="search"
                  placeholder="Search by ticket ID or subject"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <FormField
                  aria-label="Filter by status"
                  kind="select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  options={STATUS_FILTERS}
                />
              </div>
            </div>
            {list.data ? (
              <>
                <DataTable
                  columns={columns}
                  rows={list.data.rows}
                  onRowClick={(row) => navigate(`/agent/complaints/${row.ticket}`)}
                  empty={
                    search || status
                      ? "No complaints match your search."
                      : "You have not raised any complaints. Use “New complaint” if you need help."
                  }
                />
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span className="small muted">
                    Showing {list.data.showing} of {list.data.total} complaints
                  </span>
                  {list.data.total > list.data.showing || showAll ? (
                    <button type="button" className="link-button" onClick={() => setShowAll(!showAll)}>
                      {showAll ? "Show fewer" : "View all"}
                    </button>
                  ) : null}
                </div>
              </>
            ) : (
              <Loading error={list.error} onRetry={list.reload} />
            )}
          </div>
        </Card>

        <div className="stack">
          <Card title="Help centre" subtitle="Quick answers for common issues">
            <div className="kv">
              {HELP_TOPICS.map((topic) => (
                <div key={topic.title}>
                  <strong>{topic.title}</strong>
                  <div className="small muted">{topic.text}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Need further assistance?">
            <div className="stack">
              <p className="muted">Submit a complaint with details of the issue and the affected farmer or farm ID.</p>
              <Button as={Link} to="/agent/complaints/new">
                + Submit a complaint
              </Button>
              <span className="small muted">Support replies appear in your ticket thread.</span>
            </div>
          </Card>
        </div>
      </div>

      <Card title="Before submitting a complaint">
        <p className="muted">Include the affected farmer/farm ID, what happened, when it occurred, and a screenshot if available.</p>
        <p className="small" style={{ color: "var(--warning-text)", marginTop: 6 }}>
          Do not include passwords or sensitive authentication details in complaint descriptions.
        </p>
      </Card>
    </div>
  );
}

// Backend limits: subject 100 characters, first message 250.
const SUBJECT_MAX = 100;
const MESSAGE_MAX = 250;

export function NewComplaint() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ subject: "", priority: "", description: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const set = (key) => (event) => {
    setForm({ ...form, [key]: event.target.value });
    if (errors[key]) setErrors({ ...errors, [key]: "" });
  };

  async function submit(event) {
    event.preventDefault();
    const next = {};
    if (!form.subject.trim()) next.subject = "Enter a short subject.";
    if (!form.priority) next.priority = "Choose a priority.";
    if (form.description.trim().length < 10) next.description = "Describe the issue in at least 10 characters.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const created = await api.agentSubmitComplaint({
        subject: form.subject.trim(),
        priority: form.priority,
        message: form.description.trim(),
      });
      navigate(`/agent/complaints/${created.ticket}`);
    } catch (err) {
      const data = err instanceof ApiError ? err.data : null;
      const first = (value) => (Array.isArray(value) ? value[0] : value);
      const fieldErrors = {
        subject: first(data?.subject),
        priority: first(data?.priority),
        description: first(data?.message),
      };
      const known = Object.values(fieldErrors).some(Boolean);
      setErrors(known ? fieldErrors : { form: "Your complaint could not be sent. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="stack">
      <PageHeader bar="Agent" title="Contact Super Admin" subtitle="Submit a complaint or support request" />
      <Card title="New support request">
        <form className="stack" onSubmit={submit}>
          <FormField
            label="Subject"
            placeholder="Enter complaint subject"
            value={form.subject}
            onChange={set("subject")}
            error={errors.subject}
            maxLength={SUBJECT_MAX}
          />
          <FormField
            label="Priority"
            kind="select"
            value={form.priority}
            onChange={set("priority")}
            error={errors.priority}
            options={[
              { value: "", label: "Select priority" },
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
            ]}
          />
          <FormField
            label="Description"
            kind="textarea"
            placeholder="Describe the issue you need help with…"
            value={form.description}
            onChange={set("description")}
            error={errors.description}
            maxLength={MESSAGE_MAX}
            hint={`Include the affected farmer or farm ID, what happened and when. Never include passwords. ${form.description.length}/${MESSAGE_MAX} characters.`}
          />
          {errors.form ? <p className="notice notice-danger">{errors.form}</p> : null}
          <div className="form-actions">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit complaint"}
            </Button>
            <Button variant="secondary" as={Link} to="/agent/complaints">
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function ComplaintThread() {
  const { id } = useParams();
  const { data, loading, error, reload } = useAsync(() => api.agentComplaintDetail(id), [id]);
  const [sent, setSent] = useState([]);

  if (loading || !data) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <div className="stack">
          <p className="notice notice-warning">Complaint {id} was not found.</p>
          <div>
            <Button variant="secondary" as={Link} to="/agent/complaints">
              ‹ Back to complaints
            </Button>
          </div>
        </div>
      );
    }
    return <Loading error={error} onRetry={reload} />;
  }

  const resolved = data.statusValue === "closed";

  async function send(text) {
    const message = await api.agentReplyComplaint(data.ticket, text);
    setSent((list) => [...list, message]);
  }

  return (
    <div className="stack">
      <PageHeader bar="Agent" title="Complaint conversation" subtitle="View admin replies and complaint status" />
      <div>
        <Button variant="secondary" as={Link} to="/agent/complaints">
          ‹ Back to complaints
        </Button>
      </div>
      <Card title={`${data.ticket} • ${data.subject}`} subtitle={`Created ${data.created} • Priority: ${data.priority}`}>
        <div className="stack">
          <div>
            <StatusPill>{data.status}</StatusPill>
          </div>
          <Conversation
            messages={data.messages.concat(sent)}
            onSend={send}
            placeholder="Add more details or ask for an update…"
            closedNote={resolved ? "This complaint is resolved. Submit a new complaint if you still need help." : ""}
          />
        </div>
      </Card>
    </div>
  );
}
