import Button from "./Button.jsx";

// Shown while a page's data loads. If the request fails, shows a message and a retry button.
export default function Loading({ error, onRetry }) {
  if (error) {
    return (
      <div className="stack" role="alert">
        <p className="notice notice-danger">
          We could not load this page. Check your connection and try again.
        </p>
        {onRetry ? (
          <div>
            <Button variant="secondary" onClick={onRetry}>
              Try again
            </Button>
          </div>
        ) : null}
      </div>
    );
  }
  return (
    <p className="muted" role="status">
      Loading…
    </p>
  );
}
