from fastapi import APIRouter, Depends, Header, Request, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import uuid

from apps.api.db.database import get_db
from apps.api.db.models import WebhookEventModel, InvoiceModel, TransactionModel
from apps.api.integrations.paypal.client import paypal_client
from apps.api.services.audit_service import record_audit

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

@router.post("/paypal")
async def handle_paypal_webhook(
    request: Request,
    db: Session = Depends(get_db),
    paypal_transmission_id: Optional[str] = Header(None, alias="PAYPAL-TRANSMISSION-ID"),
    paypal_transmission_time: Optional[str] = Header(None, alias="PAYPAL-TRANSMISSION-TIME"),
    paypal_transmission_sig: Optional[str] = Header(None, alias="PAYPAL-TRANSMISSION-SIG"),
    paypal_cert_url: Optional[str] = Header(None, alias="PAYPAL-CERT-URL"),
    paypal_auth_algo: Optional[str] = Header(None, alias="PAYPAL-AUTH-ALGO")
):
    """
    PayPal Webhook endpoint.
    Verifies signature, ensures event deduplication via unique paypal_event_id,
    updates database records, and logs audit trail.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_id = body.get("id")
    event_type = body.get("event_type", "UNKNOWN")

    if not event_id:
        raise HTTPException(status_code=400, detail="Missing event id")

    # 1. Deduplication check
    existing = db.query(WebhookEventModel).filter_by(paypal_event_id=event_id).first()
    if existing:
        return {"status": "IGNORED", "reason": "Duplicate webhook event"}

    # 2. Verify signature if headers present
    if paypal_transmission_id and paypal_transmission_sig:
        is_valid = await paypal_client.verify_webhook_signature(
            transmission_id=paypal_transmission_id,
            transmission_time=paypal_transmission_time or "",
            cert_url=paypal_cert_url or "",
            auth_algo=paypal_auth_algo or "",
            transmission_sig=paypal_transmission_sig,
            webhook_event=body
        )
        if not is_valid:
            raise HTTPException(status_code=400, detail="Webhook signature verification failed")

    # 3. Process event
    resource = body.get("resource", {})
    
    # Handle PAYMENT.CAPTURE.COMPLETED
    if event_type == "PAYMENT.CAPTURE.COMPLETED":
        capture_id = resource.get("id")
        amount = float(resource.get("amount", {}).get("value", 0.0))
        currency = resource.get("amount", {}).get("currency_code", "USD")
        order_id = resource.get("supplementary_data", {}).get("related_ids", {}).get("order_id")

        tx = TransactionModel(
            id=str(uuid.uuid4()),
            user_id="default_merchant",
            paypal_order_id=order_id,
            paypal_capture_id=capture_id,
            amount=amount,
            currency=currency,
            status="COMPLETED",
            payment_source="paypal_webhook"
        )
        db.add(tx)

    # Handle INVOICING.INVOICE.PAID
    elif event_type in ["INVOICING.INVOICE.PAID", "INVOICE.PAID"]:
        invoice_id = resource.get("id")
        inv = db.query(InvoiceModel).filter_by(paypal_invoice_id=invoice_id).first()
        if inv:
            inv.status = "PAID"
            # Add corresponding transaction if not present
            tx = TransactionModel(
                id=str(uuid.uuid4()),
                user_id=inv.user_id,
                invoice_id=inv.id,
                paypal_capture_id=f"CAP-INV-{event_id[:8]}",
                amount=inv.amount,
                currency=inv.currency,
                status="COMPLETED",
                payment_source="paypal_invoice_webhook",
                payer_name=inv.customer.name if inv.customer else "Customer",
                payer_email=inv.customer.email if inv.customer else None
            )
            db.add(tx)

    # Record webhook event
    evt_log = WebhookEventModel(
        id=str(uuid.uuid4()),
        paypal_event_id=event_id,
        event_type=event_type,
        payload=body,
        status="PROCESSED"
    )
    db.add(evt_log)
    db.commit()

    record_audit(
        db,
        action=f"WEBHOOK_{event_type}",
        entity_type="WEBHOOK",
        entity_id=event_id,
        payload={"event_type": event_type},
        result="SUCCESS"
    )

    return {"status": "SUCCESS", "event_id": event_id, "event_type": event_type}
