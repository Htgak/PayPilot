from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from typing import List, Optional
import io
import uuid

from apps.api.db.database import get_db
from apps.api.db.models import InvoiceModel, InvoiceItemModel, CustomerModel, ProfileModel
from apps.api.models.schemas import (
    InvoiceResponse, InvoiceDetailResponse, InvoiceCreate, 
    InvoiceRemindRequest, InvoiceItemResponse, CustomerResponse
)
from apps.api.integrations.paypal.client import paypal_client
from apps.api.services.audit_service import record_audit
from apps.api.services.pdf_service import generate_invoice_pdf

router = APIRouter(prefix="/invoices", tags=["Invoices"])

def serialize_invoice(inv: InvoiceModel) -> InvoiceResponse:
    return InvoiceResponse(
        id=inv.id,
        user_id=inv.user_id,
        customer_id=inv.customer_id,
        customer_name=inv.customer.name if inv.customer else "N/A",
        customer_email=inv.customer.email if inv.customer else "N/A",
        invoice_number=inv.invoice_number,
        paypal_invoice_id=inv.paypal_invoice_id,
        paypal_invoice_number=inv.paypal_invoice_number,
        amount=inv.amount,
        currency=inv.currency,
        status=inv.status,
        due_date=inv.due_date,
        memo=inv.memo,
        payment_url=inv.payment_url,
        created_at=inv.created_at,
        updated_at=inv.updated_at
    )

@router.get("", response_model=List[InvoiceResponse])
def get_invoices(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all invoices, optionally filtered by status."""
    query = db.query(InvoiceModel).filter(InvoiceModel.user_id == "default_merchant")
    if status:
        query = query.filter(InvoiceModel.status == status.upper())
    
    invoices = query.order_by(InvoiceModel.created_at.desc()).all()
    return [serialize_invoice(i) for i in invoices]

@router.post("/draft", response_model=InvoiceDetailResponse)
async def create_invoice_draft(
    req: InvoiceCreate,
    db: Session = Depends(get_db)
):
    """
    Manually creates a new draft invoice and synchronizes with PayPal Invoicing API v2.
    """
    # 1. Customer
    cust = None
    if req.customer_id:
        cust = db.query(CustomerModel).filter_by(id=req.customer_id).first()
    elif req.customer_email:
        cust = db.query(CustomerModel).filter_by(email=req.customer_email).first()
        if not cust:
            cust = CustomerModel(
                id=str(uuid.uuid4()),
                user_id="default_merchant",
                name=req.customer_name or "Valued Client",
                email=req.customer_email
            )
            db.add(cust)
            db.flush()

    total_amount = sum(item.unit_price * item.quantity for item in req.items)
    invoice_num = f"INV-{datetime.now(timezone.utc).strftime('%Y%m')}-{uuid.uuid4().hex[:4].upper()}"

    # 2. PayPal API Draft call
    pp_payload = {
        "detail": {
            "invoice_number": invoice_num,
            "currency_code": req.currency,
            "note": req.memo or "",
            "payment_term": {
                "term_type": "DUE_ON_DATE_SPECIFIED",
                "due_date": req.due_date.isoformat() if req.due_date else None
            }
        },
        "invoicer": {
            "name": {"given_name": "PixelCraft", "surname": "Studio"},
            "email_address": "merchant@pixelcraft.studio"
        },
        "primary_recipients": [
            {
                "billing_info": {
                    "name": {"given_name": cust.name if cust else "Client"},
                    "email_address": cust.email if cust else "client@example.com"
                }
            }
        ],
        "items": [
            {
                "name": item.description,
                "quantity": str(item.quantity),
                "unit_amount": {
                    "currency_code": req.currency,
                    "value": f"{item.unit_price:.2f}"
                }
            }
            for item in req.items
        ]
    }

    pp_res = await paypal_client.create_invoice_draft(pp_payload)
    paypal_invoice_id = pp_res.get("id")

    payment_url = f"https://www.sandbox.paypal.com/invoice/p/#{paypal_invoice_id}"
    for link in pp_res.get("links", []):
        if link.get("rel") == "payer-view":
            payment_url = link.get("href")

    new_inv = InvoiceModel(
        id=str(uuid.uuid4()),
        user_id="default_merchant",
        customer_id=cust.id if cust else None,
        invoice_number=invoice_num,
        paypal_invoice_id=paypal_invoice_id,
        paypal_invoice_number=pp_res.get("detail", {}).get("invoice_number", invoice_num),
        amount=total_amount,
        currency=req.currency,
        status="DRAFT",
        due_date=req.due_date,
        memo=req.memo,
        payment_url=payment_url
    )
    db.add(new_inv)
    db.flush()

    items_created = []
    for item in req.items:
        db_item = InvoiceItemModel(
            id=str(uuid.uuid4()),
            invoice_id=new_inv.id,
            description=item.description,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_amount=item.unit_price * item.quantity
        )
        db.add(db_item)
        items_created.append(db_item)

    db.commit()
    db.refresh(new_inv)

    record_audit(
        db,
        action="INVOICE_DRAFT_CREATED",
        entity_type="INVOICE",
        entity_id=new_inv.id,
        payload={"invoice_number": invoice_num, "amount": total_amount},
        result="SUCCESS"
    )

    return InvoiceDetailResponse(
        **serialize_invoice(new_inv).model_dump(),
        items=[InvoiceItemResponse.model_validate(it) for it in items_created],
        customer=CustomerResponse.model_validate(cust) if cust else None
    )

@router.get("/{id}", response_model=InvoiceDetailResponse)
def get_invoice_detail(id: str, db: Session = Depends(get_db)):
    """Retrieve complete invoice breakdown with customer and items."""
    inv = db.query(InvoiceModel).filter_by(id=id, user_id="default_merchant").first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    return InvoiceDetailResponse(
        **serialize_invoice(inv).model_dump(),
        items=[InvoiceItemResponse.model_validate(it) for it in inv.items],
        customer=CustomerResponse.model_validate(inv.customer) if inv.customer else None
    )

@router.post("/{id}/send")
async def send_invoice(id: str, db: Session = Depends(get_db)):
    """
    Sends an invoice via PayPal Invoicing API v2.
    """
    inv = db.query(InvoiceModel).filter_by(id=id, user_id="default_merchant").first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if not inv.paypal_invoice_id:
        raise HTTPException(status_code=400, detail="Invoice does not have a PayPal Invoice ID")

    res = await paypal_client.send_invoice(inv.paypal_invoice_id)
    inv.status = "SENT"
    db.commit()

    record_audit(
        db,
        action="PAYPAL_INVOICE_SENT",
        entity_type="INVOICE",
        entity_id=inv.id,
        payload={"paypal_invoice_id": inv.paypal_invoice_id},
        result="SUCCESS"
    )

    return {"status": "SUCCESS", "invoice_status": "SENT", "paypal_result": res}

@router.post("/{id}/remind")
async def send_invoice_reminder(
    id: str,
    req: InvoiceRemindRequest,
    db: Session = Depends(get_db)
):
    """
    Triggers the PayPal Invoicing Reminder API (POST /v2/invoicing/invoices/{id}/remind).
    """
    inv = db.query(InvoiceModel).filter_by(id=id, user_id="default_merchant").first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    subject = req.subject or f"Reminder: Invoice #{inv.invoice_number} is awaiting payment"
    note = req.note or "Please review and settle your invoice at your earliest convenience."

    res = await paypal_client.send_reminder(
        paypal_invoice_id=inv.paypal_invoice_id or f"INV2-{inv.invoice_number}",
        subject=subject,
        note=note
    )

    record_audit(
        db,
        action="PAYPAL_REMINDER_SENT",
        entity_type="INVOICE",
        entity_id=inv.id,
        payload={"subject": subject},
        result="SUCCESS"
    )

    return {"status": "SUCCESS", "message": "Reminder delivered", "details": res}

@router.post("/{id}/cancel")
async def cancel_invoice(id: str, db: Session = Depends(get_db)):
    """Cancels an invoice on PayPal."""
    inv = db.query(InvoiceModel).filter_by(id=id, user_id="default_merchant").first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if inv.paypal_invoice_id:
        await paypal_client.cancel_invoice(inv.paypal_invoice_id)

    inv.status = "CANCELLED"
    db.commit()

    record_audit(
        db,
        action="INVOICE_CANCELLED",
        entity_type="INVOICE",
        entity_id=inv.id,
        result="SUCCESS"
    )
    return {"status": "SUCCESS", "invoice_status": "CANCELLED"}

@router.get("/{id}/pdf")
def download_invoice_pdf(id: str, db: Session = Depends(get_db)):
    """Generates and downloads a branded PDF invoice."""
    inv = db.query(InvoiceModel).filter_by(id=id, user_id="default_merchant").first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    profile = db.query(ProfileModel).filter_by(user_id="default_merchant").first()
    pdf_bytes = generate_invoice_pdf(inv, profile)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=invoice-{inv.invoice_number}.pdf"}
    )
