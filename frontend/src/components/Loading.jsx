export default function Loading({ error }) {
  if (error) {
    return <p className="notice notice-danger">Could not load this page. Please try again.</p>;
  }
  return <p className="muted">Loading…</p>;
}
