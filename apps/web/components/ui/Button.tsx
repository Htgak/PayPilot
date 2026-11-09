import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const sizeStyles = {
    xs: "px-2.5 py-1 text-[11px] gap-1",
    sm: "px-3.5 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-xs sm:text-sm gap-2",
    lg: "px-5 py-2.5 text-sm sm:text-base gap-2.5",
  };

  const variantStyles = {
    primary: "bg-[#0070ba] hover:bg-[#005ea6] text-white focus:ring-[#0070ba]/40 shadow-sm shadow-[#0070ba]/20 active:scale-[0.98]",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 focus:ring-slate-400 active:scale-[0.98]",
    outline: "border border-slate-300 dark:border-slate-700/80 bg-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-slate-400",
    ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 focus:ring-slate-400",
    danger: "bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-500/40 shadow-sm shadow-rose-600/20 active:scale-[0.98]",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white focus:ring-emerald-500/40 shadow-sm shadow-emerald-600/20 active:scale-[0.98]",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
