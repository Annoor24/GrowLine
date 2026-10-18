// Page frame used by every sign-in / password screen: heading top-left, white card centred.
export default function AuthShell({ heading, sub, title, intro, children, footer }) {
  return (
    <div className="auth-page">
      <div className="auth-heading">
        <h1>{heading}</h1>
        {sub ? <p>{sub}</p> : null}
      </div>
      <div className="auth-card">
        <div className="brand">
          <span className="brand-mark" />
          GrowLine
        </div>
        {title ? <h2>{title}</h2> : null}
        {intro ? <p className="muted small" style={{ marginBottom: 16 }}>{intro}</p> : null}
        {children}
        {footer ? <p className="auth-footer">{footer}</p> : null}
      </div>
    </div>
  );
}
