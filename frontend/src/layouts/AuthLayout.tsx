import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-page-container">
      {/* Left Brand Showcase Pane */}
      <div className="auth-brand-pane">
        <div className="auth-brand-content">
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 48 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-md)",
                background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.02em", color: "#F8FAFC" }}>
              Plannora
            </span>
          </Link>

          <div>
            <h2 className="auth-brand-quote">
              Master complex topics with intelligent planning.
            </h2>
            <p className="auth-brand-subtitle">
              Transform unstructured lecture slides, textbooks, and notes into structured concept hierarchies, adaptive flashcards, and focused revision paths.
            </p>
          </div>
        </div>

        {/* Feature Pills */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: "var(--radius-full)", backgroundColor: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border)", fontSize: "12px", color: "var(--text-secondary)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--accent)" }} />
            Concept Extraction
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: "var(--radius-full)", backgroundColor: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border)", fontSize: "12px", color: "var(--text-secondary)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--success)" }} />
            Dependency Ranking
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: "var(--radius-full)", backgroundColor: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border)", fontSize: "12px", color: "var(--text-secondary)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--info)" }} />
            Active Recall
          </div>
        </div>
      </div>

      {/* Right Form Pane */}
      <div className="auth-form-pane">
        <div className="auth-card">{children}</div>
      </div>
    </div>
  );
}
