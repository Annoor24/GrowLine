import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AuthShell from "../../layouts/AuthShell.jsx";
import FormField from "../../components/FormField.jsx";
import Button from "../../components/Button.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";
import { isEmail, passwordMessage } from "../../utils/validate.js";

const MIN_PASSWORD = 12;

// MOCK: any email works; the password "wrong" simulates a failed login.
export function AgentSignIn() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (password === "wrong") {
      setError("Email or password is incorrect. Please try again.");
      return;
    }
    signIn("agent", email);
    navigate(location.state?.from?.pathname || "/agent", { replace: true });
  }

  return (
    <AuthShell
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
        <Button type="submit">Sign in</Button>
      </form>
    </AuthShell>
  );
}

export function InvitationExpired() {
  const navigate = useNavigate();
  return (
    <AuthShell
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});

  // MOCK: the link /activate/expired shows the expired screen.
  if (token === "expired") return <InvitationExpired />;

  function handleSubmit(event) {
    event.preventDefault();
    const next = {};
    if (!isEmail(email)) next.email = "Enter the work email your invitation was sent to.";
    if (passwordMessage(password)) next.password = passwordMessage(password);
    if (password !== confirm) next.confirm = "The two passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length === 0) navigate("/activation-success");
  }

  return (
    <AuthShell
      heading="Extension Agent · Activate Account"
      sub="Invitation-based first-time access."
      title="Welcome to GrowLine"
      intro="Your invitation is valid for a limited time."
      footer="Activation links can only be used once."
    >
      <form className="stack" onSubmit={handleSubmit}>
        <FormField
          label="Work email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <FormField
          label="Create password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint={`${MIN_PASSWORD}+ characters with letters, numbers and symbols.`}
          error={errors.password}
        />
        <FormField
          label="Confirm password"
          type="password"
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
      heading="Extension Agent · Activation Successful"
      sub="Successful first-time account setup."
      title="✓ Account activated"
      intro="Your Extension Agent account is ready. Sign in to view your assigned service area and farmers."
    >
      <Button onClick={() => navigate("/login")}>Continue to agent sign in</Button>
    </AuthShell>
  );
}
