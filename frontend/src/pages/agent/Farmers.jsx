import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/index.js";
import useAsync from "../../hooks/useAsync.js";
import useGps from "../../hooks/useGps.js";
import Button from "../../components/Button.jsx";
import Card from "../../components/Card.jsx";
import DataTable from "../../components/DataTable.jsx";
import FormField from "../../components/FormField.jsx";
import GpsCapture from "../../components/GpsCapture.jsx";
import Loading from "../../components/Loading.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatusPill from "../../components/StatusPill.jsx";

// MOCK: registering this phone number simulates the "existing farmer found" case.
const EXISTING_PHONE = "08035550142";

export function MyFarmers() {
  const { data, loading, error } = useAsync(api.agentFarmers);
  if (loading || !data) return <Loading error={error} />;
  const columns = [
    { key: "id", label: "Farmer ID" },
    { key: "name", label: "Farmer" },
    { key: "phone", label: "Phone" },
    { key: "farms", label: "Farms" },
    {
      key: "action",
      label: "Action",
      render: (row) => (
        <Link className="link-button" to={`/agent/farmers/${row.id}/farms/new`}>
          Add farm
        </Link>
      ),
    },
  ];
  return (
    <div className="stack">
      <PageHeader
        title="My farmers"
        subtitle="Farmers assigned to your account"
        actions={
          <Button as={Link} to="/agent/farmers/new">
            + Register farmer
          </Button>
        }
      />
      <Card>
        <DataTable columns={columns} rows={data} />
      </Card>
    </div>
  );
}

export function RegisterFarmer() {
  const navigate = useNavigate();
  const { gps, capture } = useGps();
  const [form, setForm] = useState({ name: "", phone: "", state: "", lga: "" });
  const [error, setError] = useState("");

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  function save(addFarm) {
    if (!form.name || !form.phone) {
      setError("Enter the farmer's name and phone number.");
      return;
    }
    const digits = form.phone.replace(/\D/g, "");
    if (digits.endsWith(EXISTING_PHONE.slice(1))) {
      navigate("/agent/farmers/existing");
      return;
    }
    navigate(addFarm ? "/agent/farms/new" : "/agent/farmers");
  }

  return (
    <div className="stack">
      <PageHeader title="Register farmer" subtitle="Create a farmer record before adding their farms" />
      <Card title="New farmer">
        <div className="stack">
          {error ? <p className="notice notice-danger">{error}</p> : null}
          <div className="form-grid">
            <FormField label="Full name" placeholder="Enter farmer name" value={form.name} onChange={set("name")} />
            <FormField
              label="Phone number"
              type="tel"
              placeholder="Enter phone number"
              value={form.phone}
              onChange={set("phone")}
              hint="Nigerian numbers only, e.g. +234 803 123 4567"
            />
            <FormField
              label="State"
              kind="select"
              value={form.state}
              onChange={set("state")}
              options={[
                { value: "", label: "Select state" },
                { value: "kano", label: "Kano" },
                { value: "kaduna", label: "Kaduna" },
                { value: "oyo", label: "Oyo" },
              ]}
            />
            <FormField
              label="LGA"
              kind="select"
              value={form.lga}
              onChange={set("lga")}
              options={[{ value: "", label: "Select LGA" }]}
            />
            <FormField label="Assigned extension agent" value="Current agent (auto assigned)" readOnly />
          </div>
          <GpsCapture gps={gps} onCapture={capture} intro="Capture coordinates for the first farm. Additional farms can be added after saving." />
          <div className="form-actions">
            <Button onClick={() => save(true)}>Save and add farm</Button>
            <Button variant="soft" onClick={() => save(false)}>
              Save farmer only
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// MOCK content from the design: the record that matches the duplicate phone number.
export function ExistingFarmerFound() {
  const navigate = useNavigate();
  return (
    <div className="stack">
      <PageHeader title="Existing farmer found" subtitle="This phone number is already registered. Add a farm to the existing profile." />
      <p className="notice notice-warning">
        <strong>Existing record detected.</strong>
        <br />
        +234 803 555 0142 belongs to Amina Bello (FRM-0104). Do not create a duplicate farmer.
      </p>
      <Card title="Farmer profile">
        <div className="kv">
          <strong>Amina Bello • FRM-0104</strong>
          <span>Phone: +234 803 555 0142 | Tomato farmer | Registered farms: 2</span>
          <span>Assigned agent: AGT-0042 | Current agent: AGT-0042</span>
        </div>
      </Card>
      <Card title="Existing farms">
        <div className="kv">
          <span>FARM-0201 • North Field • 1.2 ha • GPS verified</span>
          <span>FARM-0202 • Riverside Plot • 0.7 ha • GPS pending</span>
          <span className="muted small">A new farm will receive its own Farm ID, coordinates and alert history.</span>
        </div>
      </Card>
      <Card title="Next step">
        <p className="muted">Add a new farm under FRM-0104. Farmer details will be prefilled and locked.</p>
        <div className="form-actions">
          <Button onClick={() => navigate("/agent/farmers/FRM-0104/farms/new")}>+ Add New Farm</Button>
          <Button variant="secondary" onClick={() => navigate("/agent/farmers")}>
            Cancel
          </Button>
        </div>
      </Card>
      <p className="hint">
        Access rule: if the farmer belongs to another agent, show Request Access instead of Add New Farm.
      </p>
    </div>
  );
}

export function MyFarms() {
  const { data, loading, error } = useAsync(api.agentFarms);
  if (loading || !data) return <Loading error={error} />;
  const columns = [
    { key: "id", label: "Farm ID" },
    { key: "name", label: "Farm" },
    { key: "farmer", label: "Farmer" },
    { key: "gps", label: "GPS coordinates" },
    { key: "crop", label: "Crop" },
  ];
  return (
    <div className="stack">
      <PageHeader
        title="My farms"
        subtitle="Each farm is recorded separately under its owner"
        actions={
          <Button as={Link} to="/agent/farms/new">
            + Add farm
          </Button>
        }
      />
      <Card>
        <DataTable columns={columns} rows={data} />
      </Card>
    </div>
  );
}

export function AddFarm() {
  const navigate = useNavigate();
  const { gps, capture } = useGps();
  const { data } = useAsync(api.agentFarmers);
  const [farmerId, setFarmerId] = useState("");
  const [error, setError] = useState("");

  function save() {
    if (!farmerId) {
      setError("Choose the farmer this farm belongs to.");
      return;
    }
    if (gps.status !== "ok") {
      setError("Capture the farm GPS location before saving.");
      return;
    }
    navigate("/agent/farms");
  }

  const options = [{ value: "", label: "Select existing farmer's name" }].concat(
    (data || []).map((farmer) => ({ value: farmer.id, label: `${farmer.name} (${farmer.id})` })),
  );

  return (
    <div className="stack">
      <PageHeader title="Add farm" subtitle="A farmer can have more than one farm at different coordinates" />
      <Card title="New farm">
        <div className="stack">
          {error ? <p className="notice notice-danger">{error}</p> : null}
          <FormField
            label="Choose from existing farmers"
            kind="select"
            value={farmerId}
            onChange={(e) => setFarmerId(e.target.value)}
            options={options}
          />
          <GpsCapture gps={gps} onCapture={capture} intro="Capture coordinates for the farm. You can add as many farms as needed." />
          <div className="form-actions">
            <Button onClick={save}>Save and add farm</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// MOCK content from the design ("Add another farm" for FRM-0104).
export function AddAnotherFarm() {
  const navigate = useNavigate();
  return (
    <div className="stack">
      <PageHeader title="Add another farm" subtitle="One tomato farmer can have multiple independent farms" />
      <Card title="Farmer FRM-0104 · Amina Bello">
        <div className="kv">
          <span>Farm FARM-0201 · 1.2 ha · <StatusPill>Verified</StatusPill></span>
          <span>New farm FARM-0202 · 0.7 ha · <StatusPill>Pending</StatusPill></span>
        </div>
      </Card>
      <Card title="Validation">
        <ul className="kv" style={{ paddingLeft: 18, margin: 0 }}>
          <li>Farm belongs to selected farmer ID</li>
          <li>Do not overwrite coordinates of an existing farm</li>
          <li>Duplicate proximity warning: allow review rather than automatic merge</li>
        </ul>
      </Card>
      <div className="form-actions">
        <Button onClick={() => navigate("/agent/farms/new")}>+ Add As New Farm</Button>
        <Button variant="secondary" onClick={() => navigate("/agent/farms")}>
          Back to Farm List
        </Button>
      </div>
    </div>
  );
}
