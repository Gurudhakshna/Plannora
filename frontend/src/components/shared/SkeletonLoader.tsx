export interface SkeletonProps {
  variant?: "text" | "circular" | "rectangular" | "card";
  width?: string | number;
  height?: string | number;
  className?: string;
}

export default function SkeletonLoader({
  variant = "rectangular",
  width,
  height,
  className = "",
}: SkeletonProps) {
  const style: React.CSSProperties = {
    width: width || (variant === "circular" ? 40 : "100%"),
    height: height || (variant === "text" ? 16 : variant === "circular" ? 40 : variant === "card" ? 120 : 36),
    borderRadius: variant === "circular" ? "var(--radius-full)" : "var(--radius-md)",
  };

  return <div className={`skeleton ${className}`.trim()} style={style} />;
}
