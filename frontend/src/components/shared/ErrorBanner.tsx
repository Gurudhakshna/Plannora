import Button from "../ui/Button";

export interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorBanner({
  message,
  onDismiss,
  onRetry,
  className = "",
}: ErrorBannerProps) {
  return (
    <div
      className={`error-banner ${className}`.trim()}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 16px",
        borderRadius: "var(--radius-lg)",
        backgroundColor: "var(--danger-light)",
        border: "1px solid var(--danger-border)",
        color: "var(--danger-text)",
        fontSize: "13px",
        marginBottom: 16,
      }}
      role="alert"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{message}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {onRetry && (
          <Button variant="danger" size="sm" onClick={onRetry}>
            Try Again
          </Button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            style={{ color: "var(--danger-text)", padding: 2 }}
            aria-label="Dismiss error"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
