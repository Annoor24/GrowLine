export default function Card({ title, subtitle, actions, children, className = "" }) {
  return (
    <section className={`card ${className}`.trim()}>
      {title || actions ? (
        <div className="card-head">
          <div>
            {title ? <h3 className="card-title">{title}</h3> : null}
            {subtitle ? <p className="card-sub">{subtitle}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}
