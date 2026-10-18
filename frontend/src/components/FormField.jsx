import { useId } from "react";

// kind: "input" (default) | "select" | "textarea". For selects pass options: [{ value, label }].
export default function FormField({ label, hint, error, kind = "input", options = [], ...props }) {
  const id = useId();
  let control;
  if (kind === "select") {
    control = (
      <select id={id} className="input" {...props}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  } else if (kind === "textarea") {
    control = <textarea id={id} className="input" {...props} />;
  } else {
    control = <input id={id} className="input" {...props} />;
  }
  return (
    <div className="field">
      {label ? <label htmlFor={id}>{label}</label> : null}
      {control}
      {hint ? <span className="hint">{hint}</span> : null}
      {error ? <span className="error-text">{error}</span> : null}
    </div>
  );
}
