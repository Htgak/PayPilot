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
      container: "bg-[#E6F9F4] text-[#0D9488] dark:bg-emerald-950/40 dark:text-emerald-300 border-transparent",
      dot: "bg-[#00D2B4]",
    },
    completed: {
      container: "bg-[#E6F9F4] text-[#0D9488] dark:bg-emerald-950/40 dark:text-emerald-300 border-transparent",
      dot: "bg-[#00D2B4]",
    },
    sent: {
      container: "bg-[#EFF6FF] text-[#2563EB] dark:bg-blue-950/40 dark:text-blue-300 border-transparent",
      dot: "bg-[#3B82F6]",
    },
    pending: {
      container: "bg-[#FFFBEB] text-[#D97706] dark:bg-amber-950/40 dark:text-amber-300 border-transparent",
      dot: "bg-[#F59E0B]",
    },
    overdue: {
      container: "bg-[#FEE2E2] text-[#E11D48] dark:bg-rose-950/40 dark:text-rose-300 border-transparent",
      dot: "bg-[#E11D48]",
    },
    draft: {
      container: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-transparent",
      dot: "bg-slate-400",
    },
    cancelled: {
      container: "bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 border-transparent",
      dot: "bg-slate-400",
    },
    info: {
      container: "bg-[#EDE9FE] text-[#6D28D9] dark:bg-purple-950/40 dark:text-purple-300 border-transparent",
      dot: "bg-[#7C72F2]",
    },
    neutral: {
      container: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-transparent",
      dot: "bg-slate-400",
    },
  };

  const current = variantStyles[normalized] || variantStyles.neutral;

  return (
    <span
      className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${current.container} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${current.dot} shrink-0`} />}
      <span>{children}</span>
    </span>
  );
}
