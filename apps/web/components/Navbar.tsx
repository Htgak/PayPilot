"use client";

import React from "react";
import Link from "next/link";
import { Search, Bell } from "lucide-react";
import ThemeToggle from "./ui/ThemeToggle";

export default function Navbar({ pendingApprovalsCount = 0 }: { onOpenChatDrawer?: () => void; pendingApprovalsCount?: number }) {
  return <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white px-5 sm:px-7 dark:border-slate-800 dark:bg-[#0b0f19]">
    <div className="relative w-full max-w-[360px]"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input aria-label="Search" type="search" placeholder="Search" className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-16 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#5146c7] focus:ring-2 focus:ring-[#5146c7]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" /><kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400 dark:border-slate-700 dark:bg-slate-800">⌘ + F</kbd></div>
    <div className="ml-4 flex shrink-0 items-center gap-2"><button type="button" aria-label="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"><Bell className="h-4 w-4" />{pendingApprovalsCount > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500" />}</button><ThemeToggle className="h-9 w-9 rounded-lg" /><Link href="/settings" aria-label="Open profile settings" className="ml-1 flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-slate-50 dark:hover:bg-slate-800"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d9d5ff] text-xs font-bold text-[#5146c7]">AM</span><span className="hidden leading-tight sm:block"><span className="block text-xs font-semibold text-slate-800 dark:text-slate-100">Alex Morgan</span><span className="block text-[10px] text-slate-400">PixelCraft Studio</span></span></Link></div>
  </header>;
}
