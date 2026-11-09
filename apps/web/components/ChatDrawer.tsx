"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  Loader2, 
  ShieldCheck,
} from "lucide-react";
import { api, ChatMessage } from "@/lib/api";
import ApprovalCard from "./ApprovalCard";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshDashboard?: () => void;
}

export default function ChatDrawer({ isOpen, onClose, onRefreshDashboard }: ChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hello! I am PayPilot, your AI financial operations copilot.\n\nAsk me to create invoices, check your current revenue, track overdue accounts, or dispatch PayPal payment reminders.\n\nClick a suggested instruction below to try an approval workflow!",
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
        content: "Sorry, I encountered an issue communicating with the backend. Please ensure the backend is running.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-lg bg-white dark:bg-[#090e18] border-l border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-[#0b121e]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0070ba] dark:text-cyan-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-1.5">
                <span>PayPilot Copilot</span>
                <Badge variant="info" dot={false}>SANDBOX</Badge>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Approval-Gated Financial Agent</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
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
                    <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950 text-[#0070ba] dark:text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? "bg-[#0070ba] text-white rounded-tr-none shadow-sm"
                        : "bg-slate-100 dark:bg-[#0f1626] border border-slate-200 dark:border-[#1e2c47] text-slate-800 dark:text-slate-200 rounded-tl-none whitespace-pre-wrap"
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
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                    {msg.timestamp}
                  </span>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-[#0070ba] dark:text-cyan-400 bg-blue-50 dark:bg-cyan-950/30 p-2.5 rounded-xl border border-blue-200 dark:border-cyan-800/40 w-fit">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing instruction and preparing financial tools...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="px-4 py-2 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-[#070b12]">
          <p className="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500 mb-1.5 flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-[#0070ba] dark:text-cyan-400" />
            <span>Suggested Workflows</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                disabled={loading}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition-colors text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0b121e]">
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
              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0070ba] dark:focus:border-cyan-500"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={loading || !inputValue.trim()}
              icon={<Send className="w-3.5 h-3.5" />}
            >
              Send
            </Button>
          </form>
          <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-400 mt-2">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Financial actions are prepared as proposals and require your approval</span>
          </div>
        </div>
      </div>
    </div>
  );
}
