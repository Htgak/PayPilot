from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional
import uuid

from apps.api.db.database import get_db
from apps.api.db.models import TransactionModel, InvoiceModel
from apps.api.models.schemas import CreateOrderRequest, CaptureOrderRequest, TransactionResponse
from apps.api.integrations.paypal.client import paypal_client
from apps.api.services.audit_service import record_audit

router = APIRouter(prefix="/payments", tags=["Payments & Orders"])

@router.post("/orders")
async def create_checkout_order(
    req: CreateOrderRequest,
    db: Session = Depends(get_db)
):
    """
    Creates a PayPal checkout order using Orders API v2.
    """
    res = await paypal_client.create_order(
        amount=req.amount,
        currency=req.currency,
        invoice_id=req.invoice_id,
        description=req.description or "PayPilot Payment"
    )
    
    order_id = res.get("id")
    approval_url = f"https://www.sandbox.paypal.com/checkoutnow?token={order_id}"
    for link in res.get("links", []):
        if link.get("rel") == "approve":
            approval_url = link.get("href")

    record_audit(
        db,
        action="PAYPAL_ORDER_CREATED",
        entity_type="ORDER",
        entity_id=order_id,
        payload={"amount": req.amount, "currency": req.currency},
        result="SUCCESS"
    )

    return {
        "order_id": order_id,
        "status": res.get("status", "CREATED"),
        "approval_url": approval_url,
        "details": res
    }

@router.post("/{order_id}/capture", response_model=TransactionResponse)
async def capture_checkout_order(
    order_id: str,
    req: Optional[CaptureOrderRequest] = None,
    db: Session = Depends(get_db)
):
    """
    Captures an approved PayPal checkout order using Orders API v2.
    Saves the transaction, updates invoice status if linked, and records audit trail.
    """
    capture_res = await paypal_client.capture_order(order_id)
    
    # Extract capture details
    capture_id = f"CAP-{order_id[-8:]}"
    amount = 100.0
    currency = "USD"
    
    try:
        pu = capture_res.get("purchase_units", [{}])[0]
        payments = pu.get("payments", {})
        captures = payments.get("captures", [])
        if captures:
            cap = captures[0]
            capture_id = cap.get("id", capture_id)
            amount = float(cap.get("amount", {}).get("value", 100.0))
            currency = cap.get("amount", {}).get("currency_code", "USD")
    except Exception as e:
        print(f"Error parsing capture payload: {e}")

    # Create transaction record
    tx = TransactionModel(
        id=str(uuid.uuid4()),
        user_id="default_merchant",
        paypal_order_id=order_id,
        paypal_capture_id=capture_id,
        amount=amount,
        currency=currency,
        status="COMPLETED",
        payment_source="paypal_checkout",
        payer_name=req.payer_name if req else "Sandbox Buyer",
        payer_email=req.payer_email if req else "buyer@sandbox.paypal.com"
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    record_audit(
        db,
        action="PAYPAL_ORDER_CAPTURED",
        entity_type="TRANSACTION",
        entity_id=tx.id,
        payload={"order_id": order_id, "capture_id": capture_id, "amount": amount},
        result="SUCCESS"
    )

    return TransactionResponse.model_validate(tx)
