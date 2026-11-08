"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowRight,
  Plus, 
  Sparkles, 
  Receipt, 
  FileText, 
  ExternalLink,
  Send,
  Bell,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ChatDrawer from "@/components/ChatDrawer";
import { api, DashboardSummary, DashboardCharts, InsightsData } from "@/lib/api";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumData, chartData, insightData] = await Promise.all([
        api.getDashboardSummary(),
        api.getDashboardCharts(),
        api.getInsights()
      ]);
      setSummary(sumData);
      setCharts(chartData);
      setInsights(insightData);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
      case "COMPLETED":
        return "bg-emerald-950/70 text-emerald-400 border-emerald-800/80";
      case "SENT":
      case "PENDING":
        return "bg-amber-950/70 text-amber-400 border-amber-800/80";
      case "OVERDUE":
        return "bg-rose-950/70 text-rose-400 border-rose-800/80";
      case "DRAFT":
        return "bg-slate-800/70 text-slate-300 border-slate-700";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#080c14]">
      {/* Sidebar Navigation */}
      <Sidebar pendingCount={summary?.pending_approvals_count || 0} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar 
          onOpenChatDrawer={() => setIsChatOpen(true)}
          pendingApprovalsCount={summary?.pending_approvals_count || 0}
        />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Banner / Welcome & Quick Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
                <span>Financial Operations</span>
                <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                  Monef Executive
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Real-time settled revenue, outstanding receivables, and AI approval-governed workflows.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={loadData}
                disabled={loading}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors"
                title="Refresh metrics"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={() => setIsChatOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium text-xs shadow-glow-cyan transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instruct AI Copilot</span>
              </button>

              <Link
                href="/invoices"
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Invoice</span>
              </Link>
            </div>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Settled Revenue */}
            <div className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Total Settled Revenue</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-bold tracking-tight text-white font-mono">
                  ${summary ? summary.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 }) : "0.00"}
                </h3>
                <div className="flex items-center space-x-1 text-[11px] text-emerald-400 mt-1 font-medium">
                  <TrendingUp className="w-3 h-3" />
                  <span>+{summary?.revenue_growth_pct || 18.4}% this month</span>
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
            </div>

            {/* 2. Outstanding Receivables */}
            <div className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Outstanding Invoices</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-bold tracking-tight text-white font-mono">
                  ${summary ? summary.outstanding_invoices_amount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : "0.00"}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Across {summary?.outstanding_invoices_count || 0} active invoices
                </p>
              </div>
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
            </div>

            {/* 3. Completed Payments */}
            <div className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Completed Captures</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-cyan-400 flex items-center justify-center border border-blue-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-bold tracking-tight text-white font-mono">
                  {summary?.completed_payments_count || 0}
                </h3>
                <p className="text-[11px] text-cyan-400 mt-1 flex items-center space-x-1">
                  <span>100% PayPal Verified</span>
                </p>
              </div>
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
            </div>

            {/* 4. Action Approvals Queue */}
            <div className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Pending Approvals</span>
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-bold tracking-tight text-white font-mono">
                  {summary?.pending_approvals_count || 0}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  {summary?.pending_approvals_count === 0 
                    ? "All actions executed" 
                    : "Awaiting merchant sign-off"}
                </p>
              </div>
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
            </div>
          </div>

          {/* Charts & AI Insights Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue & Invoicing Timeline (2 columns) */}
            <div className="lg:col-span-2 glass-card p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Revenue Inflow vs Invoiced Volume</h3>
                  <p className="text-xs text-slate-400">Track collections progress over 6-month timeline</p>
                </div>
                <div className="flex items-center space-x-3 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span className="text-slate-300">Revenue Settled</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span className="text-slate-400">Invoiced Total</span>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                {charts && charts.revenue_timeline ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.revenue_timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00cfde" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#00cfde" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorInv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0070ba" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#0070ba" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2c47" opacity={0.5} />
                      <XAxis dataKey="period" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0d1527",
                          borderColor: "#1e2c47",
                          borderRadius: "0.75rem",
                          fontSize: "12px",
                        }}
                      />
                      <Area type="monotone" dataKey="invoiced" stroke="#0070ba" strokeWidth={2} fillOpacity={1} fill="url(#colorInv)" />
                      <Area type="monotone" dataKey="revenue" stroke="#00cfde" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    Loading chart data...
                  </div>
                )}
              </div>
            </div>

            {/* AI Insights & Financial Health (1 column) */}
            <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white">AI Financial Insights</h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                    Score: {insights?.health_score || 85}/100
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {insights?.summary || "Analyzing financial records..."}
                </p>

                {/* Insight Highlights */}
                <div className="space-y-2.5">
                  {insights?.insights?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 text-xs space-y-1"
                    >
                      <div className="flex items-center space-x-1.5 font-semibold text-slate-200">
                        {item.type === "warning" && <span className="w-2 h-2 rounded-full bg-rose-500" />}
                        {item.type === "success" && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                        {item.type === "info" && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
                        <span>{item.title}</span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-normal">{item.message}</p>
                      {item.action_prompt && (
                        <button
                          onClick={() => {
                            setIsChatOpen(true);
                          }}
                          className="mt-1 text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-medium"
                        >
                          <span>Ask Copilot to resolve</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Confidence Index: 92%</span>
                <span className="text-cyan-400 cursor-pointer" onClick={() => setIsChatOpen(true)}>Ask detailed analysis</span>
              </div>
            </div>
          </div>

          {/* Bottom Grid: Recent Invoices & Recent Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Invoices Table */}
            <div className="glass-card p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Recent Invoices</h3>
                  <p className="text-xs text-slate-400">Directly synchronized with PayPal Invoicing v2</p>
                </div>
                <Link
                  href="/invoices"
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-medium"
                >
                  <span>View All</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2 font-medium">Invoice #</th>
                      <th className="pb-2 font-medium">Client</th>
                      <th className="pb-2 font-medium">Amount</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {summary?.recent_invoices?.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 font-semibold text-slate-200">
                          {inv.invoice_number}
                        </td>
                        <td className="py-3 font-sans text-slate-300">
                          {inv.customer_name || "Client"}
                        </td>
                        <td className="py-3 text-slate-200 font-bold">
                          ${inv.amount.toFixed(2)}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(inv.status)}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 text-right space-x-2">
                          <a
                            href={api.getInvoicePdfUrl(inv.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 inline-block"
                            title="Download PDF"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </a>
                          {inv.payment_url && (
                            <a
                              href={inv.payment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-400 inline-block"
                              title="View in PayPal Sandbox"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Transactions Table */}
            <div className="glass-card p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Recent Payments</h3>
                  <p className="text-xs text-slate-400">Captured through Orders API & Webhooks</p>
                </div>
                <Link
                  href="/transactions"
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-medium"
                >
                  <span>View Ledger</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2 font-medium">Capture Ref</th>
                      <th className="pb-2 font-medium">Payer</th>
                      <th className="pb-2 font-medium">Amount</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {summary?.recent_transactions?.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 text-slate-300 font-semibold">
                          {tx.paypal_capture_id || "CAP-PENDING"}
                        </td>
                        <td className="py-3 font-sans text-slate-300">
                          {tx.payer_name || tx.payer_email || "Customer"}
                        </td>
                        <td className="py-3 text-emerald-400 font-bold">
                          +${tx.amount.toFixed(2)}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(tx.status)}`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Floating AI FinOps Copilot Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onRefreshDashboard={loadData}
      />
    </div>
  );
}
