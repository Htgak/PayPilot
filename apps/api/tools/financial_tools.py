from datetime import datetime, timezone, timedelta, date
from typing import Dict, Any, List, Optional
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import func

from apps.api.db.models import (
    InvoiceModel, InvoiceItemModel, TransactionModel,
    ApprovalModel, CustomerModel, ProfileModel
)
from apps.api.integrations.paypal.client import paypal_client
from apps.api.services.audit_service import record_audit

def get_financial_summary(db: Session, user_id: str = "default_merchant") -> Dict[str, Any]:
    """Calculates comprehensive financial summary metrics directly from DB."""
    total_rev = db.query(func.sum(TransactionModel.amount))\
        .filter(TransactionModel.user_id == user_id, TransactionModel.status == "COMPLETED")\
        .scalar() or 0.0

    outstanding_amt = db.query(func.sum(InvoiceModel.amount))\
        .filter(InvoiceModel.user_id == user_id, InvoiceModel.status.in_(["SENT", "OVERDUE"]))\
        .scalar() or 0.0

    outstanding_count = db.query(InvoiceModel)\
        .filter(InvoiceModel.user_id == user_id, InvoiceModel.status.in_(["SENT", "OVERDUE"]))\
        .count()

    completed_tx_count = db.query(TransactionModel)\
        .filter(TransactionModel.user_id == user_id, TransactionModel.status == "COMPLETED")\
        .count()

    pending_approvals = db.query(ApprovalModel)\
        .filter(ApprovalModel.user_id == user_id, ApprovalModel.status == "PENDING")\
        .count()

    overdue_invoices = db.query(InvoiceModel)\
        .filter(InvoiceModel.user_id == user_id, InvoiceModel.status == "OVERDUE")\
        .all()

    return {
        "total_revenue": round(float(total_rev), 2),
        "outstanding_amount": round(float(outstanding_amt), 2),
        "outstanding_count": outstanding_count,
        "completed_payments": completed_tx_count,
        "pending_approvals": pending_approvals,
        "overdue_count": len(overdue_invoices),
        "overdue_amount": round(sum(i.amount for i in overdue_invoices), 2)
    }

def list_transactions(
    db: Session,
    user_id: str = "default_merchant",
    limit: int = 10
) -> List[Dict[str, Any]]:
    """Retrieves recent merchant transactions."""
    txs = db.query(TransactionModel)\
        .filter(TransactionModel.user_id == user_id)\
        .order_by(TransactionModel.created_at.desc())\
        .limit(limit)\
        .all()

    return [
        {
            "id": t.id,
            "paypal_order_id": t.paypal_order_id,
            "paypal_capture_id": t.paypal_capture_id,
            "amount": t.amount,
            "currency": t.currency,
            "status": t.status,
            "payer_name": t.payer_name,
            "payer_email": t.payer_email,
            "created_at": t.created_at.isoformat() if t.created_at else None
        }
        for t in txs
    ]

def list_invoices(
    db: Session,
    user_id: str = "default_merchant",
    status: Optional[str] = None,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """Retrieves invoices, optionally filtered by status."""
    query = db.query(InvoiceModel).filter(InvoiceModel.user_id == user_id)
    if status:
        query = query.filter(InvoiceModel.status == status.upper())
    
    invoices = query.order_by(InvoiceModel.created_at.desc()).limit(limit).all()
    return [
        {
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "customer_name": inv.customer.name if inv.customer else "N/A",
            "customer_email": inv.customer.email if inv.customer else "N/A",
            "amount": inv.amount,
            "currency": inv.currency,
            "status": inv.status,
            "due_date": inv.due_date.isoformat() if inv.due_date else None,
            "paypal_invoice_id": inv.paypal_invoice_id
        }
        for inv in invoices
    ]

def queue_invoice_proposal(
    db: Session,
    customer_name: str,
    customer_email: str,
    items: List[Dict[str, Any]],
    currency: str = "USD",
    memo: Optional[str] = None,
    due_days: int = 14,
    user_id: str = "default_merchant"
) -> ApprovalModel:
    """
    Creates an approval request card for invoice generation.
    Does NOT execute PayPal API until user approves.
    """
    total_amount = sum(float(item.get("unit_price", 0)) * float(item.get("quantity", 1)) for item in items)
    
    payload = {
        "action_type": "CREATE_INVOICE",
        "customer_name": customer_name,
        "customer_email": customer_email,
        "items": items,
        "amount": round(total_amount, 2),
        "currency": currency.upper(),
        "memo": memo or "Professional services provided",
        "due_date": (datetime.now(timezone.utc) + timedelta(days=due_days)).date().isoformat()
    }

    approval = ApprovalModel(
        id=str(uuid.uuid4()),
        user_id=user_id,
        action_type="CREATE_INVOICE",
        payload=payload,
        status="PENDING",
        expires_at=datetime.now(timezone.utc) + timedelta(days=3)
    )
    db.add(approval)
    db.commit()
    db.refresh(approval)

    record_audit(
        db,
        action="APPROVAL_REQUEST_CREATED",
        entity_type="APPROVAL",
        entity_id=approval.id,
        payload=payload,
        result="PENDING"
    )

    return approval

def queue_reminder_proposal(
    db: Session,
    invoice_id: str,
    subject: str,
    note: str,
    user_id: str = "default_merchant"
) -> ApprovalModel:
    """Prepares an approval action for sending a PayPal invoice reminder."""
    invoice = db.query(InvoiceModel).filter_by(id=invoice_id, user_id=user_id).first()
    if not invoice:
        raise ValueError(f"Invoice {invoice_id} not found")

    payload = {
        "action_type": "SEND_REMINDER",
        "invoice_id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "paypal_invoice_id": invoice.paypal_invoice_id,
        "customer_name": invoice.customer.name if invoice.customer else "Client",
        "customer_email": invoice.customer.email if invoice.customer else "",
        "amount": invoice.amount,
        "currency": invoice.currency,
        "subject": subject,
        "note": note
    }

    approval = ApprovalModel(
        id=str(uuid.uuid4()),
        user_id=user_id,
        action_type="SEND_REMINDER",
        payload=payload,
        status="PENDING"
    )
    db.add(approval)
    db.commit()
    db.refresh(approval)

    record_audit(
        db,
        action="APPROVAL_REMINDER_CREATED",
        entity_type="APPROVAL",
        entity_id=approval.id,
        payload=payload,
        result="PENDING"
    )
    return approval

async def execute_approved_action(
    db: Session,
    approval_id: str,
    user_id: str = "default_merchant"
) -> Dict[str, Any]:
    """
    Executes a previously approved financial action against the PayPal API.
    """
    approval = db.query(ApprovalModel).filter_by(id=approval_id, user_id=user_id).first()
    if not approval:
        raise ValueError("Approval record not found")

    if approval.status != "PENDING":
        return {
            "status": approval.status,
            "message": f"Action is already in {approval.status} state",
            "result": approval.execution_result
        }

    action_type = approval.action_type
    payload = approval.payload

    try:
        if action_type == "CREATE_INVOICE":
            # 1. Ensure or find customer
            cust = db.query(CustomerModel).filter_by(
                user_id=user_id,
                email=payload["customer_email"]
            ).first()
            if not cust:
                cust = CustomerModel(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    name=payload["customer_name"],
                    email=payload["customer_email"]
                )
                db.add(cust)
                db.flush()

            # 2. Build PayPal Invoicing v2 Draft Payload
            invoice_num = f"INV-{datetime.now(timezone.utc).strftime('%Y%m')}-{uuid.uuid4().hex[:4].upper()}"
            pp_payload = {
                "detail": {
                    "invoice_number": invoice_num,
                    "reference": invoice_num,
                    "invoice_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                    "currency_code": payload.get("currency", "USD"),
                    "note": payload.get("memo", ""),
                    "payment_term": {
                        "term_type": "DUE_ON_DATE_SPECIFIED",
                        "due_date": payload.get("due_date")
                    }
                },
                "invoicer": {
                    "name": {"given_name": "PixelCraft", "surname": "Studio"},
                    "email_address": "merchant@pixelcraft.studio"
                },
                "primary_recipients": [
                    {
                        "billing_info": {
                            "name": {"given_name": payload["customer_name"]},
                            "email_address": payload["customer_email"]
                        }
                    }
                ],
                "items": [
                    {
                        "name": item.get("description", "Service"),
                        "quantity": str(item.get("quantity", 1)),
                        "unit_amount": {
                            "currency_code": payload.get("currency", "USD"),
                            "value": f"{float(item.get('unit_price', 0)):.2f}"
                        }
                    }
                    for item in payload.get("items", [])
                ]
            }

            # 3. Call PayPal Invoicing API v2
            pp_res = await paypal_client.create_invoice_draft(pp_payload)
            paypal_invoice_id = pp_res.get("id")

            # Extract payer view URL if present
            payment_url = f"https://www.sandbox.paypal.com/invoice/p/#{paypal_invoice_id}"
            for link in pp_res.get("links", []):
                if link.get("rel") == "payer-view":
                    payment_url = link.get("href")

            # 4. Save to Database
            new_inv = InvoiceModel(
                id=str(uuid.uuid4()),
                user_id=user_id,
                customer_id=cust.id,
                invoice_number=invoice_num,
                paypal_invoice_id=paypal_invoice_id,
                paypal_invoice_number=pp_res.get("detail", {}).get("invoice_number", invoice_num),
                amount=payload["amount"],
                currency=payload.get("currency", "USD"),
                status="DRAFT",
                due_date=datetime.strptime(payload["due_date"], "%Y-%m-%d").date() if payload.get("due_date") else None,
                memo=payload.get("memo"),
                payment_url=payment_url
            )
            db.add(new_inv)
            db.flush()

            for item in payload.get("items", []):
                db_item = InvoiceItemModel(
                    id=str(uuid.uuid4()),
                    invoice_id=new_inv.id,
                    description=item.get("description", "Service"),
                    quantity=float(item.get("quantity", 1)),
                    unit_price=float(item.get("unit_price", 0)),
                    total_amount=float(item.get("unit_price", 0)) * float(item.get("quantity", 1))
                )
                db.add(db_item)

            result_data = {
                "invoice_id": new_inv.id,
                "invoice_number": invoice_num,
                "paypal_invoice_id": paypal_invoice_id,
                "payment_url": payment_url,
                "status": "CREATED_DRAFT"
            }

            approval.status = "EXECUTED"
            approval.execution_result = result_data
            db.commit()

            record_audit(
                db,
                action="PAYPAL_INVOICE_CREATED",
                entity_type="INVOICE",
                entity_id=new_inv.id,
                payload=result_data,
                result="SUCCESS"
            )
            return result_data

        elif action_type == "SEND_INVOICE":
            paypal_invoice_id = payload.get("paypal_invoice_id")
            invoice_id = payload.get("invoice_id")
            res = await paypal_client.send_invoice(paypal_invoice_id)

            if invoice_id:
                inv = db.query(InvoiceModel).filter_by(id=invoice_id).first()
                if inv:
                    inv.status = "SENT"

            approval.status = "EXECUTED"
            approval.execution_result = res
            db.commit()
            return res

        elif action_type == "SEND_REMINDER":
            paypal_invoice_id = payload.get("paypal_invoice_id")
            res = await paypal_client.send_reminder(
                paypal_invoice_id,
                subject=payload.get("subject", "Payment Reminder"),
                note=payload.get("note", "Friendly reminder regarding your invoice.")
            )
            approval.status = "EXECUTED"
            approval.execution_result = res
            db.commit()
            return res

        else:
            raise ValueError(f"Unknown action type: {action_type}")

    except Exception as e:
        approval.status = "FAILED"
        approval.execution_result = {"error": str(e)}
        db.commit()
        record_audit(
            db,
            action=f"EXECUTE_FAILED_{action_type}",
            entity_type="APPROVAL",
            entity_id=approval_id,
            payload={"error": str(e)},
            result="FAILED"
        )
        raise e
