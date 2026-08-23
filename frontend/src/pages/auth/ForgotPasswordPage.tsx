import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim();
    if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(cleanEmail);
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send reset link. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "var(--radius-full)",
            backgroundColor: "var(--success-light)",
            color: "var(--success-text)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
          Reset link dispatched
        </h2>
        <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
          We&apos;ve sent instructions to <strong style={{ color: "var(--text-primary)" }}>{email}</strong>.
          Check your inbox and follow the link to set a new password.
        </p>
        <Link to="/login">
          <Button variant="secondary" size="md" style={{ width: "100%" }}>
            Return to Sign In
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="auth-header">
        <h1>Reset your password</h1>
        <p>Enter your email and we&apos;ll send you a password reset link.</p>
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
          }}
          role="alert"
        >
          {error}
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

        <Button
          type="submit"
          variant="primary"
          size="lg"
          style={{ width: "100%", marginTop: 8 }}
          loading={loading}
        >
          Send Reset Link
        </Button>
      </form>

      <div style={{ marginTop: 24, textAlign: "center", fontSize: "13px", color: "var(--text-secondary)" }}>
        Remember your password?{" "}
        <Link to="/login" style={{ color: "var(--accent-text)", fontWeight: 600 }}>
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
