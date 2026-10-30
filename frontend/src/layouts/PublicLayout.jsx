import { useEffect, useRef, useState } from "react";
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

const SIGN_IN_OPTIONS = [
  { to: "/login", label: "Extension agent" },
  { to: "/admin/login", label: "Super admin" },
];

// Desktop: a "Sign in" button that opens a small menu. Phone: the options are listed in the menu.
function SignInMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="signin" ref={ref}>
      <button
        type="button"
        className="signin-toggle"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        Sign in <span aria-hidden="true">▾</span>
      </button>
      <div className={`signin-options${open ? " open" : ""}`}>
        <span className="signin-heading">Sign in</span>
        {SIGN_IN_OPTIONS.map((option) => (
          <Link key={option.to} to={option.to} onClick={() => setOpen(false)}>
            {option.label}
            <span className="signin-suffix"> sign in</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

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
            <SignInMenu />
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
