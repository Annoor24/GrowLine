import * as data from "../mocks/data.js";
import { fetchAllPages, request, USE_MOCKS } from "./client.js";
import {
  agentDetail,
  agentRow,
  farmDetail,
  farmRow,
  farmSummaryTiles,
  farmerDetail,
  farmerRow,
  farmerStatTiles,
  invitationRow,
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
const live = (liveFn, sampleFn) => (...args) =>
  USE_MOCKS ? delay(sampleFn(...args)) : liveFn(...args);

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
  adminOverview: sample(data.adminOverview),
  adminProfile: sample(data.adminProfile),
  adminAlerts: sample(data.adminAlerts),
  adminAlertDetail: sample(data.adminAlertDetail),
  adminReports: sample(data.adminReports),
  adminComplaints: sample(data.adminComplaints),
  adminComplaintStats: sample(data.adminComplaintStats),
  adminNotifications: sample(data.adminNotifications),

  agentOverview: sample(data.agentOverview),
  agentFarmers: sample(data.agentFarmers),
  agentFarms: sample(data.agentFarms),
  agentAdvisories: sample(data.agentAdvisories),
  agentSmsMessages: sample(data.agentSmsMessages),
  agentNotifications: sample(data.agentNotifications),
  agentComplaints: sample(data.agentComplaints),
  agentProfile: sample(data.agentProfile),
};
