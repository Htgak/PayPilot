import json
import re
import uuid
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from apps.api.config import settings
from apps.api.tools.financial_tools import (
    get_financial_summary,
    list_transactions,
    list_invoices,
    queue_invoice_proposal,
    queue_reminder_proposal
)
from apps.api.db.models import AiSessionModel, AiMessageModel

class AgentOrchestrator:
    @property
    def gemini_available(self) -> bool:
        return settings.has_real_gemini

    async def process_message(
        self,
        db: Session,
        message: str,
        session_id: Optional[str] = None,
        user_id: str = "default_merchant"
    ) -> Dict[str, Any]:
        """
        Coordinates AI reasoning, tool execution, and action proposal gating.
        """
        # Ensure or create session
        if not session_id:
            session = AiSessionModel(
                id=str(uuid.uuid4()),
                user_id=user_id,
                title="PayPilot Chat Session"
            )
            db.add(session)
            db.commit()
            session_id = session.id
        else:
            session = db.query(AiSessionModel).filter_by(id=session_id).first()
            if not session:
                session = AiSessionModel(
                    id=session_id,
                    user_id=user_id,
                    title="PayPilot Chat Session"
                )
                db.add(session)
                db.commit()

        # Save user message
        user_msg = AiMessageModel(
            id=str(uuid.uuid4()),
            session_id=session_id,
            role="user",
            content=message
        )
        db.add(user_msg)
        db.commit()

        action_proposals = []
        tool_calls = []
        assistant_reply = ""

        # Check if Gemini API is available
        if self.gemini_available:
            try:
                reply, proposals, calls = await self._run_gemini(db, message, user_id)
                assistant_reply = reply
                action_proposals = proposals
                tool_calls = calls
            except Exception as e:
                print(f"[AgentOrchestrator] Gemini call failed: {e}. Falling back to internal engine.")
                reply, proposals, calls = self._run_heuristic_agent(db, message, user_id)
                assistant_reply = reply
                action_proposals = proposals
                tool_calls = calls
        else:
            reply, proposals, calls = self._run_heuristic_agent(db, message, user_id)
            assistant_reply = reply
            action_proposals = proposals
            tool_calls = calls

        # Save assistant response
        bot_msg = AiMessageModel(
            id=str(uuid.uuid4()),
            session_id=session_id,
            role="assistant",
            content=assistant_reply,
            tool_calls=tool_calls,
            tool_results=[{"proposals": len(action_proposals)}]
        )
        db.add(bot_msg)
        db.commit()

        return {
            "session_id": session_id,
            "response": assistant_reply,
            "action_proposals": action_proposals,
            "tool_calls": tool_calls
        }

    def _run_heuristic_agent(
        self,
        db: Session,
        message: str,
        user_id: str
    ) -> tuple[str, List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        High-fidelity heuristic agent for financial understanding, parameter extraction,
        and tool dispatch without requiring an active external LLM key.
        """
        msg_lower = message.lower()
        tool_calls = []
        action_proposals = []

        # 1. Invoice Creation Intent
        is_create_invoice = (
            ("invoice" in msg_lower and any(w in msg_lower for w in ["create", "draft", "make", "generate", "new", "bill", "prepare"]))
            or any(w in msg_lower for w in ["create invoice", "generate invoice", "new invoice", "bill for"])
        )
        if is_create_invoice:
            # Extract currency & amount
            # Look for patterns like $500, ₹15,000, 500 usd, 15000 inr, $1,500
            currency = "USD"
            if "₹" in message or "inr" in msg_lower or "rupees" in msg_lower:
                currency = "INR"
            elif "€" in message or "eur" in msg_lower or "euro" in msg_lower:
                currency = "EUR"
            elif "£" in message or "gbp" in msg_lower:
                currency = "GBP"

            amount = 500.0
            # Look for explicit currency symbol followed by amount e.g. $850, ₹15000
            m1 = re.search(r'[\$₹€£]\s*([0-9]+(?:\.[0-9]{1,2})?)', message)
            if m1:
                try:
                    amount = float(m1.group(1))
                except ValueError:
                    pass
            else:
                m2 = re.search(r'\b([0-9]+(?:\.[0-9]{1,2})?)\s*(?:usd|inr|eur|gbp|dollars|rupees)?\b', msg_lower)
                if m2:
                    try:
                        amount = float(m2.group(1))
                    except ValueError:
                        pass

            # Extract Email
            email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', message)
            customer_email = email_match.group(0) if email_match else "client@acme.corp"

            # Extract Name (e.g. for Sarah Connor, for Acme Corp)
            name_match = re.search(r'(?:for|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)', message)
            customer_name = name_match.group(1) if name_match else "Valued Client"
            if "@" in customer_name:
                customer_name = "Valued Client"

            # Extract description
            desc = "Professional Consulting & Development Services"
            if "for" in msg_lower:
                parts = message.split("for")
                if len(parts) > 1:
                    raw_desc = parts[-1].strip()
                    # trim client name if at end
                    desc = raw_desc.split("to")[0].strip() or desc

            items = [
                {
                    "description": desc.capitalize(),
                    "quantity": 1.0,
                    "unit_price": amount,
                    "total_amount": amount
                }
            ]

            # Queue approval
            approval = queue_invoice_proposal(
                db=db,
                customer_name=customer_name,
                customer_email=customer_email,
                items=items,
                currency=currency,
                memo=f"Invoice created via PayPilot AI: {desc}",
                user_id=user_id
            )

            tool_calls.append({
                "tool": "queue_invoice_proposal",
                "parameters": {
                    "customer_name": customer_name,
                    "customer_email": customer_email,
                    "amount": amount,
                    "currency": currency,
                    "items": items
                }
            })

            action_proposals.append({
                "approval_id": approval.id,
                "action_type": "CREATE_INVOICE",
                "title": f"Create PayPal Invoice ({currency} {amount:,.2f})",
                "description": f"Ready to draft invoice for {customer_name} ({customer_email}). Review line items before sending to PayPal.",
                "details": approval.payload,
                "status": "PENDING"
            })

            reply = (
                f"I've structured a new PayPal draft invoice for **{customer_name}** for **{currency} {amount:,.2f}**.\n\n"
                f"**Line Item:** {desc}  \n"
                f"**Recipient:** `{customer_email}`  \n"
                f"**Payment Due:** {approval.payload.get('due_date')}  \n\n"
                f"⚠️ *In accordance with PayPilot's approval workflow, financial actions require your explicit authorization before hitting the PayPal API.* "
                f"Please review and approve the proposal card below."
            )
            return reply, action_proposals, tool_calls

        # 2. Overdue & Smart Reminders Intent
        elif any(w in msg_lower for w in ["overdue", "reminder", "unpaid", "follow up", "chase"]):
            tool_calls.append({"tool": "list_invoices", "parameters": {"status": "OVERDUE"}})
            overdue_invs = list_invoices(db, user_id=user_id, status="OVERDUE")
            
            if not overdue_invs:
                summary = get_financial_summary(db, user_id=user_id)
                reply = (
                    f"Good news! You currently have **0 overdue invoices**. "
                    f"You have {summary['outstanding_count']} outstanding invoice(s) totalling **${summary['outstanding_amount']:,.2f}** that are still within their due terms."
                )
                return reply, action_proposals, tool_calls

            target_inv = overdue_invs[0]
            # Queue reminder proposal
            subject = f"Friendly Reminder: Invoice #{target_inv['invoice_number']} is past due"
            note = f"Hi {target_inv['customer_name']}, this is a friendly reminder that invoice #{target_inv['invoice_number']} for ${target_inv['amount']:,.2f} was due on {target_inv['due_date']}. Please let us know if you need any assistance processing payment."
            
            approval = queue_reminder_proposal(
                db=db,
                invoice_id=target_inv["id"],
                subject=subject,
                note=note,
                user_id=user_id
            )

            tool_calls.append({
                "tool": "queue_reminder_proposal",
                "parameters": {
                    "invoice_id": target_inv["id"],
                    "customer_name": target_inv["customer_name"],
                    "amount": target_inv["amount"]
                }
            })

            action_proposals.append({
                "approval_id": approval.id,
                "action_type": "SEND_REMINDER",
                "title": f"Send Reminder: #{target_inv['invoice_number']} ({target_inv['customer_name']})",
                "description": f"Drafted PayPal reminder for overdue invoice of ${target_inv['amount']:,.2f}.",
                "details": approval.payload,
                "status": "PENDING"
            })

            reply = (
                f"Found **{len(overdue_invs)} overdue invoice(s)**!  \n\n"
                f"Invoice **#{target_inv['invoice_number']}** for **{target_inv['customer_name']}** (${target_inv['amount']:,.2f} {target_inv['currency']}) "
                f"was due on **{target_inv['due_date']}** and remains unpaid.\n\n"
                f"I've drafted a polite, professional reminder for you. "
                f"Click **Approve & Send** below to deliver this reminder via PayPal's Invoicing Reminder API."
            )
            return reply, action_proposals, tool_calls

        # 3. Revenue / Financial Summary Intent
        elif any(w in msg_lower for w in ["revenue", "summary", "how much", "financials", "earnings", "metrics", "stats"]):
            tool_calls.append({"tool": "get_financial_summary", "parameters": {}})
            summary = get_financial_summary(db, user_id=user_id)
            
            reply = (
                f"Here is your current financial standing calculated from verified transactions:\n\n"
                f"- 💰 **Total Settled Revenue:** ${summary['total_revenue']:,.2f}\n"
                f"- ⏳ **Outstanding Receivables:** ${summary['outstanding_amount']:,.2f} ({summary['outstanding_count']} open invoices)\n"
                f"- ✅ **Completed Payments:** {summary['completed_payments']} transactions\n"
                f"- 🚨 **Overdue Invoices:** {summary['overdue_count']} (${summary['overdue_amount']:,.2f})\n"
                f"- 📋 **Pending Approvals:** {summary['pending_approvals']} actions awaiting merchant sign-off\n\n"
                f"Your cash flow is healthy. Would you like me to prepare a reminder for the overdue invoice, or draft a new invoice for an ongoing project?"
            )
            return reply, action_proposals, tool_calls

        # 4. Transactions List Intent
        elif any(w in msg_lower for w in ["transactions", "payments", "recent captures", "orders"]):
            tool_calls.append({"tool": "list_transactions", "parameters": {"limit": 5}})
            txs = list_transactions(db, user_id=user_id, limit=5)
            
            tx_lines = []
            for t in txs:
                payer = t.get("payer_name") or t.get("payer_email") or "Customer"
                tx_lines.append(f"• **${t['amount']:,.2f} {t['currency']}** from *{payer}* (Capture: `{t['paypal_capture_id'] or 'Pending'}`) — {t['status']}")
            
            reply = "Here are your most recent recorded payments:\n\n" + "\n".join(tx_lines)
            return reply, action_proposals, tool_calls

        # 5. Default General FinOps Copilot response
        else:
            summary = get_financial_summary(db, user_id=user_id)
            reply = (
                f"I'm PayPilot, your AI financial operations copilot. I can help you with:\n\n"
                f"1. **Creating Invoices:** *'Create an invoice for $750 for Brand Identity to client@acme.com'*\n"
                f"2. **Checking Financials:** *'What is my total revenue this month?'*\n"
                f"3. **Chasing Unpaid Bills:** *'Which invoices are overdue? Prepare a reminder.'*\n"
                f"4. **Recent Activity:** *'Show my recent transactions.'*\n\n"
                f"Current Snapshot: **${summary['total_revenue']:,.2f}** settled revenue with **${summary['outstanding_amount']:,.2f}** in receivables. What would you like to do?"
            )
            return reply, action_proposals, tool_calls

    async def _run_gemini(
        self,
        db: Session,
        message: str,
        user_id: str
    ) -> tuple[str, List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Call Gemini Flash via direct async REST or SDK and return response."""
        reply, proposals, calls = self._run_heuristic_agent(db, message, user_id)
        if not proposals:
            try:
                import httpx
                summary = get_financial_summary(db, user_id=user_id)
                sys_prompt = (
                    f"You are PayPilot, an expert AI financial operations copilot for independent businesses. "
                    f"Current business stats: Settled Revenue=${summary['total_revenue']}, "
                    f"Outstanding=${summary['outstanding_amount']}, Overdue Count={summary['overdue_count']}. "
                    f"Always prioritize clear, professional responses. "
                    f"Never claim money was transferred or an invoice was finalized without the user confirming approval."
                )
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.ai_model}:generateContent?key={settings.gemini_api_key}"
                payload = {
                    "systemInstruction": {"parts": [{"text": sys_prompt}]},
                    "contents": [{"parts": [{"text": message}]}]
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text")
                            if text:
                                reply = text.strip()
            except Exception as ex:
                print(f"[AgentOrchestrator] Gemini REST error: {ex}")
        return reply, proposals, calls

agent_orchestrator = AgentOrchestrator()
