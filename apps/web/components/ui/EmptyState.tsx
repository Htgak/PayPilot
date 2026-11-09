import React from "react";
import Button from "./Button";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`py-12 px-6 flex flex-col items-center justify-center text-center space-y-3 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 flex items-center justify-center border border-slate-200 dark:border-slate-700/60 shadow-sm">
        {icon}
      </div>

      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <div className="pt-2">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
