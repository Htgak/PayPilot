"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Bot, 
  ShieldCheck, 
  CreditCard, 
  ExternalLink, 
  Sparkles, 
  Bell,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { api, SystemSettings } from "@/lib/api";

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
    <header className="h-16 border-b border-[#1e2c47] bg-[#080c14]/90 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Brand & Tagline */}
      <div className="flex items-center space-x-3">
        <Link href="/dashboard" className="flex items-center space-x-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0070ba] to-[#00cfde] flex items-center justify-center shadow-glow-cyan text-white font-black tracking-wider">
            P
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                PayPilot
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                AI Agent
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-0.5">PayPal FinOps Copilot</p>
          </div>
        </Link>
      </div>

      {/* Integration Status Badges */}
      <div className="hidden md:flex items-center space-x-3">
        {/* PayPal Sandbox Status Badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-slate-300">PayPal Sandbox</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 font-mono">
            CONNECTED
          </span>
        </div>

        {/* Approval Safety Gate Indicator */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-xs text-cyan-300">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Approval-Gated Agent</span>
        </div>
      </div>

      {/* Right Actions: AI Drawer Launcher & Profile */}
      <div className="flex items-center space-x-3">
        {onOpenChatDrawer && (
          <button
            onClick={onOpenChatDrawer}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600/90 to-cyan-600/90 hover:from-blue-500 hover:to-cyan-500 text-white font-medium text-xs shadow-glow-blue transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask AI Copilot</span>
          </button>
        )}

        <Link
          href="/settings"
          className="flex items-center space-x-2.5 pl-2 pr-3 py-1 rounded-lg hover:bg-slate-800/50 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white border border-indigo-400/40">
            {settings?.profile?.name ? settings.profile.name.charAt(0) : "A"}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-slate-200 leading-none">
              {settings?.profile?.business_name || "PixelCraft Studio"}
            </p>
            <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
              {settings?.profile?.email || "alex@pixelcraft.studio"}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}
