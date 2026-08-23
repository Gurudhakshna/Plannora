import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { hasStudyPlan } from "../../utils/storage";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

export default function LoginPage() {
  const { signInWithEmail, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (user) {
    return <Navigate to={hasStudyPlan(user.uid) ? "/dashboard" : "/setup-study-plan"} replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await signInWithEmail(cleanEmail, password);
      if (hasStudyPlan(loggedUser.uid)) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/setup-study-plan", { replace: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in. Please check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="auth-header">
        <h1>Welcome back</h1>
        <p>Continue your learning journey with Plannora.</p>
      </div>

      {error && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--danger-light)",
            border: "1px solid var(--danger-border)",
            color: "var(--danger-text)",
            fontSize: "13px",
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
          role="alert"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Input
          label="Email address"
          type="email"
          placeholder="name@university.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <div style={{ position: "relative" }}>
          <Input
            label="Password"
            isPassword
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -8, marginBottom: 16 }}>
            <Link to="/forgot-password" style={{ fontSize: "12px", color: "var(--accent-text)" }}>
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          style={{ width: "100%", marginTop: 8 }}
          loading={loading}
        >
          Sign In
        </Button>
      </form>

      <div style={{ marginTop: 24, textAlign: "center", fontSize: "13px", color: "var(--text-secondary)" }}>
        Don&apos;t have an account?{" "}
        <Link to="/register" style={{ color: "var(--accent-text)", fontWeight: 600 }}>
          Create account
        </Link>
      </div>
    </div>
  );
}
