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

  // Strip any fixed width class (like w-9) so the 3 segmented buttons always fit comfortably
  const sanitizedClassName = className.replace(/\bw-\d+\b/g, "").trim();

  return (
    <div
      role="group"
      aria-label="Appearance theme"
      className={`inline-flex h-9 items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900 ${sanitizedClassName}`}
    >
      {options.map(({ value, label, Icon }) => {
        const isActive = preference === value;
        return (
          <button
            key={value}
            type="button"
            aria-label={label}
            aria-pressed={isActive}
            title={label}
            onClick={() => setTheme(value)}
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-all ${
              isActive
                ? "bg-slate-100 text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
