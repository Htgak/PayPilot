"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  Send, 
  Sparkles, 
  Loader2
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ApprovalCard from "@/components/ApprovalCard";
import AIAssistantWelcome from "@/components/ui/AIAssistantWelcome";
import Button from "@/components/ui/Button";
import { api, ChatMessage, ApprovalAction } from "@/lib/api";

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi Alex,\nWelcome back! How can I help?\n\nI can help with invoices, payments, and your revenue.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalAction[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    "Create an invoice",
    "Check my revenue",
    "Find overdue invoices",
    "Recent transactions"
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
    <div className="flex h-screen overflow-hidden bg-[#f7f7f9] dark:bg-[#090d16] transition-colors">
      <Sidebar pendingCount={pendingApprovals.length} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar pendingApprovalsCount={pendingApprovals.length} />

        <div className="flex-1 flex overflow-hidden">
          {/* Main Chat Stream */}
          <div className="flex w-full flex-1 flex-col h-full bg-[#fcfcfd] dark:bg-[#090d16] transition-colors">
            
            {/* Header info */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0b121e] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0070ba] dark:text-cyan-400 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm text-slate-900 dark:text-white">PayPilot AI</h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Your finance assistant</p>
                </div>
              </div>

              <span className="flex items-center gap-1.5 text-[11px] text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Ready</span>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-5">
              {messages.length === 1 ? <AIAssistantWelcome onPrompt={handleSendMessage} /> : messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={index}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div className={`flex items-start space-x-3 max-w-[min(720px,90%)] ${isUser ? "flex-row-reverse" : ""}`}>
                      {!isUser && (
                        <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0070ba] dark:text-cyan-400 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                          isUser
                            ? "bg-[#5146c7] text-white rounded-tr-none shadow-sm"
                            : "bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 rounded-tl-none whitespace-pre-wrap shadow-sm"
                        } ${!isUser && index === 0 ? "max-w-xl" : ""}`}
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
            <div className={`${messages.length === 1 ? "hidden" : ""} px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#070b12]`}>
              <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 pb-1">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(prompt === "Create an invoice" ? "Create an invoice" : prompt === "Check my revenue" ? "Show my revenue this month" : prompt === "Find overdue invoices" ? "Which invoices are overdue? Prepare a reminder." : "Summarize my recent transactions")}
                    disabled={loading}
                    className="text-xs px-3 py-1.5 rounded-full bg-white hover:bg-[#f1efff] dark:bg-slate-900 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 transition-colors whitespace-nowrap"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0b121e]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="mx-auto flex max-w-4xl items-center space-x-2.5 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask me anything..."
                  disabled={loading}
                  className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
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

        </div>
      </div>
    </div>
  );
}
