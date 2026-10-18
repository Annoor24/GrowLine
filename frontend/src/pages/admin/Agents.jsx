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

export function AdminAgents() {
  const navigate = useNavigate();
  const { data, loading, error } = useAsync(api.adminAgents);
  if (loading || !data) return <Loading error={error} />;
  const columns = [
    { key: "name", label: "Agent" },
    { key: "farmers", label: "Assigned farmers" },
    { key: "farms", label: "Farms covered" },
    { key: "status", label: "Status", render: (row) => <StatusPill>{row.status}</StatusPill> },
    {
      key: "action",
      label: "Action",
      render: (row) =>
        row.status === "Inactive" ? (
          <button type="button" className="link-button" onClick={() => navigate(`/admin/agents/${row.id}/security`)}>
            Activate
          </button>
        ) : (
          <button type="button" className="link-button" onClick={() => navigate(`/admin/agents/${row.id}`)}>
            View / Edit
          </button>
        ),
    },
  ];
  return (
    <div className="stack">
      <PageHeader
        title="Extension agents"
        subtitle="Assign farmers, review workload and manage access"
        actions={[
          <Button key="inv" variant="secondary" as={Link} to="/admin/agents/invitations">
            Invitations
          </Button>,
          <Button key="add" as={Link} to="/admin/agents/new">
            + Add agent
          </Button>,
        ]}
      />
      <Card>
        <DataTable columns={columns} rows={data} />
      </Card>
    </div>
  );
}

export function AdminAgentProfile() {
  const { id } = useParams();
  const { data, loading, error } = useAsync(() => Promise.all([api.adminAgents(), api.adminFarmers()]), [id]);
  if (loading || !data) return <Loading error={error} />;
  const [agents, farmers] = data;
  const agent = agents.find((item) => item.id === id);
  if (!agent) return <p className="notice notice-warning">Agent not found.</p>;

  const columns = [
    { key: "id", label: "Farmer ID" },
    { key: "name", label: "Farmer" },
    { key: "farms", label: "Farms" },
    { key: "location", label: "Location" },
  ];
  return (
    <div className="stack">
      <PageHeader title="Extension agent profile" subtitle="Agent details, assigned farmers and activity" />
      <Card>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div className="kv">
            <strong>{agent.name}</strong>
            <span className="muted small">
              Agent ID: {agent.id} • <StatusPill>{agent.status}</StatusPill> • {agent.email}
            </span>
            <strong>
              {agent.farmers} assigned farmers · {agent.farms} farms · {agent.advisories} advisories this month
            </strong>
          </div>
          <div className="row">
            <Button variant="secondary" as={Link} to={`/admin/agents/${agent.id}/security`}>
              Account & password
            </Button>
            <Button>Reassign farmers</Button>
          </div>
        </div>
      </Card>
      <Card title="Assigned farmers" subtitle="Sample list">
        <DataTable columns={columns} rows={farmers.slice(0, 3)} />
      </Card>
    </div>
  );
}

export function AgentInvitations() {
  const { data, loading, error } = useAsync(api.adminInvitations);
  if (loading || !data) return <Loading error={error} />;
  const columns = [
    { key: "agent", label: "Agent" },
    { key: "area", label: "Area" },
    { key: "invitation", label: "Invitation", render: (row) => <StatusPill>{row.invitation}</StatusPill> },
    { key: "sent", label: "Sent" },
    { key: "action", label: "Action", render: (row) => <button type="button" className="link-button">{row.action}</button> },
  ];
  return (
    <div className="stack">
      <PageHeader
        title="Extension Agents · Invitations"
        subtitle="Manage activation and delivery status without sharing passwords."
        actions={
          <Button as={Link} to="/admin/agents/new">
            Add new agent
          </Button>
        }
      />
      <Card title="Agent invitations" subtitle="Track activation, expiry and invitation delivery.">
        <DataTable columns={columns} rows={data} />
      </Card>
    </div>
  );
}

export function CreateAgent() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", area: "" });
  const [error, setError] = useState("");
  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  function submit(event) {
    event.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.area) {
      setError("Fill in all fields before sending the invitation.");
      return;
    }
    navigate("/admin/agents/invitations");
  }

  return (
    <div className="stack">
      <PageHeader title="Extension Agents · Add New Agent" subtitle="Create an agent and send a secure activation link." />
      <Card title="Agent account details" subtitle="Only Super Admins can create Extension Agent accounts.">
        <form className="stack" onSubmit={submit}>
          {error ? <p className="notice notice-danger">{error}</p> : null}
          <div className="form-grid">
            <FormField label="Full name" value={form.name} onChange={set("name")} />
            <FormField label="Work email" type="email" value={form.email} onChange={set("email")} />
            <FormField label="Phone number" type="tel" value={form.phone} onChange={set("phone")} />
            <FormField label="Assigned area" value={form.area} onChange={set("area")} />
            <FormField label="Account role" value="Extension Agent (fixed)" readOnly />
            <FormField label="Account status" value="Pending activation" readOnly />
          </div>
          <p className="notice notice-success">
            <strong>Invitation policy.</strong> Single-use activation link · Expires in 48 hours · Agent sets their own password.
          </p>
          <div className="form-actions">
            <Button type="submit">Create & send invitation</Button>
            <Button variant="secondary" onClick={() => navigate("/admin/agents")}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function AgentSecurity() {
  const { id } = useParams();
  const { data, loading, error } = useAsync(api.adminAgents);
  const [sent, setSent] = useState(false);
  if (loading || !data) return <Loading error={error} />;
  const agent = data.find((item) => item.id === id);
  if (!agent) return <p className="notice notice-warning">Agent not found.</p>;
  return (
    <div className="stack">
      <PageHeader title="Agent Account & Password Reset" subtitle="Control agent account access safely" />
      <Card title="Agent account">
        <div className="form-grid">
          <FormField label="Agent" value={agent.name} readOnly />
          <FormField label="Agent ID" value={agent.id} readOnly />
          <FormField label="Account status" value={agent.status} readOnly />
          <FormField label="Last sign in" value="View audit log" readOnly />
        </div>
        <div className="form-actions">
          <Button>Update account</Button>
        </div>
      </Card>
      <Card title="Password reset">
        {sent ? <p className="notice notice-success">Reset link sent to the agent's registered email.</p> : null}
        <div className="form-grid" style={{ marginTop: sent ? 12 : 0 }}>
          <FormField label="Reset method" value="Send secure reset link" readOnly />
          <FormField label="Delivery channel" value="Registered email address" readOnly />
        </div>
        <div className="form-actions">
          <Button onClick={() => setSent(true)}>Send reset link</Button>
        </div>
      </Card>
    </div>
  );
}
