import React from "react";

export type BadgeVariant =
  | "paid"
  | "completed"
  | "sent"
  | "pending"
  | "overdue"
  | "draft"
  | "cancelled"
  | "info"
  | "neutral";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

export default function Badge({
  variant = "neutral",
  dot = true,
  children,
  className = "",
  ...props
}: BadgeProps) {
  const normalized = variant.toLowerCase() as BadgeVariant;

  const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
    paid: {
      container: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/60",
      dot: "bg-emerald-500",
    },
    completed: {
      container: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/60",
      dot: "bg-emerald-500",
    },
    sent: {
      container: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800/60",
      dot: "bg-amber-500",
    },
    pending: {
      container: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800/60",
      dot: "bg-amber-500",
    },
    overdue: {
      container: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/60",
      dot: "bg-rose-500",
    },
    draft: {
      container: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/70 dark:text-slate-300 dark:border-slate-700/80",
      dot: "bg-slate-400",
    },
    cancelled: {
      container: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700",
      dot: "bg-slate-400",
    },
    info: {
      container: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800/60",
      dot: "bg-blue-500",
    },
    neutral: {
      container: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      dot: "bg-slate-400",
    },
  };

  const style = variantStyles[normalized] || variantStyles.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${style.container} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${style.dot} shrink-0`} />}
      <span>{children}</span>
    </span>
  );
}
