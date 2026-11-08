"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings, 
  ShieldCheck, 
  Key, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Save, 
  ExternalLink,
  Bot,
  Radio
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ChatDrawer from "@/components/ChatDrawer";
import { api, SystemSettings } from "@/lib/api";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [webhookLog, setWebhookLog] = useState<string | null>(null);

  // Form Fields
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [webhookId, setWebhookId] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [currency, setCurrency] = useState("USD");

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await api.getSettings();
      setSettings(data);
      if (data.profile) {
        setBusinessName(data.profile.business_name || "");
        setCurrency(data.profile.currency || "USD");
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateSettings({
        paypal_client_id: clientId || undefined,
        paypal_client_secret: clientSecret || undefined,
        paypal_webhook_id: webhookId || undefined,
        gemini_api_key: geminiKey || undefined,
        business_name: businessName || undefined,
        currency: currency || undefined,
      });
      setSettings(updated);
      alert("Settings updated successfully!");
    } catch (err: any) {
      alert("Error saving settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSimulateWebhook = async (type: string) => {
    try {
      const res = await api.triggerTestWebhook(type, {
        id: `CAP-WH-${Date.now()}`,
        amount: { value: "650.00", currency_code: "USD" },
        supplementary_data: { related_ids: { order_id: `ORD-WH-${Date.now()}` } }
      });
      setWebhookLog(`Webhook event ${type} delivered successfully! Status: ${res.status}`);
    } catch (err: any) {
      setWebhookLog(`Webhook delivery error: ${err.message}`);
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
              <span>Settings & Integrations</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                Configuration
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Configure PayPal Developer Sandbox credentials, Gemini Flash API keys, and run test webhooks.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl">
            {/* Left 2 Cols: Form */}
            <div className="lg:col-span-2 glass-card p-6 rounded-2xl space-y-6">
              <form onSubmit={handleSave} className="space-y-6 text-xs">
                {/* PayPal Sandbox Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      <span>PayPal Sandbox Developer Credentials</span>
                    </h3>
                    <a
                      href="https://developer.paypal.com/dashboard/applications/sandbox"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                    >
                      <span>PayPal Developer Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Sandbox Client ID</label>
                    <input
                      type="text"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder={settings?.paypal_client_id_masked || "Paste your PayPal Sandbox Client ID"}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Sandbox Client Secret</label>
                    <input
                      type="password"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      placeholder="Paste your PayPal Sandbox Secret"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Webhook ID (Optional)</label>
                    <input
                      type="text"
                      value={webhookId}
                      onChange={(e) => setWebhookId(e.target.value)}
                      placeholder="e.g. 4JH392819827..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Gemini AI Section */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <Bot className="w-4 h-4 text-cyan-400" />
                      <span>Google Gemini AI Engine</span>
                    </h3>
                    <span className="text-[10px] font-mono text-cyan-400">
                      Model: {settings?.ai_model || "gemini-1.5-flash"}
                    </span>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Gemini API Key</label>
                    <input
                      type="password"
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="Paste your GEMINI_API_KEY (optional, fallback heuristic agent active)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Merchant Profile */}
                <div className="space-y-3 pt-2">
                  <div className="pb-2 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-white">Merchant Business Profile</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Business Name</label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Default Currency</label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="INR">INR (₹)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold shadow-glow-cyan flex items-center space-x-2 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving..." : "Save Settings"}</span>
                </button>
              </form>
            </div>

            {/* Right Column: Connection Status & Webhook Simulator */}
            <div className="space-y-6">
              {/* Connection Status Card */}
              <div className="glass-card p-5 rounded-2xl space-y-3 text-xs">
                <h3 className="font-bold text-white text-sm">System Diagnostics</h3>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">PayPal REST API:</span>
                    <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{settings?.paypal_connected ? "Live Sandbox" : "Simulation Mode"}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">AI Reasoning:</span>
                    <span className="text-cyan-400 font-semibold">
                      {settings?.has_gemini ? "Gemini Flash API" : "Heuristic FinOps"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Database:</span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      {settings?.database_url.includes("sqlite") ? "SQLite (Zero-Config)" : "Supabase PostgreSQL"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Webhook Simulator Card */}
              <div className="glass-card p-5 rounded-2xl space-y-3 text-xs">
                <div className="flex items-center space-x-2">
                  <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <h3 className="font-bold text-white text-sm">PayPal Webhook Simulator</h3>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Test the real-time event pipeline (`POST /api/webhooks/paypal`) by dispatching synthetic payment events.
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => handleSimulateWebhook("PAYMENT.CAPTURE.COMPLETED")}
                    className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-left font-mono text-[11px] border border-slate-700 flex items-center justify-between"
                  >
                    <span>PAYMENT.CAPTURE.COMPLETED</span>
                    <Send className="w-3 h-3 text-cyan-400" />
                  </button>

                  <button
                    onClick={() => handleSimulateWebhook("INVOICING.INVOICE.PAID")}
                    className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-left font-mono text-[11px] border border-slate-700 flex items-center justify-between"
                  >
                    <span>INVOICING.INVOICE.PAID</span>
                    <Send className="w-3 h-3 text-emerald-400" />
                  </button>
                </div>

                {webhookLog && (
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[10px] text-cyan-400">
                    {webhookLog}
                  </div>
                )}
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
