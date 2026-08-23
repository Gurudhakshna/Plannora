export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
}

export default function LoadingSpinner({
  size = "md",
  message,
  className = "",
}: LoadingSpinnerProps) {
  const pixelSize = size === "sm" ? 18 : size === "lg" ? 36 : 24;

  return (
    <div
      className={`loading-spinner-wrap ${className}`.trim()}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 24,
      }}
    >
      <div className="spinner" style={{ width: pixelSize, height: pixelSize }} />
      {message && <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>{message}</p>}
    </div>
  );
}
