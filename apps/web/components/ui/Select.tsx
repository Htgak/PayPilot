import React from "react";

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  error?: string;
}

export default function Select({
  label,
  options,
  error,
  children,
  className = "",
  id,
  ...props
}: SelectProps) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}

      <select
        id={selectId}
        className={`w-full rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border ${
          error
            ? "border-rose-400 focus:border-rose-500"
            : "border-slate-300 dark:border-slate-700/80 focus:border-[#0070ba] dark:focus:border-cyan-500 focus:ring-1 focus:ring-[#0070ba]/30 dark:focus:ring-cyan-500/30"
        } focus:outline-none transition-colors ${className}`}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>

      {error && <p className="text-[11px] text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}
