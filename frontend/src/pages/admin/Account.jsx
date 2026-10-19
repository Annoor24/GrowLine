import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/index.js";
import useAsync from "../../hooks/useAsync.js";
import Button from "../../components/Button.jsx";
import Card from "../../components/Card.jsx";
import FormField from "../../components/FormField.jsx";
import Loading from "../../components/Loading.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import { isEmail, isNigerianPhone } from "../../utils/validate.js";

export function AdminProfile() {
  const { data, loading, error, reload } = useAsync(api.adminProfile);
  if (loading || !data) return <Loading error={error} onRetry={reload} />;
  return (
    <div className="stack">
      <PageHeader title="My Profile" subtitle="Your Super Admin account details" />
      <Card title="Personal information">
        <div className="stack">
          <div className="form-grid">
            <FormField label="Full name" value={data.name} readOnly />
            <FormField label="Email address" value={data.email} readOnly />
            <FormField label="Phone number" value={data.phone} readOnly />
            <FormField label="Profile photo" value="Upload / replace photo" readOnly />
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
          <FormField label="Admin ID (read only)" value={data.adminId} readOnly />
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
    // The sample phone number is a placeholder, so only check it once it has been changed.
    if (values.phone !== data.phone && !isNigerianPhone(values.phone)) {
      next.phone = "Use a Nigerian mobile number, e.g. 0803 123 4567.";
    }
    setErrors(next);
    if (Object.keys(next).length === 0) navigate("/admin/profile");
  }

  return (
    <div className="stack">
      <PageHeader title="Edit Profile" subtitle="Manage your personal contact information" />
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
      <PageHeader title="Personal Settings" subtitle="Manage your own security and alerts" />
      <Card title="Security">
        <div className="row">
          <div style={{ flex: 1, minWidth: 220 }}>
            <FormField label="Password" type="password" value="••••••••" readOnly />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <FormField label="Last password update" value="Not available" readOnly />
          </div>
          <Button as={Link} to="/admin/settings/password">
            Change password
          </Button>
        </div>
      </Card>
      <Card title="Alerts and sessions">
        <div className="form-grid">
          <FormField label="Admin notifications" value="Enabled" readOnly />
          <FormField label="Email alerts" value="Enabled" readOnly />
          <FormField label="Active sessions" value="View and sign out" readOnly />
        </div>
        <div className="form-actions">
          <Button>Save preferences</Button>
        </div>
      </Card>
    </div>
  );
}
