import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/index.js";
import { isEmail, isNigerianPhone } from "../../utils/validate.js";
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
  const { data, loading, error, reload } = useAsync(api.adminAgents);
  if (loading || !data) return <Loading error={error} onRetry={reload} />;
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
      <PageHeader bar="Admin"
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
        <DataTable
          columns={columns}
          rows={data}
          empty="No extension agents yet. Use “Add agent” to invite the first one."
        />
      </Card>
    </div>
  );
}

export function AdminAgentProfile() {
  const { id } = useParams();
  const { data: agent, loading, error, reload } = useAsync(() => api.adminAgentDetail(id), [id]);
  if (loading || !agent) return <Loading error={error} onRetry={reload} />;

  const columns = [
    { key: "code", label: "Farmer ID" },
    { key: "name", label: "Farmer" },
    { key: "farms", label: "Farms" },
    { key: "location", label: "LGA" },
  ];
  return (
    <div className="stack">
      <PageHeader bar="Admin" title="Extension agent profile" subtitle="Agent details, assigned farmers and activity" />
      <Card>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div className="kv">
            <strong>{agent.name}</strong>
            <span className="muted small">
              Agent ID: {agent.code} • <StatusPill>{agent.status}</StatusPill> • {agent.email}
            </span>
            <strong>
              {agent.farmers} assigned farmers · {agent.farms} farms · {agent.advisories} advisories
            </strong>
          </div>
          <div className="row">
            <Button variant="secondary" as={Link} to={`/admin/agents/${agent.id}/security`}>
              Account & password
            </Button>
            <Button as={Link} to={`/admin/agents/${agent.id}/assign`}>
              Reassign farmers
            </Button>
          </div>
        </div>
      </Card>
      <Card title="Assigned farmers">
        <DataTable columns={columns} rows={agent.farmerList} empty="No farmers are assigned to this agent yet." />
      </Card>
    </div>
  );
}

// NOT IN THE DESIGN: requested in review comment #15. Assign or unassign farmers for one agent,
// including farmers who registered themselves on the website and have no agent yet.
// Changes are kept on this page only until the backend has an assignment endpoint.
export function AssignFarmers() {
  const { id } = useParams();
  const { data: agent, loading, error, reload } = useAsync(() => api.adminAgentDetail(id), [id]);
  const farmers = useAsync(api.adminFarmerAssignments);
  const agents = useAsync(api.adminAgents);
  const [changes, setChanges] = useState({});
  const [picked, setPicked] = useState({ assigned: [], unassigned: [] });
  const [moveTo, setMoveTo] = useState("");
  const [notice, setNotice] = useState("");

  if (loading || !agent) return <Loading error={error} onRetry={reload} />;
  if (farmers.loading || !farmers.data) return <Loading error={farmers.error} onRetry={farmers.reload} />;

  // The sample assignments use the sample agent IDs; the agent on this page is matched by its code.
  const agentKey = agent.code;
  const rows = farmers.data.map((f) => ({ ...f, agentId: f.id in changes ? changes[f.id] : f.agentId }));
  const assigned = rows.filter((f) => f.agentId === agentKey);
  const unassigned = rows.filter((f) => !f.agentId);
  const otherAgents = (agents.data || []).filter((a) => a.id !== agentKey && a.status !== "Inactive");

  const toggle = (list, farmerId) => {
    const current = picked[list];
    const next = current.includes(farmerId) ? current.filter((x) => x !== farmerId) : [...current, farmerId];
    setPicked({ ...picked, [list]: next });
  };

  function apply(ids, newAgentId, message) {
    const next = { ...changes };
    ids.forEach((farmerId) => {
      next[farmerId] = newAgentId;
    });
    setChanges(next);
    setPicked({ assigned: [], unassigned: [] });
    setNotice(message);
  }

  const checkColumn = (list) => ({
    key: "pick",
    label: "",
    render: (row) => (
      <input
        type="checkbox"
        aria-label={`Select ${row.name}`}
        checked={picked[list].includes(row.id)}
        onChange={() => toggle(list, row.id)}
      />
    ),
  });
  const baseColumns = [
    { key: "id", label: "Farmer ID" },
    { key: "name", label: "Farmer" },
    { key: "farms", label: "Farms" },
    { key: "location", label: "LGA" },
  ];
  const sourceColumn = {
    key: "source",
    label: "Registered by",
    render: (row) => <StatusPill tone={row.source === "Website" ? "info" : "neutral"}>{row.source === "Website" ? "Self (website)" : "Agent"}</StatusPill>,
  };

  const count = (n) => `${n} farmer${n === 1 ? "" : "s"}`;
  const movingAgent = otherAgents.find((a) => a.id === moveTo);

  return (
    <div className="stack">
      <PageHeader bar="Admin" title="Assign farmers" subtitle={`Assign or unassign farmers for ${agent.name} (${agent.code})`} />
      <div>
        <Button variant="secondary" as={Link} to={`/admin/agents/${agent.id}`}>
          ‹ Back to agent profile
        </Button>
      </div>
      {notice ? <p className="notice notice-success">{notice}</p> : null}

      <Card title={`Assigned to ${agent.name}`} subtitle="Select farmers to unassign or move to another agent">
        <DataTable columns={[checkColumn("assigned"), ...baseColumns]} rows={assigned} empty="No farmers are assigned to this agent." />
        <div className="form-actions" style={{ alignItems: "flex-end" }}>
          <Button
            variant="secondary"
            disabled={picked.assigned.length === 0}
            onClick={() => apply(picked.assigned, null, `${count(picked.assigned.length)} unassigned from ${agent.name}.`)}
          >
            Unassign selected
          </Button>
          <div style={{ minWidth: 220 }}>
            <FormField
              label="Move to agent"
              kind="select"
              value={moveTo}
              onChange={(e) => setMoveTo(e.target.value)}
              options={[{ value: "", label: "Choose an agent" }, ...otherAgents.map((a) => ({ value: a.id, label: a.name }))]}
            />
          </div>
          <Button
            disabled={picked.assigned.length === 0 || !movingAgent}
            onClick={() => apply(picked.assigned, moveTo, `${count(picked.assigned.length)} moved to ${movingAgent.name}.`)}
          >
            Move selected
          </Button>
        </div>
      </Card>

      <Card title="Farmers without an agent" subtitle="Includes farmers who registered themselves on the website">
        <DataTable
          columns={[checkColumn("unassigned"), ...baseColumns, sourceColumn]}
          rows={unassigned}
          empty="Every farmer has an agent."
        />
        <div className="form-actions">
          <Button
            disabled={picked.unassigned.length === 0}
            onClick={() => apply(picked.unassigned, agentKey, `${count(picked.unassigned.length)} assigned to ${agent.name}.`)}
          >
            Assign selected to {agent.name}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function AgentInvitations() {
  const { data, loading, error, reload } = useAsync(api.adminInvitations);
  if (loading || !data) return <Loading error={error} onRetry={reload} />;
  const columns = [
    { key: "agent", label: "Agent" },
    { key: "area", label: "Area" },
    { key: "invitation", label: "Invitation", render: (row) => <StatusPill>{row.invitation}</StatusPill> },
    { key: "sent", label: "Sent" },
    { key: "action", label: "Action", render: (row) => <button type="button" className="link-button">{row.action}</button> },
  ];
  return (
    <div className="stack">
      <PageHeader bar="Admin"
        title="Extension Agents · Invitations"
        subtitle="Manage activation and delivery status without sharing passwords."
        actions={
          <Button as={Link} to="/admin/agents/new">
            Add new agent
          </Button>
        }
      />
      <Card title="Agent invitations" subtitle="Track activation, expiry and invitation delivery.">
        <DataTable columns={columns} rows={data} empty="No invitations have been sent yet." />
      </Card>
    </div>
  );
}

export function CreateAgent() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", area: "" });
  const [errors, setErrors] = useState({});
  const set = (key) => (event) => {
    setForm({ ...form, [key]: event.target.value });
    if (errors[key]) setErrors({ ...errors, [key]: "" });
  };

  function submit(event) {
    event.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = "Enter the agent's full name.";
    if (!isEmail(form.email)) next.email = "Enter a valid work email, e.g. name@example.ng.";
    if (!isNigerianPhone(form.phone)) next.phone = "Use a Nigerian mobile number, e.g. 0803 123 4567.";
    if (!form.area.trim()) next.area = "Enter the agent's assigned area.";
    setErrors(next);
    if (Object.keys(next).length === 0) navigate("/admin/agents/invitations");
  }

  return (
    <div className="stack">
      <PageHeader bar="Admin" title="Extension Agents · Add New Agent" subtitle="Create an agent and send a secure activation link." />
      <Card title="Agent account details" subtitle="Only Super Admins can create Extension Agent accounts.">
        <form className="stack" onSubmit={submit}>
          <div className="form-grid">
            <FormField label="Full name" value={form.name} onChange={set("name")} error={errors.name} />
            <FormField label="Work email" type="email" value={form.email} onChange={set("email")} error={errors.email} />
            <FormField label="Phone number" type="tel" value={form.phone} onChange={set("phone")} error={errors.phone} />
            <FormField label="Assigned area" value={form.area} onChange={set("area")} error={errors.area} />
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
  const { data, loading, error, reload } = useAsync(api.adminAgents);
  const [sent, setSent] = useState(false);
  if (loading || !data) return <Loading error={error} onRetry={reload} />;
  const agent = data.find((item) => String(item.id) === id);
  if (!agent) return <p className="notice notice-warning">Agent not found.</p>;
  return (
    <div className="stack">
      <PageHeader bar="Admin" title="Agent Account & Password Reset" subtitle="Control agent account access safely" />
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
