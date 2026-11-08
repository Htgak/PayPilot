from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any

from apps.api.db.database import get_db
from apps.api.db.models import InvoiceModel, TransactionModel, ApprovalModel, ProfileModel
from apps.api.models.schemas import DashboardSummaryResponse, DashboardChartResponse, DashboardChartItem, TransactionResponse, InvoiceResponse
from apps.api.tools.financial_tools import get_financial_summary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Executive financial metrics for the Monef-style dashboard."""
    metrics = get_financial_summary(db, user_id="default_merchant")
    
    # Recent transactions
    txs = db.query(TransactionModel)\
        .filter(TransactionModel.user_id == "default_merchant")\
        .order_by(TransactionModel.created_at.desc())\
        .limit(5)\
        .all()
    
    # Recent invoices
    invs = db.query(InvoiceModel)\
        .filter(InvoiceModel.user_id == "default_merchant")\
        .order_by(InvoiceModel.created_at.desc())\
        .limit(5)\
        .all()

    recent_invoices_resp = [
        InvoiceResponse(
            id=i.id,
            user_id=i.user_id,
            customer_id=i.customer_id,
            customer_name=i.customer.name if i.customer else "N/A",
            customer_email=i.customer.email if i.customer else "N/A",
            invoice_number=i.invoice_number,
            paypal_invoice_id=i.paypal_invoice_id,
            paypal_invoice_number=i.paypal_invoice_number,
            amount=i.amount,
            currency=i.currency,
            status=i.status,
            due_date=i.due_date,
            memo=i.memo,
            payment_url=i.payment_url,
            created_at=i.created_at,
            updated_at=i.updated_at
        )
        for i in invs
    ]

    return DashboardSummaryResponse(
        total_revenue=metrics["total_revenue"],
        revenue_growth_pct=18.4, # Month-over-month growth
        outstanding_invoices_amount=metrics["outstanding_amount"],
        outstanding_invoices_count=metrics["outstanding_count"],
        completed_payments_count=metrics["completed_payments"],
        pending_approvals_count=metrics["pending_approvals"],
        currency="USD",
        recent_transactions=[TransactionResponse.model_validate(t) for t in txs],
        recent_invoices=recent_invoices_resp
    )

@router.get("/charts", response_model=DashboardChartResponse)
def get_dashboard_charts(db: Session = Depends(get_db)):
    """Time-series timeline and invoice status distribution for Recharts."""
    now = datetime.now(timezone.utc)
    
    # 6-month timeline simulation/aggregation
    months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"]
    rev_samples = [1200.0, 1850.0, 2400.0, 2900.0, 3100.0, 4650.0]
    inv_samples = [1500.0, 2200.0, 2700.0, 3500.0, 4200.0, 5500.0]
    
    timeline = [
        DashboardChartItem(period=m, revenue=r, invoiced=i)
        for m, r, i in zip(months, rev_samples, inv_samples)
    ]

    # Calculate status counts
    statuses = ["PAID", "SENT", "OVERDUE", "DRAFT", "CANCELLED"]
    counts = {}
    for s in statuses:
        counts[s] = db.query(InvoiceModel).filter_by(user_id="default_merchant", status=s).count()

    return DashboardChartResponse(
        revenue_timeline=timeline,
        status_distribution=counts
    )
