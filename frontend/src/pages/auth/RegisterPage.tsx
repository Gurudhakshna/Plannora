import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

function calculateStrength(pass: string): "weak" | "fair" | "strong" {
  if (pass.length < 6) return "weak";
  const hasLetters = /[a-zA-Z]/.test(pass);
  const hasNumbers = /\d/.test(pass);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pass);
  if (pass.length >= 8 && hasLetters && hasNumbers && hasSpecial) return "strong";
  if (pass.length >= 6 && hasLetters && hasNumbers) return "fair";
  return "weak";
}

export default function RegisterPage() {
  const { registerWithEmail, user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (user) {
    return <Navigate to="/setup-study-plan" replace />;
  }

  const strength = calculateStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    const cleanEmail = email.trim();
    if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail(name.trim(), cleanEmail, password);
      navigate("/setup-study-plan", { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create account. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="auth-header">
        <h1>Create your account</h1>
        <p>Start your intelligent study planning with Plannora.</p>
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
          label="Full Name"
          type="text"
          placeholder="e.g. Alex Morgan"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />

        <Input
          label="Email address"
          type="email"
          placeholder="name@university.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <div>
          <Input
            label="Password"
            isPassword
            placeholder="Min. 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          {password && (
            <div style={{ marginTop: -10, marginBottom: 16 }}>
              <div className="password-strength-bar">
                <div className={`password-strength-fill ${strength}`} />
              </div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "capitalize" }}>
                Password strength: {strength}
              </span>
            </div>
          )}
        </div>

        <Input
          label="Confirm Password"
          isPassword
          placeholder="Re-enter password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          style={{ width: "100%", marginTop: 8 }}
          loading={loading}
        >
          Create Account
        </Button>
      </form>

      <div style={{ marginTop: 24, textAlign: "center", fontSize: "13px", color: "var(--text-secondary)" }}>
        Already have an account?{" "}
        <Link to="/login" style={{ color: "var(--accent-text)", fontWeight: 600 }}>
          Sign In
        </Link>
      </div>
    </div>
  );
}
