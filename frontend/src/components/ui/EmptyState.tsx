import type { ReactNode } from "react";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  if (compact) {
    return (
      <div className="dash-empty-inline">
        {title && <p className="empty-inline-title">{title}</p>}
        {description && <p className="empty-inline-desc">{description}</p>}
        {action}
      </div>
    );
  }

  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon-wrap">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-text">{description}</p>}
      {action}
    </div>
  );
}
