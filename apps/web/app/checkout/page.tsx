"use client";

import React, { useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { 
  CreditCard, 
  ExternalLink, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  ShoppingBag
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ChatDrawer from "@/components/ChatDrawer";
import Button from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import { api, Transaction } from "@/lib/api";

export default function CheckoutPage() {
  const [amount, setAmount] = useState<number>(350.0);
  const [description, setDescription] = useState<string>("Brand Identity & Design Consultation");
  const [currency, setCurrency] = useState<string>("USD");
  const [order, setOrder] = useState<{ order_id: string; approval_url: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [capturedTx, setCapturedTx] = useState<Transaction | null>(null);
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
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#090d16] transition-colors">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar onOpenChatDrawer={() => setIsChatOpen(true)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
              <span>PayPal Checkout Portal</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Demonstrate customer payment experience, order creation, buyer approval, and backend capture.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
            {/* Payment Request Builder */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0070ba] dark:text-cyan-400 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-sm">Create Payment Request</CardTitle>
                </div>
                <CardDescription>
                  Configure payment parameters and initialize a PayPal checkout order
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <Input
                  label="Service / Product Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                  />
                  <Select
                    label="Currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </Select>
                </div>

                {/* Preset Chips */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Quick Amount Presets:</span>
                  <div className="flex space-x-2">
                    {[150, 350, 750, 1200].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmount(val)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                          amount === val
                            ? "bg-[#0070ba] text-white shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        ${val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    loading={loading}
                    onClick={handleCreateOrder}
                    icon={<CreditCard className="w-4 h-4" />}
                  >
                    Initialize PayPal Order
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Checkout Sandbox Preview & Capture */}
            <Card className="flex flex-col justify-between">
              <div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Buyer Checkout & Settlement</CardTitle>
                    <Badge variant={order ? "pending" : "neutral"} dot={false}>
                      {order ? "Order Active" : "Step 2"}
                    </Badge>
                  </div>
                  <CardDescription>
                    Execute buyer approval and capture payment into the double-entry ledger
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {!order && (
                    <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
                      <CreditCard className="w-8 h-8 mx-auto opacity-50" />
                      <p>Initialize an order on the left to activate checkout controls.</p>
                    </div>
                  )}

                  {order && !capturedTx && (
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2 font-mono">
                        <div className="flex justify-between text-slate-500">
                          <span>PayPal Order ID:</span>
                          <span className="text-slate-900 dark:text-slate-100 font-semibold">{order.order_id}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Amount:</span>
                          <span className="text-[#0070ba] dark:text-cyan-400 font-bold">${amount.toFixed(2)} {currency}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Status:</span>
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">CREATED</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <a
                          href={order.approval_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 rounded-xl bg-[#0070ba] hover:bg-[#005ea6] text-white font-medium text-xs flex items-center justify-center space-x-2 transition-colors shadow-sm"
                        >
                          <span>Open in PayPal Sandbox Approval Window</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        <Button
                          variant="success"
                          size="md"
                          className="w-full"
                          loading={loading}
                          onClick={handleCaptureOrder}
                          icon={<CheckCircle2 className="w-4 h-4" />}
                        >
                          Simulate Buyer Approval & Capture
                        </Button>
                      </div>
                    </div>
                  )}

                  {capturedTx && (
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2.5">
                      <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Payment Successfully Captured!</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">
                        The transaction has been captured via PayPal Orders API and logged in PayPilot's double-entry database.
                      </p>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-emerald-700 dark:text-emerald-400 space-y-1">
                        <div>Capture ID: {capturedTx.paypal_capture_id}</div>
                        <div>Settled Amount: ${capturedTx.amount.toFixed(2)} {capturedTx.currency}</div>
                        <div>Status: {capturedTx.status}</div>
                      </div>

                      <Link
                        href="/dashboard"
                        className="inline-flex items-center space-x-1 text-[#0070ba] dark:text-cyan-400 hover:underline font-semibold text-xs pt-1"
                      >
                        <span>View Updated Revenue on Dashboard</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </CardContent>
              </div>

              <div className="p-4 pt-0">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-[#0070ba] dark:text-cyan-400 shrink-0" />
                  <span>Orders v2 API endpoints ensure verified capture before updating merchant balances.</span>
                </div>
              </div>
            </Card>
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
