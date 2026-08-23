import { forwardRef } from "react";
import type { SelectHTMLAttributes, ReactNode } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, required, className = "", id, children, ...props },
  ref
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={selectId} className={`form-label ${required ? "form-label-required" : ""}`}>
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`form-select ${error ? "error" : ""} ${className}`.trim()}
        {...props}
      >
        {children}
      </select>
      {error && <span className="form-error-msg">{error}</span>}
      {hint && !error && <span className="form-hint">{hint}</span>}
    </div>
  );
});

export default Select;
