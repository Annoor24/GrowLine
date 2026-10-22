import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AuthShell from "../../layouts/AuthShell.jsx";
import FormField from "../../components/FormField.jsx";
import Button from "../../components/Button.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";
import { passwordMessage } from "../../utils/validate.js";
import { describeLoginError } from "../../auth/loginErrors.js";

const MIN_PASSWORD = 12;

// MOCK: the real invitation details (name, email, expiry) will come from the API using the link's token.
const SAMPLE_INVITATION = {
  firstName: "Fatima",
  email: "fatima.musa@example.ng",
  expires: "17 Oct 2026, 14:00 WAT",
};

// MOCK: any email works; the password "wrong" simulates a failed login.
export function AgentSignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await login("agent", email.trim(), password);
      navigate(location.state?.from?.pathname || "/agent", { replace: true });
    } catch (err) {
      setError(describeLoginError(err).text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      centered
      heading="Extension Agent · Sign In"
      sub="Existing agents sign in; public self-registration is disabled."
      title="Sign in to your agent account"
      intro="Access your assigned farmers, farms and advisories."
      footer="Forgot password? · No account? Contact your administrator."
    >
      <form className="stack" onSubmit={handleSubmit}>
        {error ? <p className="notice notice-danger">{error}</p> : null}
        <FormField
          label="Work email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.ng"
        />
        <FormField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}

export function InvitationExpired() {
  const navigate = useNavigate();
  return (
    <AuthShell
      centered
      showLogo={false}
      heading="Extension Agent · Invitation Expired"
      sub="Expired or previously used activation link."
      title="This invitation is no longer valid"
      intro="Your activation link has expired or was already used."
    >
      <div className="stack">
        <p className="notice notice-warning">Ask your Super Admin to send a new invitation.</p>
        <Button onClick={() => navigate("/login")}>Back to sign in</Button>
      </div>
    </AuthShell>
  );
}

export function AgentActivate() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});

  // MOCK: the link /activate/expired shows the expired screen.
  if (token === "expired") return <InvitationExpired />;

  function handleSubmit(event) {
    event.preventDefault();
    const next = {};
    if (passwordMessage(password)) next.password = passwordMessage(password);
    if (password !== confirm) next.confirm = "The two passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length === 0) navigate("/activation-success");
  }

  return (
    <AuthShell
      centered
      heading="Extension Agent · Activate Account"
      sub="Invitation-based first-time access."
      title={`Welcome to GrowLine, ${SAMPLE_INVITATION.firstName}`}
      intro={`Your invitation is valid until ${SAMPLE_INVITATION.expires}.`}
      footer="Activation links can only be used once."
    >
      <form className="stack" onSubmit={handleSubmit}>
        <FormField label="Work email" type="email" value={SAMPLE_INVITATION.email} readOnly />
        <FormField
          label="Create password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint={`${MIN_PASSWORD}+ characters with letters, numbers and symbols.`}
          error={errors.password}
        />
        <FormField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />
        <Button type="submit">Activate my account</Button>
      </form>
    </AuthShell>
  );
}

export function ActivationSuccess() {
  const navigate = useNavigate();
  return (
    <AuthShell
      centered
      showLogo={false}
      heading="Extension Agent · Activation Successful"
      sub="Successful first-time account setup."
      title="✓ Account activated"
      intro="Your Extension Agent account is ready. Sign in to view your assigned service area and farmers."
    >
      <Button onClick={() => navigate("/login")}>Continue to agent sign in</Button>
    </AuthShell>
  );
}
