"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, 
  Receipt, 
  FileText, 
  Send, 
  Bell, 
  ExternalLink, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Filter,
  Trash2,
  RefreshCw,
  Loader2
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ChatDrawer from "@/components/ChatDrawer";
import { api, Invoice, InvoiceItem } from "@/lib/api";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [loading, setLoading] = useState<boolean>(true);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // New Invoice Form State
  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [memo, setMemo] = useState("");
  const [dueDays, setDueDays] = useState(14);
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "Product Design & Consultation", quantity: 1, unit_price: 650.0 }
  ]);

  const loadInvoices = async (statusFilter?: string) => {
    setLoading(true);
    try {
      const data = await api.getInvoices(statusFilter === "ALL" ? undefined : statusFilter);
      setInvoices(data);
    } catch (err) {
      console.error("Error loading invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices(activeTab);
  }, [activeTab]);

  const handleSendInvoice = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.sendInvoice(id);
      await loadInvoices(activeTab);
    } catch (err: any) {
      alert("Failed to send invoice: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemindInvoice = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.remindInvoice(id);
      alert("Payment reminder successfully sent to client via PayPal!");
    } catch (err: any) {
      alert("Failed to send reminder: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelInvoice = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this invoice?")) return;
    setActionLoadingId(id);
    try {
      await api.cancelInvoice(id);
      await loadInvoices(activeTab);
    } catch (err: any) {
      alert("Failed to cancel invoice: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, unit_price: 100.0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    setItems(next);
  };

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custEmail) {
      alert("Client email is required");
      return;
    }

    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + Number(dueDays));
      const dueDateStr = dueDate.toISOString().split("T")[0];

      await api.createInvoiceDraft({
        customer_name: custName,
        customer_email: custEmail,
        currency,
        items,
        due_date: dueDateStr,
        memo
      });

      setIsModalOpen(false);
      setCustName("");
      setCustEmail("");
      setMemo("");
      await loadInvoices(activeTab);
    } catch (err: any) {
      alert("Failed to create draft: " + err.message);
    }
  };

  const totalCalculated = items.reduce((acc, it) => acc + (Number(it.unit_price) * Number(it.quantity) || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-emerald-950/70 text-emerald-400 border-emerald-800/80";
      case "SENT":
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
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar onOpenChatDrawer={() => setIsChatOpen(true)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
                <span>Invoices & Billing</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-950 text-cyan-400 border border-blue-800">
                  PayPal Invoicing v2
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Draft, send, remind, and download branded invoices with PayPal Sandbox sync.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => loadInvoices(activeTab)}
                disabled={loading}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium text-xs shadow-glow-cyan transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Draft Invoice</span>
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            {["ALL", "PAID", "SENT", "OVERDUE", "DRAFT"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab
                    ? "bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Invoices Table */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                    <th className="py-3.5 px-4 font-medium">Invoice #</th>
                    <th className="py-3.5 px-4 font-medium">PayPal ID</th>
                    <th className="py-3.5 px-4 font-medium">Customer</th>
                    <th className="py-3.5 px-4 font-medium">Due Date</th>
                    <th className="py-3.5 px-4 font-medium">Amount</th>
                    <th className="py-3.5 px-4 font-medium">Status</th>
                    <th className="py-3.5 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-500 font-sans">
                        No invoices found for this filter tab.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-200">
                          {inv.invoice_number}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          {inv.paypal_invoice_id || "DRAFT_LOCAL"}
                        </td>
                        <td className="py-3.5 px-4 font-sans text-slate-300">
                          <div>
                            <p className="font-semibold">{inv.customer_name || "Client"}</p>
                            <p className="text-[11px] text-slate-500">{inv.customer_email || "N/A"}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-sans">
                          {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "Upon Receipt"}
                        </td>
                        <td className="py-3.5 px-4 text-white font-bold">
                          ${inv.amount.toFixed(2)} {inv.currency}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(inv.status)}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5 font-sans">
                          {/* Send button for Drafts */}
                          {inv.status === "DRAFT" && (
                            <button
                              onClick={() => handleSendInvoice(inv.id)}
                              disabled={actionLoadingId === inv.id}
                              className="px-2.5 py-1 rounded-md bg-blue-600/80 hover:bg-blue-600 text-white text-[11px] font-medium transition-colors"
                              title="Send to client via PayPal"
                            >
                              Send
                            </button>
                          )}

                          {/* Remind button for Sent/Overdue */}
                          {(inv.status === "SENT" || inv.status === "OVERDUE") && (
                            <button
                              onClick={() => handleRemindInvoice(inv.id)}
                              disabled={actionLoadingId === inv.id}
                              className="px-2.5 py-1 rounded-md bg-amber-600/80 hover:bg-amber-600 text-white text-[11px] font-medium transition-colors"
                              title="Send PayPal reminder"
                            >
                              Remind
                            </button>
                          )}

                          {/* PDF Download */}
                          <a
                            href={api.getInvoicePdfUrl(inv.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 inline-block align-middle"
                            title="Download PDF"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </a>

                          {/* PayPal Link */}
                          {inv.payment_url && (
                            <a
                              href={inv.payment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-md bg-cyan-950 hover:bg-cyan-900 text-cyan-400 inline-block align-middle"
                              title="View & Pay in PayPal Sandbox"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Create Draft Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#090e18] border border-[#1e2c47] rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-cyan-400" />
                <span>Create Draft Invoice</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDraft} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Client Name</label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Client Email</label>
                  <input
                    type="email"
                    required
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="e.g. sarah@cyberdyne.io"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Payment Terms</label>
                  <select
                    value={dueDays}
                    onChange={(e) => setDueDays(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value={7}>Net 7 (Due in 7 days)</option>
                    <option value={14}>Net 14 (Due in 14 days)</option>
                    <option value={30}>Net 30 (Due in 30 days)</option>
                    <option value={0}>Due on Receipt</option>
                  </select>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 pt-2">
                <label className="text-slate-400 block font-semibold">Line Items</label>
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="text"
                      required
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                      className="w-16 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(idx, "unit_price", Number(e.target.value))}
                      className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-cyan-400 hover:text-cyan-300 font-medium text-[11px] flex items-center space-x-1 pt-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add another line item</span>
                </button>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Notes / Memo</label>
                <textarea
                  rows={2}
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="Thank you for your business. Terms and notes..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-500">Calculated Total: </span>
                  <span className="text-base font-bold text-white font-mono">
                    ${totalCalculated.toFixed(2)} {currency}
                  </span>
                </div>

                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium shadow-glow-cyan"
                  >
                    Create PayPal Draft
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onRefreshDashboard={() => loadInvoices(activeTab)}
      />
    </div>
  );
}
