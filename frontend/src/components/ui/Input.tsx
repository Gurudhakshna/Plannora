import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", id, ...props }: InputProps) {
  return (
    <div className="form-group">
      {label && <label htmlFor={id}>{label}</label>}
      <input
        id={id}
        className={`${error ? "input-error" : ""} ${className}`.trim()}
        {...props}
      />
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = "", id, ...props }: TextareaProps) {
  return (
    <div className="form-group">
      {label && <label htmlFor={id}>{label}</label>}
      <textarea
        id={id}
        className={`${error ? "input-error" : ""} ${className}`.trim()}
        {...props}
      />
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({ label, error, className = "", id, children, ...props }: SelectProps) {
  return (
    <div className="form-group">
      {label && <label htmlFor={id}>{label}</label>}
      <select
        id={id}
        className={`${error ? "input-error" : ""} ${className}`.trim()}
        {...props}
      >
        {children}
      </select>
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}
