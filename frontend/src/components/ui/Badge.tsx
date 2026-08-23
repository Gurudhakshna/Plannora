import type { ReactNode, CSSProperties } from "react";

export interface BadgeProps {
  variant?: "primary" | "success" | "warning" | "danger" | "info" | "neutral";
  dot?: boolean;
  style?: CSSProperties;
  children: ReactNode;
  className?: string;
}

export default function Badge({
  variant = "neutral",
  dot = false,
  style,
  children,
  className = "",
}: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()} style={style}>
      {dot && (
        <span
          className="priority-dot"
          style={{
            backgroundColor:
              variant === "danger"
                ? "var(--danger)"
                : variant === "warning"
                ? "var(--warning)"
                : variant === "success"
                ? "var(--success)"
                : "var(--accent)",
          }}
        />
      )}
      {children}
    </span>
  );
}
