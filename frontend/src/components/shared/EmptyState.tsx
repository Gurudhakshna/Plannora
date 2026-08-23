import type { ReactNode } from "react";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  className = "",
}: EmptyStateProps) {
  if (compact) {
    return (
      <div
        className={`empty-state-compact ${className}`.trim()}
        style={{
          padding: "20px",
          textAlign: "center",
          backgroundColor: "var(--bg-card)",
          borderRadius: "var(--radius-md)",
          border: "1px dashed var(--border)",
        }}
      >
        <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{title}</p>
        {description && <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginBottom: action ? 12 : 0 }}>{description}</p>}
        {action}
      </div>
    );
  }

  return (
    <div className={`empty-state ${className}`.trim()}>
      <div className="empty-state-icon">
        {icon || (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        )}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
