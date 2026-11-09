"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  ShieldCheck, 
  User
} from "lucide-react";
import { api, SystemSettings } from "@/lib/api";
import ThemeToggle from "./ui/ThemeToggle";
import Button from "./ui/Button";

interface NavbarProps {
  onOpenChatDrawer?: () => void;
  pendingApprovalsCount?: number;
}

export default function Navbar({ onOpenChatDrawer, pendingApprovalsCount = 0 }: NavbarProps) {
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    api.getSettings()
      .then(setSettings)
      .catch((err) => console.error("Error loading navbar settings:", err));
  }, []);

  return (
    <header className="h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#090d16]/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between transition-colors">
      {/* Brand & Identity */}
      <div className="flex items-center space-x-3">
        <Link href="/dashboard" className="flex items-center space-x-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-[#0070ba] text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-sm shadow-[#0070ba]/20 group-hover:scale-105 transition-transform">
            P
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white group-hover:text-[#0070ba] dark:group-hover:text-cyan-400 transition-colors">
                PayPilot
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-[#0070ba] dark:text-cyan-400 border border-blue-200 dark:border-blue-800/60 font-mono">
                AI Copilot
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Middle status badges */}
      <div className="hidden sm:flex items-center space-x-3 text-xs">
        {/* PayPal Sandbox Status Badge */}
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-[11px]">PayPal Sandbox Active</span>
        </div>

        {/* Safety Gate Indicator */}
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0070ba] dark:text-cyan-400" />
          <span>Approval-Governed</span>
        </div>
      </div>

      {/* Right Actions: Theme Toggle, Ask Copilot, Profile */}
      <div className="flex items-center space-x-2.5">
        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Ask Copilot Button */}
        {onOpenChatDrawer && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenChatDrawer}
            icon={<Sparkles className="w-3.5 h-3.5 text-[#0070ba] dark:text-cyan-400" />}
          >
            <span>Ask AI Copilot</span>
          </Button>
        )}

        {/* Merchant profile button */}
        <Link
          href="/settings"
          className="flex items-center space-x-2 pl-2 pr-2.5 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          title="Settings & Merchant Profile"
        >
          <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
            {settings?.profile?.name ? settings.profile.name.charAt(0) : "M"}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              {settings?.profile?.business_name || "PixelCraft Studio"}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}
