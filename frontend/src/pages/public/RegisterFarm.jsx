import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/index.js";
import Button from "../../components/Button.jsx";
import FormField from "../../components/FormField.jsx";
import StepTabs from "../../components/StepTabs.jsx";
import useGps from "../../hooks/useGps.js";
import PublicLayout from "../../layouts/PublicLayout.jsx";
import { isNigerianPhone } from "../../utils/validate.js";
import { STATES, choose } from "./options.js";

const LANGUAGES = ["English", "Yoruba", "Pidgin"];
const UNITS = ["Plots", "Acres", "Hectares"];
// A reading less precise than this is treated as a weak GPS signal.
const WEAK_GPS_METRES = 50;

const STEPS = ["01 About you", "02 Mark your farm and tell us your farm size"];

// One farm on step 2: size, unit and its own GPS point.
function FarmBlock({ index, farm, onChange, onRemove, errors }) {
  const { gps, capture } = useGps();

  useEffect(() => {
    if (gps.status === "ok") onChange({ ...farm, location: gps });
    // Only react to a new GPS reading.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gps]);

  const weak = gps.status === "ok" && gps.accuracy > WEAK_GPS_METRES;
  const saved = farm.location && !weak;

  let state;
  if (gps.status === "waiting") {
    state = { tone: "info", title: "Finding your farm…", text: "Please stay where you are while your phone finds your location." };
  } else if (gps.status === "error") {
    state = { tone: "danger", title: "Location permission denied", text: "Allow location in your browser settings, then try again." };
  } else if (weak) {
    state = { tone: "warning", title: "Weak GPS signal", text: "Move to an open area away from tall trees or buildings, then try again." };
  } else if (saved) {
    state = { tone: "success", title: "Farm location saved", text: "Your farm pin has been saved." };
  }

  return (
    <div className="farm-block">
      <div className="farm-block-head">
        <h3>Farm {index + 1}</h3>
        {onRemove ? (
          <button type="button" className="link-button" onClick={onRemove}>
            Remove
          </button>
        ) : null}
      </div>
      <div className="form-grid">
        <FormField
          label="Enter farm size"
          type="number"
          min="0"
          step="0.1"
          inputMode="decimal"
          placeholder="Enter number"
          value={farm.size}
          onChange={(e) => onChange({ ...farm, size: e.target.value })}
          error={errors?.size}
          hint="A guess is fine."
        />
        <FormField
          label="Enter unit"
          kind="select"
          value={farm.unit}
          onChange={(e) => onChange({ ...farm, unit: e.target.value })}
          options={choose("Plots / Acres / Hectares", UNITS)}
          error={errors?.unit}
        />
      </div>
      <ol className="plain-steps">
        <li>Walk to the middle of your farm (or as close as possible).</li>
        <li>Stand still and tap the button below.</li>
        <li>If your phone asks to use your location, tap Allow.</li>
      </ol>
      <div className="split-even">
        <div className="mark-panel">
          <h4>Mark your farm location</h4>
          <p>We will capture your phone's GPS position. A location pin will appear here when your location is found.</p>
          <Button onClick={capture} disabled={gps.status === "waiting"}>
            {gps.status === "error" || weak ? "Try again" : saved ? "Mark again" : "Tap here to mark my farm"}
          </Button>
        </div>
        <div className="preview-panel" aria-live="polite">
          <p className="eyebrow">Location preview</p>
          {state ? (
            <div className={`notice notice-${state.tone}`}>
              <strong>{state.title}</strong>
              <div>{state.text}</div>
            </div>
          ) : (
            <strong>Your farm pin will appear here</strong>
          )}
          <p className="small muted">Raw GPS coordinates are not shown to farmers.</p>
        </div>
      </div>
      {errors?.location ? <span className="error-text">{errors.location}</span> : null}
      {gps.status === "error" || weak ? (
        <p className="small muted">Still having trouble? Ask your Extension Agent for help capturing your farm location.</p>
      ) : null}
    </div>
  );
}

let farmKey = 0;
const emptyFarm = () => ({ key: (farmKey += 1), size: "", unit: "", location: null });

export default function RegisterFarm() {
  const [step, setStep] = useState(0);
  const [about, setAbout] = useState({ name: "", phone: "", state: "", lga: "", town: "", language: "", consent: false });
  const [farms, setFarms] = useState([emptyFarm()]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const set = (key) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setAbout({ ...about, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: "" });
  };

  function continueToGps(event) {
    event.preventDefault();
    const next = {};
    if (!about.name.trim()) next.name = "Enter your full name.";
    if (!isNigerianPhone(about.phone)) next.phone = "Use a Nigerian mobile number, e.g. 0803 123 4567.";
    if (!about.state) next.state = "Choose your state.";
    if (!about.lga.trim()) next.lga = "Enter your Local Government Area.";
    if (!about.town.trim()) next.town = "Enter your town or village.";
    if (!about.consent) next.consent = "Tick the box to agree before you continue.";
    setErrors(next);
    if (Object.keys(next).length === 0) {
      setStep(1);
      window.scrollTo(0, 0);
    }
  }

  async function register() {
    const farmErrors = farms.map((farm) => {
      const e = {};
      if (!(Number(farm.size) > 0)) e.size = "Enter the farm size.";
      if (!farm.unit) e.unit = "Choose a unit.";
      if (!farm.location) e.location = "Mark the farm location before you register.";
      else if (farm.location.accuracy > WEAK_GPS_METRES) e.location = "The GPS signal was weak. Mark the farm again.";
      return e;
    });
    setErrors({ farms: farmErrors });
    if (farmErrors.some((e) => Object.keys(e).length > 0)) return;

    // Both steps are sent together in one request.
    const payload = {
      ...about,
      farms: farms.map(({ size, unit, location }) => ({
        size: Number(size),
        unit: unit.toLowerCase(),
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy_m: Math.round(location.accuracy),
        captured_at: location.capturedAt,
      })),
    };
    setSubmitting(true);
    setSubmitError("");
    try {
      await api.registerFarmer(payload);
      setDone(true);
      window.scrollTo(0, 0);
    } catch {
      setSubmitError("We could not send your registration. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <PublicLayout>
        <div className="public-inner form-page">
          <div className="result-card">
            <div className="result-icon">✓</div>
            <h1>Farmer registered</h1>
            <p>Welcome to GrowLine. Spray advice will be sent to your SMS number.</p>
            <div className="row">
              <Button as={Link} to="/">
                Return to homepage
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigator.share?.({ title: "GrowLine", url: window.location.origin })}
              >
                Share page
              </Button>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="public-inner form-page">
        <p className="eyebrow">Farmer registration</p>
        {step === 0 ? (
          <>
            <h1>Tell us about yourself.</h1>
            <p className="section-text">Your phone number is where GrowLine will send spray advice.</p>
            <StepTabs steps={STEPS} current={0} />
            <form className="form-card" onSubmit={continueToGps} noValidate>
              <div className="form-grid cols-3">
                <FormField label="Full name" placeholder="Enter your full name" value={about.name} onChange={set("name")} error={errors.name} autoComplete="name" />
                <FormField label="Phone number for SMS" type="tel" placeholder="e.g. 08031234567" value={about.phone} onChange={set("phone")} error={errors.phone} autoComplete="tel" />
                <FormField label="State" kind="select" value={about.state} onChange={set("state")} options={choose("Select state", STATES)} error={errors.state} />
                <FormField label="Local Government Area" placeholder="Enter your LGA" value={about.lga} onChange={set("lga")} error={errors.lga} />
                <FormField label="Town or village" placeholder="Enter your town or village" value={about.town} onChange={set("town")} error={errors.town} />
              </div>
              <div className="form-grid">
                <FormField
                  label="SMS language (optional)"
                  kind="select"
                  value={about.language}
                  onChange={set("language")}
                  options={choose("English / Yoruba / Pidgin", LANGUAGES)}
                />
              </div>
              <label className="check">
                <input type="checkbox" checked={about.consent} onChange={set("consent")} />
                <span>
                  I agree that GrowLine may keep my name, phone number and farm location to send farm weather advice and
                  improve the service.
                </span>
              </label>
              {errors.consent ? <span className="error-text">{errors.consent}</span> : null}
              <div className="notice notice-success">
                <strong>Before you continue</strong>
                <div>Be at your farm for the next step. You will need to allow location access on your phone.</div>
              </div>
              <div className="form-actions end">
                <Button type="submit">Save and continue to GPS</Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h1>Stand in the middle of your farm.</h1>
            <p className="section-text">Your location helps GrowLine send advice for the weather at your farm.</p>
            <StepTabs steps={STEPS} current={1} />
            <div className="form-card">
              {farms.map((farm, index) => (
                <FarmBlock
                  key={farm.key}
                  index={index}
                  farm={farm}
                  errors={errors.farms?.[index]}
                  onChange={(next) => setFarms((all) => all.map((f) => (f.key === farm.key ? next : f)))}
                  onRemove={farms.length > 1 ? () => setFarms((all) => all.filter((f) => f.key !== farm.key)) : null}
                />
              ))}
              {submitError ? <p className="notice notice-danger">{submitError}</p> : null}
              <div className="form-actions spread">
                <div className="row">
                  <Button variant="secondary" onClick={() => setStep(0)}>
                    ‹ Back
                  </Button>
                  <Button variant="secondary" onClick={() => setFarms([...farms, emptyFarm()])}>
                    + Add another farm
                  </Button>
                </div>
                <Button onClick={register} disabled={submitting}>
                  {submitting ? "Registering…" : "Register me for GrowLine"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </PublicLayout>
  );
}
