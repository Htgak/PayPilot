"use client";

import React, { useState } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  ArrowRight, 
  Receipt, 
  Send, 
  Bell, 
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { api, ActionProposal } from "@/lib/api";

interface ApprovalCardProps {
  proposal: ActionProposal;
  onExecuted?: (result: any) => void;
  onRejected?: () => void;
}

export default function ApprovalCard({ proposal, onExecuted, onRejected }: ApprovalCardProps) {
  const [status, setStatus] = useState<string>(proposal.status || "PENDING");
  const [loading, setLoading] = useState<boolean>(false);
  const [execResult, setExecResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleApprove = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.confirmApproval(proposal.approval_id);
      setStatus("EXECUTED");
      setExecResult(res.execution_result);
      if (onExecuted) onExecuted(res.execution_result);
    } catch (err: any) {
      console.error("Execution error:", err);
      setErrorMsg(err.message || "Failed to execute approved action");
      setStatus("FAILED");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await api.rejectApproval(proposal.approval_id, "Declined by merchant");
      setStatus("REJECTED");
      if (onRejected) onRejected();
    } catch (err: any) {
      console.error("Reject error:", err);
    } finally {
      setLoading(false);
    }
  };

  const isExecuted = status === "EXECUTED";
  const isRejected = status === "REJECTED";
  const isPending = status === "PENDING";

  return (
    <div className={`my-3 p-4 rounded-xl border transition-all ${
      isExecuted
        ? "bg-emerald-950/20 border-emerald-800/40"
        : isRejected
        ? "bg-rose-950/20 border-rose-800/40 opacity-75"
        : "bg-[#0d1527] border-cyan-500/40 shadow-glow-cyan"
    }`}>
      {/* Top Tag & Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {proposal.action_type === "CREATE_INVOICE" && (
            <span className="p-1.5 rounded-lg bg-blue-500/20 text-cyan-400">
              <Receipt className="w-4 h-4" />
            </span>
          )}
          {proposal.action_type === "SEND_REMINDER" && (
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Bell className="w-4 h-4" />
            </span>
          )}
          {proposal.action_type === "SEND_INVOICE" && (
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Send className="w-4 h-4" />
            </span>
          )}
          <div>
            <h4 className="text-sm font-semibold text-slate-100">{proposal.title}</h4>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
              Action Gate: {proposal.action_type}
            </span>
          </div>
        </div>

        {/* State Pill */}
        {isPending && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Requires Approval</span>
          </span>
        )}
        {isExecuted && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Executed via PayPal</span>
          </span>
        )}
        {isRejected && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center space-x-1">
            <XCircle className="w-3 h-3" />
            <span>Rejected</span>
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-slate-300 mb-3">{proposal.description}</p>

      {/* Details Box */}
      {proposal.details && (
        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-1.5 mb-3 font-mono">
          {proposal.details.customer_name && (
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500 font-sans">Recipient:</span>
              <span>{proposal.details.customer_name} ({proposal.details.customer_email})</span>
            </div>
          )}
          {proposal.details.amount !== undefined && (
            <div className="flex justify-between text-slate-200 font-bold">
              <span className="text-slate-500 font-sans font-normal">Total Amount:</span>
              <span className="text-cyan-400">${Number(proposal.details.amount).toFixed(2)} {proposal.details.currency || "USD"}</span>
            </div>
          )}
          {proposal.details.due_date && (
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500 font-sans">Due Date:</span>
              <span>{proposal.details.due_date}</span>
            </div>
          )}
          {proposal.details.subject && (
            <div className="text-slate-300">
              <span className="text-slate-500 font-sans">Subject:</span> {proposal.details.subject}
            </div>
          )}
          {proposal.details.note && (
            <div className="text-slate-400 italic text-[11px] pt-1">
              "{proposal.details.note}"
            </div>
          )}
        </div>
      )}

      {/* Execution Result Banner */}
      {isExecuted && execResult && (
        <div className="p-3 mb-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 space-y-1">
          <div className="flex items-center space-x-1.5 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>PayPal Sandbox Operation Complete</span>
          </div>
          {execResult.paypal_invoice_id && (
            <p className="font-mono text-[11px] text-emerald-400">
              PayPal Invoice ID: {execResult.paypal_invoice_id}
            </p>
          )}
          {execResult.payment_url && (
            <a
              href={execResult.payment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 underline font-medium pt-1"
            >
              <span>View & Pay in PayPal Sandbox</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <p className="text-xs text-rose-400 mb-3 bg-rose-950/40 p-2 rounded border border-rose-800">
          {errorMsg}
        </p>
      )}

      {/* Interactive Approval Actions */}
      {isPending && (
        <div className="flex items-center space-x-2 pt-1">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium text-xs flex items-center justify-center space-x-1.5 shadow-glow-cyan transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Executing PayPal API...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve & Execute PayPal API</span>
              </>
            )}
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
