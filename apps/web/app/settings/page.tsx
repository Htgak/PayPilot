"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Save, 
  ExternalLink,
  Bot,
  Radio,
  CheckCircle2,
  RefreshCw,
  Send
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ChatDrawer from "@/components/ChatDrawer";
import Button from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
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
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#090d16] transition-colors">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar onOpenChatDrawer={() => setIsChatOpen(true)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
              <span>Settings & Integrations</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure PayPal Developer Sandbox credentials, Gemini Flash API keys, and run test webhooks.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl">
            {/* Main Form (2 columns) */}
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleSave} className="space-y-6">
                {/* PayPal Sandbox Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0070ba] dark:text-cyan-400 flex items-center justify-center">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <CardTitle className="text-sm">PayPal Sandbox Credentials</CardTitle>
                      </div>
                      <a
                        href="https://developer.paypal.com/dashboard/applications/sandbox"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#0070ba] dark:text-cyan-400 hover:underline flex items-center space-x-1"
                      >
                        <span>Developer Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <CardDescription>
                      Required for live PayPal REST Invoicing v2 and Orders v2 operations
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3.5">
                    <Input
                      label="Sandbox Client ID"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder={settings?.paypal_client_id_masked || "Paste your PayPal Sandbox Client ID"}
                      className="font-mono"
                    />

                    <Input
                      label="Sandbox Client Secret"
                      type="password"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      placeholder="Paste your PayPal Sandbox Secret"
                      className="font-mono"
                    />

                    <Input
                      label="Webhook ID (Optional)"
                      value={webhookId}
                      onChange={(e) => setWebhookId(e.target.value)}
                      placeholder="e.g. 4JH392819827..."
                      className="font-mono"
                    />
                  </CardContent>
                </Card>

                {/* AI Configuration Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0070ba] dark:text-cyan-400 flex items-center justify-center">
                          <Bot className="w-4 h-4" />
                        </div>
                        <CardTitle className="text-sm">Google Gemini AI Engine</CardTitle>
                      </div>
                      <Badge variant="info" dot={false}>
                        Model: {settings?.ai_model || "gemini-1.5-flash"}
                      </Badge>
                    </div>
                    <CardDescription>
                      Powers natural-language understanding and tool selection
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <Input
                      label="Gemini API Key"
                      type="password"
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="Paste your GEMINI_API_KEY (optional, fallback engine active)"
                      className="font-mono"
                      helperText="If unset, PayPilot automatically uses its built-in rule-based intent parser."
                    />
                  </CardContent>
                </Card>

                {/* Merchant Business Profile */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Merchant Business Profile</CardTitle>
                    <CardDescription>
                      Appears on generated invoice drafts and branded PDFs
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Business Name"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                      />
                      <Select
                        label="Default Currency"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="INR">INR (₹)</option>
                      </Select>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        loading={saving}
                        icon={<Save className="w-4 h-4" />}
                      >
                        {saving ? "Saving Changes..." : "Save Settings"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </form>
            </div>

            {/* Right Column: Diagnostics & Webhook Simulator */}
            <div className="space-y-6">
              {/* System Diagnostics Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">System Diagnostics</CardTitle>
                  <CardDescription>Active runtime environment and connection status</CardDescription>
                </CardHeader>

                <CardContent className="space-y-2.5 text-xs font-mono">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 font-sans">PayPal REST:</span>
                    <Badge variant={settings?.paypal_connected ? "paid" : "neutral"} dot={true}>
                      {settings?.paypal_connected ? "Live Sandbox" : "Simulation Fallback"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 font-sans">AI Reasoning:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {settings?.has_gemini ? "Gemini Flash" : "Heuristic NLP"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 font-sans">Database:</span>
                    <span className="text-slate-700 dark:text-slate-300 text-[11px]">
                      {settings?.database_url.includes("sqlite") ? "SQLite (Local)" : "Supabase PostgreSQL"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Webhook Simulator Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Radio className="w-4 h-4 text-[#0070ba] dark:text-cyan-400" />
                    <CardTitle className="text-sm">Webhook Diagnostics</CardTitle>
                  </div>
                  <CardDescription>
                    Test real-time event pipeline (`POST /api/webhooks/paypal`) with synthetic events
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between"
                    onClick={() => handleSimulateWebhook("PAYMENT.CAPTURE.COMPLETED")}
                  >
                    <span className="font-mono text-[11px]">PAYMENT.CAPTURE.COMPLETED</span>
                    <Send className="w-3 h-3 text-[#0070ba] dark:text-cyan-400" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between"
                    onClick={() => handleSimulateWebhook("INVOICING.INVOICE.PAID")}
                  >
                    <span className="font-mono text-[11px]">INVOICING.INVOICE.PAID</span>
                    <Send className="w-3 h-3 text-emerald-500" />
                  </Button>

                  {webhookLog && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[10px] text-slate-700 dark:text-cyan-300">
                      {webhookLog}
                    </div>
                  )}
                </CardContent>
              </Card>
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
