import type { ReactNode, HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div className={`dash-section ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  action,
  count,
  className = "",
}: {
  title: ReactNode;
  action?: ReactNode;
  count?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`dash-section-header ${className}`.trim()}>
      <h3 className="dash-section-title">
        {title}
        {count && <span className="dash-section-count">{count}</span>}
      </h3>
      {action}
    </div>
  );
}
