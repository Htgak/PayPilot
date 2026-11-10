"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Sparkles, 
  FileText, 
  RefreshCw,
  ArrowRight,
  Receipt,
  CreditCard,
  PieChart as PieChartIcon,
  ShieldCheck
} from "lucide-react";
import {
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ChatDrawer from "@/components/ChatDrawer";
import StatCard from "@/components/ui/StatCard";
import CellColumnTrend from "@/components/ui/CellColumnTrend";
import { Card } from "@/components/ui/Card";
import Badge, { BadgeVariant } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
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

  const totalRev = summary?.total_revenue ?? 0;
  const outstandingAmt = summary?.outstanding_invoices_amount ?? 0;
  const completedCount = summary?.completed_payments_count ?? 0;
  const pendingApprovals = summary?.pending_approvals_count ?? 0;

  // Donut chart distribution based on PayPal channels
  const channelData = [
    { name: "Invoicing v2", value: Math.max(outstandingAmt, 100), color: "#5B50EB" },
    { name: "Orders Checkout", value: Math.max(totalRev, 50), color: "#00D2B4" },
    { name: "Retainers / Direct", value: 50, color: "#7C72F2" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f7f9] dark:bg-[#0B0F19] transition-colors">
      {/* Sidebar */}
      <Sidebar pendingCount={pendingApprovals} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar 
          onOpenChatDrawer={() => setIsChatOpen(true)}
          pendingApprovalsCount={pendingApprovals}
        />

        <main className="flex-1 overflow-y-auto p-5 lg:p-7 space-y-5">
          {/* Dashboard Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Overview
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Keep track of your PayPal payments and invoices in one place.
              </p>
            </div>

            {/* Right Action Controls */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="p-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                title="Refresh metrics"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>

              <button
                type="button"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Last 30 days</span>
              </button>

              {/* Instruct AI Button */}
              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#5B50EB]/10 dark:bg-[#5B50EB]/20 text-[#5B50EB] dark:text-[#818CF8] hover:bg-[#5B50EB]/20 font-semibold shadow-xs transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI</span>
              </button>

              {/* New Invoice Button */}
              <Link
                href="/invoices"
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#5B50EB] hover:bg-[#4F46E5] text-white font-semibold shadow-sm shadow-[#5B50EB]/30 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create invoice</span>
              </Link>
            </div>
          </div>

          {/* Top Row: 4 FinOps Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Total revenue"
              value={`$${totalRev.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              growthPct={summary?.revenue_growth_pct}
              subtitle="Verified PayPal payments"
              icon={<DollarSign className="w-4 h-4 text-[#00D2B4]" />}
            />

            <StatCard
              title="Outstanding"
              value={`$${outstandingAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              subtitle={`${summary?.outstanding_invoices_count || 0} active invoice(s)`}
              icon={<Clock className="w-4 h-4 text-[#5B50EB]" />}
            />

            <StatCard title="Completed payments" value={completedCount} subtitle="Verified PayPal captures" icon={<CheckCircle2 className="w-4 h-4 text-[#00D2B4]" />} />
            <StatCard title="Needs your review" value={pendingApprovals} subtitle={pendingApprovals ? "Actions waiting for approval" : "No actions waiting"} icon={<Sparkles className="w-4 h-4 text-[#5B50EB]" />} />

          </div>

          {/* Revenue timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              {charts ? <CellColumnTrend labels={charts.revenue_timeline.map((item) => item.period)} revenue={charts.revenue_timeline.map((item) => item.revenue)} invoiced={charts.revenue_timeline.map((item) => item.invoiced)} currency={summary?.currency || "USD"} /> : <Card className="flex h-80 items-center justify-center text-sm text-slate-400">Loading revenue activity…</Card>}
            </div>

            {/* AI Financial Copilot Insights Card (1 col) */}
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-[#5B50EB]/10 text-[#5B50EB] dark:text-[#818CF8] flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      AI FinOps Insights
                    </span>
                  </div>

                  <Badge variant="paid" dot={false}>
                    {insights?.health_score || 100}/100 Health
                  </Badge>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                  {insights?.summary || "AI Agent continuously monitors overdue accounts, cash flow, and approval gates."}
                </p>

                {/* Insight items */}
                <div className="space-y-2.5">
                  {insights?.insights?.slice(0, 3).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 text-xs space-y-1"
                    >
                      <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200">
                        {item.type === "warning" && <span className="w-2 h-2 rounded-full bg-[#E11D48]" />}
                        {item.type === "success" && <span className="w-2 h-2 rounded-full bg-[#00D2B4]" />}
                        {item.type === "info" && <span className="w-2 h-2 rounded-full bg-[#5B50EB]" />}
                        <span>{item.title}</span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-normal">{item.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Trigger */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsChatOpen(true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#5B50EB] hover:bg-[#4F46E5] text-white text-xs font-semibold flex items-center justify-center space-x-2 shadow-sm shadow-[#5B50EB]/25 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask Copilot to Act</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          </div>

          {/* Bottom Row: Payment Channels Donut & Recent Financial Records Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Channel Distribution Donut (1 col) */}
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4">
                  <div className="flex items-center space-x-2">
                    <PieChartIcon className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      Payment Channels
                    </span>
                  </div>

                  <span className="text-xs text-slate-400 font-medium">Live Mix</span>
                </div>

                {/* Top Metrics Indicators with colored bars */}
                <div className="grid grid-cols-3 gap-2 pt-1 pb-3 text-xs border-b border-slate-100 dark:border-slate-800/80">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1">
                      <span className="w-1 h-3 rounded-full bg-[#5B50EB]"></span>
                      <span className="text-slate-400 text-[10px]">Invoices</span>
                    </div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      ${outstandingAmt > 0 ? outstandingAmt.toFixed(0) : "0"}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1">
                      <span className="w-1 h-3 rounded-full bg-[#00D2B4]"></span>
                      <span className="text-slate-400 text-[10px]">Checkout</span>
                    </div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      ${totalRev > 0 ? totalRev.toFixed(0) : "0"}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1">
                      <span className="w-1 h-3 rounded-full bg-[#7C72F2]"></span>
                      <span className="text-slate-400 text-[10px]">Retainers</span>
                    </div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">$0</p>
                  </div>
                </div>
              </div>

              {/* Donut Chart */}
              <div className="h-44 w-full flex items-center justify-center relative my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelData}
                      innerRadius={50}
                      outerRadius={68}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-slate-400 font-medium">Total Volume</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    ${(totalRev + outstandingAmt).toFixed(0)}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
                <span>Integrated with PayPal Developer Platform</span>
              </div>
            </Card>

            {/* Recent Financial Operations Table (2 cols) */}
            <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      Recent Financial Operations
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <Link
                      href="/invoices"
                      className="font-semibold text-[#5B50EB] hover:underline"
                    >
                      All Invoices
                    </Link>
                    <Link
                      href="/transactions"
                      className="font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      All Transactions
                    </Link>
                  </div>
                </div>

                {/* Clean Table with Real Invoices and Payments */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 tracking-wider">
                        <th className="pb-3">REF / INVOICE</th>
                        <th className="pb-3">CLIENT / PAYER</th>
                        <th className="pb-3">CHANNEL</th>
                        <th className="pb-3">STATUS</th>
                        <th className="pb-3 text-right">AMOUNT</th>
                        <th className="pb-3 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                      {summary?.recent_invoices && summary.recent_invoices.length > 0 ? (
                        summary.recent_invoices.slice(0, 4).map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                              {inv.invoice_number}
                            </td>
                            <td className="py-3 font-sans text-slate-600 dark:text-slate-300">
                              {inv.customer_name || "Valued Client"}
                            </td>
                            <td className="py-3 font-sans text-slate-500 text-[11px]">
                              PayPal Invoicing v2
                            </td>
                            <td className="py-3 font-sans">
                              <Badge variant={getStatusVariant(inv.status)}>
                                {inv.status}
                              </Badge>
                            </td>
                            <td className="py-3 text-right font-bold text-slate-900 dark:text-slate-100">
                              ${(inv.amount ?? 0).toFixed(2)}
                            </td>
                            <td className="py-3 text-right">
                              <a
                                href={api.getInvoicePdfUrl(inv.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded-lg text-slate-400 hover:text-[#5B50EB] inline-block transition-colors"
                                title="Download PDF"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </a>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center font-sans">
                            <EmptyState
                              icon={<Receipt className="w-6 h-6 text-[#5B50EB]" />}
                              title="No active invoices yet"
                              description="Instruct PayPilot AI Copilot: 'Create an invoice for $500 to client@acme.com'."
                              actionLabel="Create First Invoice"
                              onAction={() => setIsChatOpen(true)}
                            />
                          </td>
                        </tr>
                      )}

                      {/* Display recent captures if available */}
                      {summary?.recent_transactions && summary.recent_transactions.slice(0, 2).map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">
                            {tx.paypal_capture_id || "CAP-CAPTURE"}
                          </td>
                          <td className="py-3 font-sans text-slate-600 dark:text-slate-300">
                            {tx.payer_name || tx.payer_email || "Customer"}
                          </td>
                          <td className="py-3 font-sans text-slate-500 text-[11px]">
                            PayPal Orders API
                          </td>
                          <td className="py-3 font-sans">
                            <Badge variant={getStatusVariant(tx.status)}>
                              {tx.status}
                            </Badge>
                          </td>
                          <td className="py-3 text-right font-bold text-[#00D2B4]">
                            +${(tx.amount ?? 0).toFixed(2)}
                          </td>
                          <td className="py-3 text-right text-slate-400 font-sans text-[11px]">
                            Direct
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Transactions synchronized via PayPal Webhooks & API</span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {completedCount} Verified Captures
                </span>
              </div>
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
