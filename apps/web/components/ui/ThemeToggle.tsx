"use client";

import React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, Theme } from "./ThemeProvider";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { preference, setTheme } = useTheme();
  const options: { value: Theme; label: string; Icon: typeof Sun }[] = [
    { value: "system", label: "Use system theme", Icon: Monitor },
    { value: "light", label: "Light theme", Icon: Sun },
    { value: "dark", label: "Dark theme", Icon: Moon },
  ];
  return <div role="group" aria-label="Appearance" className={`flex h-10 items-center rounded-full border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900 ${className}`}>
    {options.map(({ value, label, Icon }) => <button key={value} type="button" aria-label={label} aria-pressed={preference === value} title={label} onClick={() => setTheme(value)} className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${preference === value ? "bg-slate-100 text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}><Icon className="h-4 w-4" /></button>)}
  </div>;
}
