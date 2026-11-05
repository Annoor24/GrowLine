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

// Agent: GET /agent/farmer-list/ rows. The code (FMR-…) is used in links and in add/farms/.
export const agentFarmerRow = (f) => ({
  id: f.code,
  code: f.code,
  name: f.name,
  phone: f.phone_masked || "—",
  farms: f.farms_count ?? 0,
  location: [f.town_or_village, f.lga, f.state].filter(Boolean).join(", ") || "—",
  status: titleCase(f.onboarding_status),
});

// Agent: GET /agent/farm-list/ rows. The list returns the centre of the farm's polygon.
export const agentFarmRow = (f) => ({
  id: f.code,
  code: f.code,
  name: f.name,
  farmer: f.farmer_name || "—",
  gps:
    typeof f.centroid_latitude === "number" && typeof f.centroid_longitude === "number"
      ? `${f.centroid_latitude.toFixed(4)}, ${f.centroid_longitude.toFixed(4)}`
      : "—",
  stage: titleCase(f.crop_stage),
});

// Agent: GET /agent/farmer/<code>/ (full phone number, the farmer's farms and their agent).
export const agentFarmerDetail = (f) => ({
  code: f.code,
  name: f.name,
  phone: f.phone || "—",
  agentCode: f.agent_code || "—",
  farms: (f.farms || []).map((farm) => ({
    code: farm.code,
    name: farm.name,
    area: typeof farm.area_hectares === "number" ? `${farm.area_hectares} ha` : "—",
    gpsStatus: titleCase(farm.gps_status),
  })),
});

// The engine's confidence values; the design calls them High, Moderate and Low.
const CONFIDENCE_LABELS = { HIGH: "High", MODERATE: "Moderate", LOWER: "Low" };
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// SMS status comes as the gateway sent it; the design shows Delivered, Failed, Submitted or Pending.
const GATEWAY_LABELS = {
  delivered: "Delivered",
  success: "Delivered",
  failed: "Failed",
  undelivered: "Failed",
  rejected: "Failed",
  queued: "Submitted",
  accepted: "Submitted",
  sending: "Submitted",
  submitted: "Submitted",
  buffered: "Submitted",
  sent: "Submitted",
  pending: "Pending",
  expired: "Expired",
};
export const gatewayLabel = (raw) => (raw ? GATEWAY_LABELS[String(raw).toLowerCase()] || titleCase(raw) : "—");

// Agent: GET /agent/sms/history/ rows and GET /agent/sms/<id>/. Rows are one SMS to one farmer.
export const smsRow = (s) => ({
  id: s.id,
  message: s.title || "Spray advisory",
  recipient: s.recipient || "—",
  sentAt: formatWhen(s.created_at),
  sentLong: formatLong(s.created_at),
  status: gatewayLabel(s.status),
  text: s.message || "",
});

// Agent: POST /agent/check/farmer-phone/. "exists" is false when the number is free to register.
export const farmerPhoneCheck = (c) => ({
  exists: Boolean(c.exists),
  canAddFarm: Boolean(c.can_add_farm),
  canRequestAccess: Boolean(c.can_request_access),
  currentAgentCode: c.current_agent_code || "—",
  farmer: c.farmer
    ? {
        name: c.farmer.name,
        code: c.farmer.code,
        phone: c.farmer.phone || "",
        farmsCount: c.farmer.farms_count ?? 0,
        agentCode: c.farmer.assigned_agent_code || "—",
        farms: (c.farmer.farms || []).map((farm) => ({
          code: farm.code,
          name: farm.name,
          area: typeof farm.area_hectares === "number" ? `${farm.area_hectares.toFixed(2)} ha` : "—",
          gpsStatus: titleCase(farm.gps_status),
        })),
      }
    : null,
});

// Agent: GET /agent/advisories/activity/ rows (also the dashboard's recent activity).
export const activityRow = (a, index) => ({
  id: `${a.farm_id}-${a.sent_at}-${index}`,
  farmer: a.farmer || "—",
  farmId: a.farm_id,
  rating: a.risk_display || "—",
  sms: gatewayLabel(a.sms_status),
  api: apiLabel(a.weather_api),
  sentAt: formatWhen(a.sent_at),
});

// Agent: GET /agent/dashboard/, in the shape the Overview page uses.
export function agentDashboard(d) {
  const { greeting = {}, priorities = {}, stats = {}, advisory_summary: summary = {}, registration = {} } = d;
  const date = greeting.date ? new Date(`${greeting.date}T12:00:00`) : new Date();
  const items = [];
  if (priorities.high_risk_farms) {
    items.push({ tone: "danger", title: `${plural(priorities.high_risk_farms, "farm")} with a Do not spray advisory`, note: "Review advisories before recommending spraying" });
  }
  if (priorities.failed_sms) {
    items.push({ tone: "warning", title: `${plural(priorities.failed_sms, "SMS message")} failed`, note: "Review delivery failures and retry eligible messages" });
  }
  if (items.length === 0) items.push({ tone: "success", title: "Nothing needs attention", note: "No high-risk farms or failed SMS right now" });
  return {
    name: greeting.name || "",
    dateLabel: date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    area: greeting.area || "—",
    priorities: items,
    prioritiesBadge: `${priorities.need_attention ?? 0} need attention`,
    stats: [
      { label: "Assigned farmers", value: number(stats.assigned_farmers), note: `${stats.registered_this_month ?? 0} registered this month` },
      { label: "Tomato farms", value: number(stats.tomato_farms), note: `${stats.gps_verified ?? 0} GPS verified` },
      { label: "Advisories sent today", value: number(stats.advisories_sent_today), note: `${stats.delivered_today ?? 0} delivered · ${stats.failed_today ?? 0} failed` },
      { label: "Feedback response", value: stats.feedback_response_rate == null ? "—" : `${stats.feedback_response_rate}%`, note: "Last 7 days" },
    ],
    summary: { total: summary.monitored_farms ?? 0, high: summary.high ?? 0, moderate: summary.moderate ?? 0, low: summary.low ?? 0 },
    recent: (d.recent_activity || []).map(activityRow),
    registration: { verified: registration.gps_verified ?? 0, awaiting: registration.gps_pending ?? 0 },
  };
}

// Agent: GET /agent/farms/ (the "Choose farm" dropdown).
export const advisoryFarmOption = (f) => ({
  farmId: f.code,
  label: f.label || f.code,
  farmer: f.farmer_name || "—",
  smsReady: Boolean(f.sms_ready),
});

// Agent: POST /agent/farms/<code>/advisory/ (runs the engine for one farm).
export const farmAdvisoryResult = (r) => ({
  advisoryId: r.advisory?.id,
  directive: DIRECTIVE_LABELS[r.advisory?.directive] || r.advisory?.directive_label || "—",
  confidence: CONFIDENCE_LABELS[r.advisory?.confidence] || r.advisory?.confidence_label || "—",
  generatedAt: formatWhen(r.advisory?.generated_at),
  note: r.note || "",
  lastSms: r.sms?.already_sent ? `${r.sms.label}${r.sms.sent_at ? ` • ${formatWhen(r.sms.sent_at)}` : ""}` : "Not sent yet",
  canSend: Boolean(r.sms?.can_send),
  alreadySent: Boolean(r.sms?.already_sent),
  blockedReason: r.sms?.blocked_reason || "",
});

// GET /user/ (the signed-in user's own profile; agents and the super admin).
export const userProfile = (u) => ({
  name: u.fullname || "",
  phone: u.phone && u.phone !== "None" ? u.phone : "",
  role: u.role === "admin" ? "Super Admin" : "Extension Agent",
  agentId: u.agentID || "",
  area: u.area || "",
});

// Agent: GET /agent/ (the signed-in agent's profile and coverage).
export const agentProfile = (p) => ({
  name: p.full_name,
  email: p.email || "—",
  phone: p.phone || "—",
  agentId: p.agent_code,
  assignedFarmers: p.coverage?.farmers_assigned ?? 0,
  registeredFarms: p.coverage?.registered_farms ?? 0,
  status: titleCase(p.status),
  location: p.area || "—",
  memberSince: formatDate(p.member_since),
});

// Agent: GET /agent/notifications/ rows.
export const notificationRow = (n) => ({
  id: n.id,
  title: n.title,
  body: n.message,
  when: formatWhen(n.created_at),
  read: Boolean(n.is_read),
});

// Super admin: GET /superadmin/notifications/ rows (and the send response). The counts arrive as text.
export const notificationBatchRow = (n) => ({
  id: n.id,
  title: n.title,
  recipients: n.recipientsCount || "—",
  dashboard: n.dashboardCount || "—",
  email: n.emailCount || "—",
  sent: formatWhen(n.sent_at),
});

// Agent daily feedback: the API stores in_accurate; the page says Inaccurate.
export const FEEDBACK_LABELS = { not_collected: "Not collected", accurate: "Accurate", in_accurate: "Inaccurate" };

// "10:42 AM"
export function formatClock(iso) {
  const date = new Date(iso);
  if (!iso || Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// "Today, 10:20 AM" / "Yesterday, 5:10 PM" / "30 Oct, 5:10 PM"
export function formatFetched(iso) {
  const date = new Date(iso);
  if (!iso || Number.isNaN(date.getTime())) return "—";
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86400000);
  if (days === 0) return `Today, ${time}`;
  if (days === 1) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}, ${time}`;
}

// Agent: GET /agent/advisories/daily-feedback/ rows (and the PATCH response).
export const dailyFeedbackRow = (a) => ({
  id: a.id,
  farm: a.farm_name || "—",
  farmId: a.farm_code,
  directive: DIRECTIVE_LABELS[a.directive_type] || a.directive_display || "—",
  fetched: formatFetched(a.generated_at),
  feedback: a.feedback,
});

// Agent complaints: the API returns stored values, the page shows friendlier labels.
export const COMPLAINT_STATUS_LABELS = { pending: "Open", on_going: "In progress", closed: "Resolved" };

// Agent lists call the code "ticket" or "code" depending on the endpoint; admin rows add agent_name.
export const complaintRow = (c) => ({
  id: c.id,
  ticket: c.ticket || c.code,
  subject: c.subject,
  agent: c.agent_name || "—",
  created: formatDate(c.created_at),
  priority: c.priority_display || titleCase(c.priority),
  priorityValue: c.priority,
  status: COMPLAINT_STATUS_LABELS[c.status] || c.status_display || titleCase(c.status),
  statusValue: c.status,
});

// A complaint with its conversation (follow_ups, oldest first).
export const complaintThread = (c) => ({
  ...complaintRow(c),
  messages: (c.follow_ups || []).map(followUpMessage),
});

export const followUpMessage = (f) => ({
  id: f.id,
  role: f.sender_role,
  from: f.sender_role === "superadmin" ? "Super Admin" : f.sender_name || "Agent",
  when: formatWhen(f.created_at),
  text: f.message,
});

export function formatWhen(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// "13 October 2026, 10:42"
export function formatLong(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const day = date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${day}, ${time}`;
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

// ----- operations overview -----
const OVERVIEW_ATTENTION_TONES = { error: "danger", warning: "warning" };
const shortApi = (label) => String(label || "—").replace(/^API\s+/, "");
// The backend sends null when there is nothing to divide by; that shows as empty, never 0%.
const rate = (value, text) => (typeof value === "number" ? `${value.toFixed(1)}% ${text}` : "");
const percent = (value) => (typeof value === "number" ? `${value}%` : "—");

// "A, B and C operational"
function operationalNote(labels = []) {
  const names = labels.map(shortApi);
  if (names.length === 0) return "None operational";
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
  return `${list} operational`;
}

// Today's events show the time; older ones add the day.
function activityTime(iso) {
  const date = new Date(iso);
  if (!iso || Number.isNaN(date.getTime())) return "—";
  if (date.toDateString() !== new Date().toDateString()) return formatWhen(iso);
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

// Super admin: GET /superadmin/overview/, in the shape the Overview page uses.
export function adminOverview(o) {
  const c = o.cards || {};
  const days = o.window_days ?? 7;
  const decision = o.decision || {};
  const sample = decision.feedback_sample || {};
  return {
    dateLabel: formatDate(o.as_of),
    stats: [
      { label: "Registered farmers", value: number(c.registered_farmers?.value), note: `+${c.registered_farmers?.new_in_window ?? 0} ${days === 7 ? "this week" : `in ${days} days`}`, tone: "good" },
      { label: "Registered farms", value: number(c.registered_farms?.value), note: `${(c.registered_farms?.farms_per_farmer ?? 0).toFixed(1)} farms per farmer` },
      { label: "Verified farm GPS", value: number(c.verified_farm_gps?.value), note: `${c.verified_farm_gps?.require_verification ?? 0} require verification` },
      { label: "Active weather APIs", value: `${c.active_weather_apis?.active ?? 0} / ${c.active_weather_apis?.total ?? 0}`, note: operationalNote(c.active_weather_apis?.operational), tone: "good" },
      { label: "SMS generated", value: number(c.sms_generated?.value), note: `Last ${days} days` },
      { label: "SMS delivered", value: number(c.sms_delivered?.value), note: rate(c.sms_delivered?.delivery_rate_pct, "delivery rate"), tone: "good" },
      { label: "SMS failed", value: number(c.sms_failed?.value), note: rate(c.sms_failed?.failed_rate_pct, "require review"), tone: "bad" },
      { label: "Farmers feedback", value: number(c.farmer_feedback?.value), note: rate(c.farmer_feedback?.pct_of_delivered, "of delivered") },
    ],
    apiPerformance: (o.api_performance || []).map((a) => ({
      id: a.api,
      api: a.api_label,
      farmers: a.farmers,
      alerts: a.alerts,
      delivered: a.delivered,
      failed: a.failed,
      pending: a.pending,
      accuracy: percent(a.accuracy_pct),
    })),
    attention: (o.attention || []).map((a) => ({
      id: `${a.kind}-${a.message}`,
      label: a.badge,
      tone: OVERVIEW_ATTENTION_TONES[a.severity] || "warning",
      detail: a.message,
    })),
    activity: (o.recent_activity || []).map((a, index) => ({
      id: `${a.event}-${a.time}-${index}`,
      time: activityTime(a.time),
      event: a.label,
      record: a.record,
      api: shortApi(a.api_label),
      status: titleCase(a.status),
      farmerId: a.farmer_uuid,
    })),
    readiness: {
      accuracy: (decision.forecast_accuracy || []).map((a) => `${shortApi(a.api_label)}: ${percent(a.accuracy_pct)}`).join(" • ") || "—",
      feedbackSample: `${sample.responses ?? 0} of ${sample.delivered ?? 0} delivered alerts`,
      decision: decision.status === "sufficient" ? "Sufficient evidence" : "Insufficient evidence",
      tone: decision.status === "sufficient" ? "success" : "warning",
      reasons: decision.reasons || [],
      note: decision.note || "",
    },
  };
}

// ----- SMS management -----
// Super admin: GET /superadmin/sms/stats/ (the four cards).
export const smsStatTiles = (s) => [
  { label: "Generated", value: number(s.generated), note: "All providers" },
  { label: "Delivered", value: number(s.delivered), note: `${(s.delivered_pct ?? 0).toFixed(1)}%` },
  { label: "Failed", value: number(s.failed), note: `${(s.failed_pct ?? 0).toFixed(1)}%` },
  { label: "Queued", value: number(s.queued), note: `${(s.queued_pct ?? 0).toFixed(1)}%` },
];

// Super admin: GET /superadmin/sms/alerts/ rows.
export const smsAlertRow = (a) => ({
  id: a.alert_id,
  farmerId: a.farmer_code,
  farmId: a.farm_code,
  api: a.source ? apiLabel(a.source) : "—",
  delivery: gatewayLabel(a.gateway_status),
  feedback: a.feedback_display || "No response",
  sentAt: formatWhen(a.sent_at),
});

// Super admin: GET /superadmin/sms/alerts/<alert_id>/. sms and recovery are null if it was never texted.
export function smsAlertDetail(a) {
  const recovery = a.recovery;
  const reason = a.status?.failure_reason;
  let recoveryText = "";
  if (recovery) {
    const next = recovery.retry_scheduled
      ? `Next attempt scheduled ${formatWhen(recovery.next_attempt_at)}`
      : recovery.needs_followup
        ? "Needs extension agent follow-up"
        : "No retry scheduled";
    recoveryText = `Retry by backend policy only · ${next}`;
  }
  return {
    id: a.alert_id,
    api: a.weather_source ? apiLabel(a.weather_source) : "—",
    forecastEventId: a.forecast_event?.code || "—",
    farmerCode: a.farmer?.code || "—",
    farmerName: a.farmer?.name || "",
    farmCode: a.farm?.code || "—",
    farmName: a.farm?.name || "",
    smsId: a.sms?.code || "",
    gatewayMessageId: a.sms?.gateway_message_id || "—",
    sentAt: a.sms?.sent_at ? formatWhen(a.sms.sent_at) : "",
    status: a.sms ? gatewayLabel(a.status?.gateway_status || a.status?.state) : "Not sent",
    failureReason: reason?.message || "",
    attempts: recovery?.attempts ?? 0,
    recovery: recoveryText,
  };
}

// ----- reports -----
const REPORT_METHODOLOGY = [
  "Assign farmers to balanced geographical cohorts.",
  "Record API source on each forecast and SMS.",
  "Collect structured farmer feedback per alert.",
  "Compare with independent observed weather.",
  "Track confidence, coverage and sample sizes.",
  "Decide only when evidence is sufficient.",
];
const shortRate = (value, text) => (typeof value === "number" ? `${value}% ${text}` : "");
const outcome = (label, row, tone) => ({
  label,
  value: number(row?.count ?? 0),
  percent: row?.pct_of_generated ?? 0,
  percentLabel: percent(row?.pct_of_generated),
  tone,
});

// Super admin: GET /superadmin/reports/. top_provisional_api is null until there is feedback.
export function adminReports(r) {
  const c = r.cards || {};
  const top = c.top_provisional_api;
  const outcomes = r.delivery_outcomes || {};
  return {
    dateLabel: formatDate(r.as_of),
    stats: [
      {
        label: "Pilot alerts",
        value: number(c.pilot_alerts?.value),
        note: (c.pilot_alerts?.by_api || []).map((a) => `${a.alerts} ${shortApi(a.api_label)}`).join(" / "),
      },
      { label: "Delivered", value: number(c.delivered?.value), note: shortRate(c.delivered?.pct_of_generated, "of generated") },
      { label: "Feedback received", value: number(c.feedback_received?.value), note: shortRate(c.feedback_received?.response_rate_pct, "response rate") },
      {
        label: "Top provisional API",
        value: top?.api_label || "—",
        note: top ? `${percent(top.accuracy_pct)} reported accuracy${top.evidence_sufficient ? "" : " • limited feedback"}` : "Not enough feedback yet",
      },
    ],
    providers: (r.provider_comparison || []).map((p) => ({
      id: p.api,
      provider: p.api_label,
      assigned: p.farmers,
      sent: p.alerts,
      delivered: p.delivered,
      failed: p.failed,
      pending: p.pending,
      feedback: p.feedback_count,
      accuracy: percent(p.accuracy_pct),
    })),
    outcomes: [
      outcome("Delivered", outcomes.delivered, ""),
      outcome("Failed", outcomes.failed, "bad"),
      outcome("Pending", outcomes.pending, "warn"),
      // The design has three rows; expired only appears when there is something to report.
      ...(outcomes.expired?.count ? [outcome("Expired", outcomes.expired, "bad")] : []),
    ],
    methodology: REPORT_METHODOLOGY,
  };
}

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
// The backend sends "longitude, latitude"; the page shows "latitude, longitude" to 6 decimals.
export function latLng(coordinates) {
  const [lng, lat] = String(coordinates ?? "").split(",").map((part) => Number(part.trim()));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "—";
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

export const farmRow = (f) => ({
  id: f.id,
  code: f.farm_id,
  farmerCode: f.farmer_id,
  crop: f.crop,
  size: `${f.size_hectares} ha`,
  coordinates: latLng(f.coordinates),
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
  coordinates: latLng(f.coordinates),
  status: titleCase(f.gps_Status),
  position: f.position || null,
  locationCaptured: Boolean(f.location_captured),
  alerts: (f.alerts || []).map(alertRow),
});
