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

const STATUS_OPTIONS = [
  { value: "pending", label: "Open" },
  { value: "on_going", label: "In progress" },
  { value: "closed", label: "Resolved" },
];
const PRIORITY_OPTIONS = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];
const withAll = (label, options) => [{ value: "", label }, ...options];

export function AdminComplaints() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({ search: "", status: "", priority: "" });

  // Wait until the admin stops typing before searching.
  useEffect(() => {
    const timer = setTimeout(() => setFilters((f) => ({ ...f, search: searchInput.trim() })), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const stats = useAsync(api.adminComplaintStats);
  const list = useAsync(() => api.adminComplaints(filters), [filters.search, filters.status, filters.priority]);

  const columns = [
    { key: "ticket", label: "Ticket" },
    { key: "agent", label: "Agent" },
    { key: "subject", label: "Subject" },
    { key: "priority", label: "Priority" },
    { key: "status", label: "Status", render: (row) => <StatusPill>{row.status}</StatusPill> },
  ];
  const cards = stats.data
    ? [
        { label: "Open complaints", value: stats.data.open_complaints },
        { label: "In progress", value: stats.data.in_progress },
        { label: "Resolved", value: stats.data.resolved },
        { label: "High priority", value: stats.data.high_priority },
      ]
    : [];

  return (
    <div className="stack">
      <PageHeader bar="Admin" title="Complaints & support" subtitle="Receive, respond to and resolve agent complaints" />
      {stats.data ? (
        <div className="grid grid-4">
          {cards.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      ) : (
        <Loading error={stats.error} onRetry={stats.reload} />
      )}
      <Card>
        <div className="stack">
          <div className="row">
            <div style={{ flex: 2, minWidth: 200 }}>
              <FormField
                aria-label="Search complaints"
                type="search"
                placeholder="Search ticket, subject or agent"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <FormField
                aria-label="Filter by status"
                kind="select"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                options={withAll("All statuses", STATUS_OPTIONS)}
              />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <FormField
                aria-label="Filter by priority"
                kind="select"
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                options={withAll("All priorities", PRIORITY_OPTIONS)}
              />
            </div>
          </div>
          {list.data ? (
            <DataTable
              columns={columns}
              rows={list.data}
              onRowClick={(row) => navigate(`/admin/complaints/${row.ticket}`)}
              empty={filters.search || filters.status || filters.priority ? "No complaints match your filters." : "No complaints received."}
            />
          ) : (
            <Loading error={list.error} onRetry={list.reload} />
          )}
        </div>
      </Card>
    </div>
  );
}

export function AdminComplaintDetail() {
  const { id } = useParams();
  const { data, loading, error, reload } = useAsync(() => api.adminComplaintDetail(id), [id]);
  const [sent, setSent] = useState([]);
  const [changes, setChanges] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  if (loading || !data) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <div className="stack">
          <p className="notice notice-warning">Complaint {id} was not found.</p>
          <div>
            <Button variant="secondary" as={Link} to="/admin/complaints">
              ‹ Back to complaints
            </Button>
          </div>
        </div>
      );
    }
    return <Loading error={error} onRetry={reload} />;
  }

  const current = changes || data;
  const resolved = current.statusValue === "closed";

  async function send(text) {
    const message = await api.adminReplyComplaint(data.ticket, text);
    setSent((list) => [...list, message]);
  }

  // PATCH status and/or priority; the response is the updated complaint.
  async function update(fields, message) {
    setSaving(true);
    setNotice("");
    try {
      const updated = await api.adminUpdateComplaint(data.ticket, fields);
      setChanges(updated);
      setNotice(message);
    } catch {
      setNotice("The change could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack">
      <PageHeader bar="Admin" title={`Complaint ${data.ticket}`} subtitle="Two-way communication with extension agents" />
      <div>
        <Button variant="secondary" as={Link} to="/admin/complaints">
          ‹ Back to complaints
        </Button>
      </div>
      {notice ? <p className="notice notice-success">{notice}</p> : null}
      <div className="grid grid-main-side">
        <Card title={data.subject} subtitle={`Submitted by ${data.agent} • ${data.created}`}>
          <div className="stack">
            <div>
              <StatusPill>{current.status}</StatusPill>
            </div>
            <Conversation
              messages={data.messages.concat(sent)}
              onSend={send}
              replyLabel="Admin reply"
              placeholder="Type a response to the agent…"
              actions={
                <Button variant="soft" disabled={resolved || saving} onClick={() => update({ status: "closed" }, "Complaint marked as resolved.")}>
                  {resolved ? "Resolved" : "Mark resolved"}
                </Button>
              }
            />
          </div>
        </Card>
        <Card title="Ticket details">
          <div className="stack">
            <FormField
              label="Status"
              kind="select"
              value={current.statusValue}
              disabled={saving}
              onChange={(e) => update({ status: e.target.value }, "Status updated.")}
              options={STATUS_OPTIONS}
            />
            <FormField
              label="Priority"
              kind="select"
              value={current.priorityValue}
              disabled={saving}
              onChange={(e) => update({ priority: e.target.value }, "Priority updated.")}
              options={PRIORITY_OPTIONS}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

export function AdminNotifications() {
  const { data, loading, error, reload } = useAsync(api.adminNotifications);
  if (loading || !data) return <Loading error={error} onRetry={reload} />;
  const columns = [
    { key: "title", label: "Title" },
    { key: "recipients", label: "Recipients" },
    { key: "dashboard", label: "Dashboard status" },
    { key: "email", label: "Email backup" },
    { key: "sent", label: "Sent" },
  ];
  return (
    <div className="stack">
      <PageHeader bar="Admin"
        title="Agent notifications"
        subtitle="Dashboard notifications with email backup"
        actions={
          <Button as={Link} to="/admin/notifications/new">
            + New notification
          </Button>
        }
      />
      <Card>
        <DataTable columns={columns} rows={data} empty="No notifications have been sent yet." />
      </Card>
    </div>
  );
}

const TITLE_MAX = 150;

export function ComposeNotification() {
  const navigate = useNavigate();
  const agents = useAsync(api.adminAgents);
  const [form, setForm] = useState({ recipients: "all", title: "", message: "", agents: [] });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const set = (key) => (event) => {
    setForm({ ...form, [key]: event.target.value });
    if (errors[key]) setErrors({ ...errors, [key]: "" });
  };

  // The backend only notifies active agents.
  const activeAgents = (agents.data || []).filter((agent) => agent.status === "Active");
  const recipientCount = form.recipients === "all" ? activeAgents.length : form.agents.length;

  function toggleAgent(id) {
    const chosen = form.agents.includes(id) ? form.agents.filter((x) => x !== id) : [...form.agents, id];
    setForm({ ...form, agents: chosen });
    if (errors.agents) setErrors({ ...errors, agents: "" });
  }

  async function send() {
    const next = {};
    if (!form.title.trim()) next.title = "Enter a title for the notification.";
    if (!form.message.trim()) next.message = "Write the message agents should see.";
    if (form.recipients === "selected" && form.agents.length === 0) next.agents = "Select at least one agent.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSending(true);
    try {
      await api.adminSendNotification({
        title: form.title.trim(),
        message: form.message.trim(),
        audience: form.recipients,
        agents: form.recipients === "selected" ? form.agents : [],
      });
      navigate("/admin/notifications");
    } catch (err) {
      const body = err instanceof ApiError ? err.data : null;
      const first = (value) => (Array.isArray(value) ? String(value[0]) : value ? String(value) : "");
      setErrors({
        title: first(body?.title),
        message: first(body?.message),
        agents: first(body?.agents),
        form: first(body?.detail) || (body?.title || body?.message || body?.agents ? "" : "The notification could not be sent. Please try again."),
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="stack">
      <PageHeader bar="Admin" title="Send agent notification" subtitle="Send to one, selected or all extension agents" />
      {errors.form ? <p className="notice notice-danger">{errors.form}</p> : null}
      <div className="grid grid-main-side">
        <Card title="New dashboard notification">
          <div className="stack">
            <FormField
              label="Recipients"
              kind="select"
              value={form.recipients}
              onChange={set("recipients")}
              options={[
                { value: "all", label: "All extension agents" },
                { value: "selected", label: "Selected agents" },
              ]}
            />
            {form.recipients === "selected" ? (
              <fieldset className="check-group">
                <legend>Choose agents</legend>
                {agents.data ? (
                  <div className="stack" style={{ gap: 8 }}>
                    {activeAgents.length === 0 ? <span className="muted">There are no active agents.</span> : null}
                    {activeAgents.map((agent) => (
                      <label key={agent.id} className="check">
                        <input type="checkbox" checked={form.agents.includes(agent.id)} onChange={() => toggleAgent(agent.id)} />
                        <span>{agent.name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <Loading error={agents.error} onRetry={agents.reload} />
                )}
                {errors.agents ? <span className="error-text">{errors.agents}</span> : null}
              </fieldset>
            ) : null}
            <FormField
              label="Notification title"
              value={form.title}
              maxLength={TITLE_MAX}
              onChange={set("title")}
              placeholder="Important platform update"
              error={errors.title}
            />
            <FormField
              label="Message"
              kind="textarea"
              value={form.message}
              error={errors.message}
              onChange={set("message")}
              placeholder="Write your announcement…"
            />
            <div>
              <StatusPill tone="success">Email backup enabled</StatusPill>
            </div>
            <div className="form-actions">
              <Button onClick={send} disabled={sending}>
                {sending ? "Sending…" : "Send notification"}
              </Button>
            </div>
          </div>
        </Card>
        <Card title="Delivery channels">
          <div className="kv">
            <strong>✓ In-app dashboard notice</strong>
            <strong>✓ Email backup</strong>
            <span className="muted small">
              Recipients: {agents.data ? `${recipientCount} ${recipientCount === 1 ? "agent" : "agents"}` : "…"}
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
