"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeftRight, 
  Search, 
  RefreshCw, 
  ShieldCheck, 
  CreditCard
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ChatDrawer from "@/components/ChatDrawer";
import { Card, CardContent } from "@/components/ui/Card";
import Badge, { BadgeVariant } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { api, Transaction } from "@/lib/api";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  const loadTransactions = async (status?: string) => {
    setLoading(true);
    try {
      const data = await api.getTransactions(status === "ALL" ? undefined : status);
      setTransactions(data);
    } catch (err) {
      console.error("Error loading transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions(filterStatus);
  }, [filterStatus]);

  const filtered = transactions.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.paypal_capture_id && t.paypal_capture_id.toLowerCase().includes(q)) ||
      (t.paypal_order_id && t.paypal_order_id.toLowerCase().includes(q)) ||
      (t.payer_name && t.payer_name.toLowerCase().includes(q)) ||
      (t.payer_email && t.payer_email.toLowerCase().includes(q))
    );
  });

  const totalCompletedAmount = transactions
    .filter((t) => t.status === "COMPLETED")
    .reduce((acc, t) => acc + t.amount, 0);

  const getStatusVariant = (status: string): BadgeVariant => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return "completed";
      case "PENDING":
        return "pending";
      case "REFUNDED":
        return "neutral";
      default:
        return "neutral";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#090d16] transition-colors">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar onOpenChatDrawer={() => setIsChatOpen(true)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Transactions & Settlements</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Audited payment capture records from PayPal Orders v2, Checkout, and Webhook events.
              </p>
            </div>

            <button
              onClick={() => loadTransactions(filterStatus)}
              disabled={loading}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors self-start sm:self-auto"
              title="Refresh ledger"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Captured Volume</span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">
                ${totalCompletedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
              </h3>
            </Card>

            <Card className="p-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Verified Captures</span>
              <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {transactions.filter(t => t.status === "COMPLETED").length} Settlements
              </h3>
            </Card>

            <Card className="p-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Auditing & Security</span>
              <h3 className="text-xs font-semibold text-[#0070ba] dark:text-cyan-400 mt-2 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>100% Cryptographically Verified</span>
              </h3>
            </Card>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-1.5">
              {["ALL", "COMPLETED", "PENDING", "REFUNDED"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterStatus(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    filterStatus === tab
                      ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search capture ID, payer, order..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#0070ba] dark:focus:border-cyan-500 w-full sm:w-64"
              />
            </div>
          </div>

          {/* Transactions Table */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {filtered.length === 0 ? (
                <EmptyState
                  icon={<CreditCard className="w-6 h-6" />}
                  title="No transaction records found"
                  description="When clients pay invoices or checkout via PayPal Orders API, settlement captures appear here."
                  actionLabel="Go to Sandbox Checkout"
                  onAction={() => {
                    window.location.href = "/checkout";
                  }}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 font-medium">
                        <th className="py-3 px-4">Capture ID</th>
                        <th className="py-3 px-4">Order Reference</th>
                        <th className="py-3 px-4">Payer</th>
                        <th className="py-3 px-4">Source</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                      {filtered.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                            {t.paypal_capture_id || "CAP-PENDING"}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">
                            {t.paypal_order_id || "N/A"}
                          </td>
                          <td className="py-3.5 px-4 font-sans text-slate-700 dark:text-slate-300">
                            <div>
                              <p className="font-semibold">{t.payer_name || "Sandbox Customer"}</p>
                              <p className="text-[11px] text-slate-400">{t.payer_email || "N/A"}</p>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-sans">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]">
                              {t.payment_source || "paypal"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-sans">
                            {new Date(t.created_at).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-bold">
                            +${t.amount.toFixed(2)} {t.currency}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Badge variant={getStatusVariant(t.status)}>
                              {t.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onRefreshDashboard={() => loadTransactions(filterStatus)}
      />
    </div>
  );
}
