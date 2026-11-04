import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../../api/index.js";
import { ApiError } from "../../api/client.js";
import useAsync from "../../hooks/useAsync.js";
import useGps from "../../hooks/useGps.js";
import { isNigerianPhone, toE164 } from "../../utils/validate.js";
import { farmPolygon, SIZE_UNITS } from "../../utils/farmShape.js";
import { STATES, choose } from "../public/options.js";
import Button from "../../components/Button.jsx";
import Card from "../../components/Card.jsx";
import DataTable from "../../components/DataTable.jsx";
import FormField from "../../components/FormField.jsx";
import GpsCapture from "../../components/GpsCapture.jsx";
import Loading from "../../components/Loading.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatusPill from "../../components/StatusPill.jsx";

// The backend rejects GPS readings less accurate than this.
const MAX_GPS_METRES = 500;

export function MyFarmers() {
  const { data, loading, error, reload } = useAsync(api.agentFarmers);
  if (loading || !data) return <Loading error={error} onRetry={reload} />;
  const columns = [
    { key: "code", label: "Farmer ID" },
    { key: "name", label: "Farmer" },
    { key: "phone", label: "Phone" },
    { key: "farms", label: "Farms" },
    {
      key: "action",
      label: "Action",
      render: (row) => (
        <Link className="link-button" to={`/agent/farmers/${row.code}/farms/new`}>
          View
        </Link>
      ),
    },
  ];
  return (
    <div className="stack">
      <PageHeader bar="Agent"
        title="My farmers"
        subtitle="Farmers assigned to your account"
        actions={
          <Button as={Link} to="/agent/farmers/new">
            + Register farmer
          </Button>
        }
      />
      <Card>
        <DataTable
          columns={columns}
          rows={data}
          empty="No farmers are assigned to you yet. Use “Register farmer” to add the first one."
        />
      </Card>
    </div>
  );
}

// Farm size, unit and GPS checks shared by Register farmer and Add farm.
// The farm's outline is estimated from the GPS point and size (see utils/farmShape.js).
function farmProblems(farm, gps) {
  const problems = {};
  if (!(Number(farm.size) > 0)) problems.size = "Enter the estimated farm size.";
  if (!farm.unit) problems.unit = "Choose a unit.";
  if (gps.status !== "ok") problems.gps = "Capture the farm GPS location first.";
  else if (gps.accuracy > MAX_GPS_METRES) problems.gps = "The GPS signal is too weak. Move to an open area and capture again.";
  return problems;
}

const footprintFor = (farm, gps) => farmPolygon(gps.latitude, gps.longitude, farm.size, farm.unit);

function FarmSizeFields({ farm, onChange, errors }) {
  return (
    <div className="form-grid">
      <FormField
        label="Estimated farm size"
        type="number"
        min="0"
        step="0.1"
        inputMode="decimal"
        placeholder="Enter number"
        value={farm.size}
        onChange={(e) => onChange({ ...farm, size: e.target.value })}
        error={errors.size}
        hint="1 plot is about 50 ft × 100 ft."
      />
      <FormField
        label="Unit"
        kind="select"
        value={farm.unit}
        onChange={(e) => onChange({ ...farm, unit: e.target.value })}
        error={errors.unit}
        options={[{ value: "", label: "Plots / Acres / Hectares" }, ...SIZE_UNITS]}
      />
    </div>
  );
}

// "field: ['message']" errors from the backend -> first message per form field.
function firstErrors(err, map) {
  const data = err instanceof ApiError ? err.data : null;
  const out = {};
  if (!data || typeof data !== "object") return out;
  Object.entries(map).forEach(([apiKey, formKey]) => {
    const value = data[apiKey];
    if (value && !out[formKey]) out[formKey] = Array.isArray(value) ? String(value[0]) : String(value);
  });
  return out;
}

export function RegisterFarmer() {
  const navigate = useNavigate();
  const { gps, capture } = useGps();
  const [form, setForm] = useState({ name: "", phone: "", state: "", lga: "", town: "", language: "en" });
  const [farm, setFarm] = useState({ size: "", unit: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (key) => (event) => {
    setForm({ ...form, [key]: event.target.value });
    if (errors[key]) setErrors({ ...errors, [key]: "" });
  };

  function validate(addFarm) {
    const next = {};
    if (!form.name.trim()) next.name = "Enter the farmer's full name.";
    if (!form.phone.trim()) {
      next.phone = "Enter the farmer's phone number.";
    } else if (!isNigerianPhone(form.phone)) {
      next.phone = "Use a Nigerian mobile number, e.g. 0803 123 4567 or +234 803 123 4567.";
    }
    if (!form.state) next.state = "Choose a state.";
    if (addFarm) Object.assign(next, farmProblems(farm, gps));
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function save(addFarm) {
    if (!validate(addFarm)) return;
    setSaving(true);
    try {
      // Look the number up first so a registered farmer is never created twice.
      const check = await api.agentCheckFarmerPhone(toE164(form.phone));
      if (check.exists) {
        navigate("/agent/farmers/existing", { state: { phone: toE164(form.phone), check } });
        return;
      }
      await api.agentRegisterFarmer({
        full_name: form.name.trim(),
        phone_e164: toE164(form.phone),
        state: form.state,
        lga: form.lga.trim() || undefined,
        town_or_village: form.town.trim() || undefined,
        language: form.language,
        farms: addFarm ? [{ estimated_footprint: footprintFor(farm, gps) }] : [],
      });
      navigate(addFarm ? "/agent/farms" : "/agent/farmers");
    } catch (err) {
      const found = firstErrors(err, {
        full_name: "name",
        phone: "phone",
        phone_e164: "phone",
        state: "state",
        lga: "lga",
        town_or_village: "town",
        language: "language",
      });
      const farmError = err instanceof ApiError && Array.isArray(err.data?.farms) ? err.data.farms[0]?.estimated_footprint : null;
      if (farmError) found.gps = Array.isArray(farmError) ? farmError[0] : String(farmError);
      if (Object.keys(found).length === 0) found.form = "The farmer could not be saved. Check your connection and try again.";
      setErrors(found);
    } finally {
      setSaving(false);
    }
  }

  const duplicatePhone = /already exists/i.test(errors.phone || "");

  return (
    <div className="stack">
      <PageHeader bar="Agent" title="Register farmer" subtitle="Create a farmer record before adding their farms" />
      <Card title="New farmer">
        <div className="stack">
          <div className="form-grid">
            <FormField
              label="Full name"
              placeholder="Enter farmer name"
              value={form.name}
              onChange={set("name")}
              error={errors.name}
            />
            <FormField
              label="Phone number"
              type="tel"
              placeholder="Enter phone number"
              value={form.phone}
              onChange={set("phone")}
              hint="Nigerian numbers only, e.g. +234 803 123 4567"
              error={errors.phone}
            />
            <FormField
              label="State"
              kind="select"
              value={form.state}
              onChange={set("state")}
              error={errors.state}
              options={choose("Select state", STATES)}
            />
            <FormField label="LGA" placeholder="Enter LGA" value={form.lga} onChange={set("lga")} error={errors.lga} />
            <FormField label="Town or village (optional)" placeholder="Enter town or village" value={form.town} onChange={set("town")} error={errors.town} />
            <FormField
              label="SMS language"
              kind="select"
              value={form.language}
              onChange={set("language")}
              error={errors.language}
              options={[
                { value: "en", label: "English" },
                { value: "yo", label: "Yoruba" },
              ]}
            />
            <FormField label="Assigned extension agent" value="Current agent (auto assigned)" readOnly />
          </div>
          {duplicatePhone ? (
            <p className="notice notice-warning">
              This phone number is already registered. If the farmer is yours, find them in{" "}
              <Link className="link-button" to="/agent/farmers">
                My Farmers
              </Link>{" "}
              and use View to add a farm. Do not create a duplicate farmer.
            </p>
          ) : null}
          <GpsCapture
            gps={gps}
            onCapture={capture}
            error={errors.gps}
            intro="Capture coordinates for the first farm. Additional farms can be added after saving."
          />
          <FarmSizeFields farm={farm} onChange={(next) => { setFarm(next); setErrors({ ...errors, size: "", unit: "" }); }} errors={errors} />
          {errors.form ? <p className="notice notice-danger">{errors.form}</p> : null}
          <div className="form-actions">
            <Button onClick={() => save(true)} disabled={saving}>
              {saving ? "Saving…" : "Save and add farm"}
            </Button>
            <Button variant="soft" onClick={() => save(false)} disabled={saving}>
              Save farmer only
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// The result of the phone check on Register farmer, passed in the page's navigation state.
export function ExistingFarmerFound() {
  const navigate = useNavigate();
  const { state } = useLocation();
  if (!state?.check?.farmer) return <Navigate to="/agent/farmers/new" replace />;
  const { phone, check } = state;
  const { farmer } = check;

  // Another agent's farmer: the backend only shares the name and code.
  if (!check.canAddFarm) {
    return (
      <div className="stack">
        <PageHeader bar="Agent" title="Existing farmer found" subtitle="This phone number is registered under another extension agent." />
        <p className="notice notice-warning">
          <strong>Existing record detected.</strong>
          <br />
          {phone} belongs to {farmer.name} ({farmer.code}). Do not create a duplicate farmer.
        </p>
        <Card title="Next step">
          <p className="muted">Contact the Super Admin to get access to this farmer.</p>
          <div className="form-actions">
            <Button as={Link} to="/agent/complaints/new">
              Contact Super Admin
            </Button>
            <Button variant="secondary" onClick={() => navigate("/agent/farmers")}>
              Cancel
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="stack">
      <PageHeader bar="Agent" title="Existing farmer found" subtitle="This phone number is already registered. Add a farm to the existing profile." />
      <p className="notice notice-warning">
        <strong>Existing record detected.</strong>
        <br />
        {farmer.phone || phone} belongs to {farmer.name} ({farmer.code}). Do not create a duplicate farmer.
      </p>
      <Card title="Farmer profile">
        <div className="kv">
          <strong>
            {farmer.name} • {farmer.code}
          </strong>
          <span>
            Phone: {farmer.phone || phone} | Tomato farmer | Registered farms: {farmer.farmsCount}
          </span>
          <span>
            Assigned agent: {farmer.agentCode} | Current agent: {check.currentAgentCode}
          </span>
        </div>
      </Card>
      <Card title="Existing farms">
        <div className="kv">
          {farmer.farms.map((farm) => (
            <span key={farm.code}>
              {farm.code} • {farm.name} • {farm.area} • GPS {farm.gpsStatus.toLowerCase()}
            </span>
          ))}
          <span className="muted small">A new farm will receive its own Farm ID, coordinates and alert history.</span>
        </div>
      </Card>
      <Card title="Next step">
        <p className="muted">Add a new farm under {farmer.code}. Farmer details will be prefilled and locked.</p>
        <div className="form-actions">
          <Button onClick={() => navigate(`/agent/farmers/${farmer.code}/farms/new`)}>+ Add New Farm</Button>
          <Button variant="secondary" onClick={() => navigate("/agent/farmers")}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function MyFarms() {
  const { data, loading, error, reload } = useAsync(api.agentFarms);
  if (loading || !data) return <Loading error={error} onRetry={reload} />;
  const columns = [
    { key: "code", label: "Farm ID" },
    { key: "name", label: "Farm" },
    { key: "farmer", label: "Farmer" },
    { key: "gps", label: "GPS coordinates" },
    { key: "stage", label: "Crop stage" },
  ];
  return (
    <div className="stack">
      <PageHeader bar="Agent"
        title="My farms"
        subtitle="Each farm is recorded separately under its owner"
        actions={
          <Button as={Link} to="/agent/farms/new">
            + Add farm
          </Button>
        }
      />
      <Card>
        <DataTable
          columns={columns}
          rows={data}
          empty="No farms recorded yet. Use “Add farm” to capture the first one."
        />
      </Card>
    </div>
  );
}

export function AddFarm() {
  const navigate = useNavigate();
  const { gps, capture } = useGps();
  const { data } = useAsync(api.agentFarmers);
  const [searchParams] = useSearchParams();
  const [farmerId, setFarmerId] = useState(searchParams.get("farmer") || "");
  const [farm, setFarm] = useState({ size: "", unit: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  async function save() {
    const next = farmProblems(farm, gps);
    if (!farmerId) next.farmer = "Choose the farmer this farm belongs to.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await api.agentAddFarm({ farmer_code: farmerId, estimated_footprint: footprintFor(farm, gps) });
      navigate("/agent/farms");
    } catch (err) {
      const found = firstErrors(err, { farmer_code: "farmer", estimated_footprint: "gps" });
      if (Object.keys(found).length === 0) found.form = "The farm could not be saved. Check your connection and try again.";
      setErrors(found);
    } finally {
      setSaving(false);
    }
  }

  const options = [{ value: "", label: "Select existing farmer's name" }].concat(
    (data || []).map((farmer) => ({ value: farmer.code, label: `${farmer.name} (${farmer.code})` })),
  );

  return (
    <div className="stack">
      <PageHeader bar="Agent" title="Add farm" subtitle="A farmer can have more than one farm at different coordinates" />
      <Card title="New farm">
        <div className="stack">
          <FormField
            label="Choose from existing farmers"
            kind="select"
            value={farmerId}
            onChange={(e) => {
              setFarmerId(e.target.value);
              setErrors({ ...errors, farmer: "" });
            }}
            error={errors.farmer}
            options={options}
          />
          <GpsCapture
            gps={gps}
            onCapture={capture}
            error={errors.gps}
            intro="Capture coordinates for the farm. You can add as many farms as needed."
          />
          <FarmSizeFields farm={farm} onChange={(next) => { setFarm(next); setErrors({ ...errors, size: "", unit: "" }); }} errors={errors} />
          {errors.form ? <p className="notice notice-danger">{errors.form}</p> : null}
          <div className="form-actions">
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save and add farm"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// "Add another farm": the farmer (GET /agent/farmer/<code>/) and the farms they already have.
export function AddAnotherFarm() {
  const navigate = useNavigate();
  const { farmerId } = useParams();
  const { data: farmer, loading, error, reload } = useAsync(() => api.agentFarmerDetail(farmerId), [farmerId]);
  if (loading || !farmer) {
    if (error instanceof ApiError && error.status === 404) {
      return <p className="notice notice-warning">Farmer {farmerId} was not found among your farmers.</p>;
    }
    return <Loading error={error} onRetry={reload} />;
  }
  return (
    <div className="stack">
      <PageHeader bar="Agent" title="Add another farm" subtitle="One tomato farmer can have multiple independent farms" />
      <Card title={`Farmer ${farmer.code} · ${farmer.name}`} subtitle={`Phone: ${farmer.phone} • Agent: ${farmer.agentCode}`}>
        <div className="kv">
          {farmer.farms.length === 0 ? <span className="muted">No farms recorded yet.</span> : null}
          {farmer.farms.map((farm) => (
            <span key={farm.code}>
              {farm.name} ({farm.code}) · {farm.area} · <StatusPill>{farm.gpsStatus}</StatusPill>
            </span>
          ))}
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
        <Button onClick={() => navigate(`/agent/farms/new?farmer=${farmer.code}`)}>+ Add As New Farm</Button>
        <Button variant="secondary" onClick={() => navigate("/agent/farms")}>
          Back to Farm List
        </Button>
      </div>
    </div>
  );
}
