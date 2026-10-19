// Page frame used by every sign-in / password screen: heading above, white card centred.
// centered: centre the heading text above the card (used on the agent screens)
// showLogo: show the GrowLine logo inside the card (the design omits it on a few status screens)
export default function AuthShell({
  heading,
  sub,
  title,
  intro,
  children,
  footer,
  centered = false,
  showLogo = true,
}) {
  return (
    <div className="auth-page">
      <div className={`auth-heading${centered ? " centered" : ""}`}>
        <h1>{heading}</h1>
        {sub ? <p>{sub}</p> : null}
      </div>
      <div className="auth-card">
        {showLogo ? (
          <div className="brand">
            <span className="brand-mark" />
            GrowLine
          </div>
        ) : null}
        {title ? <h2>{title}</h2> : null}
        {intro ? <p className="muted small" style={{ marginBottom: 16 }}>{intro}</p> : null}
        {children}
        {footer ? <p className="auth-footer">{footer}</p> : null}
      </div>
    </div>
  );
}
