"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Receipt, 
  FileText, 
  Send, 
  Bell, 
  ExternalLink, 
  Trash2,
  RefreshCw,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ChatDrawer from "@/components/ChatDrawer";
import Button from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import Badge, { BadgeVariant } from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import EmptyState from "@/components/ui/EmptyState";
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
      alert("Payment reminder successfully dispatched to client via PayPal!");
    } catch (err: any) {
      alert("Failed to send reminder: " + err.message);
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

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
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

  const getStatusVariant = (status: string): BadgeVariant => {
    switch (status.toUpperCase()) {
      case "PAID":
        return "paid";
      case "SENT":
        return "sent";
      case "OVERDUE":
        return "overdue";
      case "DRAFT":
        return "draft";
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
                <span>Invoices & Billing</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Create, track, remind, and download invoices synchronized with PayPal Invoicing API v2.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2.5">
              <button
                onClick={() => loadInvoices(activeTab)}
                disabled={loading}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
                title="Refresh invoices"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                <span>Create Invoice</span>
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-1.5 border-b border-slate-200 dark:border-slate-800 pb-3">
            {["ALL", "PAID", "SENT", "OVERDUE", "DRAFT"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  activeTab === tab
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Invoices Card & Table */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {invoices.length === 0 ? (
                <EmptyState
                  icon={<Receipt className="w-6 h-6" />}
                  title={activeTab === "ALL" ? "No invoices found" : `No ${activeTab.toLowerCase()} invoices`}
                  description="Create a draft invoice or ask the AI Copilot to generate one from a prompt."
                  actionLabel="Create Invoice"
                  onAction={() => setIsModalOpen(true)}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 font-medium">
                        <th className="py-3 px-4">Invoice #</th>
                        <th className="py-3 px-4">PayPal Ref</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Due Date</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                            {inv.invoice_number}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                            {inv.paypal_invoice_id || "DRAFT_LOCAL"}
                          </td>
                          <td className="py-3.5 px-4 font-sans text-slate-700 dark:text-slate-300">
                            <div>
                              <p className="font-semibold">{inv.customer_name || "Client"}</p>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500">{inv.customer_email || "N/A"}</p>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-sans">
                            {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "Upon Receipt"}
                          </td>
                          <td className="py-3.5 px-4 text-slate-900 dark:text-slate-100 font-bold">
                            ${inv.amount.toFixed(2)} {inv.currency}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant={getStatusVariant(inv.status)}>
                              {inv.status}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1.5 font-sans">
                            {inv.status === "DRAFT" && (
                              <Button
                                variant="primary"
                                size="xs"
                                loading={actionLoadingId === inv.id}
                                onClick={() => handleSendInvoice(inv.id)}
                                icon={<Send className="w-3 h-3" />}
                              >
                                Send
                              </Button>
                            )}

                            {(inv.status === "SENT" || inv.status === "OVERDUE") && (
                              <Button
                                variant="secondary"
                                size="xs"
                                loading={actionLoadingId === inv.id}
                                onClick={() => handleRemindInvoice(inv.id)}
                                icon={<Bell className="w-3 h-3 text-amber-500" />}
                              >
                                Remind
                              </Button>
                            )}

                            <a
                              href={api.getInvoicePdfUrl(inv.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-block align-middle transition-colors"
                              title="Download PDF"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </a>

                            {inv.payment_url && (
                              <a
                                href={inv.payment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-[#0070ba] dark:text-cyan-400 hover:bg-blue-50 dark:hover:bg-cyan-950/40 inline-block align-middle transition-colors"
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
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Reusable Create Invoice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Invoice"
        description="Drafts a structured invoice and syncs with PayPal Invoicing API v2."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateDraft} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Client Name"
              required
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              placeholder="e.g. Sarah Connor"
            />
            <Input
              label="Client Email"
              type="email"
              required
              value={custEmail}
              onChange={(e) => setCustEmail(e.target.value)}
              placeholder="e.g. sarah@cyberdyne.io"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
            </Select>

            <Select
              label="Payment Terms"
              value={dueDays}
              onChange={(e) => setDueDays(Number(e.target.value))}
            >
              <option value={7}>Net 7 (Due in 7 days)</option>
              <option value={14}>Net 14 (Due in 14 days)</option>
              <option value={30}>Net 30 (Due in 30 days)</option>
              <option value={0}>Due on Receipt</option>
            </Select>
          </div>

          {/* Line Items */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Line Items
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-[11px] text-[#0070ba] dark:text-cyan-400 hover:underline font-medium flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Item</span>
              </button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <input
                  type="text"
                  required
                  placeholder="Item description"
                  value={item.description}
                  onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                  className="w-16 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={item.unit_price}
                  onChange={(e) => handleItemChange(idx, "unit_price", Number(e.target.value))}
                  className="w-24 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Notes / Memo (Optional)
            </label>
            <textarea
              rows={2}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Thank you for your business. Terms and notes..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0070ba]"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">Total: </span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
                ${totalCalculated.toFixed(2)} {currency}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
              >
                Create PayPal Draft
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onRefreshDashboard={() => loadInvoices(activeTab)}
      />
    </div>
  );
}
