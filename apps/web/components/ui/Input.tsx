import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Input({
  label,
  error,
  helperText,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}

      <input
        id={inputId}
        className={`w-full rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border ${
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
            : "border-slate-300 dark:border-slate-700/80 focus:border-[#0070ba] dark:focus:border-cyan-500 focus:ring-1 focus:ring-[#0070ba]/30 dark:focus:ring-cyan-500/30"
        } placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-colors disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800 ${className}`}
        {...props}
      />

      {error ? (
        <p className="text-[11px] text-rose-600 dark:text-rose-400">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-400 dark:text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
