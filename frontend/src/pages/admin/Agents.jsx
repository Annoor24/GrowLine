import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/index.js";
import { ApiError } from "../../api/client.js";
import { isEmail, isNigerianPhone, toE164 } from "../../utils/validate.js";
import useAsync from "../../hooks/useAsync.js";
import Button from "../../components/Button.jsx";
import Card from "../../components/Card.jsx";
import DataTable from "../../components/DataTable.jsx";
import FormField from "../../components/FormField.jsx";
import Loading from "../../components/Loading.jsx";
import Modal from "../../components/Modal.jsx";
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
      render: (row) => (
        <span>
          <button type="button" className="link-button" onClick={() => navigate(`/admin/agents/${row.id}`)}>
            View / Edit
          </button>
          {row.status === "Inactive" ? (
            <>
              {" | "}
              <button type="button" className="link-button" onClick={() => navigate(`/admin/agents/${row.id}/security`)}>
                Activate
              </button>
            </>
          ) : null}
        </span>
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

// NOT IN THE DESIGN: requested in review comment #15. Assign farmers to one agent or move them to
// another, including farmers who registered themselves on the website and have no agent yet.
// The backend has no unassign and no bulk endpoint, so each farmer is one request.
export function AssignFarmers() {
  const { id } = useParams();
  const { data: agent, loading, error, reload } = useAsync(() => api.adminAgentDetail(id), [id]);
  const assignments = useAsync(api.adminFarmerAssignments);
  const [picked, setPicked] = useState({ assigned: [], unassigned: [] });
  const [moveTo, setMoveTo] = useState("");
  const [notice, setNotice] = useState("");
  const [problem, setProblem] = useState("");
  const [saving, setSaving] = useState(false);

  if (loading || !agent) return <Loading error={error} onRetry={reload} />;
  if (!assignments.data) return <Loading error={assignments.error} onRetry={assignments.reload} />;

  const { farmers, agents } = assignments.data;
  const assigned = farmers.filter((f) => f.agentCode === agent.code);
  const unassigned = farmers.filter((f) => !f.agentCode);
  const otherAgents = agents.filter((a) => a.code !== agent.code && a.status !== "Inactive");
  const agentInactive = agent.status === "Inactive";

  const toggle = (list, farmerId) => {
    const current = picked[list];
    const next = current.includes(farmerId) ? current.filter((x) => x !== farmerId) : [...current, farmerId];
    setPicked({ ...picked, [list]: next });
  };

  const count = (n) => `${n} farmer${n === 1 ? "" : "s"}`;
  const reason = (err) => {
    const body = err instanceof ApiError ? err.data : null;
    const text = body?.agent_code || body?.farmer_code || body?.message;
    return Array.isArray(text) ? text[0] : text || "the change could not be saved";
  };

  // One request per farmer, one after another, so a failure only affects that farmer.
  async function assignTo(codes, target) {
    setSaving(true);
    setNotice("");
    setProblem("");
    const failed = [];
    for (const code of codes) {
      try {
        await api.adminReassignFarmer(code, target.code);
      } catch (err) {
        failed.push(`${code}: ${reason(err)}`);
      }
    }
    setPicked({ assigned: [], unassigned: [] });
    setMoveTo("");
    setSaving(false);
    const done = codes.length - failed.length;
    if (done > 0) setNotice(`${count(done)} assigned to ${target.name}. Their farms moved with them.`);
    if (failed.length > 0) setProblem(`Not saved: ${failed.join("; ")}`);
    assignments.reload();
    reload();
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
    { key: "location", label: "Location" },
  ];
  const movingAgent = otherAgents.find((a) => a.code === moveTo);

  return (
    <div className="stack">
      <PageHeader bar="Admin" title="Assign farmers" subtitle={`Assign or move farmers for ${agent.name} (${agent.code})`} />
      <div>
        <Button variant="secondary" as={Link} to={`/admin/agents/${agent.id}`}>
          ‹ Back to agent profile
        </Button>
      </div>
      {notice ? <p className="notice notice-success">{notice}</p> : null}
      {problem ? <p className="notice notice-danger">{problem}</p> : null}
      {agentInactive ? (
        <p className="notice notice-warning">
          This agent's account is not active, so farmers can't be assigned to them until it is activated.
        </p>
      ) : null}

      <Card title={`Assigned to ${agent.name}`} subtitle="Select farmers to move to another agent">
        <DataTable columns={[checkColumn("assigned"), ...baseColumns]} rows={assigned} empty="No farmers are assigned to this agent." />
        <div className="form-actions" style={{ alignItems: "flex-end" }}>
          <div style={{ minWidth: 220 }}>
            <FormField
              label="Move to agent"
              kind="select"
              value={moveTo}
              onChange={(e) => setMoveTo(e.target.value)}
              options={[{ value: "", label: "Choose an agent" }, ...otherAgents.map((a) => ({ value: a.code, label: a.name }))]}
            />
          </div>
          <Button disabled={saving || picked.assigned.length === 0 || !movingAgent} onClick={() => assignTo(picked.assigned, movingAgent)}>
            {saving ? "Saving…" : "Move selected"}
          </Button>
        </div>
      </Card>

      <Card title="Farmers without an agent" subtitle="Includes farmers who registered themselves on the website">
        <DataTable columns={[checkColumn("unassigned"), ...baseColumns]} rows={unassigned} empty="Every farmer has an agent." />
        <div className="form-actions">
          <Button disabled={saving || agentInactive || picked.unassigned.length === 0} onClick={() => assignTo(picked.unassigned, agent)}>
            {saving ? "Saving…" : `Assign selected to ${agent.name}`}
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

  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = "Enter the agent's full name.";
    if (!isEmail(form.email)) next.email = "Enter a valid work email, e.g. name@example.ng.";
    if (!isNigerianPhone(form.phone)) next.phone = "Use a Nigerian mobile number, e.g. 0803 123 4567.";
    if (!form.area.trim()) next.area = "Enter the agent's assigned area.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      // The backend needs a username; the design has none, so the (unique) email is used.
      const email = form.email.trim().toLowerCase();
      await api.adminCreateAgent({ username: email, fullname: form.name.trim(), email, phone: toE164(form.phone), area: form.area.trim() });
      navigate("/admin/agents/invitations");
    } catch (err) {
      const body = err instanceof ApiError && err.status === 400 ? err.data : null;
      const first = (value) => (Array.isArray(value) ? String(value[0]) : value ? String(value) : "");
      const found = {
        name: first(body?.fullname),
        email: first(body?.email) || first(body?.username),
        phone: first(body?.phone),
        area: first(body?.area),
      };
      if (!Object.values(found).some(Boolean)) {
        found.form = err instanceof ApiError && err.status === 0
          ? "We could not reach GrowLine. Check your internet connection and try again."
          : "The agent could not be created. Please try again.";
      }
      setErrors(found);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack">
      <PageHeader bar="Admin" title="Extension Agents · Add New Agent" subtitle="Create an agent and send a secure activation link." />
      {errors.form ? <p className="notice notice-danger">{errors.form}</p> : null}
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
            <Button type="submit" disabled={saving}>
              {saving ? "Sending…" : "Create & send invitation"}
            </Button>
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
  const { data: agent, loading, error, reload } = useAsync(() => api.adminAgentDetail(id), [id]);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [problem, setProblem] = useState("");
  if (loading || !agent) return <Loading error={error} onRetry={reload} />;
  const active = agent.status !== "Inactive";

  async function setActive(next) {
    setConfirming(false);
    setSaving(true);
    setNotice("");
    setProblem("");
    try {
      await api.adminSetAgentActive(agent.code, next);
      setNotice(next ? "Account activated." : "Account deactivated. This agent can no longer sign in.");
      reload();
    } catch (err) {
      setProblem((err instanceof ApiError && err.data?.message) || "The account could not be updated. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack">
      <PageHeader bar="Admin" title="Agent Account & Password Reset" subtitle="Control agent account access safely" />
      <div>
        <Button variant="secondary" as={Link} to={`/admin/agents/${agent.id}`}>
          ‹ Back to agent profile
        </Button>
      </div>
      {notice ? <p className="notice notice-success">{notice}</p> : null}
      {problem ? <p className="notice notice-danger">{problem}</p> : null}
      <Card title="Agent account">
        <div className="form-grid">
          <FormField label="Agent" value={agent.name} readOnly />
          <FormField label="Agent ID" value={agent.code} readOnly />
          <FormField label="Account status" value={agent.status} readOnly />
        </div>
        <div className="form-actions">
          {active ? (
            <Button variant="secondary" disabled={saving} onClick={() => setConfirming(true)}>
              Deactivate account
            </Button>
          ) : (
            <Button disabled={saving} onClick={() => setActive(true)}>
              {saving ? "Activating…" : "Activate account"}
            </Button>
          )}
        </div>
      </Card>
      <Card title="Password reset">
        <div className="form-grid">
          <FormField label="Reset method" value="Send secure reset link" readOnly />
          <FormField label="Delivery channel" value="Registered email address" readOnly />
        </div>
        <p className="hint" style={{ marginTop: 12 }}>
          Sending a reset link is not available yet.
        </p>
        <div className="form-actions">
          <Button disabled>Send reset link</Button>
        </div>
      </Card>

      <Modal
        open={confirming}
        title="Deactivate this account?"
        onClose={() => setConfirming(false)}
        actions={[
          <Button key="cancel" variant="secondary" onClick={() => setConfirming(false)}>
            Cancel
          </Button>,
          <Button key="confirm" onClick={() => setActive(false)}>
            Deactivate
          </Button>,
        ]}
      >
        <p>{agent.name} will no longer be able to sign in. You can activate the account again later.</p>
      </Modal>
    </div>
  );
}
