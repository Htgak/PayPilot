import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "./Card";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  growthPct?: number | null;
  icon: React.ReactNode;
  iconBg?: string;
  badge?: React.ReactNode;
}

export default function StatCard({
  title,
  value,
  subtitle,
  growthPct,
  icon,
  iconBg = "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-cyan-400",
  badge,
}: StatCardProps) {
  return (
    <Card className="p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
      </div>

      <div className="mt-3">
        <h4 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
          {value}
        </h4>

        <div className="flex items-center space-x-2 mt-1.5">
          {growthPct !== undefined && growthPct !== null && (
            <span
              className={`inline-flex items-center text-[11px] font-semibold ${
                growthPct >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {growthPct >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-0.5" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-0.5" />
              )}
              {growthPct > 0 ? `+${growthPct}%` : `${growthPct}%`}
            </span>
          )}

          {subtitle && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
              {subtitle}
            </span>
          )}

          {badge && <div className="ml-auto">{badge}</div>}
        </div>
      </div>
    </Card>
  );
}
