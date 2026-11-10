"use client";

import React, { useEffect, useState } from "react";
import { Save, UserRound } from "lucide-react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getSettings()
      .then((data) => {
        setBusinessName(data.profile?.business_name || "");
        setCurrency(data.profile?.currency || "USD");
      })
      .catch((err) => {
        console.error(err);
        setError("Could not load current settings. Check backend connection.");
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await api.updateSettings({
        business_name: businessName || undefined,
        currency: currency || undefined
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
      setError("Failed to save changes. Please check API server connection.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f7f9] dark:bg-[#0B0F19]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-5 lg:p-8">
          <div className="w-full">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Profile settings
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Manage the profile details shown on your invoices and account.
              </p>
            </div>
            <Card className="max-w-5xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eeeafe] text-[#5146c7]">
                    <UserRound className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">Business profile</CardTitle>
                    <p className="mt-1 text-xs text-slate-500">
                      These details are used for your merchant identity.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Business name"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="PixelCraft Studio"
                    />
                    <Select
                      label="Default currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                    </Select>
                  </div>
                  <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                    {error && (
                      <span role="alert" className="text-xs text-rose-500">
                        {error}
                      </span>
                    )}
                    {saved && (
                      <span role="status" className="text-xs text-emerald-600">
                        Changes saved
                      </span>
                    )}
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      loading={saving}
                      icon={<Save className="h-4 w-4" />}
                    >
                      {saving ? "Saving..." : "Save changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
