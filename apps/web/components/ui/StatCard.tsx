import React from "react";
import { Info } from "lucide-react";
import { Card } from "./Card";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  growthPct?: number | null;
  icon?: React.ReactNode;
  infoTooltip?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  growthPct,
  icon,
  infoTooltip = "Metric calculated from verified records",
}: StatCardProps) {
  const isPositive = growthPct !== undefined && growthPct !== null && growthPct >= 0;
  const isNegative = growthPct !== undefined && growthPct !== null && growthPct < 0;

  return (
    <Card className="p-6 rounded-2xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
      {/* Top Header Row */}
      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
        <div className="flex items-center space-x-2">
          {icon && <span className="text-slate-400 dark:text-slate-400 w-4 h-4 flex items-center justify-center">{icon}</span>}
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{title}</span>
        </div>
        <button
          type="button"
          className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors"
          title={infoTooltip}
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Metric Row */}
      <div className="mt-4 flex items-baseline space-x-3">
        <h4 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
          {value}
        </h4>

        {growthPct !== undefined && growthPct !== null && (
          <span
            className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md ${
              isPositive
                ? "bg-[#E6F9F4] dark:bg-emerald-950/50 text-[#0D9488] dark:text-emerald-400"
                : isNegative
                ? "bg-[#FEE2E2] dark:bg-rose-950/50 text-[#E11D48] dark:text-rose-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            }`}
          >
            {Math.abs(growthPct)}% {isPositive ? "↗" : isNegative ? "↘" : "•"}
          </span>
        )}
      </div>

      {/* Subtitle / Context */}
      {subtitle && (
        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
          {subtitle}
        </p>
      )}
    </Card>
  );
}
