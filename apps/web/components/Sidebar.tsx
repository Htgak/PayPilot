"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, Bot, FileText, LayoutDashboard, Settings, Zap } from "lucide-react";

interface SidebarProps { pendingCount?: number; }

export default function Sidebar({ pendingCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const items = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Invoices", href: "/invoices", icon: FileText },
    { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
    { label: "AI Assistant", href: "/assistant", icon: Bot, badge: pendingCount || undefined },
  ];
  return <aside className="hidden md:flex w-[252px] shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-5 dark:border-slate-800 dark:bg-[#111827]">
    <Link href="/dashboard" className="flex items-center gap-2.5 px-3 pb-8"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5146c7] text-white shadow-sm"><Zap className="h-4 w-4 fill-current" /></span><span className="text-[17px] font-semibold tracking-tight text-slate-900 dark:text-white">PayPilot</span></Link>
    <nav className="flex-1"><p className="px-3 pb-3 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">Workspace</p><div className="space-y-1">{items.map(({ label, href, icon: Icon, badge }) => { const active = pathname === href || (href === "/invoices" && pathname.startsWith("/invoices")); return <Link key={href} href={href} className={`flex h-11 items-center justify-between rounded-lg px-3 text-[13px] transition ${active ? "bg-slate-100 font-semibold text-slate-950 dark:bg-slate-800 dark:text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70"}`}><span className="flex items-center gap-3"><Icon className={`h-[16px] w-[16px] ${active ? "text-[#5146c7] dark:text-[#a49cff]" : "text-slate-500"}`} />{label}</span>{badge ? <span className="rounded-md bg-[#eeeafe] px-1.5 py-0.5 text-[10px] font-semibold text-[#5146c7]">{badge}</span> : null}</Link>; })}</div><p className="px-3 pb-3 pt-8 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">Account</p><Link href="/settings" className={`flex h-11 items-center gap-3 rounded-lg px-3 text-[13px] transition ${pathname === "/settings" ? "bg-slate-100 font-semibold text-slate-950 dark:bg-slate-800 dark:text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70"}`}><Settings className="h-4 w-4 text-slate-500" /> Profile settings</Link></nav>
    <div className="border-t border-slate-100 pt-5 dark:border-slate-800"><Link href="/settings" className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d9d5ff] text-xs font-bold text-[#5146c7]">AM</div><div className="min-w-0 leading-tight"><p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">Alex Morgan</p><p className="truncate text-[10px] text-slate-400">PixelCraft Studio</p></div></Link></div>
  </aside>;
}
