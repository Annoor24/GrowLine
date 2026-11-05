import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/index.js";
import useAsync from "../../hooks/useAsync.js";
import Button from "../../components/Button.jsx";
import Card from "../../components/Card.jsx";
import FormField from "../../components/FormField.jsx";
import Loading from "../../components/Loading.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import { saveProfile } from "../../utils/profile.js";

export function AdminProfile() {
  const { data, loading, error, reload } = useAsync(api.adminProfile);
  if (loading || !data) return <Loading error={error} onRetry={reload} />;
  return (
    <div className="stack">
      <PageHeader bar="Super Admin" title="My Profile" subtitle="Your Super Admin account details" />
      <Card title="Personal information">
        <div className="stack">
          <div className="form-grid">
            <FormField label="Full name" value={data.name} readOnly />
            <FormField label="Email address" value={data.email} readOnly />
            <FormField label="Phone number" value={data.phone} readOnly />
          </div>
          <div className="form-actions">
            <Button as={Link} to="/admin/profile/edit">
              Edit profile
            </Button>
          </div>
        </div>
      </Card>
      <Card title="Administrator details">
        <div className="form-grid">
          <FormField label="Admin ID (read only)" value={data.adminId || "—"} readOnly />
          <FormField label="Role (read only)" value={data.role} readOnly />
        </div>
      </Card>
    </div>
  );
}

export function AdminEditProfile() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(api.adminProfile);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  if (loading || !data) return <Loading error={error} onRetry={reload} />;
  const values = form || { name: data.name, email: data.email, phone: data.phone };
  const set = (key) => (event) => {
    setForm({ ...values, [key]: event.target.value });
    if (errors[key]) setErrors({ ...errors, [key]: "" });
  };

  async function save() {
    setSaving(true);
    const next = await saveProfile(values, data);
    setSaving(false);
    setErrors(next);
    if (Object.keys(next).length === 0) navigate("/admin/profile");
  }

  return (
    <div className="stack">
      <PageHeader bar="Super Admin" title="Edit Profile" subtitle="Manage your personal contact information" />
      {errors.form ? <p className="notice notice-danger">{errors.form}</p> : null}
      <Card title="Personal information">
        <div className="stack">
          <div className="form-grid">
            <FormField label="Full name" value={values.name} onChange={set("name")} error={errors.name} />
            <FormField label="Email address" type="email" value={values.email} onChange={set("email")} error={errors.email} />
            <FormField label="Phone number" value={values.phone} onChange={set("phone")} error={errors.phone} />
          </div>
          <div className="form-actions">
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <Button variant="secondary" onClick={() => navigate("/admin/profile")}>
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function AdminSettings() {
  return (
    <div className="stack">
      <PageHeader bar="Super Admin" title="Settings" subtitle="Manage your account security" />
      <Card title="Security">
        <div className="row">
          <div style={{ flex: 1, minWidth: 220 }}>
            <FormField label="Password" type="password" value="••••••••" readOnly />
          </div>
          <Button as={Link} to="/admin/settings/password">
            Change password
          </Button>
        </div>
      </Card>
    </div>
  );
}
