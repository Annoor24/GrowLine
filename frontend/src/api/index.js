import * as data from "../mocks/data.js";
import { request, USE_MOCKS } from "./client.js";

// Every screen reads through this file. Paths below are PROVISIONAL until the
// backend engineer confirms the real routes and response shapes.
const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 120));
const get = (path, mock) => (USE_MOCKS ? delay(mock) : request(path));

export const api = {
  // Extension agent
  agentOverview: () => get("/api/agent/overview", data.agentOverview),
  agentFarmers: () => get("/api/agent/farmers", data.agentFarmers),
  agentFarms: () => get("/api/agent/farms", data.agentFarms),
  agentAdvisories: () => get("/api/agent/advisories", data.agentAdvisories),
  agentSmsMessages: () => get("/api/agent/sms", data.agentSmsMessages),
  agentNotifications: () => get("/api/agent/notifications", data.agentNotifications),
  agentComplaints: () => get("/api/agent/complaints", data.agentComplaints),
  agentProfile: () => get("/api/agent/profile", data.agentProfile),

  // Super admin
  adminOverview: () => get("/api/admin/overview", data.adminOverview),
  adminProfile: () => get("/api/admin/profile", data.adminProfile),
  adminFarmers: () => get("/api/admin/farmers", data.adminFarmers),
  adminFarms: () => get("/api/admin/farms", data.adminFarms),
  adminAgents: () => get("/api/admin/agents", data.adminAgents),
  adminInvitations: () => get("/api/admin/invitations", data.adminInvitations),
  adminAlerts: () => get("/api/admin/alerts", data.adminAlerts),
  adminAlertDetail: () => get("/api/admin/alerts/detail", data.adminAlertDetail),
  adminComplaintStats: () => get("/api/admin/complaints/stats", data.adminComplaintStats),
  adminReports: () => get("/api/admin/reports", data.adminReports),
  adminComplaints: () => get("/api/admin/complaints", data.adminComplaints),
  adminNotifications: () => get("/api/admin/notifications", data.adminNotifications),
};
