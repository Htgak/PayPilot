"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  Receipt,
  HelpCircle
} from "lucide-react";
import { api, ChatMessage, ActionProposal } from "@/lib/api";
import ApprovalCard from "./ApprovalCard";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshDashboard?: () => void;
}

export default function ChatDrawer({ isOpen, onClose, onRefreshDashboard }: ChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hello! I am PayPilot, your AI financial operations copilot. You can ask me to draft invoices, check your current revenue, track overdue accounts, or dispatch PayPal payment reminders.\n\nTry clicking one of the suggested requests below to see the approval-based workflow in action!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    "Create an invoice for $750 for Brand Identity to Sarah Connor at sarah@cyberdyne.io",
    "Show my revenue this month",
    "Which invoices are overdue? Prepare a reminder.",
    "Show my recent transactions"
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

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
    } catch (err: any) {
      console.error("Agent chat error:", err);
      const errMsg: ChatMessage = {
        role: "assistant",
        content: "Sorry, I encountered an issue processing your financial instruction. Please ensure the backend is running.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-lg bg-[#090e18] border-l border-[#1e2c47] flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#1e2c47] flex items-center justify-between bg-[#0b121e]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0070ba] to-[#00cfde] flex items-center justify-center text-white shadow-glow-cyan">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center space-x-1.5">
                <span>PayPilot Copilot</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 font-mono border border-cyan-800">
                  SANDBOX
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Approval-Gated Financial Agent</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={index}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                <div className="flex items-start space-x-2 max-w-[90%]">
                  {!isUser && (
                    <div className="w-6 h-6 rounded-md bg-cyan-950 border border-cyan-700/50 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-tr-none"
                        : "bg-[#0f1626] border border-[#1e2c47] text-slate-200 rounded-tl-none whitespace-pre-wrap"
                    }`}
                  >
                    {msg.content}

                    {/* Render Interactive Action Proposals */}
                    {msg.action_proposals && msg.action_proposals.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msg.action_proposals.map((prop, pIdx) => (
                          <ApprovalCard
                            key={prop.approval_id || pIdx}
                            proposal={prop}
                            onExecuted={() => {
                              if (onRefreshDashboard) onRefreshDashboard();
                            }}
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
            <div className="flex items-center space-x-2 text-xs text-cyan-400 bg-cyan-950/30 p-2.5 rounded-xl border border-cyan-800/40 w-fit">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing financial instruction and preparing tools...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Preset Prompt Suggestions */}
        <div className="px-4 py-2 border-t border-[#1e2c47]/50 bg-[#070b12]">
          <p className="text-[10px] font-semibold uppercase text-slate-500 mb-1.5 flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Suggested Workflows</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                disabled={loading}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-cyan-500/40 transition-colors text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-[#1e2c47] bg-[#0b121e]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="e.g. Create an invoice for $500 for web design to client@acme.com"
              disabled={loading}
              className="flex-1 bg-slate-900/90 border border-[#1e2c47] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-glow-cyan disabled:opacity-40 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-500 mt-2">
            <ShieldCheck className="w-3 h-3 text-cyan-400" />
            <span>Financial actions are prepared as proposals and require your explicit approval</span>
          </div>
        </div>
      </div>
    </div>
  );
}
