import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, required, className = "", id, ...props },
  ref
) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={textareaId} className={`form-label ${required ? "form-label-required" : ""}`}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={`form-textarea ${error ? "error" : ""} ${className}`.trim()}
        {...props}
      />
      {error && <span className="form-error-msg">{error}</span>}
      {hint && !error && <span className="form-hint">{hint}</span>}
    </div>
  );
});

export default Textarea;
