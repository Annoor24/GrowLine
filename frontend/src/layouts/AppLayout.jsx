import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import Icon from "../components/Icon.jsx";

// nav / accountNav: [{ to, label, icon?, end? }]
export default function AppLayout({ roleLabel, nav, accountNav = [], loginPath }) {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

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

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
