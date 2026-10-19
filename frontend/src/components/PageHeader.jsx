// Two looks, matching the Figma screens:
// - default: title on the page background (dashboards, reports), optional actions on the right
// - bar="Agent" | "Admin" | ...: white header bar with a role label at the right;
//   actions then sit just below the bar, aligned right
export default function PageHeader({ title, subtitle, crumb, actions, bar }) {
  const heading = (
    <div>
      {crumb ? <div className="crumb">{crumb}</div> : null}
      <h1 className="page-title">{title}</h1>
      {subtitle ? <p className="page-sub">{subtitle}</p> : null}
    </div>
  );

  if (bar) {
    return (
      <>
        <header className="page-bar">
          {heading}
          <span className="who">
            <span className="who-dot" />
            {bar}
          </span>
        </header>
        {actions ? <div className="page-actions">{actions}</div> : null}
      </>
    );
  }

  return (
    <header className="page-header">
      {heading}
      {actions ? <div className="row">{actions}</div> : null}
    </header>
  );
}
