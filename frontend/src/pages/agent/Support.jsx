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

export function Notifications() {
  const { data, loading, error } = useAsync(api.agentNotifications);
  if (loading || !data) return <Loading error={error} />;
  return (
    <div className="stack">
      <PageHeader title="Notifications" subtitle="Messages from GrowLine Super Admin" />
      {data.map((item) => (
        <Card key={item.id} title={item.title} subtitle={`${item.when} • From ${item.from}`}>
          <p>{item.body}</p>
        </Card>
      ))}
    </div>
  );
}

export function Complaints() {
  const navigate = useNavigate();
  const { data, loading, error } = useAsync(api.agentComplaints);
  if (loading || !data) return <Loading error={error} />;
  const columns = [
    { key: "id", label: "Ticket" },
    { key: "subject", label: "Subject" },
    { key: "submitted", label: "Submitted" },
    { key: "priority", label: "Priority", render: (row) => <StatusPill>{row.priority}</StatusPill> },
    { key: "status", label: "Status", render: (row) => <StatusPill>{row.status}</StatusPill> },
  ];
  return (
    <div className="stack">
      <PageHeader
        title="Complaints & help"
        subtitle="Raise and track requests to Super Admin"
        actions={
          <Button as={Link} to="/agent/complaints/new">
            + New complaint
          </Button>
        }
      />
      <Card>
        <DataTable columns={columns} rows={data} onRowClick={(row) => navigate(`/agent/complaints/${row.id}`)} />
      </Card>
    </div>
  );
}

export function NewComplaint() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ subject: "", priority: "", description: "" });
  const [error, setError] = useState("");
  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  function submit(event) {
    event.preventDefault();
    if (!form.subject || !form.priority || !form.description) {
      setError("Fill in the subject, priority and description.");
      return;
    }
    navigate("/agent/complaints");
  }

  return (
    <div className="stack">
      <PageHeader title="Contact Super Admin" subtitle="Submit a complaint or support request" />
      <Card title="New support request">
        <form className="stack" onSubmit={submit}>
          {error ? <p className="notice notice-danger">{error}</p> : null}
          <FormField label="Subject" placeholder="Enter complaint subject" value={form.subject} onChange={set("subject")} />
          <FormField
            label="Priority"
            kind="select"
            value={form.priority}
            onChange={set("priority")}
            options={[
              { value: "", label: "Select priority" },
              { value: "Low", label: "Low" },
              { value: "Medium", label: "Medium" },
              { value: "High", label: "High" },
            ]}
          />
          <FormField
            label="Description"
            kind="textarea"
            placeholder="Describe the issue you need help with…"
            value={form.description}
            onChange={set("description")}
            hint="Include the affected farmer or farm ID, what happened and when. Never include passwords."
          />
          <div className="form-actions">
            <Button type="submit">Submit complaint</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function ComplaintThread() {
  const { id } = useParams();
  const { data, loading, error } = useAsync(api.agentComplaints);
  const [reply, setReply] = useState("");
  const [sent, setSent] = useState([]);
  if (loading || !data) return <Loading error={error} />;
  const complaint = data.find((item) => item.id === id);
  if (!complaint) return <p className="notice notice-warning">Complaint not found.</p>;

  function send() {
    if (!reply.trim()) return;
    setSent([...sent, { from: "You", when: "Just now", text: reply }]);
    setReply("");
  }

  return (
    <div className="stack">
      <PageHeader title="Complaint conversation" subtitle="View admin replies and complaint status" />
      <Card
        title={`${complaint.id} • ${complaint.subject}`}
        subtitle={`Status: ${complaint.status} • Priority: ${complaint.priority}`}
      >
        {complaint.messages.concat(sent).map((message, index) => (
          <div className="message" key={`${message.from}-${index}`}>
            <div className="message-meta">
              {message.from} • {message.when}
            </div>
            <p>{message.text}</p>
          </div>
        ))}
        <div className="stack" style={{ marginTop: 16 }}>
          <FormField label="Your reply" kind="textarea" value={reply} onChange={(e) => setReply(e.target.value)} />
          <div className="form-actions">
            <Button onClick={send}>Send reply</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
