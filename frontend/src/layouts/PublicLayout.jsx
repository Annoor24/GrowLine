import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";
import "../styles/public.css";

// Header links jump to sections of the landing page.
const LINKS = [
  { href: "/#about", label: "About" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#farmers", label: "For farmers" },
  { href: "/#agents", label: "Extension agents" },
  { href: "/#faqs", label: "FAQs" },
];

export default function PublicLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return (
    <div className="public">
      <header className="public-header">
        <div className="public-inner public-header-row">
          <Link to="/" className="public-brand" onClick={close}>
            <span className="brand-mark" />
            GrowLine
          </Link>
          <nav className={`public-nav${menuOpen ? " open" : ""}`} onClick={close}>
            {LINKS.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
            <Link to="/login" className="public-signin">
              Sign in
            </Link>
          </nav>
          <Button as={Link} to="/register" className="public-cta" onClick={close}>
            Register my farm
          </Button>
          <button
            type="button"
            className="public-menu-button"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <main>{children}</main>

      <footer className="public-footer">
        <div className="public-inner">
          <p>GrowLine · Southwest Nigeria · Built by Group 8, AltSchool Africa</p>
          <p className="public-footer-note">Contact and privacy notice: details to be confirmed</p>
        </div>
      </footer>
    </div>
  );
}
