// SAMPLE DATA ONLY, copied from the Figma screens so the pages look right before the API exists.
// Shapes are provisional: agree the real field names with the backend engineer, then update here.
// Note: the design uses mixed ID formats (FRM-, FAR-, FARM-, FM-, AGT-, AG-); these mocks use
// FRM- (farmer), FARM- (farm), ALT- (alert), AGT- (agent) consistently until the scheme is agreed.

/* ------------------------------ Extension agent ------------------------------ */

export const agentOverview = {
  name: "Amina",
  dateLabel: "Wednesday, 14 October 2026",
  area: "Ogun State",
  priorities: [
    { tone: "danger", title: "3 farms have high-risk spray conditions", note: "Review advisories before recommending spraying" },
    { tone: "warning", title: "4 SMS messages failed", note: "Review delivery failures and retry eligible messages" },
  ],
  prioritiesBadge: "7 need attention",
  stats: [
    { label: "Assigned farmers", value: "94", note: "8 registered this month" },
    { label: "Tomato farms", value: "136", note: "121 GPS verified" },
    { label: "Advisories sent today", value: "28", note: "24 delivered · 4 failed" },
    { label: "Feedback response", value: "72%", note: "Last 7 days" },
  ],
  summary: { total: 136, favourable: 92, caution: 30, highRisk: 14 },
  recent: [
    { id: "r1", farmer: "Musa Bello", farmId: "FRM-0081", risk: "High risk", sms: "Delivered", api: "API A", sentAt: "10:42 AM" },
    { id: "r2", farmer: "Bisi Adeoye", farmId: "FRM-0092", risk: "Caution", sms: "Failed", api: "API B", sentAt: "10:21 AM" },
    { id: "r3", farmer: "Tunde Bakare", farmId: "FRM-0104", risk: "Favourable", sms: "Delivered", api: "API C", sentAt: "09:58 AM" },
    { id: "r4", farmer: "Musa Bello", farmId: "FRM-0082", risk: "Caution", sms: "Queued", api: "API A", sentAt: "09:32 AM" },
  ],
  registration: { verified: 121, awaiting: 15 },
};

export const agentFarmers = [
  { id: "FRM-1021", name: "Musa Ibrahim", phone: "0803 *** 4521", farms: 3 },
  { id: "FRM-1022", name: "Hauwa Bello", phone: "0806 *** 1042", farms: 2 },
  { id: "FRM-1023", name: "Rashid Sani", phone: "0705 *** 3189", farms: 1 },
];

export const agentFarms = [
  { id: "FARM-201", name: "North Plot", farmer: "Musa Ibrahim", farmerId: "FRM-1021", gps: "7.8145, 3.9421", crop: "Tomatoes" },
  { id: "FARM-202", name: "River Plot", farmer: "Musa Ibrahim", farmerId: "FRM-1021", gps: "7.8201, 3.9568", crop: "Tomatoes" },
  { id: "FARM-203", name: "East Plot", farmer: "Musa Ibrahim", farmerId: "FRM-1021", gps: "7.8031, 3.9655", crop: "Cocoa" },
];

export const agentAdvisories = [
  { farmId: "FARM-201", label: "North Plot • FARM-201", directive: "Safe to spray", confidence: "High", smsStatus: "Not sent" },
  { farmId: "FARM-202", label: "River Plot • FARM-202", directive: "Do not spray", confidence: "Moderate", smsStatus: "Not sent" },
];

export const agentSmsMessages = [
  { id: "SMS-1", message: "Spray advisory", date: "13 Oct", dateLong: "13 October 2026", recipients: 46, status: "Delivered", delivered: 44, pending: 2, failed: 0, text: "Conditions currently indicate a safe spray window." },
  { id: "SMS-2", message: "Safety notice", date: "12 Oct", dateLong: "12 October 2026", recipients: 94, status: "Pending", delivered: 80, pending: 14, failed: 0, text: "Avoid spraying during the afternoon due to high wind." },
  { id: "SMS-3", message: "Rain update", date: "10 Oct", dateLong: "10 October 2026", recipients: 94, status: "Delivered", delivered: 94, pending: 0, failed: 0, text: "Light rain expected tomorrow morning." },
];

export const agentNotifications = [
  { id: "N-1", title: "Updated spray guidance", when: "Today", from: "Super Admin", body: "Please review the latest advisory guidance before sending SMS." },
  { id: "N-2", title: "Farm registration reminder", when: "Yesterday", from: "Super Admin", body: "Ensure each farm has its own unique ID and GPS coordinates." },
];

export const agentComplaints = [
  {
    id: "CMP-103",
    subject: "Cannot update farm GPS",
    submitted: "13 Oct",
    priority: "High",
    status: "Open",
    messages: [
      { from: "You", when: "13 Oct", text: "The farm coordinates are not saving after I submit." },
      { from: "Super Admin", when: "13 Oct", text: "We are reviewing this issue. Please retry shortly." },
    ],
  },
  {
    id: "CMP-098",
    subject: "SMS delivery issue",
    submitted: "9 Oct",
    priority: "Medium",
    status: "Resolved",
    messages: [
      { from: "You", when: "9 Oct", text: "Several farmers did not receive yesterday's advisory." },
      { from: "Super Admin", when: "10 Oct", text: "The gateway issue has been fixed. Messages were resent." },
    ],
  },
];

export const agentProfile = {
  name: "Amina Yusuf",
  email: "amina@example.com",
  phone: "0803 *** 1190",
  agentId: "AGT-0042",
  assignedFarmers: 94,
  registeredFarms: 136,
  status: "Active",
  location: "Oyo North",
};

/* -------------------------------- Super admin -------------------------------- */

export const adminOverview = {
  dateLabel: "14 Oct 2026",
  stats: [
    { label: "Registered farmers", value: "1,200", note: "+38 this week", tone: "good" },
    { label: "Registered farms", value: "1,680", note: "1.4 farms per farmer" },
    { label: "Verified farm GPS", value: "1,512", note: "168 require verification" },
    { label: "Active weather APIs", value: "3 / 3", note: "A, B and C operational", tone: "good" },
    { label: "Alerts generated", value: "1,000", note: "Last 7 days" },
    { label: "SMS delivered", value: "940", note: "94.0% delivery rate", tone: "good" },
    { label: "SMS failed", value: "35", note: "3.5% require review", tone: "bad" },
    { label: "Farmer responses", value: "376", note: "40.0% of delivered" },
  ],
  apiPerformance: [
    { id: "A", api: "API A", farmers: 400, alerts: 330, delivered: 315, failed: 10, pending: 5, accuracy: "81%" },
    { id: "B", api: "API B", farmers: 400, alerts: 340, delivered: 320, failed: 12, pending: 8, accuracy: "88%" },
    { id: "C", api: "API C", farmers: 400, alerts: 330, delivered: 305, failed: 13, pending: 12, accuracy: "76%" },
  ],
  attention: [
    { id: "a1", label: "35 SMS failed", tone: "danger", detail: "22 farms have invalid or missing GPS" },
    { id: "a2", label: "GPS review", tone: "warning", detail: "API C latency elevated: 2.8 s p95" },
  ],
  activity: [
    { id: "e1", time: "13:28", event: "SMS delivered", record: "FRM-002 / FARM-003", api: "B", status: "Delivered" },
    { id: "e2", time: "13:14", event: "GPS validation", record: "FRM-018 / FARM-027", api: "A", status: "Needs review" },
    { id: "e3", time: "12:52", event: "SMS failed", record: "FRM-041 / FARM-061", api: "C", status: "Failed" },
    { id: "e4", time: "12:30", event: "New farm added", record: "FRM-002 / FARM-004", api: "B", status: "Pending" },
    { id: "e5", time: "11:57", event: "Forecast feedback", record: "FRM-010 / FARM-015", api: "A", status: "Received" },
  ],
  readiness: {
    accuracy: "B: 88% • A: 81% • C: 76%",
    feedbackSample: "376 of 940 delivered alerts",
    decision: "Insufficient evidence",
    note: "Review geography and observation bias",
  },
};

export const adminProfile = {
  name: "System Administrator",
  email: "admin@growline.example",
  phone: "0800 000 0000",
  adminId: "ADM-0001",
  role: "Super Admin",
};

export const adminFarmers = [
  { id: "FRM-001", name: "Amina Bello", phone: "0803 *** 4521", farms: 1, api: "API A", location: "Kaduna", status: "Active" },
  { id: "FRM-002", name: "Musa Ibrahim", phone: "0806 *** 1042", farms: 2, api: "API B", location: "Kano", status: "Active" },
  { id: "FRM-003", name: "Zainab Yusuf", phone: "0705 *** 3189", farms: 3, api: "API C", location: "Katsina", status: "Active" },
  { id: "FRM-004", name: "Bello Sani", phone: "0812 *** 4490", farms: 1, api: "API A", location: "Kaduna", status: "Pending GPS" },
  { id: "FRM-005", name: "Fatima Umar", phone: "0802 *** 8063", farms: 2, api: "API B", location: "Kano", status: "Active" },
  { id: "FRM-006", name: "Ibrahim Lawal", phone: "0903 *** 2207", farms: 1, api: "API C", location: "Jigawa", status: "Inactive" },
];

export const adminFarms = [
  { id: "FARM-001", farmerId: "FRM-001", crop: "Tomatoes", size: "1.0 ha", gps: "10.5234, 7.4412", status: "Verified", accuracy: "± 12 metres", confidence: "High" },
  { id: "FARM-003", farmerId: "FRM-002", crop: "Tomatoes", size: "1.2 ha", gps: "11.9842, 8.5167", status: "Verified", accuracy: "± 9 metres", confidence: "High" },
  { id: "FARM-004", farmerId: "FRM-002", crop: "Tomatoes", size: "0.8 ha", gps: "11.9848, 8.5174", status: "Pending", accuracy: "± 34 metres", confidence: "Low confidence" },
  { id: "FARM-005", farmerId: "FRM-003", crop: "Tomatoes", size: "2.0 ha", gps: "12.9954, 7.6011", status: "Verified", accuracy: "± 15 metres", confidence: "High" },
  { id: "FARM-027", farmerId: "FRM-018", crop: "Tomatoes", size: "0.5 ha", gps: "0.0000, 0.0000", status: "Invalid", accuracy: "Not captured", confidence: "Low confidence" },
];

export const adminAgents = [
  { id: "AGT-0042", name: "Amina Yusuf", email: "amina@example.com", farmers: 94, farms: 136, advisories: 28, status: "Active", area: "Oyo North" },
  { id: "AGT-0043", name: "Bello Musa", email: "bello@example.com", farmers: 87, farms: 119, advisories: 24, status: "Active", area: "Kano Municipal" },
  { id: "AGT-0044", name: "Kemi Ade", email: "kemi@example.com", farmers: 62, farms: 81, advisories: 19, status: "Active", area: "Ilorin East" },
  { id: "AGT-0045", name: "Tayo Ali", email: "tayo@example.com", farmers: 0, farms: 0, advisories: 0, status: "Inactive", area: "Zaria" },
];

export const adminInvitations = [
  { id: "AG-012", agent: "AG-012 · Ibrahim Yusuf", area: "Kano Municipal", invitation: "Active", sent: "12 Oct 2026", action: "View agent" },
  { id: "AG-018", agent: "AG-018 · Fatima Musa", area: "Kaduna North", invitation: "Pending", sent: "15 Oct 2026", action: "Resend invite" },
  { id: "AG-021", agent: "AG-021 · Bayo Ade", area: "Ilorin East", invitation: "Expired", sent: "11 Oct 2026", action: "Renew invite" },
  { id: "AG-022", agent: "AG-022 · Grace Eze", area: "Zaria", invitation: "Delivery failed", sent: "15 Oct 2026", action: "Retry delivery" },
];

export const adminAlerts = [
  { id: "ALT-0092", farmerId: "FRM-002", farmId: "FARM-003", api: "API B", delivery: "Delivered", feedback: "Accurate", sentAt: "14 Oct, 13:28" },
  { id: "ALT-0091", farmerId: "FRM-040", farmId: "FARM-001", api: "API C", delivery: "Failed", feedback: "No response", sentAt: "14 Oct, 12:52" },
  { id: "ALT-0090", farmerId: "FRM-012", farmId: "FARM-018", api: "API A", delivery: "Queued", feedback: "No response", sentAt: "14 Oct, 12:48" },
  { id: "ALT-0089", farmerId: "FRM-019", farmId: "FARM-026", api: "API A", delivery: "Delivered", feedback: "Inaccurate", sentAt: "14 Oct, 11:02" },
  { id: "ALT-0085", farmerId: "FRM-002", farmId: "FARM-004", api: "API B", delivery: "Failed", feedback: "Not collected", sentAt: "13 Oct, 10:20" },
  { id: "ALT-0073", farmerId: "FRM-002", farmId: "FARM-004", api: "API B", delivery: "Delivered", feedback: "Accurate", sentAt: "12 Oct, 09:40" },
  { id: "ALT-0067", farmerId: "FRM-002", farmId: "FARM-003", api: "API B", delivery: "Delivered", feedback: "Inaccurate", sentAt: "11 Oct, 09:17" },
];

// Extra detail for one failed delivery (the "Automated alert delivery detail" screen).
// It matches alert ALT-0091 in adminAlerts; other alerts only show the basic fields.
export const adminAlertDetail = {
  id: "ALT-0091",
  forecastEventId: "WX-00217",
  smsId: "SMS-04401",
  gatewayMessageId: "GW-99212",
  failureReason: "Gateway rejected destination number",
  recovery: "Retry by backend policy only · Next attempt scheduled 14:15",
};

export const adminReports = {
  dateLabel: "14 Oct 2026",
  stats: [
    { label: "Pilot alerts", value: "1,000", note: "330 A / 340 B / 330 C" },
    { label: "Delivered", value: "940", note: "94% of generated" },
    { label: "Feedback received", value: "376", note: "40% response rate" },
    { label: "Top provisional API", value: "API B", note: "88% reported accuracy" },
  ],
  providers: [
    { id: "A", provider: "API A", assigned: 400, sent: 330, delivered: 315, failed: 10, pending: 5, feedback: 126, accuracy: "81%" },
    { id: "B", provider: "API B", assigned: 400, sent: 340, delivered: 320, failed: 12, pending: 8, feedback: 144, accuracy: "88%" },
    { id: "C", provider: "API C", assigned: 400, sent: 330, delivered: 305, failed: 13, pending: 12, feedback: 106, accuracy: "76%" },
  ],
  outcomes: [
    { label: "Delivered", value: 940, percent: 94.0, tone: "" },
    { label: "Failed", value: 35, percent: 3.5, tone: "bad" },
    { label: "Pending", value: 25, percent: 2.5, tone: "warn" },
  ],
  methodology: [
    "Assign farmers to balanced geographical cohorts.",
    "Record API source on each forecast and SMS.",
    "Collect structured farmer feedback per alert.",
    "Compare with independent observed weather.",
    "Track confidence, coverage and sample sizes.",
    "Decide only when evidence is sufficient.",
  ],
};

export const adminComplaints = [
  {
    id: "CMP-103",
    agent: "Amina Yusuf",
    subject: "Cannot update farm GPS",
    priority: "High",
    status: "Open",
    submitted: "13 October 2026",
    message: "The farm coordinates are not saving after I submit.",
    assigned: "Super Admin",
  },
  {
    id: "CMP-102",
    agent: "Bello Musa",
    subject: "SMS delivery issue",
    priority: "Medium",
    status: "In progress",
    submitted: "12 October 2026",
    message: "Several farmers did not receive the morning advisory.",
    assigned: "Super Admin",
  },
  {
    id: "CMP-101",
    agent: "Kemi Ade",
    subject: "Farmer assignment",
    priority: "Low",
    status: "Resolved",
    submitted: "10 October 2026",
    message: "Two farmers appear under the wrong agent.",
    assigned: "Super Admin",
  },
];
export const adminComplaintStats = [
  { label: "Open complaints", value: "12" },
  { label: "In progress", value: "5" },
  { label: "Resolved", value: "48" },
  { label: "High priority", value: "3" },
];

export const adminNotifications = [
  { id: "AN-1", title: "Updated spray guidance", recipients: "All agents", dashboard: "38 delivered", email: "38 queued", sent: "13 Oct" },
  { id: "AN-2", title: "Farm registration reminder", recipients: "12 agents", dashboard: "12 delivered", email: "12 delivered", sent: "12 Oct" },
  { id: "AN-3", title: "Maintenance notice", recipients: "All agents", dashboard: "38 delivered", email: "38 delivered", sent: "10 Oct" },
];
