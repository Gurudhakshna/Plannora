import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  badge?: ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  description,
  action,
  badge,
  className = "",
}: PageHeaderProps) {
  return (
    <div
      className={`page-header ${className}`.trim()}
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 24,
        flexWrap: "wrap",
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginTop: 4, maxWidth: 640 }}>
            {description}
          </p>
        )}
      </div>
      {action && <div style={{ display: "flex", alignItems: "center", gap: 10 }}>{action}</div>}
    </div>
  );
}
