import Button from "./Button.jsx";

export default function GpsCapture({ gps, onCapture, intro, error }) {
  const retry = gps.status === "error";
  return (
    <div className="stack">
      <div>
        <h3 className="card-title">Farm GPS location</h3>
        <p className="card-sub">{intro}</p>
      </div>
      <p className="notice notice-warning">
        <strong>Before capturing location.</strong> The agent must be physically present at the
        CENTER of the farm before clicking the button.
      </p>
      <div className="row">
        <Button onClick={onCapture} disabled={gps.status === "waiting"}>
          {retry ? "Retry GPS capture" : "Get Farm GPS Location Coordinates"}
        </Button>
        <div className="input" style={{ flex: 1, minWidth: 220 }} aria-live="polite">
          <div className="small muted">Latitude / Longitude</div>
          {gps.message}
        </div>
      </div>
      {error ? <span className="error-text">{error}</span> : null}
      <p className="hint">
        Location permission is required. Accuracy (± metres), timestamp and retry on failure are
        shown. GPS coordinates are saved with this farm record, not as a single location for all
        farmer farms.
      </p>
    </div>
  );
}
