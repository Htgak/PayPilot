"use client";

import React, { useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { 
  CreditCard, 
  ExternalLink, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  Receipt,
  Sparkles,
  ShoppingBag
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ChatDrawer from "@/components/ChatDrawer";
import { api } from "@/lib/api";

export default function CheckoutPage() {
  const [amount, setAmount] = useState<number>(350.0);
  const [description, setDescription] = useState<string>("Brand Identity & Design Consultation");
  const [currency, setCurrency] = useState<string>("USD");
  const [order, setOrder] = useState<{ order_id: string; approval_url: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [capturedTx, setCapturedTx] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  const handleCreateOrder = async () => {
    setLoading(true);
    setCapturedTx(null);
    try {
      const res = await api.createOrder(amount, currency, undefined, description);
      setOrder({
        order_id: res.order_id,
        approval_url: res.approval_url
      });
    } catch (err: any) {
      alert("Error creating PayPal order: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCaptureOrder = async () => {
    if (!order) return;
    setLoading(true);
    try {
      const tx = await api.captureOrder(order.order_id, "Sarah Connor", "sarah@cyberdyne.io");
      setCapturedTx(tx);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      alert("Error capturing payment: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#080c14]">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar onOpenChatDrawer={() => setIsChatOpen(true)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
              <span>PayPal Sandbox Checkout Portal</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-950 text-cyan-400 border border-blue-800">
                Orders API v2
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Demonstrate customer payment experience, order creation, buyer approval, and backend capture.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl">
            {/* Payment Request Builder */}
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
                <ShoppingBag className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Create Payment Request</h3>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-medium">Service / Product Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5 font-medium">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5 font-medium">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              {/* Preset buttons */}
              <div>
                <span className="text-[11px] text-slate-500 block mb-1.5">Preset Packages:</span>
                <div className="flex space-x-2">
                  {[150, 350, 750, 1200].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                        amount === val
                          ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                          : "bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      ${val}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-glow-cyan flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                <span>Initialize PayPal Order (POST /v2/checkout/orders)</span>
              </button>
            </div>

            {/* Checkout Sandbox Preview & Capture */}
            <div className="glass-card p-6 rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="font-bold text-sm text-white">Buyer Payment Simulation</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    Step 2: Approval & Capture
                  </span>
                </div>

                {!order && (
                  <div className="py-16 text-center text-xs text-slate-500 space-y-2">
                    <CreditCard className="w-8 h-8 text-slate-600 mx-auto" />
                    <p>Initialize a PayPal order on the left to activate checkout controls.</p>
                  </div>
                )}

                {order && !capturedTx && (
                  <div className="space-y-4 pt-3">
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2 font-mono">
                      <div className="flex justify-between text-slate-400">
                        <span>PayPal Order ID:</span>
                        <span className="text-white font-semibold">{order.order_id}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Payment Amount:</span>
                        <span className="text-cyan-400 font-bold">${amount.toFixed(2)} {currency}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Order Status:</span>
                        <span className="text-amber-400 font-semibold">CREATED</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <a
                        href={order.approval_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 rounded-xl bg-[#0070ba] hover:bg-[#005ea6] text-white font-medium text-xs flex items-center justify-center space-x-2 transition-colors shadow-glow-blue"
                      >
                        <span>Open in PayPal Sandbox Approval Window</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={handleCaptureOrder}
                        disabled={loading}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>Simulate Buyer Approval & Capture (Orders API)</span>
                      </button>
                    </div>
                  </div>
                )}

                {capturedTx && (
                  <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-xs space-y-2 pt-4">
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Payment Successfully Captured!</span>
                    </div>
                    <p className="text-slate-300">
                      The transaction has been captured via PayPal Orders API and logged in PayPilot's double-entry database.
                    </p>
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-400 space-y-1">
                      <div>Capture ID: {capturedTx.paypal_capture_id}</div>
                      <div>Settled Amount: ${capturedTx.amount.toFixed(2)} {capturedTx.currency}</div>
                      <div>Status: {capturedTx.status}</div>
                    </div>

                    <Link
                      href="/dashboard"
                      className="inline-flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 font-semibold pt-1"
                    >
                      <span>View Updated Revenue on Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-500 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Orders v2 API endpoints ensure verified capture before updating merchant balances.</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}
