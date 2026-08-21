import type { ReactNode } from "react";

export interface BadgeProps {
  variant?: "high" | "medium" | "low" | "success" | "neutral" | "purple" | "info";
  children: ReactNode;
  className?: string;
}

export default function Badge({
  variant = "neutral",
  children,
  className = "",
}: BadgeProps) {
  const variantMap: Record<string, string> = {
    high: "priority-high",
    medium: "priority-medium",
    low: "priority-low",
    success: "badge-success",
    neutral: "badge-neutral",
    purple: "ai-chip",
    info: "badge-info",
  };

  const badgeClass = variantMap[variant] || "badge-neutral";

  return <span className={`badge ${badgeClass} ${className}`.trim()}>{children}</span>;
}
