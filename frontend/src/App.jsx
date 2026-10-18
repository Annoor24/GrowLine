import { Navigate, Route, Routes } from "react-router-dom";
import RequireRole from "./auth/RequireRole.jsx";
import AppLayout from "./layouts/AppLayout.jsx";

import { ActivationSuccess, AgentActivate, AgentSignIn, InvitationExpired } from "./pages/auth/AgentAuth.jsx";
import { AdminSignIn, ForgotPassword, ResetLinkSent, SessionExpired, SetNewPassword } from "./pages/auth/AdminAuth.jsx";

import AgentOverview from "./pages/agent/Overview.jsx";
import { AddAnotherFarm, AddFarm, ExistingFarmerFound, MyFarmers, MyFarms, RegisterFarmer } from "./pages/agent/Farmers.jsx";
import { AlertMonitoring, SmsDetails, SmsHistory, SprayAdvisory } from "./pages/agent/Advisory.jsx";
import { ComplaintThread, Complaints, NewComplaint, Notifications } from "./pages/agent/Support.jsx";
import { ChangePassword, EditProfile, Profile, Settings } from "./pages/agent/Account.jsx";

import AdminOverview from "./pages/admin/Overview.jsx";
import { AdminFarmDetail, AdminFarmerDetail, AdminFarmers, AdminFarms } from "./pages/admin/People.jsx";
import { AdminAgentProfile, AdminAgents, AgentInvitations, AgentSecurity, CreateAgent } from "./pages/admin/Agents.jsx";
import { AlertDetail, Reports, SmsMonitoring } from "./pages/admin/Monitoring.jsx";
import { AdminComplaintDetail, AdminComplaints, AdminNotifications, ComposeNotification } from "./pages/admin/Support.jsx";
import { AdminEditProfile, AdminProfile, AdminSettings } from "./pages/admin/Account.jsx";

const agentNav = [
  { to: "/agent", label: "Overview", icon: "overview", end: true },
  { to: "/agent/farmers", label: "My Farmers", icon: "farmers" },
  { to: "/agent/farms", label: "My Farms", icon: "farms" },
  { to: "/agent/advisory", label: "Spray Advisory", icon: "advisory" },
  { to: "/agent/alerts", label: "Alert Monitoring", icon: "alerts" },
  { to: "/agent/sms", label: "SMS History", icon: "history" },
  { to: "/agent/notifications", label: "Notifications", icon: "bell" },
  { to: "/agent/complaints", label: "Complaints & Help", icon: "help" },
  { to: "/agent/profile", label: "My Profile", icon: "profile" },
];

const adminNav = [
  { to: "/admin", label: "Overview", icon: "overview", end: true },
  { to: "/admin/agents", label: "Extension Agents", icon: "agents" },
  { to: "/admin/farmers", label: "Farmers", icon: "farmers" },
  { to: "/admin/farms", label: "Farms", icon: "farms" },
  { to: "/admin/sms", label: "Automated SMS Monitoring", icon: "sms" },
  { to: "/admin/notifications", label: "Notifications", icon: "bell" },
  { to: "/admin/complaints", label: "Complaints & Support", icon: "help" },
  { to: "/admin/reports", label: "Reports & Analytics", icon: "reports" },
];
// The profile and settings frames in Figma show Settings under "Account".
const adminAccountNav = [
  { to: "/admin/profile", label: "My Profile", icon: "profile" },
  { to: "/admin/settings", label: "Settings", icon: "settings" },
];

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/agent" replace />} />

      {/* Extension agent: public screens */}
      <Route path="/login" element={<AgentSignIn />} />
      <Route path="/activate/:token" element={<AgentActivate />} />
      <Route path="/activation-success" element={<ActivationSuccess />} />
      <Route path="/invitation-expired" element={<InvitationExpired />} />

      {/* Super admin: public screens */}
      <Route path="/admin/login" element={<AdminSignIn />} />
      <Route path="/admin/forgot-password" element={<ForgotPassword />} />
      <Route path="/admin/reset-sent" element={<ResetLinkSent />} />
      <Route path="/admin/reset/:token" element={<SetNewPassword />} />
      <Route path="/admin/session-expired" element={<SessionExpired />} />

      {/* Extension agent: signed-in screens */}
      <Route element={<RequireRole role="agent" loginPath="/login" />}>
        <Route
          path="/agent"
          element={<AppLayout roleLabel="Extension Agent" nav={agentNav} loginPath="/login" />}
        >
          <Route index element={<AgentOverview />} />
          <Route path="farmers" element={<MyFarmers />} />
          <Route path="farmers/new" element={<RegisterFarmer />} />
          <Route path="farmers/existing" element={<ExistingFarmerFound />} />
          <Route path="farmers/:farmerId/farms/new" element={<AddAnotherFarm />} />
          <Route path="farms" element={<MyFarms />} />
          <Route path="farms/new" element={<AddFarm />} />
          <Route path="advisory" element={<SprayAdvisory />} />
          <Route path="alerts" element={<AlertMonitoring />} />
          <Route path="sms" element={<SmsHistory />} />
          <Route path="sms/:id" element={<SmsDetails />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="complaints/new" element={<NewComplaint />} />
          <Route path="complaints/:id" element={<ComplaintThread />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/edit" element={<EditProfile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/password" element={<ChangePassword backTo="/agent/settings" />} />
        </Route>
      </Route>

      {/* Super admin: signed-in screens */}
      <Route element={<RequireRole role="admin" loginPath="/admin/login" />}>
        <Route
          path="/admin"
          element={
            <AppLayout
              roleLabel="Super Admin"
              nav={adminNav}
              accountNav={adminAccountNav}
              loginPath="/admin/login"
            />
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="agents" element={<AdminAgents />} />
          <Route path="agents/new" element={<CreateAgent />} />
          <Route path="agents/invitations" element={<AgentInvitations />} />
          <Route path="agents/:id" element={<AdminAgentProfile />} />
          <Route path="agents/:id/security" element={<AgentSecurity />} />
          <Route path="farmers" element={<AdminFarmers />} />
          <Route path="farmers/:id" element={<AdminFarmerDetail />} />
          <Route path="farms" element={<AdminFarms />} />
          <Route path="farms/:id" element={<AdminFarmDetail />} />
          <Route path="sms" element={<SmsMonitoring />} />
          <Route path="sms/:id" element={<AlertDetail />} />
          <Route path="reports" element={<Reports />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="notifications/new" element={<ComposeNotification />} />
          <Route path="complaints" element={<AdminComplaints />} />
          <Route path="complaints/:id" element={<AdminComplaintDetail />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="settings/password" element={<ChangePassword backTo="/admin/settings" />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="profile/edit" element={<AdminEditProfile />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
