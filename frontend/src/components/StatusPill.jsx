// Maps a status label to a colour. Unknown labels fall back to neutral.
// The final list of statuses should be agreed with the backend.
const TONES = {
  success: [
    "delivered",
    "active",
    "verified",
    "resolved",
    "accurate",
    "favourable",
    "safe to spray",
    "connected",
    "onboarded",
  ],
  warning: [
    "pending",
    "queued",
    "caution",
    "open",
    "pending gps",
    "pending review",
    "moderate confidence",
    "low confidence",
    "expired",
    "needs review",
    "medium",
    "degraded",
  ],
  danger: [
    "failed",
    "invalid",
    "inaccurate",
    "high risk",
    "do not spray",
    "delivery failed",
    "high",
  ],
  info: ["in progress", "sent"],
};

function toneFor(label) {
  const key = String(label).toLowerCase();
  const found = Object.keys(TONES).find((tone) => TONES[tone].includes(key));
  return found || "neutral";
}

export default function StatusPill({ children, tone }) {
  return <span className={`pill pill-${tone || toneFor(children)}`}>{children}</span>;
}
