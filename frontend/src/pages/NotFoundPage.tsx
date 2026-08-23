import { Link } from "react-router-dom";
import Button from "../components/ui/Button";

export default function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 24,
        backgroundColor: "var(--bg-base)",
      }}
    >
      <div style={{ fontSize: "64px", fontWeight: 800, color: "var(--accent-text)", lineHeight: 1 }}>
        404
      </div>
      <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", margin: "12px 0" }}>
        Page Not Found
      </h1>
      <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: 420, marginBottom: 24 }}>
        The workspace path you requested does not exist or has been moved.
      </p>
      <Link to="/dashboard">
        <Button variant="primary" size="md">
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
