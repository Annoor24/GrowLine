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
import StatCard from "../../components/StatCard.jsx";
import StatusPill from "../../components/StatusPill.jsx";

export function AdminComplaints() {
  const navigate = useNavigate();
  const { data, loading, error } = useAsync(() => Promise.all([api.adminComplaints(), api.adminComplaintStats()]));
  if (loading || !data) return <Loading error={error} />;
  const [complaints, stats] = data;
  const columns = [
    { key: "id", label: "Ticket" },
    { key: "agent", label: "Agent" },
    { key: "subject", label: "Subject" },
    { key: "priority", label: "Priority", render: (row) => <StatusPill>{row.priority}</StatusPill> },
    { key: "status", label: "Status", render: (row) => <StatusPill>{row.status}</StatusPill> },
  ];
  return (
    <div className="stack">
      <PageHeader title="Complaints & support" subtitle="Receive, assign, respond and resolve agent complaints" />
      <div className="grid grid-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <Card>
        <DataTable columns={columns} rows={complaints} onRowClick={(row) => navigate(`/admin/complaints/${row.id}`)} />
      </Card>
    </div>
  );
}

export function AdminComplaintDetail() {
  const { id } = useParams();
  const { data, loading, error } = useAsync(api.adminComplaints);
  const [reply, setReply] = useState("");
  const [replies, setReplies] = useState([]);
  const [resolved, setResolved] = useState(false);
  if (loading || !data) return <Loading error={error} />;
  const complaint = data.find((item) => item.id === id);
  if (!complaint) return <p className="notice notice-warning">Complaint not found.</p>;

  function send() {
    if (!reply.trim()) return;
    setReplies([...replies, reply]);
    setReply("");
  }

  return (
    <div className="stack">
      <PageHeader title={`Complaint ${complaint.id}`} subtitle="Two-way communication with extension agents" />
      <div className="grid grid-main-side">
        <Card title={complaint.subject} subtitle={`Submitted by ${complaint.agent} • ${complaint.submitted}`}>
          <div className="stack">
            <div>
              <StatusPill>{resolved ? "Resolved" : complaint.status}</StatusPill>
            </div>
            <div>
              <div className="small muted">Agent message</div>
              <p>{complaint.message}</p>
            </div>
            {replies.map((text, index) => (
              <div className="message" key={`${text}-${index}`}>
                <div className="message-meta">Super Admin • Just now</div>
                <p>{text}</p>
              </div>
            ))}
            <FormField
              label="Admin reply"
              kind="textarea"
              placeholder="Type a response to the agent…"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
            <div className="form-actions">
              <Button onClick={send}>Send reply</Button>
              <Button variant="soft" onClick={() => setResolved(true)} disabled={resolved}>
                Mark resolved
              </Button>
            </div>
          </div>
        </Card>
        <Card title="Ticket details">
          <div className="kv">
            <span>Priority: {complaint.priority}</span>
            <span>Assigned: {complaint.assigned}</span>
          </div>
        </Card>
      </div>
      <div>
        <Button variant="secondary" as={Link} to="/admin/complaints">
          Back to complaints
        </Button>
      </div>
    </div>
  );
}

export function AdminNotifications() {
  const { data, loading, error } = useAsync(api.adminNotifications);
  if (loading || !data) return <Loading error={error} />;
  const columns = [
    { key: "title", label: "Title" },
    { key: "recipients", label: "Recipients" },
    { key: "dashboard", label: "Dashboard status" },
    { key: "email", label: "Email backup" },
    { key: "sent", label: "Sent" },
  ];
  return (
    <div className="stack">
      <PageHeader
        title="Agent notifications"
        subtitle="Dashboard notifications with email backup"
        actions={
          <Button as={Link} to="/admin/notifications/new">
            + New notification
          </Button>
        }
      />
      <Card>
        <DataTable columns={columns} rows={data} />
      </Card>
    </div>
  );
}

export function ComposeNotification() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ recipients: "all", title: "", message: "" });
  const [error, setError] = useState("");
  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  function send() {
    if (!form.title || !form.message) {
      setError("Enter a title and a message.");
      return;
    }
    navigate("/admin/notifications");
  }

  return (
    <div className="stack">
      <PageHeader title="Send agent notification" subtitle="Send to one, selected or all extension agents" />
      <div className="grid grid-main-side">
        <Card title="New dashboard notification">
          <div className="stack">
            {error ? <p className="notice notice-danger">{error}</p> : null}
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
            <FormField label="Notification title" value={form.title} onChange={set("title")} placeholder="Important platform update" />
            <FormField
              label="Message"
              kind="textarea"
              value={form.message}
              onChange={set("message")}
              placeholder="Write your announcement…"
            />
            <div>
              <StatusPill tone="success">Email backup enabled</StatusPill>
            </div>
            <div className="form-actions">
              <Button onClick={send}>Send notification</Button>
            </div>
          </div>
        </Card>
        <Card title="Delivery channels">
          <div className="kv">
            <strong>✓ In-app dashboard notice</strong>
            <strong>✓ Email backup</strong>
            <span className="muted small">Recipients: 38 agents</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
