import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/index.js";
import useAsync from "../../hooks/useAsync.js";
import Button from "../../components/Button.jsx";
import Card from "../../components/Card.jsx";
import FormField from "../../components/FormField.jsx";
import Loading from "../../components/Loading.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import { isEmail, isNigerianPhone, passwordMessage } from "../../utils/validate.js";

const MIN_PASSWORD = 12;

export function Profile() {
  const { data, loading, error, reload } = useAsync(api.agentProfile);
  if (loading || !data) return <Loading error={error} onRetry={reload} />;
  return (
    <div className="stack">
      <PageHeader
        title="My profile"
        subtitle="Your profile and assigned coverage"
        actions={[
          <Button key="edit" as={Link} to="/agent/profile/edit">
            Update profile
          </Button>,
          <Button key="settings" variant="secondary" as={Link} to="/agent/settings">
            Settings
          </Button>,
        ]}
      />
      <Card title="Agent profile">
        <div className="form-grid">
          <FormField label="Full name" value={data.name} readOnly />
          <FormField label="Email" value={data.email} readOnly />
          <FormField label="Phone" value={data.phone} readOnly />
          <FormField label="Agent ID" value={data.agentId} readOnly />
          <FormField label="Assigned farmers" value={data.assignedFarmers} readOnly />
          <FormField label="Registered farms" value={data.registeredFarms} readOnly />
        </div>
      </Card>
    </div>
  );
}

export function EditProfile() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(api.agentProfile);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  if (loading || !data) return <Loading error={error} onRetry={reload} />;
  const values = form || { name: data.name, email: data.email, phone: data.phone };
  const set = (key) => (event) => {
    setForm({ ...values, [key]: event.target.value });
    if (errors[key]) setErrors({ ...errors, [key]: "" });
  };

  function save() {
    const next = {};
    if (!values.name.trim()) next.name = "Enter your full name.";
    if (!isEmail(values.email)) next.email = "Enter a valid email address.";
    // The sample phone number is masked, so only check it once it has been changed.
    if (values.phone !== data.phone && !isNigerianPhone(values.phone)) {
      next.phone = "Use a Nigerian mobile number, e.g. 0803 123 4567.";
    }
    setErrors(next);
    if (Object.keys(next).length === 0) navigate("/agent/profile");
  }

  return (
    <div className="stack">
      <PageHeader title="Edit profile" subtitle="Update your contact details" />
      <Card title="Personal information">
        <div className="stack">
          <div className="form-grid">
            <FormField label="Full name" value={values.name} onChange={set("name")} error={errors.name} />
            <FormField label="Email address" type="email" value={values.email} onChange={set("email")} error={errors.email} />
            <FormField label="Phone number" value={values.phone} onChange={set("phone")} error={errors.phone} />
            <FormField label="Profile photo" value="Upload / replace photo" readOnly />
          </div>
          <div className="form-actions">
            <Button onClick={save}>Save changes</Button>
          </div>
        </div>
      </Card>
      <Card title="Managed by Super Admin">
        <div className="form-grid">
          <FormField label="Agent ID (read only)" value={data.agentId} readOnly />
          <FormField label="Account status (read only)" value={data.status} readOnly />
          <FormField label="Assigned location (read only)" value={data.location} readOnly />
        </div>
      </Card>
    </div>
  );
}

export function Settings() {
  return (
    <div className="stack">
      <PageHeader title="Settings" subtitle="Manage account security and notification preferences" />
      <Card title="Security">
        <div className="row">
          <div style={{ flex: 1, minWidth: 220 }}>
            <FormField label="Password" type="password" value="••••••••" readOnly />
          </div>
          <Button as={Link} to="/agent/settings/password">
            Change password
          </Button>
        </div>
      </Card>
      <Card title="Notification preferences">
        <div className="form-grid">
          <FormField label="Dashboard alerts" value="Enabled for critical notices" readOnly />
          <FormField label="Email backup" value="Enabled for admin notices" readOnly />
        </div>
        <div className="form-actions">
          <Button>Save preferences</Button>
        </div>
      </Card>
    </div>
  );
}

export function ChangePassword({ backTo = "/agent/settings" }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const set = (key) => (event) => {
    setForm({ ...form, [key]: event.target.value });
    if (errors[key]) setErrors({ ...errors, [key]: "" });
  };

  function submit(event) {
    event.preventDefault();
    const next = {};
    if (!form.current) next.current = "Enter your current password.";
    if (passwordMessage(form.next)) next.next = passwordMessage(form.next);
    else if (form.next === form.current) next.next = "Choose a password different from the current one.";
    if (form.next !== form.confirm) next.confirm = "The two new passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length === 0) navigate(backTo);
  }

  return (
    <div className="stack">
      <PageHeader title="Change password" subtitle="Keep your GrowLine account secure" />
      <Card title="Update password">
        <form className="stack" onSubmit={submit}>
          <div className="form-grid">
            <FormField label="Current password" type="password" value={form.current} onChange={set("current")} error={errors.current} />
            <FormField label="New password" type="password" value={form.next} onChange={set("next")} error={errors.next} />
            <FormField label="Confirm new password" type="password" value={form.confirm} onChange={set("confirm")} error={errors.confirm} />
          </div>
          <div className="form-actions">
            <Button type="submit">Update password</Button>
          </div>
        </form>
      </Card>
      <Card title="Security guidance">
        <div className="kv">
          <span>Password policy: minimum {MIN_PASSWORD} characters</span>
          <span className="muted">After changing password: other sessions may be signed out</span>
        </div>
      </Card>
    </div>
  );
}
