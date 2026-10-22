// Converts the backend's field names and values into the ones the pages use.
// The backend has a few odd names (weatehrApi, gps_Status); they are handled here only.

// The pilot compares three weather services. The backend stores the raw name; the design says API A, B, C.
const API_LABELS = {
  open_meteo: "API A",
  openweathermap: "API B",
  tomorrow_io: "API C",
};

const SMS_LABELS = {
  delivered: "Delivered",
  failed: "Failed",
  expired: "Expired",
  pending: "Pending",
  not_sent: "Not sent",
};

const DIRECTIVE_LABELS = {
  DO_NOT_SPRAY: "Do not spray",
  SAFE_TO_SPRAY: "Safe to spray",
  CAUTION: "Caution",
};

// "pending_gps" -> "Pending gps"
export function titleCase(value) {
  const text = String(value ?? "").replace(/_/g, " ").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : "—";
}

export const apiLabel = (raw) => (raw ? API_LABELS[raw] || titleCase(raw) : "—");
export const smsLabel = (raw) => (raw ? SMS_LABELS[raw] || titleCase(raw) : "—");
export const directiveLabel = (raw) => (raw ? DIRECTIVE_LABELS[raw] || titleCase(raw) : "—");

export function formatWhen(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function formatDate(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const number = (value) => (typeof value === "number" ? value.toLocaleString("en-GB") : "—");

// ----- agents -----
export const agentRow = (a) => ({
  id: a.id,
  name: a.fullname,
  farmers: a.farmers,
  farms: a.farms,
  status: a.status ? "Active" : "Inactive",
});

export const agentDetail = (a) => ({
  id: a.id,
  code: a.agent_code,
  name: a.fullname,
  email: a.email,
  status: a.status ? "Active" : "Inactive",
  farmers: a.farmers,
  farms: a.farms,
  advisories: a.advisories,
  farmerList: (a.farmersList || []).map((f) => ({
    id: f.id,
    code: f.farmerCode,
    name: f.name,
    farms: f.farmCount,
    location: f.lga || "—",
  })),
});

const INVITE_ACTIONS = { active: "View agent", pending: "Resend invite", expired: "Renew invite" };

export const invitationRow = (a) => ({
  id: a.id,
  agent: `${a.agent_code} · ${a.fullname}`,
  area: a.area || "—",
  invitation: titleCase(a.invitation),
  sent: a.invitationDate || "—",
  action: INVITE_ACTIONS[String(a.invitation || "").toLowerCase()] || "—",
});

// ----- farmers -----
export const farmerRow = (f) => ({
  id: f.id,
  code: f.farmer_id,
  name: f.farmer,
  phone: f.phone,
  farms: f.farms,
  api: apiLabel(f.weatehrApi),
  location: f.location || "—",
  status: titleCase(f.status),
});

export const farmerStatTiles = (s) => [
  { label: "Farmers", value: number(s.farmers), note: "Unique farmer profiles" },
  { label: "Farms", value: number(s.farms), note: "Separate farm records" },
  { label: "Multi-farm farmers", value: number(s.multi_farm_farmers), note: "More than one farm" },
  { label: "Awaiting GPS checks", value: number(s.awaiting_gps_checks), note: "Across all farms" },
];

export const alertRow = (a) => ({
  id: a.id,
  code: a.alert_id,
  farmCode: a.farm_id,
  api: apiLabel(a.weather_api),
  directive: directiveLabel(a.directive),
  delivery: smsLabel(a.sms_status),
  sentAt: formatWhen(a.timestamp),
});

export const farmerDetail = (f) => ({
  id: f.id,
  code: f.farmer_id,
  name: f.farmer,
  phone: f.phone,
  location: f.location || "—",
  status: titleCase(f.status),
  crop: f.crop || "—",
  api: f.pilot_group ? `API ${f.pilot_group}` : apiLabel(f.weatehrApi),
  registeredAt: formatDate(f.registered_at),
  farms: (f.farms || []).map((x) => ({
    id: x.id,
    code: x.farm_id,
    name: x.name,
    size: `${x.size_hectares} ha`,
    gps: titleCase(x.gps_Status),
    alerts: x.alerts,
  })),
  history: (f.history || []).map(alertRow),
});

// ----- farms -----
export const farmRow = (f) => ({
  id: f.id,
  code: f.farm_id,
  farmerCode: f.farmer_id,
  crop: f.crop,
  size: `${f.size_hectares} ha`,
  coordinates: f.coordinates,
  status: titleCase(f.gps_Status),
});

export const farmSummaryTiles = (s) => [
  { label: "Total farms", value: number(s?.total), note: "All registered farms" },
  { label: "Verified", value: number(s?.verified), note: "GPS confirmed" },
  { label: "Pending verification", value: number(s?.pending), note: "Farm location review" },
  { label: "Invalid GPS", value: number(s?.invalid), note: "Requires recapture" },
];

export const farmDetail = (f) => ({
  id: f.id,
  code: f.farm_id,
  farmerCode: f.farmer_id,
  farmerName: f.farmer_name,
  crop: f.crop,
  size: `${f.size_hectares} ha`,
  coordinates: f.coordinates,
  status: titleCase(f.gps_Status),
  position: f.position || null,
  locationCaptured: Boolean(f.location_captured),
  alerts: (f.alerts || []).map(alertRow),
});
