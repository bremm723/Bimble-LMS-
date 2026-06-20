import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export function Input({
  label,
  error,
  helpText,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-brand-navy"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          "rounded-lg border px-3 py-2 text-sm transition-colors",
          "placeholder:text-neutral-400",
          "focus:border-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-yellow/30",
          error
            ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
            : "border-neutral-300",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {helpText && !error && (
        <p className="text-xs text-neutral-500">{helpText}</p>
      )}
    </div>
  );
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  className = "",
  id,
  ...props
}: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={textareaId}
          className="text-sm font-medium text-brand-navy"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={[
          "rounded-lg border px-3 py-2 text-sm transition-colors resize-y min-h-[80px]",
          "placeholder:text-neutral-400",
          "focus:border-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-yellow/30",
          error ? "border-red-500" : "border-neutral-300",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({
  label,
  error,
  options,
  className = "",
  id,
  ...props
}: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-brand-navy"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={[
          "rounded-lg border px-3 py-2 text-sm transition-colors",
          "focus:border-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-yellow/30",
          error ? "border-red-500" : "border-neutral-300",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
