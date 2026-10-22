import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthShell from "../../layouts/AuthShell.jsx";
import FormField from "../../components/FormField.jsx";
import Button from "../../components/Button.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";
import { passwordMessage } from "../../utils/validate.js";
import { describeLoginError } from "../../auth/loginErrors.js";

const MAX_ATTEMPTS = 3;

export function AdminSignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // "Attempts remaining" is display only: the backend does not report or enforce an attempt count.
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [failed, setFailed] = useState(false); // wrong email or password
  const [notice, setNotice] = useState(""); // any other problem (no connection, wrong account type)
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      if (!email || !password) {
        setFailed(true);
        setAttemptsLeft((n) => Math.max(0, n - 1));
        return;
      }
      await login("admin", email.trim(), password);
      navigate(location.state?.from?.pathname || "/admin", { replace: true });
    } catch (err) {
      const { credentials, text } = describeLoginError(err);
      if (credentials) {
        setFailed(true);
        setAttemptsLeft((n) => Math.max(0, n - 1));
      } else {
        setNotice(text);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell centered
      heading={failed ? "Super Admin · Invalid Credentials" : "Super Admin · Sign In"}
      sub={
        failed
          ? "Authentication failure with a clear recovery path."
          : "Secure access for authorized GrowLine administrators."
      }
      title={failed ? "Sign in to GrowLine" : "Welcome back"}
      intro={failed ? "Check your details and try again." : "Sign in to manage GrowLine operations."}
      footer={
        failed
          ? `Attempts remaining: ${attemptsLeft}`
          : "Need access? Contact your system owner."
      }
    >
      <form className="stack" onSubmit={handleSubmit}>
        {failed && !notice ? (
          <p className="notice notice-danger">Email or password is incorrect. Please try again.</p>
        ) : null}
        {notice ? <p className="notice notice-danger">{notice}</p> : null}
        <FormField
          label="Work email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@growline.ng"
        />
        <FormField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" disabled={busy || attemptsLeft === 0}>
          {busy ? "Signing in…" : failed ? "Try again" : "Sign in securely"}
        </Button>
        <Link className="link-button" to="/admin/forgot-password">
          Forgot password?
        </Link>
      </form>
    </AuthShell>
  );
}

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    // The real API must answer the same way whether or not the account exists.
    navigate("/admin/reset-sent");
  }

  return (
    <AuthShell centered
      heading="Super Admin · Forgot Password"
      sub="Request a time-limited password reset link."
      title="Reset your password"
      intro="Enter your work email to receive reset instructions."
      footer="For security, the response is the same whether or not an account exists."
    >
      <form className="stack" onSubmit={handleSubmit}>
        <FormField label="Work email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit">Send reset link</Button>
      </form>
    </AuthShell>
  );
}

export function ResetLinkSent() {
  const navigate = useNavigate();
  return (
    <AuthShell centered
      heading="Super Admin · Reset Requested"
      sub="Privacy-preserving confirmation state."
      title="Check your inbox"
      intro="If this email is registered, we have sent a reset link. The link expires after 30 minutes and can be used once."
      footer="Did not receive it? Check spam or request a new link."
    >
      <Button onClick={() => navigate("/admin/login")}>Back to sign in</Button>
    </AuthShell>
  );
}

export function SetNewPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});

  function handleSubmit(event) {
    event.preventDefault();
    const next = {};
    if (passwordMessage(password)) next.password = passwordMessage(password);
    if (password !== confirm) next.confirm = "The two passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length === 0) navigate("/admin/login");
  }

  return (
    <AuthShell centered
      heading="Super Admin · Set New Password"
      sub="Password reset form and validation requirements."
      title="Choose a new password"
      intro="Create a strong password for your administrator account."
      footer="Use 12+ characters with a mix of letters, numbers and symbols."
    >
      <form className="stack" onSubmit={handleSubmit}>
        <FormField
          label="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <FormField
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />
        <Button type="submit">Update password</Button>
      </form>
    </AuthShell>
  );
}

export function SessionExpired() {
  const navigate = useNavigate();
  return (
    <AuthShell centered
      heading="Super Admin · Session Expired"
      sub="Secure re-authentication without losing context."
      title="Your session has expired"
      intro="For your security, sign in again to continue."
    >
      <div className="stack">
        <p className="notice notice-warning">Your unsaved changes may not have been saved.</p>
        <Button onClick={() => navigate("/admin/login")}>Return to sign in</Button>
      </div>
    </AuthShell>
  );
}
