"use client";

import React, { useState } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Receipt, 
  Send, 
  Bell, 
  ExternalLink,
  ShieldCheck,
  CreditCard
} from "lucide-react";
import { api, ActionProposal } from "@/lib/api";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

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

  const getActionIcon = () => {
    switch (proposal.action_type) {
      case "CREATE_INVOICE":
        return <Receipt className="w-4 h-4 text-[#0070ba] dark:text-cyan-400" />;
      case "SEND_REMINDER":
        return <Bell className="w-4 h-4 text-amber-500" />;
      case "SEND_INVOICE":
        return <Send className="w-4 h-4 text-emerald-500" />;
      default:
        return <CreditCard className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className={`my-3 p-4 rounded-xl border transition-all text-left ${
      isExecuted
        ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40"
        : isRejected
        ? "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70"
        : "bg-white dark:bg-[#131b2e] border-slate-200 dark:border-slate-700/80 shadow-sm"
    }`}>
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
            {getActionIcon()}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              {proposal.title}
            </h4>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              Action Gate: {proposal.action_type}
            </span>
          </div>
        </div>

        {isPending && <Badge variant="pending">Awaiting Approval</Badge>}
        {isExecuted && <Badge variant="paid">Executed on PayPal</Badge>}
        {isRejected && <Badge variant="draft">Declined</Badge>}
      </div>

      {/* Description */}
      <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
        {proposal.description}
      </p>

      {/* Details Box */}
      {proposal.details && (
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-1.5 mb-3 font-mono">
          {proposal.details.customer_name && (
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span className="text-slate-400 font-sans">Recipient:</span>
              <span className="font-medium">{proposal.details.customer_name} ({proposal.details.customer_email})</span>
            </div>
          )}
          {proposal.details.amount !== undefined && (
            <div className="flex justify-between text-slate-900 dark:text-slate-100 font-bold">
              <span className="text-slate-400 font-sans font-normal">Amount:</span>
              <span className="text-[#0070ba] dark:text-cyan-400">
                ${Number(proposal.details.amount).toFixed(2)} {proposal.details.currency || "USD"}
              </span>
            </div>
          )}
          {proposal.details.due_date && (
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span className="text-slate-400 font-sans">Due Date:</span>
              <span>{proposal.details.due_date}</span>
            </div>
          )}
          {proposal.details.note && (
            <div className="text-slate-500 dark:text-slate-400 italic text-[11px] pt-1 border-t border-slate-200 dark:border-slate-800">
              "{proposal.details.note}"
            </div>
          )}
        </div>
      )}

      {/* Execution Result Banner */}
      {isExecuted && execResult && (
        <div className="p-3 mb-3 rounded-lg bg-emerald-100/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
          <div className="flex items-center space-x-1.5 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>PayPal Sandbox Operation Succeeded</span>
          </div>
          {execResult.paypal_invoice_id && (
            <p className="font-mono text-[11px]">
              Invoice Reference: {execResult.paypal_invoice_id}
            </p>
          )}
          {execResult.payment_url && (
            <a
              href={execResult.payment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-[#0070ba] dark:text-cyan-400 hover:underline font-medium pt-1"
            >
              <span>View & Settle in PayPal Sandbox</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <p className="text-xs text-rose-600 dark:text-rose-400 mb-3 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-800">
          {errorMsg}
        </p>
      )}

      {/* Streamlined Approval Actions - No Multiple Confusing Buttons */}
      {isPending && (
        <div className="flex items-center space-x-2 pt-1">
          <Button
            variant="primary"
            size="sm"
            loading={loading}
            onClick={handleApprove}
            className="flex-1"
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            {loading ? "Executing PayPal API..." : "Approve & Execute PayPal API"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            disabled={loading}
            onClick={handleReject}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Decline
          </Button>
        </div>
      )}
    </div>
  );
}
