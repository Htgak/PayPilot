"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, Zap } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isFirstSetup, setIsFirstSetup] = useState(false);
  const [ready, setReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { api.getAuthStatus().then((status) => setIsFirstSetup(!status.account_exists)).catch(() => setError("Can't reach PayPilot right now. Check that the API is running.")).finally(() => setReady(true)); }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const session = isFirstSetup ? await api.signup(email, password) : await api.login(email, password);
      signIn(session.access_token, session.email);
    } catch (err) {
      setError(err instanceof Error ? err.message.replace(/^API error \(\d+\): /, "").replace(/["{}]/g, "") : "Unable to sign in. Please try again.");
    } finally { setBusy(false); }
  };

  return <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f6f7fb] px-4 py-10 dark:bg-[#111827]">
    <div className="absolute right-6 top-6"><ThemeToggle /></div>
    <div className="w-full max-w-[420px]">
      <div className="mb-7 flex items-center justify-center gap-2.5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5146c7] text-white"><Zap className="h-5 w-5 fill-current" /></span><span className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">PayPilot</span></div>
      <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_18px_50px_-30px_rgba(15,23,42,.28)] dark:border-slate-700 dark:bg-[#182233] sm:p-8">
        <div className="mb-6"><h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{isFirstSetup ? "Set up your workspace" : "Welcome back"}</h1><p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{isFirstSetup ? "Create the owner sign-in for your PayPilot workspace." : "Sign in to manage your payments and invoices."}</p></div>
        {!ready ? <p className="py-8 text-center text-sm text-slate-400">Checking workspace…</p> : <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">Email address</span><span className="relative block"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-[#5146c7] focus:ring-2 focus:ring-[#5146c7]/15 dark:border-slate-600 dark:bg-[#111827] dark:text-white" /></span></label>
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">Password</span><span className="relative block"><LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type={showPassword ? "text" : "password"} autoComplete={isFirstSetup ? "new-password" : "current-password"} required minLength={10} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isFirstSetup ? "At least 10 characters" : "Enter your password"} className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-11 text-sm text-slate-900 outline-none transition focus:border-[#5146c7] focus:ring-2 focus:ring-[#5146c7]/15 dark:border-slate-600 dark:bg-[#111827] dark:text-white" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span>{isFirstSetup && <span className="mt-1.5 block text-[11px] text-slate-400">Use at least 10 characters. This creates the first workspace owner account.</span>}</label>
          {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
          <button type="submit" disabled={busy || !ready} className="flex h-11 w-full items-center justify-center rounded-lg bg-[#5146c7] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4338ad] disabled:cursor-not-allowed disabled:opacity-60">{busy ? "Please wait…" : isFirstSetup ? "Create workspace account" : "Sign in"}</button>
        </form>}
        <p className="mt-5 text-center text-[11px] text-slate-400">Your account protects access to this PayPilot workspace.</p>
      </section>
    </div>
  </main>;
}
