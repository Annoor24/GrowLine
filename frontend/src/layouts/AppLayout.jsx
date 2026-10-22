import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { USE_MOCKS } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import Icon from "../components/Icon.jsx";

// Pages that read from the real backend. Everything else still shows sample data.
const CONNECTED_PAGES = [
  /^\/admin\/agents$/,
  /^\/admin\/agents\/invitations$/,
  /^\/admin\/agents\/\d+$/,
  /^\/admin\/farmers(\/[^/]+)?$/,
  /^\/admin\/farms(\/[^/]+)?$/,
];

// nav / accountNav: [{ to, label, icon?, end? }]
export default function AppLayout({ roleLabel, nav, accountNav = [], loginPath }) {
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

  const renderLink = (item) => (
    <NavLink key={item.to} to={item.to} end={item.end}>
      <Icon name={item.icon} />
      {item.label}
    </NavLink>
  );

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
          <div className="account-chip">
            <strong>{session?.name || "Account"}</strong>
            {roleLabel}
          </div>
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
