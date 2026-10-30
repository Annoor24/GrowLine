// Numbered steps above a multi-step form. current is the 0-based index of the step on screen.
export default function StepTabs({ steps, current }) {
  return (
    <ol className="step-tabs">
      {steps.map((label, index) => (
        <li key={label} className={index === current ? "current" : index < current ? "done" : ""} aria-current={index === current ? "step" : undefined}>
          {label}
        </li>
      ))}
    </ol>
  );
}
