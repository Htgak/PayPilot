"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Bot, 
  Receipt, 
  ArrowLeftRight, 
  CreditCard, 
  Settings, 
  CheckCircle2, 
  ShieldAlert,
  Sparkles,
  ExternalLink
} from "lucide-react";

interface SidebarProps {
  pendingCount?: number;
}

export default function Sidebar({ pendingCount = 0 }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      label: "AI Copilot",
      href: "/assistant",
      icon: Bot,
      badge: "Active",
      badgeColor: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30",
    },
    {
      label: "Invoices",
      href: "/invoices",
      icon: Receipt,
      badge: pendingCount > 0 ? `${pendingCount} req` : null,
      badgeColor: "bg-amber-500/20 text-amber-400 border border-amber-500/40",
    },
    {
      label: "Transactions",
      href: "/transactions",
      icon: ArrowLeftRight,
      badge: null,
    },
    {
      label: "Sandbox Checkout",
      href: "/checkout",
      icon: CreditCard,
      badge: "Demo",
      badgeColor: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
    },
    {
      label: "Settings & API",
      href: "/settings",
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 border-r border-[#1e2c47] bg-[#090e18] flex flex-col justify-between p-4 hidden md:flex shrink-0">
      <div className="space-y-6">
        {/* Navigation Section */}
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">
            Operations
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600/20 to-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-glow-cyan"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Safety Gate Banner */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 text-xs">
          <div className="flex items-center space-x-2 text-cyan-400 font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Human-in-the-Loop</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            All AI-drafted invoices and payment requests require your explicit one-click confirmation before executing against the PayPal Sandbox API.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="border-t border-slate-800/80 pt-4 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>PayPal API v2</span>
          <span className="font-mono text-emerald-400">SANDBOX</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>AI Engine</span>
          <span className="font-mono text-cyan-400">Gemini Flash</span>
        </div>
      </div>
    </aside>
  );
}
