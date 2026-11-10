"use client";

import React from "react";
import { ArrowUpRight, CircleDollarSign, FilePlus2, ReceiptText, Sparkles } from "lucide-react";

const prompts = [
  { label: "Create an invoice", prompt: "Create an invoice", icon: FilePlus2, tone: "text-violet-600 bg-violet-50 dark:bg-violet-950/60 dark:text-violet-400" },
  { label: "Check revenue", prompt: "Show my revenue this month", icon: CircleDollarSign, tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400" },
  { label: "Find overdue invoices", prompt: "Which invoices are overdue? Prepare a reminder.", icon: ReceiptText, tone: "text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400" },
  { label: "Recent payments", prompt: "Show my recent transactions", icon: ArrowUpRight, tone: "text-sky-600 bg-sky-50 dark:bg-sky-950/60 dark:text-sky-400" },
];

export default function AIAssistantWelcome({ onPrompt }: { onPrompt: (prompt: string) => void }) {
  return <section className="mx-auto flex min-h-full w-full max-w-2xl flex-col items-center justify-center px-4 py-10 text-center">
    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eeeafe] text-[#5146c7] dark:bg-[#5146c7]/20 dark:text-[#8d82ff]"><Sparkles className="h-6 w-6" /></div>
    <p className="text-sm text-slate-500 dark:text-slate-400">Hi Alex,</p>
    <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Welcome back! How can I help?</h1>
    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">Ask about your PayPal activity or choose a task to get started.</p>
    <div className="mt-7 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">{prompts.map(({ label, prompt, icon: Icon, tone }) => <button key={label} type="button" onClick={() => onPrompt(prompt)} className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-[#c9c2ff] hover:bg-[#fbfaff] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}><Icon className="h-4 w-4" /></span><span className="flex-1">{label}</span><ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-[#5146c7]" /></button>)}</div>
  </section>;
}
