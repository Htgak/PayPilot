"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  Send, 
  Sparkles, 
  Loader2, 
  ShieldCheck
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ApprovalCard from "@/components/ApprovalCard";
import Button from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { api, ChatMessage, ApprovalAction } from "@/lib/api";

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Welcome to the PayPilot AI Workspace. I am your specialized financial operations copilot.\n\nI can execute real PayPal sandbox workflows including drafting invoices, checking settled revenue, tracking past-due accounts, and preparing payment reminders.\n\nNotice that any financial action is presented as a structured proposal card requiring your confirmation before hitting the PayPal API.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalAction[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    "Create an invoice for $750 for Brand Identity to Sarah Connor at sarah@cyberdyne.io",
    "Show my revenue this month",
    "Which invoices are overdue? Prepare a reminder.",
    "Summarize my recent transactions"
  ];

  const loadApprovals = async () => {
    try {
      const data = await api.getApprovals("PENDING");
      setPendingApprovals(data);
    } catch (err) {
      console.error("Error loading approvals:", err);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setLoading(true);

    try {
      const res = await api.chatWithAgent(text);
      const botMsg: ChatMessage = {
        role: "assistant",
        content: res.response,
        action_proposals: res.action_proposals,
        tool_calls: res.tool_calls,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
      loadApprovals();
    } catch (err: any) {
      console.error("Error in chat:", err);
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: "Error communicating with AI engine. Please ensure the backend server is running.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#090d16] transition-colors">
      <Sidebar pendingCount={pendingApprovals.length} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar pendingApprovalsCount={pendingApprovals.length} />

        <div className="flex-1 flex overflow-hidden">
          {/* Main Chat Stream */}
          <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#090d16] transition-colors">
            
            {/* Header info */}
            <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#0b121e]/80 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0070ba] dark:text-cyan-400 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-slate-900 dark:text-white">AI Financial Operations Copilot</h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Natural-Language Tool Calling & Action Approval Engine</p>
                </div>
              </div>

              <Badge variant="info" dot={false}>
                IDEMPOTENT & AUDITED
              </Badge>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={index}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-start space-x-3 max-w-[85%]">
                      {!isUser && (
                        <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0070ba] dark:text-cyan-400 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                          isUser
                            ? "bg-[#0070ba] text-white rounded-tr-none shadow-sm"
                            : "bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 rounded-tl-none whitespace-pre-wrap shadow-sm"
                        }`}
                      >
                        {msg.content}

                        {/* Render Interactive Action Proposals */}
                        {msg.action_proposals && msg.action_proposals.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {msg.action_proposals.map((prop, pIdx) => (
                              <ApprovalCard
                                key={prop.approval_id || pIdx}
                                proposal={prop}
                                onExecuted={() => loadApprovals()}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {msg.timestamp && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                        {msg.timestamp}
                      </span>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center space-x-2 text-xs text-[#0070ba] dark:text-cyan-400 bg-blue-50 dark:bg-blue-950/40 p-3 rounded-2xl border border-blue-200 dark:border-blue-800/40 w-fit">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI Copilot is interpreting request and preparing tools...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompt Chips */}
            <div className="px-6 py-2 border-t border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-[#070b12]/60">
              <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">Suggested:</span>
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(prompt)}
                    disabled={loading}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 transition-colors whitespace-nowrap"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0b121e]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center space-x-2.5"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask PayPilot to create an invoice, check revenue, prepare a reminder..."
                  disabled={loading}
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0070ba] dark:focus:border-cyan-500"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={loading || !inputValue.trim()}
                  icon={<Send className="w-4 h-4" />}
                >
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </form>
            </div>
          </div>

          {/* Right Rail: Pending Action Queue */}
          <div className="w-80 border-l border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#090e18] p-4 hidden xl:flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                  Pending Actions
                </h3>
                <Badge variant={pendingApprovals.length > 0 ? "pending" : "neutral"} dot={false}>
                  {pendingApprovals.length} Pending
                </Badge>
              </div>

              {pendingApprovals.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 space-y-1">
                  <ShieldCheck className="w-6 h-6 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-slate-800 dark:text-slate-300">Action Queue Clear</p>
                  <p className="text-[11px]">No financial executions awaiting confirmation.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingApprovals.map((app) => (
                    <div
                      key={app.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0f1626] border border-slate-200 dark:border-slate-800 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {app.action_type}
                        </span>
                        <Badge variant="pending">WAITING</Badge>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                        Amount: ${app.payload.amount ? Number(app.payload.amount).toFixed(2) : "0.00"} {app.payload.currency || "USD"}
                      </p>
                      <Button
                        variant="primary"
                        size="xs"
                        className="w-full"
                        onClick={async () => {
                          await api.confirmApproval(app.id);
                          loadApprovals();
                        }}
                      >
                        Authorize & Execute
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Architecture Highlights */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-2">
              <span className="font-semibold text-slate-800 dark:text-slate-300 block">Safety Architecture</span>
              <p>
                1. <b>Zero autonomous transfers:</b> AI cannot unilaterally disburse funds or commit financial operations without user sign-off.
              </p>
              <p>
                2. <b>Verified PayPal APIs:</b> All actions use Invoicing v2 and Orders v2 with immutable audit logging.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
