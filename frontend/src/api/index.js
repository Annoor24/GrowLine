import * as data from "../mocks/data.js";
import { ApiError, fetchAllPages, request, USE_MOCKS } from "./client.js";
import { readSession } from "./session.js";
import {
  activityRow,
  adminOverview,
  adminReports,
  smsAlertDetail,
  smsAlertRow,
  smsStatTiles,
  advisoryFarmOption,
  agentDashboard,
  farmAdvisoryResult,
  farmerPhoneCheck,
  smsRow,
  userProfile,
  agentDetail,
  agentFarmerDetail,
  agentFarmerRow,
  agentFarmRow,
  agentProfile,
  agentRow,
  complaintRow,
  complaintThread,
  dailyFeedbackRow,
  formatClock,
  followUpMessage,
  farmDetail,
  farmRow,
  farmSummaryTiles,
  farmerDetail,
  farmerRow,
  farmerStatTiles,
  invitationRow,
  notificationBatchRow,
  notificationRow,
} from "./adapters.js";

// Every screen reads through this file.
//
// - "live" functions call the real backend (when VITE_API_URL is set) and fall back to sample data otherwise.
// - "sample" functions always return the sample data: the backend has no endpoint for them yet.
//
// Endpoints come from the backend repo's `staging` branch. When a new endpoint appears, turn the
// matching `sample(...)` line into a `live(...)` one with an adapter from adapters.js.
const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 120));
const sample = (value) => () => delay(value);
// Sample errors (e.g. "not found") come back as a rejected promise, like a failed request.
const live = (liveFn, sampleFn) => (...args) =>
  USE_MOCKS ? Promise.resolve().then(() => sampleFn(...args)).then(delay) : liveFn(...args);

// ---- sample data reshaped like the adapters' output ----
const asCode = (row) => ({ ...row, code: row.id });

const sampleAgentDetail = (id) => {
  const agent = data.adminAgents.find((a) => String(a.id) === String(id));
  if (!agent) throw new Error("Agent not found");
  return {
    id: agent.id,
    code: agent.id,
    name: agent.name,
    email: agent.email,
    status: agent.status,
    farmers: agent.farmers,
    farms: agent.farms,
    advisories: agent.advisories,
    farmerList: data.adminFarmers.slice(0, 3).map((f) => ({
      id: f.id,
      code: f.id,
      name: f.name,
      farms: f.farms,
      location: f.location,
    })),
  };
};

const sampleAlertRow = (a) => ({
  id: a.id,
  code: a.id,
  farmCode: a.farmId,
  api: a.api,
  directive: "—",
  delivery: a.delivery,
  sentAt: a.sentAt,
});

const sampleFarmerDetail = (id) => {
  const farmer = data.adminFarmers.find((f) => f.id === id);
  if (!farmer) throw new Error("Farmer not found");
  return {
    id: farmer.id,
    code: farmer.id,
    name: farmer.name,
    phone: farmer.phone,
    location: farmer.location,
    status: farmer.status,
    crop: "Tomatoes",
    api: farmer.api,
    registeredAt: "06 Oct 2026",
    farms: data.adminFarms
      .filter((f) => f.farmerId === id)
      .map((f) => ({ id: f.id, code: f.id, name: f.id, size: f.size, gps: f.status, alerts: 0 })),
    history: data.adminAlerts.filter((a) => a.farmerId === id).map(sampleAlertRow),
  };
};

const sampleFarmRow = (f) => ({
  id: f.id,
  code: f.id,
  farmerCode: f.farmerId,
  crop: f.crop,
  size: f.size,
  coordinates: f.gps,
  status: f.status,
});

const sampleFarmDetail = (id) => {
  const farm = data.adminFarms.find((f) => f.id === id);
  if (!farm) throw new Error("Farm not found");
  const farmer = data.adminFarmers.find((f) => f.id === farm.farmerId);
  const siblings = data.adminFarms.filter((f) => f.farmerId === farm.farmerId);
  return {
    id: farm.id,
    code: farm.id,
    farmerCode: farm.farmerId,
    farmerName: farmer ? farmer.name : "—",
    crop: farm.crop,
    size: farm.size,
    coordinates: farm.gps,
    status: farm.status,
    position: { index: siblings.findIndex((f) => f.id === id) + 1, total: siblings.length },
    locationCaptured: farm.status !== "Invalid",
    accuracy: farm.accuracy,
    confidence: farm.confidence,
    alerts: data.adminAlerts.filter((a) => a.farmId === id).map(sampleAlertRow),
  };
};

// ---- complaints: sample versions that mirror the backend, working on one shared list ----
// The sample agent is the first one in the list; the admin sees everyone's complaints.
const SAMPLE_AGENT = "Amina Yusuf";
const myComplaints = () => data.complaintStore.filter((c) => c.agent_name === SAMPLE_AGENT);
const countBy = (rows, status) => rows.filter((c) => c.status === status).length;

function findComplaint(code) {
  const found = data.complaintStore.find((c) => c.code.toLowerCase() === String(code).toLowerCase());
  if (!found) throw new ApiError(404, { detail: "Not found." });
  return found;
}

// Search on ticket or subject (and agent name for admins), filters, newest first, then limit.
function filterComplaints(rows, { search = "", status = "", priority = "" } = {}) {
  const term = search.toLowerCase();
  return rows.filter(
    (c) =>
      (!status || c.status === status) &&
      (!priority || c.priority === priority) &&
      (!term || [c.code, c.subject, c.agent_name].some((value) => value.toLowerCase().includes(term))),
  );
}

const sampleMyComplaints = ({ limit, ...filters } = {}) => {
  const matching = filterComplaints(myComplaints(), filters);
  const shown = limit ? matching.slice(0, limit) : matching;
  return { total: matching.length, showing: shown.length, rows: shown.map(complaintRow) };
};

let sampleCounter = 300;
const now = () => new Date().toISOString();
const sampleReply = (code, message, role) => {
  const target = findComplaint(code);
  const entry = { id: `${code}-${target.follow_ups.length + 1}`, sender_role: role, sender_name: role === "agent" ? SAMPLE_AGENT : "Super Admin", created_at: now(), message };
  target.follow_ups.push(entry);
  return entry;
};

// Responses are either wrapped as { message, data } or bare, depending on the endpoint.
const unwrap = (res) => (res && "data" in res && "message" in res ? res.data : res);

// The log returns ALT-0278 but the detail endpoint only accepts ALT-<date>-0278. It reads the number
// at the end and does not check the date, so short IDs get a placeholder date.
const fullAlertId = (id) => String(id).replace(/^ALT-(\d+)$/i, "ALT-00000000-$1");

const sampleSmsTiles = [
  { label: "Generated", value: "1,000", note: "All providers" },
  { label: "Delivered", value: "940", note: "94.0%" },
  { label: "Failed", value: "35", note: "3.5%" },
  { label: "Queued", value: "25", note: "2.5%" },
];

function sampleAlertDetail(id) {
  const alert = data.adminAlerts.find((a) => a.id === id);
  if (!alert) throw new ApiError(404, { detail: "Not found." });
  const extra = data.adminAlertDetail.id === id ? data.adminAlertDetail : {};
  return {
    id,
    api: alert.api,
    forecastEventId: extra.forecastEventId || "WX-00100",
    farmerCode: alert.farmerId,
    farmerName: "",
    farmCode: alert.farmId,
    farmName: "",
    smsId: extra.smsId || "SMS-04000",
    gatewayMessageId: extra.gatewayMessageId || "GW-99000",
    sentAt: alert.sentAt,
    status: alert.delivery,
    failureReason: extra.failureReason || "",
    attempts: extra.failureReason ? 2 : 1,
    recovery: extra.recovery || "Retry by backend policy only · No retry scheduled",
  };
}

const sampleSmsRow = (sms) => ({
  ...sms,
  recipient: data.agentFarmers.find((farmer) => farmer.name === sms.farmer)?.id || "—",
});

const sampleFarmerTiles = [
  { label: "Farmers", value: "1,200", note: "Unique farmer profiles" },
  { label: "Farms", value: "1,680", note: "Separate farm records" },
  { label: "Multi-farm farmers", value: "320", note: "More than one farm" },
  { label: "Awaiting GPS checks", value: "168", note: "Across all farms" },
];

const sampleFarmTiles = [
  { label: "Total farms", value: "1,680", note: "Across 1,200 farmers" },
  { label: "Verified", value: "1,512", note: "90% of farms" },
  { label: "Pending verification", value: "146", note: "Farm location review" },
  { label: "Invalid GPS", value: "22", note: "Requires recapture" },
];

export const api = {
  // ---------- Super admin: connected to the backend ----------
  adminAgents: live(
    async () => (await request("/superadmin/agent-list/")).map(agentRow),
    () => data.adminAgents,
  ),
  adminAgentDetail: live(
    async (id) => agentDetail(await request(`/superadmin/agent/${id}/`)),
    sampleAgentDetail,
  ),
  // body: { username, fullname, email, phone (+234…), area }. The backend emails the set-password link.
  adminCreateAgent: live(
    (body) => request("/register-agent/", { method: "POST", body }),
    (body) => {
      if (data.adminAgents.some((a) => a.email === body.email)) {
        throw new ApiError(400, { email: ["A user with this email already exists."] });
      }
      return { message: `Registration successful for Agent ${body.fullname}.` };
    },
  ),
  adminInvitations: live(
    async () => (await request("/superadmin/agent-invite-list/")).map(invitationRow),
    () => data.adminInvitations,
  ),
  adminFarmers: live(
    async () => {
      const { rows } = await fetchAllPages("/superadmin/farmers/?page_size=100");
      return rows.map(farmerRow);
    },
    () => data.adminFarmers.map(asCode),
  ),
  adminFarmerStats: live(
    async () => farmerStatTiles(await request("/superadmin/farmers/stats/")),
    () => sampleFarmerTiles,
  ),
  adminFarmerDetail: live(
    async (id) => farmerDetail(await request(`/superadmin/farmers/${id}/`)),
    sampleFarmerDetail,
  ),
  adminFarms: live(
    async () => {
      const { rows, first } = await fetchAllPages("/superadmin/farms/?page_size=100");
      return { rows: rows.map(farmRow), tiles: farmSummaryTiles(first?.summary) };
    },
    () => ({ rows: data.adminFarms.map(sampleFarmRow), tiles: sampleFarmTiles }),
  ),
  adminFarmDetail: live(
    async (id) => farmDetail(await request(`/superadmin/farms/${id}/`)),
    sampleFarmDetail,
  ),

  // ---------- Not connected yet (no backend endpoint): always sample data ----------
  adminOverview: live(async () => adminOverview(await request("/superadmin/overview/")), () => data.adminOverview),
  // The farmer list does not say who a farmer's agent is, but each agent's details list their farmers.
  adminFarmerAssignments: live(
    async () => {
      const [list, { rows }] = await Promise.all([request("/superadmin/agent-list/"), fetchAllPages("/superadmin/farmers/?page_size=100")]);
      const details = await Promise.all(list.map((a) => request(`/superadmin/agent/${a.id}/`).then(agentDetail)));
      const owners = {};
      details.forEach((agent) => agent.farmerList.forEach((farmer) => { owners[farmer.code] = agent.code; }));
      return {
        farmers: rows.map(farmerRow).map((f) => ({ id: f.code, name: f.name, farms: f.farms, location: f.location, agentCode: owners[f.code] || null })),
        agents: details.map((a) => ({ id: a.id, code: a.code, name: a.name, status: a.status })),
      };
    },
    () => ({
      farmers: data.adminFarmerAssignments.map((f) => ({ ...f, agentCode: f.agentId })),
      agents: data.adminAgents.map((a) => ({ id: a.id, code: a.id, name: a.name, status: a.status })),
    }),
  ),
  // Assigns or moves one farmer; there is no bulk endpoint. Their farms move with them.
  adminReassignFarmer: live(
    async (farmerCode, agentCode) =>
      unwrap(await request("/superadmin/farmers/reassign/", { method: "POST", body: { farmer_code: farmerCode, agent_code: agentCode } })),
    (farmerCode, agentCode) => {
      const farmer = data.adminFarmerAssignments.find((f) => f.id === farmerCode);
      if (!farmer) throw new ApiError(400, { farmer_code: ["Farmer not found."] });
      farmer.agentId = agentCode;
      return { agent_code: agentCode, farms_moved: farmer.farms };
    },
  ),
  // active: true to reactivate the agent's account, false to deactivate it.
  adminSetAgentActive: live(
    (agentCode, active) => request(`/superadmin/${active ? "activate" : "deactivate"}/agent/${encodeURIComponent(agentCode)}/`, { method: "POST" }),
    (agentCode, active) => {
      Object.assign(data.adminAgents.find((a) => a.id === agentCode), { status: active ? "Active" : "Inactive" });
      return { message: "Done." };
    },
  ),
  // GET /user/ has no email or admin ID, so the email comes from the login.
  adminProfile: live(
    async () => ({ ...userProfile(await request("/user/")), email: readSession()?.email || "", adminId: "" }),
    () => data.adminProfile,
  ),
  // SMS management is per day (date: YYYY-MM-DD; the backend defaults to today).
  adminSmsStats: live(
    async (date) => smsStatTiles(unwrap(await request(`/superadmin/sms/stats/?${new URLSearchParams(date ? { date } : {})}`))),
    () => sampleSmsTiles,
  ),
  adminAlerts: live(
    async ({ date, page = 1 } = {}) => {
      const params = new URLSearchParams({ page: String(page) });
      if (date) params.set("date", date);
      const log = unwrap(await request(`/superadmin/sms/alerts/?${params}`));
      return { count: log.count, page: log.page, totalPages: log.total_pages, rows: log.results.map(smsAlertRow) };
    },
    () => ({ count: data.adminAlerts.length, page: 1, totalPages: 1, rows: data.adminAlerts }),
  ),
  adminAlertDetail: live(
    async (id) => smsAlertDetail(unwrap(await request(`/superadmin/sms/alerts/${encodeURIComponent(fullAlertId(id))}/`))),
    sampleAlertDetail,
  ),
  adminReports: live(async () => adminReports(await request("/superadmin/reports/")), () => data.adminReports),
  adminNotifications: live(
    async () => {
      const { rows } = await fetchAllPages("/superadmin/notifications/");
      return rows.map(notificationBatchRow);
    },
    () => data.adminNotifications.map((n) => ({ ...n })),
  ),
  // body: { title, message, audience: "all" | "selected", agents: [agent ids] }. Returns the new row.
  adminSendNotification: live(
    async (body) => notificationBatchRow(unwrap(await request("/superadmin/notifications/send/", { method: "POST", body }))),
    (body) => {
      const recipients = body.audience === "all" ? "All agents" : `${body.agents.length} Agents`;
      const row = { id: `AN-${Date.now()}`, title: body.title, recipients, dashboard: "0 delivered", email: "0 delivered", sent: "Just now" };
      data.adminNotifications.unshift(row);
      return row;
    },
  ),

  // ---------- Complaints: super admin ----------
  adminComplaintStats: live(
    async () => unwrap(await request("/superadmin/complaints/stats/")),
    () => ({
      open_complaints: countBy(data.complaintStore, "pending"),
      in_progress: countBy(data.complaintStore, "on_going"),
      resolved: countBy(data.complaintStore, "closed"),
      high_priority: data.complaintStore.filter((c) => c.priority === "high" && c.status !== "closed").length,
    }),
  ),
  adminComplaints: live(
    async ({ search = "", status = "", priority = "" } = {}) => {
      const params = new URLSearchParams({ ordering: "-created_at" });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      const { rows } = await fetchAllPages(`/superadmin/complaints/?${params}`);
      return rows.map(complaintRow);
    },
    (filters) => filterComplaints(data.complaintStore, filters).map(complaintRow),
  ),
  adminComplaintDetail: live(
    async (code) => complaintThread(unwrap(await request(`/superadmin/complaints/${encodeURIComponent(code)}/`))),
    (code) => complaintThread(findComplaint(code)),
  ),
  // changes: { status?, priority? }
  adminUpdateComplaint: live(
    async (code, changes) =>
      complaintThread(unwrap(await request(`/superadmin/complaints/${encodeURIComponent(code)}/`, { method: "PATCH", body: changes }))),
    (code, changes) => complaintThread(Object.assign(findComplaint(code), changes)),
  ),
  adminReplyComplaint: live(
    async (code, message) =>
      followUpMessage(unwrap(await request(`/superadmin/complaints/${encodeURIComponent(code)}/follow-ups/`, { method: "POST", body: { message } }))),
    (code, message) => followUpMessage(sampleReply(code, message, "superadmin")),
  ),

  agentOverview: live(async () => agentDashboard(unwrap(await request("/agent/dashboard/"))), () => data.agentOverview),
  // Every advisory that was sent by SMS, newest first ("View all activity").
  agentActivity: live(
    async () => unwrap(await request("/agent/advisories/activity/")).map(activityRow),
    () => data.agentOverview.recent,
  ),
  // ---------- Agent farmers and farms ----------
  agentFarmers: live(
    async () => unwrap(await request("/agent/farmer-list/")).map(agentFarmerRow),
    () => data.agentFarmers.map((f) => ({ ...f, code: f.id, location: "—", status: "Onboarded" })),
  ),
  agentFarms: live(
    async () => unwrap(await request("/agent/farm-list/")).map(agentFarmRow),
    () => data.agentFarms.map((f) => ({ ...f, code: f.id, stage: "Vegetative" })),
  ),
  // Run before registering. Sample: 0803 555 0142 is the agent's own farmer, 0803 555 0143 another agent's.
  agentCheckFarmerPhone: live(
    async (phone) => farmerPhoneCheck(unwrap(await request("/agent/check/farmer-phone/", { method: "POST", body: { phone } }))),
    (phone) => {
      if (phone.endsWith("8035550143")) {
        return farmerPhoneCheck({ exists: true, can_request_access: true, current_agent_code: "AGT-0042", farmer: { name: "Bisi Ojo", code: "FRM-2040" } });
      }
      if (!phone.endsWith("8035550142")) return farmerPhoneCheck({ exists: false, farmer: null });
      return farmerPhoneCheck({
        exists: true,
        can_add_farm: true,
        current_agent_code: "AGT-0042",
        farmer: {
          name: "Musa Ibrahim",
          code: "FRM-1021",
          phone,
          farms_count: 2,
          assigned_agent_code: "AGT-0042",
          farms: [
            { code: "FARM-201", name: "North Plot", area_hectares: 1.2, gps_status: "verified" },
            { code: "FARM-202", name: "River Plot", area_hectares: 0.7, gps_status: "pending" },
          ],
        },
      });
    },
  ),
  // body: { full_name, phone_e164, state, lga, town_or_village, language, farms: [{ estimated_footprint }] }
  agentRegisterFarmer: live(
    async (body) => unwrap(await request("/agent/register/farmers/", { method: "POST", body })),
    (body) => {
      // Sample: 0803 555 0142 behaves as an already-registered number.
      if (body.phone_e164.endsWith("8035550142")) {
        throw new ApiError(400, { phone_e164: ["A farmer with this phone number already exists."] });
      }
      return { farmer: { code: "FMR-S001", name: body.full_name }, farms: body.farms.map((_, i) => ({ code: `FM-S00${i + 1}` })) };
    },
  ),
  // body: { farmer_code, estimated_footprint }
  agentAddFarm: live(
    async (body) => unwrap(await request("/agent/add/farms/", { method: "POST", body })),
    (body) => ({ code: "FM-S009", name: "Farm 2", farmer_code: body.farmer_code }),
  ),
  agentFarmerDetail: live(
    async (code) => agentFarmerDetail(unwrap(await request(`/agent/farmer/${encodeURIComponent(code)}/`))),
    (code) => {
      const farmer = data.agentFarmers.find((f) => f.id.toLowerCase() === String(code).toLowerCase());
      if (!farmer) throw new ApiError(404, { detail: "Not found." });
      return {
        code: farmer.id,
        name: farmer.name,
        phone: farmer.phone,
        agentCode: "AGT-0042",
        farms: data.agentFarms
          .filter((farm) => farm.farmerId === farmer.id)
          .map((farm) => ({ code: farm.id, name: farm.name, area: "1.2 ha", gpsStatus: "Pending" })),
      };
    },
  ),
  // ---------- Agent farm-specific advisory ----------
  agentAdvisoryFarms: live(
    async () => unwrap(await request("/agent/farms/")).map(advisoryFarmOption),
    () => data.agentAdvisories.map(({ farmId, label, farmer }) => ({ farmId, label, farmer, smsReady: true })),
  ),
  // Runs the advisory engine for one farm (saves a new advisory; may fetch fresh weather).
  agentRunAdvisory: live(
    async (code) => farmAdvisoryResult(await request(`/agent/farms/${encodeURIComponent(code)}/advisory/`, { method: "POST" })),
    (code) => {
      const farm = data.agentAdvisories.find((item) => item.farmId === code);
      if (!farm) throw new ApiError(404, { detail: "Not found." });
      return { advisoryId: farm.farmId, directive: farm.directive, confidence: farm.confidence, generatedAt: "Just now", note: "Check conditions before sharing with farmers.", lastSms: farm.lastSms, canSend: !farm.unchanged, alreadySent: farm.unchanged, blockedReason: "" };
    },
  ),
  // 409 { detail } when the advice is unchanged since the last SMS, or changed since it was run.
  agentSendAdvisorySms: live(
    async (code, advisoryId) =>
      (await request(`/agent/farms/${encodeURIComponent(code)}/advisory/sms/`, { method: "POST", body: { advisory_id: advisoryId } })).sms,
    (code) => {
      const farm = data.agentAdvisories.find((item) => item.farmId === code);
      if (farm.unchanged) throw new ApiError(409, { detail: "This advice was already sent and has not changed." });
      return { label: "Submitted", to: farm.farmerPhone };
    },
  ),
  // ---------- Agent daily feedback (advisories from the last 24 hours) ----------
  agentDailyFeedback: live(
    async () => {
      const list = unwrap(await request("/agent/advisories/daily-feedback/"));
      return { rows: list.results.map(dailyFeedbackRow), updatedAt: formatClock(list.updated_at) };
    },
    () => ({ rows: data.agentDailyFeedback.map((row) => ({ ...row })), updatedAt: "10:42 AM" }),
  ),
  // feedback: not_collected | accurate | in_accurate. Returns the updated row.
  agentUpdateFeedback: live(
    async (id, feedback) =>
      dailyFeedbackRow(unwrap(await request(`/agent/advisories/${id}/feedback/`, { method: "PATCH", body: { feedback } }))),
    (id, feedback) => Object.assign(data.agentDailyFeedback.find((row) => row.id === id), { feedback }),
  ),
  // ---------- Agent SMS history ----------
  agentSmsMessages: live(
    async () => unwrap(await request("/agent/sms/history/")).map(smsRow),
    () => data.agentSmsMessages.map(sampleSmsRow),
  ),
  agentSmsDetail: live(
    async (id) => smsRow(unwrap(await request(`/agent/sms/${encodeURIComponent(id)}/`))),
    (id) => {
      const found = data.agentSmsMessages.find((sms) => String(sms.id) === String(id));
      if (!found) throw new ApiError(404, { detail: "Not found." });
      return sampleSmsRow(found);
    },
  ),
  // ---------- Agent notifications ----------
  agentNotifications: live(
    async () => unwrap(await request("/agent/notifications/")).map(notificationRow),
    () => data.agentNotifications.map((n) => ({ ...n })),
  ),
  // POST with no body marks a notification read.
  agentMarkNotificationRead: live(
    async (id) => notificationRow(unwrap(await request(`/agent/notifications/${id}/`, { method: "POST" }))),
    (id) => Object.assign(data.agentNotifications.find((n) => n.id === id), { read: true }),
  ),
  // ---------- Complaints: extension agent ----------
  // Agent complaints page: the four cards and the "My complaints" table.
  agentComplaintStats: live(
    async () => unwrap(await request("/agent/complaints/stats/")),
    () => {
      const rows = myComplaints();
      return {
        total_submitted: rows.length,
        open: countBy(rows, "pending"),
        in_progress: countBy(rows, "on_going"),
        resolved: countBy(rows, "closed"),
      };
    },
  ),
  agentMyComplaints: live(
    async ({ search = "", status = "", limit } = {}) => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      if (limit) params.set("limit", String(limit));
      const query = params.toString();
      const page = unwrap(await request(`/agent/complaints/my/${query ? `?${query}` : ""}`));
      return { total: page.total, showing: page.showing, rows: page.results.map(complaintRow) };
    },
    sampleMyComplaints,
  ),
  // There is no agent endpoint for one complaint: GET /agent/complain/ returns all of the agent's
  // complaints with their messages, so pick the one asked for.
  agentComplaintDetail: live(
    async (code) => {
      const all = unwrap(await request("/agent/complain/"));
      const found = (all || []).find((c) => String(c.code).toLowerCase() === String(code).toLowerCase());
      if (!found) throw new ApiError(404, { detail: "Not found." });
      return complaintThread(found);
    },
    (code) => {
      const found = findComplaint(code);
      if (found.agent_name !== SAMPLE_AGENT) throw new ApiError(404, { detail: "Not found." });
      return complaintThread(found);
    },
  ),
  // body: { subject, priority, message }. Returns the new complaint with its first message.
  agentSubmitComplaint: live(
    async (body) => complaintThread(unwrap(await request("/agent/complain/", { method: "POST", body }))),
    (body) => {
      sampleCounter += 1;
      const code = `CMP-0${sampleCounter}`;
      const created = {
        id: code.toLowerCase(),
        code,
        agent_name: SAMPLE_AGENT,
        subject: body.subject,
        priority: body.priority || "medium",
        status: "pending",
        created_at: now(),
        follow_ups: [{ id: `${code}-1`, sender_role: "agent", sender_name: SAMPLE_AGENT, created_at: now(), message: body.message }],
      };
      data.complaintStore.unshift(created);
      return complaintThread(created);
    },
  ),
  agentReplyComplaint: live(
    async (code, message) =>
      followUpMessage(unwrap(await request(`/agent/complaints/${encodeURIComponent(code)}/follow-ups/`, { method: "POST", body: { message } }))),
    (code, message) => followUpMessage(sampleReply(code, message, "agent")),
  ),
  agentProfile: live(async () => agentProfile(unwrap(await request("/agent/"))), () => data.agentProfile),
  // Agents and the super admin. body: { fullname, email, phone (+234…) }
  updateProfile: live(
    (body) => request("/user/", { method: "PATCH", body }),
    (body) => ({ message: "User profile updated successfully.", data: body }),
  ),

  // ---------- Agent and super admin ----------
  // body: { oldPassword, newPassword1, newPassword2 }. Sample: the current password "wrong" is rejected.
  changePassword: live(
    (body) => request("/change-password/", { method: "POST", body }),
    (body) => {
      if (body.oldPassword === "wrong") throw new ApiError(400, { oldPassword: ["Old password is incorrect."] });
      return { message: "Password changed successfully." };
    },
  ),

  // ---------- Public farmer registration (no login) ----------
  // Step 1: the farmer's details. Returns { token, expires_in } for step 2.
  registerFarmerDetails: live(
    (body) => request("/farm/register/farmer/", { method: "POST", body, auth: false }),
    () => ({ token: "sample-token", expires_in: 7200 }),
  ),
  // Step 2: one or more farms. The backend builds each farm's polygon from the point and size.
  registerFarms: live(
    (token, farms) => request("/farm/register/farm/", { method: "POST", body: { token, farms }, auth: false }),
    (token, farms) => ({
      farms: farms.map((_, i) => ({ code: `FM-S00${i + 1}`, name: `Farm ${i + 1}`, duplicate: false })),
      farms_registered: farms.length,
    }),
  ),

  // ---------- Agent application (no backend endpoint yet): accept and do nothing ----------
  applyAgent: (payload) => delay({ ok: true, payload }),
};
