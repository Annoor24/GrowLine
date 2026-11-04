import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { USE_MOCKS } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import Icon from "../components/Icon.jsx";

// Pages that read from the real backend. Everything else still shows sample data.
const CONNECTED_PAGES = [
  /^\/admin\/agents$/,
  /^\/admin\/agents\/(invitations|new)$/,
  /^\/admin\/agents\/\d+$/,
  /^\/admin\/farmers(\/[^/]+)?$/,
  /^\/admin\/farms(\/[^/]+)?$/,
  /^\/admin\/complaints(\/[^/]+)?$/,
  /^\/agent\/complaints(\/[^/]+)?$/,
  /^\/agent\/farmers(\/new)?$/,
  /^\/agent\/farms(\/new)?$/,
  /^\/agent\/farmers\/[^/]+\/farms\/new$/,
  /^\/agent\/advisory\/daily$/,
  /^\/agent\/notifications$/,
  /^\/agent\/?$/,
  /^\/agent\/advisory\/farm$/,
  /^\/agent\/alerts$/,
  /^\/agent\/sms(\/[^/]+)?$/,
  /^\/agent\/farmers\/existing$/,
  /^\/(agent|admin)\/profile(\/edit)?$/,
  /^\/(agent|admin)\/settings\/password$/,
  /^\/admin\/notifications(\/new)?$/,
];

// nav / accountNav: [{ to, label, icon?, end?, children?: [{ to, label }] }]
// accountLink: when set, the account card at the bottom becomes a link (the agent's Settings).
export default function AppLayout({ roleLabel, nav, accountNav = [], accountLink, loginPath }) {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // When the app talks to the real backend, warn on pages that are not connected yet.
  const showSampleNotice = !USE_MOCKS && !CONNECTED_PAGES.some((pattern) => pattern.test(pathname));

  function handleLogout() {
    signOut();
    navigate(loginPath, { replace: true });
  }

  const renderLink = (item) => [
    <NavLink key={item.to} to={item.to} end={item.end}>
      <Icon name={item.icon} />
      {item.label}
    </NavLink>,
    ...(item.children || []).map((child) => (
      <NavLink key={child.to} to={child.to} className="nav-sub">
        {child.label}
      </NavLink>
    )),
  ];

  return (
    <div className="app">
      <div className="mobile-bar">
        <div className="brand">
          <span className="brand-mark" />
          GrowLine
        </div>
        <button
          type="button"
          className="menu-button"
          aria-expanded={menuOpen}
          aria-label="Open menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      {menuOpen ? <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} /> : null}

      <aside className={`sidebar${menuOpen ? " open" : ""}`}>
        <div className="brand">
          <span className="brand-mark" />
          GrowLine
        </div>
        <div className="brand-sub">Weather to spray advisory</div>
        <div className="role-badge">{roleLabel}</div>
        <nav className="nav" onClick={() => setMenuOpen(false)}>
          {nav.map(renderLink)}
          {accountNav.length > 0 ? <div className="nav-label">Account</div> : null}
          {accountNav.map(renderLink)}
        </nav>
        <div className="sidebar-foot">
          <button type="button" className="logout" onClick={handleLogout}>
            Log out
          </button>
          {accountLink ? (
            <NavLink className="account-chip" to={accountLink} onClick={() => setMenuOpen(false)}>
              <Icon name="settings" />
              <span>
                <strong>Account (Settings)</strong>
                {session?.name || roleLabel}
              </span>
            </NavLink>
          ) : (
            <div className="account-chip">
              <strong>{session?.name || "Account"}</strong>
              {roleLabel}
            </div>
          )}
        </div>
      </aside>

      <main className={`main${showSampleNotice ? " has-banner" : ""}`}>
        {showSampleNotice ? (
          <p className="sample-banner" role="note">
            Sample data: this page is not connected to the backend yet.
          </p>
        ) : null}
        <Outlet />
      </main>
    </div>
  );
}
