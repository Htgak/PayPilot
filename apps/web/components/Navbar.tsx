"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Sparkles,
  FileText,
  CreditCard,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  LayoutDashboard,
  Settings as SettingsIcon,
  ShoppingBag
} from "lucide-react";
import ThemeToggle from "./ui/ThemeToggle";
import { api, Invoice, Transaction } from "@/lib/api";

const QUICK_ROUTES = [
  { label: "Dashboard Overview", path: "/dashboard", icon: LayoutDashboard, category: "Navigation" },
  { label: "AI Copilot Assistant", path: "/assistant", icon: Sparkles, category: "AI Operations" },
  { label: "Invoices & Billing", path: "/invoices", icon: FileText, category: "Billing" },
  { label: "Payments & Transactions", path: "/transactions", icon: CreditCard, category: "Ledger" },
  { label: "PayPal Checkout Portal", path: "/checkout", icon: ShoppingBag, category: "Customer Portal" },
  { label: "Merchant Profile Settings", path: "/settings", icon: SettingsIcon, category: "Settings" }
];

export default function Navbar({
  pendingApprovalsCount = 0
}: {
  onOpenChatDrawer?: () => void;
  pendingApprovalsCount?: number;
}) {
  const router = useRouter();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadedData, setLoadedData] = useState(false);

  // Lazy-load invoices and transactions when search is activated
  useEffect(() => {
    if (isOpen && !loadedData) {
      Promise.all([
        api.getInvoices().catch(() => []),
        api.getTransactions().catch(() => [])
      ]).then(([invs, txs]) => {
        setInvoices(invs);
        setTransactions(txs);
        setLoadedData(true);
      });
    }
  }, [isOpen, loadedData]);

  // Global Keyboard shortcut: Cmd+K or Ctrl+K or Cmd+F or Ctrl+F
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === "k" || e.key.toLowerCase() === "f")) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered Results
  const trimmed = query.trim().toLowerCase();

  const filteredRoutes = useMemo(() => {
    if (!trimmed) return QUICK_ROUTES;
    return QUICK_ROUTES.filter(
      (r) => r.label.toLowerCase().includes(trimmed) || r.category.toLowerCase().includes(trimmed)
    );
  }, [trimmed]);

  const filteredInvoices = useMemo(() => {
    if (!trimmed) return [];
    return invoices
      .filter((inv) => {
        const num = inv.invoice_number?.toLowerCase() || "";
        const name = inv.customer_name?.toLowerCase() || "";
        const email = inv.customer_email?.toLowerCase() || "";
        const status = inv.status?.toLowerCase() || "";
        const memo = inv.memo?.toLowerCase() || "";
        const amt = String(inv.amount);
        return (
          num.includes(trimmed) ||
          name.includes(trimmed) ||
          email.includes(trimmed) ||
          status.includes(trimmed) ||
          memo.includes(trimmed) ||
          amt.includes(trimmed)
        );
      })
      .slice(0, 4);
  }, [trimmed, invoices]);

  const filteredTransactions = useMemo(() => {
    if (!trimmed) return [];
    return transactions
      .filter((tx) => {
        const orderId = tx.paypal_order_id?.toLowerCase() || "";
        const captureId = tx.paypal_capture_id?.toLowerCase() || "";
        const name = tx.payer_name?.toLowerCase() || "";
        const email = tx.payer_email?.toLowerCase() || "";
        const status = tx.status?.toLowerCase() || "";
        const amt = String(tx.amount);
        return (
          orderId.includes(trimmed) ||
          captureId.includes(trimmed) ||
          name.includes(trimmed) ||
          email.includes(trimmed) ||
          status.includes(trimmed) ||
          amt.includes(trimmed)
        );
      })
      .slice(0, 4);
  }, [trimmed, transactions]);

  const handleSelectRoute = (path: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(path);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID":
      case "COMPLETED":
        return <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"><CheckCircle2 className="h-3 w-3" /> Paid</span>;
      case "OVERDUE":
        return <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"><AlertCircle className="h-3 w-3" /> Overdue</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"><Clock className="h-3 w-3" /> {status}</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white px-5 sm:px-7 dark:border-slate-800 dark:bg-[#0b0f19]">
      {/* Search Input Container */}
      <div ref={searchContainerRef} className="relative w-full max-w-[420px]">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            aria-label="Search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search invoices, clients, payments, or actions..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-20 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#5146c7] focus:ring-2 focus:ring-[#5146c7]/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-8 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-800">
            ⌘K
          </kbd>
        </div>

        {/* Global Search Results Dropdown */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-11 z-50 max-h-[460px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-100 dark:border-slate-800 dark:bg-[#0f172a]">
            {/* 1. Quick Navigation Routes */}
            {filteredRoutes.length > 0 && (
              <div className="mb-2">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {trimmed ? "Matching Pages & Actions" : "Quick Navigation"}
                </div>
                <div className="space-y-0.5">
                  {filteredRoutes.map((route) => {
                    const Icon = route.icon;
                    return (
                      <button
                        key={route.path}
                        type="button"
                        onClick={() => handleSelectRoute(route.path)}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/80"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 text-[#5146c7] dark:bg-indigo-950/70 dark:text-indigo-400">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {route.label}
                            </span>
                            <span className="ml-2 text-[10px] text-slate-400">
                              {route.category}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Invoices Matches */}
            {filteredInvoices.length > 0 && (
              <div className="mb-2 border-t border-slate-100 pt-2 dark:border-slate-800">
                <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Invoices</span>
                  <span className="text-[9px] font-normal lowercase">click to view</span>
                </div>
                <div className="space-y-0.5">
                  {filteredInvoices.map((inv) => (
                    <button
                      key={inv.id}
                      type="button"
                      onClick={() => handleSelectRoute("/invoices")}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/80"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-50 text-violet-600 dark:bg-violet-950/70 dark:text-violet-400">
                          <FileText className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {inv.invoice_number} — {inv.customer_name || "Client"}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {inv.memo || inv.customer_email || "PayPal Invoice"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          ${(inv.amount ?? 0).toFixed(2)}
                        </span>
                        {getStatusBadge(inv.status)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Transactions Matches */}
            {filteredTransactions.length > 0 && (
              <div className="mb-2 border-t border-slate-100 pt-2 dark:border-slate-800">
                <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Transactions</span>
                  <span className="text-[9px] font-normal lowercase">click to view</span>
                </div>
                <div className="space-y-0.5">
                  {filteredTransactions.map((tx) => (
                    <button
                      key={tx.id}
                      type="button"
                      onClick={() => handleSelectRoute("/transactions")}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/80"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400">
                          <CreditCard className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {tx.payer_name || "Customer Payment"}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {tx.paypal_capture_id || tx.paypal_order_id}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          +${(tx.amount ?? 0).toFixed(2)}
                        </span>
                        {getStatusBadge(tx.status)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. No Matches Fallback */}
            {trimmed && filteredRoutes.length === 0 && filteredInvoices.length === 0 && filteredTransactions.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No records matching <span className="font-semibold text-slate-800 dark:text-slate-200">"{query}"</span>
                </p>
                <button
                  type="button"
                  onClick={() => handleSelectRoute(`/assistant`)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#5146c7] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#4338ad]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Ask PayPilot AI about "{query}"
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="ml-4 flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <Bell className="h-4 w-4" />
          {pendingApprovalsCount > 0 && (
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
          )}
        </button>
        <ThemeToggle className="h-9 rounded-lg" />
        <Link
          href="/settings"
          aria-label="Open profile settings"
          className="ml-1 flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          
        </Link>
      </div>
    </header>
  );
}
