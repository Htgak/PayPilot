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
  ShieldCheck,
  Sparkles
} from "lucide-react";
import Badge from "./ui/Badge";

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
      badgeVariant: "info" as const,
    },
    {
      label: "Invoices",
      href: "/invoices",
      icon: Receipt,
      badge: pendingCount > 0 ? `${pendingCount} req` : null,
      badgeVariant: "pending" as const,
    },
    {
      label: "Transactions",
      href: "/transactions",
      icon: ArrowLeftRight,
      badge: null,
      badgeVariant: null,
    },
    {
      label: "Sandbox Checkout",
      href: "/checkout",
      icon: CreditCard,
      badge: null,
      badgeVariant: null,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
      badge: null,
      badgeVariant: null,
    },
  ];

  return (
    <aside className="w-60 border-r border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-[#090d16] flex flex-col justify-between p-4 hidden md:flex shrink-0 transition-colors">
      <div className="space-y-6">
        {/* Navigation Items */}
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2 font-mono">
            Platform
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#0070ba]/10 dark:bg-cyan-500/10 text-[#0070ba] dark:text-cyan-300 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? "text-[#0070ba] dark:text-cyan-400"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badgeVariant && (
                  <Badge variant={item.badgeVariant} dot={false} className="py-0 px-2 text-[10px]">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>

        {/* Human-in-the-Loop Safe Box */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
          <div className="flex items-center space-x-1.5 text-[#0070ba] dark:text-cyan-400 font-semibold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-[11px]">Approval Safety Gate</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Financial actions require merchant review before executing PayPal Sandbox APIs.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="border-t border-slate-200/80 dark:border-slate-800 pt-3 text-[11px] text-slate-400 dark:text-slate-500 space-y-1 font-mono">
        <div className="flex justify-between">
          <span>PayPal REST v2</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">ONLINE</span>
        </div>
        <div className="flex justify-between">
          <span>AI Engine</span>
          <span className="text-[#0070ba] dark:text-cyan-400">ACTIVE</span>
        </div>
      </div>
    </aside>
  );
}
