"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  Plus, 
  Sparkles, 
  FileText, 
  ExternalLink,
  RefreshCw,
  ArrowRight,
  Receipt,
  ArrowLeftRight,
  CreditCard
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ChatDrawer from "@/components/ChatDrawer";
import { useTheme } from "@/components/ui/ThemeProvider";
import Button from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import Badge, { BadgeVariant } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { api, DashboardSummary, DashboardCharts, InsightsData } from "@/lib/api";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const { theme } = useTheme();

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumData, chartData, insightData] = await Promise.all([
        api.getDashboardSummary(),
        api.getDashboardCharts(),
        api.getInsights(),
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

  const getStatusVariant = (status: string): BadgeVariant => {
    switch (status.toUpperCase()) {
      case "PAID":
      case "COMPLETED":
        return "paid";
      case "SENT":
      case "PENDING":
        return "sent";
      case "OVERDUE":
        return "overdue";
      case "DRAFT":
        return "draft";
      default:
        return "neutral";
    }
  };

  const isDark = theme === "dark";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#090d16] transition-colors">
      {/* Sidebar */}
      <Sidebar pendingCount={summary?.pending_approvals_count || 0} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar 
          onOpenChatDrawer={() => setIsChatOpen(true)}
          pendingApprovalsCount={summary?.pending_approvals_count || 0}
        />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Bar: Title & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Financial Overview</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time settled revenue, outstanding receivables, and AI approval-governed workflows.
              </p>
            </div>

            {/* Streamlined Action Buttons - No Duplicate Clutter */}
            <div className="flex items-center space-x-2.5">
              <button
                onClick={loadData}
                disabled={loading}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
                title="Refresh metrics"
                aria-label="Refresh metrics"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChatOpen(true)}
                icon={<Sparkles className="w-3.5 h-3.5 text-[#0070ba] dark:text-cyan-400" />}
              >
                <span>Instruct AI</span>
              </Button>

              <Link href="/invoices">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  <span>New Invoice</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Settled Revenue"
              value={`$${summary ? summary.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 }) : "0.00"}`}
              growthPct={summary?.revenue_growth_pct}
              subtitle="All completed captures"
              icon={<DollarSign className="w-4 h-4" />}
              iconBg="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
            />

            <StatCard
              title="Outstanding Invoices"
              value={`$${summary ? summary.outstanding_invoices_amount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : "0.00"}`}
              subtitle={`${summary?.outstanding_invoices_count || 0} active invoice(s)`}
              icon={<Clock className="w-4 h-4" />}
              iconBg="bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
            />

            <StatCard
              title="Completed Captures"
              value={summary?.completed_payments_count || 0}
              subtitle="Verified PayPal captures"
              icon={<CheckCircle2 className="w-4 h-4" />}
              iconBg="bg-blue-50 text-[#0070ba] dark:bg-blue-950/60 dark:text-cyan-400"
            />

            <StatCard
              title="Pending Approvals"
              value={summary?.pending_approvals_count || 0}
              subtitle={summary?.pending_approvals_count === 0 ? "All actions confirmed" : "Requires merchant sign-off"}
              icon={<ShieldAlert className="w-4 h-4" />}
              iconBg="bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400"
            />
          </div>

          {/* Charts & AI Insights Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline Chart (2 columns) */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Cash Flow & Invoicing Timeline</CardTitle>
                  <CardDescription>Real settled revenue vs invoiced receivables over 6 months</CardDescription>
                </div>
                <div className="flex items-center space-x-3 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0070ba] dark:bg-cyan-400" />
                    <span className="text-slate-600 dark:text-slate-400">Settled Revenue</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span className="text-slate-500 dark:text-slate-500">Invoiced Total</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="h-64 w-full">
                  {charts && charts.revenue_timeline ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={charts.revenue_timeline}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isDark ? "#38bdf8" : "#0070ba"} stopOpacity={0.35} />
                            <stop offset="95%" stopColor={isDark ? "#38bdf8" : "#0070ba"} stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="colorInv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={isDark ? "#1e293b" : "#e2e8f0"}
                          opacity={0.8}
                        />
                        <XAxis
                          dataKey="period"
                          stroke={isDark ? "#64748b" : "#94a3b8"}
                          fontSize={11}
                          tickLine={false}
                        />
                        <YAxis
                          stroke={isDark ? "#64748b" : "#94a3b8"}
                          fontSize={11}
                          tickLine={false}
                          tickFormatter={(v) => `$${v}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? "#0f172a" : "#ffffff",
                            borderColor: isDark ? "#1e293b" : "#e2e8f0",
                            borderRadius: "0.75rem",
                            fontSize: "12px",
                            color: isDark ? "#f8fafc" : "#0f172a",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="invoiced"
                          stroke={isDark ? "#64748b" : "#94a3b8"}
                          strokeWidth={1.5}
                          fillOpacity={1}
                          fill="url(#colorInv)"
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke={isDark ? "#38bdf8" : "#0070ba"}
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorRev)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      Loading chart...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Insights & Financial Health (1 column) */}
            <Card className="flex flex-col justify-between">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0070ba] dark:text-cyan-400 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <CardTitle className="text-sm">AI Financial Insights</CardTitle>
                  </div>
                  <Badge variant="info" dot={false}>
                    Health: {insights?.health_score || 100}/100
                  </Badge>
                </div>
                <CardDescription className="pt-1">
                  {insights?.summary || "Analyzing real financial records..."}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2.5 flex-1 pt-1">
                {insights?.insights?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-1"
                  >
                    <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200">
                      {item.type === "warning" && <span className="w-2 h-2 rounded-full bg-rose-500" />}
                      {item.type === "success" && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                      {item.type === "info" && <span className="w-2 h-2 rounded-full bg-[#0070ba] dark:bg-cyan-400" />}
                      <span>{item.title}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-normal">{item.message}</p>
                    {item.action_prompt && (
                      <button
                        onClick={() => setIsChatOpen(true)}
                        className="mt-1 text-[11px] text-[#0070ba] dark:text-cyan-400 hover:underline flex items-center space-x-1 font-medium"
                      >
                        <span>Instruct Copilot</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Bottom Grid: Recent Invoices & Recent Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Invoices Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm">Recent Invoices</CardTitle>
                  <CardDescription>PayPal Invoicing v2 synchronized records</CardDescription>
                </div>
                <Link
                  href="/invoices"
                  className="text-xs text-[#0070ba] dark:text-cyan-400 hover:underline flex items-center space-x-1 font-medium"
                >
                  <span>View All</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </CardHeader>

              <CardContent className="pt-0">
                {summary?.recent_invoices && summary.recent_invoices.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">
                          <th className="pb-2 font-medium">Invoice #</th>
                          <th className="pb-2 font-medium">Client</th>
                          <th className="pb-2 font-medium">Amount</th>
                          <th className="pb-2 font-medium">Status</th>
                          <th className="pb-2 font-medium text-right">PDF</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                        {summary.recent_invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                              {inv.invoice_number}
                            </td>
                            <td className="py-3 font-sans text-slate-600 dark:text-slate-300">
                              {inv.customer_name || "Client"}
                            </td>
                            <td className="py-3 text-slate-900 dark:text-slate-100 font-bold">
                              ${inv.amount.toFixed(2)}
                            </td>
                            <td className="py-3">
                              <Badge variant={getStatusVariant(inv.status)}>
                                {inv.status}
                              </Badge>
                            </td>
                            <td className="py-3 text-right">
                              <a
                                href={api.getInvoicePdfUrl(inv.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-block transition-colors"
                                title="Download PDF"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState
                    icon={<Receipt className="w-6 h-6" />}
                    title="No invoices created yet"
                    description="Instruct the AI Copilot to prepare your first invoice, or create one manually."
                    actionLabel="Create Invoice"
                    onAction={() => setIsChatOpen(true)}
                  />
                )}
              </CardContent>
            </Card>

            {/* Recent Payments Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm">Recent Payments</CardTitle>
                  <CardDescription>Captured through Orders API and Webhooks</CardDescription>
                </div>
                <Link
                  href="/transactions"
                  className="text-xs text-[#0070ba] dark:text-cyan-400 hover:underline flex items-center space-x-1 font-medium"
                >
                  <span>View Ledger</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </CardHeader>

              <CardContent className="pt-0">
                {summary?.recent_transactions && summary.recent_transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">
                          <th className="pb-2 font-medium">Capture Ref</th>
                          <th className="pb-2 font-medium">Payer</th>
                          <th className="pb-2 font-medium">Amount</th>
                          <th className="pb-2 font-medium text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                        {summary.recent_transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 text-slate-700 dark:text-slate-300 font-semibold">
                              {tx.paypal_capture_id || "CAP-PENDING"}
                            </td>
                            <td className="py-3 font-sans text-slate-600 dark:text-slate-300">
                              {tx.payer_name || tx.payer_email || "Customer"}
                            </td>
                            <td className="py-3 text-emerald-600 dark:text-emerald-400 font-bold">
                              +${tx.amount.toFixed(2)} {tx.currency}
                            </td>
                            <td className="py-3 text-right">
                              <Badge variant={getStatusVariant(tx.status)}>
                                {tx.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState
                    icon={<ArrowLeftRight className="w-6 h-6" />}
                    title="No settled payments yet"
                    description="Payments captured via PayPal Checkout or Invoicing will automatically sync here."
                    actionLabel="Try Sandbox Checkout"
                    onAction={() => {
                      window.location.href = "/checkout";
                    }}
                  />
                )}
              </CardContent>
            </Card>
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
