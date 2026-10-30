import { useState } from "react";
import Button from "./Button.jsx";
import FormField from "./FormField.jsx";

// A complaint's messages, oldest first, with a reply box.
// onSend(text) must return a promise; closedNote replaces the reply box when replies are not allowed.
export default function Conversation({ messages, onSend, replyLabel = "Your reply", placeholder, closedNote, actions }) {
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    const text = reply.trim();
    if (!text) {
      setError("Write a message before sending.");
      return;
    }
    setSending(true);
    setError("");
    try {
      await onSend(text);
      setReply("");
    } catch {
      setError("Your reply could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="stack">
      {messages.length === 0 ? <p className="muted">No messages yet.</p> : null}
      {messages.map((message) => (
        <div className={`message${message.role === "superadmin" ? " message-admin" : ""}`} key={message.id}>
          <div className="message-meta">
            {message.from} • {message.when}
          </div>
          <p>{message.text}</p>
        </div>
      ))}
      {closedNote ? (
        <p className="notice notice-info">{closedNote}</p>
      ) : (
        <>
          <FormField
            label={replyLabel}
            kind="textarea"
            placeholder={placeholder}
            value={reply}
            onChange={(e) => {
              setReply(e.target.value);
              if (error) setError("");
            }}
            error={error}
          />
          <div className="form-actions">
            <Button onClick={send} disabled={sending}>
              {sending ? "Sending…" : "Send reply"}
            </Button>
            {actions}
          </div>
        </>
      )}
      {closedNote && actions ? <div className="form-actions">{actions}</div> : null}
    </div>
  );
}
