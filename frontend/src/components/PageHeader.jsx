export default function PageHeader({ title, subtitle, crumb, actions }) {
  return (
    <header className="page-header">
      <div>
        {crumb ? <div className="crumb">{crumb}</div> : null}
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="page-sub">{subtitle}</p> : null}
      </div>
      {actions ? <div className="row">{actions}</div> : null}
    </header>
  );
}
