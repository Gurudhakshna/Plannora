import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { hasStudyPlan } from "../utils/storage";
import GoogleLoginButton from "../components/auth/GoogleLoginButton";

export default function Login() {
  const { signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogleLogin() {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to sign in with Google.";
      setError(message);
      setLoading(false);
      return;
    }
  }

  if (user) {
    if (hasStudyPlan(user.uid)) {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/setup-study-plan", { replace: true });
    }
    return null;
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-icon login-brand-icon">
            <svg width="28" height="28" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3 18H7L10 10L13 18H17L10 2Z" fill="white" />
            </svg>
          </div>
          <span className="login-brand-text">Plannora</span>
        </div>

        <h1 className="login-title">Welcome to Plannora</h1>
        <p className="login-subtitle">
          Your smart study planner. Organize tasks, track progress, and stay on
          top of your goals.
        </p>

        {error && (
          <div className="login-error">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
            </svg>
            {error}
          </div>
        )}

        <GoogleLoginButton onClick={handleGoogleLogin} loading={loading} />

        <p className="login-footer">
          Sign in to create your personalized study plan.
        </p>
      </div>
    </div>
  );
}
