"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  Loader2, 
  ShieldCheck, 
  Receipt, 
  CheckCircle2, 
  AlertTriangle,
  History,
  Trash2,
  HelpCircle,
  Clock,
  ExternalLink
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ApprovalCard from "@/components/ApprovalCard";
import { api, ChatMessage, ActionProposal, ApprovalAction } from "@/lib/api";

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Welcome to the PayPilot AI Workspace. I am your specialized financial operations copilot.\n\nI can execute real PayPal sandbox workflows including creating draft invoices, dispatching reminder notifications, creating checkout payment orders, and providing calculated financial analytics.\n\nNotice that any write operation generates a verifiable approval card requiring your sign-off before hitting PayPal.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalAction[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    "Create an invoice for $950 for Website Development to client@acme.corp",
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
        content: "Error communicating with AI engine. Please ensure the backend is active.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#080c14]">
      <Sidebar pendingCount={pendingApprovals.length} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar pendingApprovalsCount={pendingApprovals.length} />

        <div className="flex-1 flex overflow-hidden">
          {/* Main Chat Stream (Left/Center) */}
          <div className="flex-1 flex flex-col h-full bg-[#080c14]">
            
            {/* Header info */}
            <div className="p-4 border-b border-[#1e2c47] bg-[#0b121e]/80 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0070ba] to-[#00cfde] flex items-center justify-center text-white shadow-glow-cyan">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-white">AI Financial Operations Copilot</h2>
                  <p className="text-[11px] text-slate-400">Natural-Language Tool Calling & Action Approval Engine</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 font-mono text-[10px]">
                  IDEMPOTENT & AUDITED
                </span>
              </div>
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
                        <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-700/50 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                          isUser
                            ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-tr-none shadow-glow-cyan"
                            : "bg-[#0f1626] border border-[#1e2c47] text-slate-200 rounded-tl-none whitespace-pre-wrap"
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
                      <span className="text-[10px] text-slate-500 mt-1 px-1">
                        {msg.timestamp}
                      </span>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center space-x-2.5 text-xs text-cyan-400 bg-cyan-950/30 p-3 rounded-2xl border border-cyan-800/40 w-fit">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI Copilot is interpreting intent and selecting PayPal tools...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompt Chips */}
            <div className="px-6 py-2 border-t border-[#1e2c47]/50 bg-[#070b12]">
              <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Suggested:</span>
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(prompt)}
                    disabled={loading}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-cyan-500/40 transition-colors whitespace-nowrap"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-[#1e2c47] bg-[#0b121e]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center space-x-3"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask PayPilot to create an invoice, check revenue, chase overdue payments..."
                  disabled={loading}
                  className="flex-1 bg-slate-900/90 border border-[#1e2c47] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
                <button
                  type="submit"
                  disabled={loading || !inputValue.trim()}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium text-xs sm:text-sm shadow-glow-cyan disabled:opacity-40 transition-all flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Rail: Pending Approval Queue & Safety Inspector */}
          <div className="w-80 border-l border-[#1e2c47] bg-[#090e18] p-4 hidden xl:flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Pending Action Queue
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  {pendingApprovals.length} Pending
                </span>
              </div>

              {pendingApprovals.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500 space-y-1">
                  <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-slate-300">Queue is Clear</p>
                  <p className="text-[11px]">No financial executions awaiting confirmation.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingApprovals.map((app) => (
                    <div
                      key={app.id}
                      className="p-3.5 rounded-xl bg-[#0f1626] border border-cyan-500/30 text-xs space-y-2 shadow-glow-cyan"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">
                          {app.action_type}
                        </span>
                        <span className="text-[10px] text-amber-400 font-mono">
                          WAITING
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Amount: ${app.payload.amount ? Number(app.payload.amount).toFixed(2) : "0.00"} {app.payload.currency || "USD"}
                      </p>
                      <button
                        onClick={async () => {
                          await api.confirmApproval(app.id);
                          loadApprovals();
                        }}
                        className="w-full py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-[11px] transition-colors"
                      >
                        Authorize & Execute
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Architecture Highlights */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-2">
              <span className="font-semibold text-slate-300 block">Agent Safety Framework</span>
              <p>
                1. <b>Zero autonomous transfers:</b> AI cannot unilaterally disburse funds or commit financial operations without user sign-off.
              </p>
              <p>
                2. <b>Verified PayPal APIs:</b> All actions use Invoicing v2 and Orders v2 with immutable double-entry audit logging.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
