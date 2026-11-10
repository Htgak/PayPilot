"use client";

import React, { useMemo, useState } from "react";
import { BarChart3, CircleDollarSign, FileText } from "lucide-react";
import { Card } from "./Card";

export interface TrendSeries { key: string; label: string; color: string; values: number[]; format: (value: number) => string; }
interface CellColumnTrendProps { labels: string[]; revenue: number[]; invoiced: number[]; currency?: string; }

export default function CellColumnTrend({ labels, revenue, invoiced, currency = "USD" }: CellColumnTrendProps) {
  const [selected, setSelected] = useState<"revenue" | "invoiced">("revenue");
  const formatter = useMemo(() => new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }), [currency]);
  const series: Record<typeof selected, TrendSeries> = {
    revenue: { key: "revenue", label: "Collected revenue", color: "#5146c7", values: revenue, format: (v) => formatter.format(v) },
    invoiced: { key: "invoiced", label: "Invoiced", color: "#16b8aa", values: invoiced, format: (v) => formatter.format(v) },
  };
  const active = series[selected];
  const max = Math.max(1, ...active.values);
  return <Card className="overflow-hidden rounded-xl p-0 shadow-sm">
    <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-6">
      <div><div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white"><BarChart3 className="h-4 w-4 text-slate-400" />Revenue overview</div><p className="mt-1 text-xs text-slate-500">Monthly payments and invoices</p></div>
      <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-900" role="tablist" aria-label="Chart metric">
        {[{ key: "revenue" as const, label: "Revenue", Icon: CircleDollarSign }, { key: "invoiced" as const, label: "Invoiced", Icon: FileText }].map(({ key, label, Icon }) => <button key={key} role="tab" aria-selected={selected === key} onClick={() => setSelected(key)} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${selected === key ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}><Icon className="h-3.5 w-3.5" />{label}</button>)}
      </div>
    </div>
    {labels.length ? <div className="px-5 pb-5 sm:px-6">
      <div className="mb-4 flex h-8 items-center gap-2"><span className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{formatter.format(active.values.reduce((sum, value) => sum + value, 0))}</span><span className="text-xs text-slate-400">last 6 months</span></div>
      <div className="relative flex h-52 items-end gap-2 border-b border-slate-200 bg-[linear-gradient(to_bottom,transparent_24.5%,#e9edf3_25%,transparent_25.5%,transparent_49.5%,#e9edf3_50%,transparent_50.5%,transparent_74.5%,#e9edf3_75%,transparent_75.5%)] px-1 dark:border-slate-700 dark:bg-[linear-gradient(to_bottom,transparent_24.5%,#263244_25%,transparent_25.5%,transparent_49.5%,#263244_50%,transparent_50.5%,transparent_74.5%,#263244_75%,transparent_75.5%)]">
        {labels.map((label, index) => { const value = active.values[index] || 0; const height = Math.max(value ? 8 : 2, (value / max) * 100); return <div key={`${label}-${index}`} className="group relative flex h-full flex-1 flex-col justify-end"><div className="absolute inset-x-0 bottom-0 top-0 flex flex-col-reverse gap-[3px] pb-1" aria-hidden="true">{Array.from({ length: 12 }, (_, cell) => <span key={cell} className="flex-1 rounded-[3px] transition-colors" style={{ background: cell < Math.ceil(height / (100 / 12)) ? active.color : "rgba(148,163,184,.12)", opacity: cell === Math.ceil(height / (100 / 12)) - 1 ? 0.62 : 1 }} />)}</div><span className="pointer-events-none absolute bottom-[calc(var(--bar-height)+8px)] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] text-white opacity-0 shadow transition group-hover:opacity-100" style={{ ["--bar-height" as string]: `${height}%` }}>{active.format(value)}</span><span className="relative z-10 translate-y-5 text-center text-[10px] text-slate-400">{label}</span></div>; })}
      </div>
      <div className="mt-8 flex items-center gap-2 text-[11px] text-slate-500"><span className="h-2 w-2 rounded-sm" style={{ background: active.color }} />{active.label}</div>
    </div> : <div className="flex h-52 items-center justify-center text-sm text-slate-400">No monthly activity yet</div>}
  </Card>;
}
