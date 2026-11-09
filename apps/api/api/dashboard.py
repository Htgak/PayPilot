from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any

from apps.api.db.database import get_db
from apps.api.db.models import InvoiceModel, TransactionModel, ApprovalModel, ProfileModel
from apps.api.models.schemas import (
    DashboardSummaryResponse, DashboardChartResponse, DashboardChartItem,
    TransactionResponse, InvoiceResponse
)
from apps.api.tools.financial_tools import get_financial_summary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Executive financial metrics calculated directly from verified database records."""
    metrics = get_financial_summary(db, user_id="default_merchant")
    
    # Calculate real month-over-month growth
    now = datetime.now(timezone.utc)
    first_of_this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    # First of previous month
    if first_of_this_month.month == 1:
        first_of_prev_month = first_of_this_month.replace(year=first_of_this_month.year - 1, month=12)
    else:
        first_of_prev_month = first_of_this_month.replace(month=first_of_this_month.month - 1)

    this_month_rev = db.query(func.coalesce(func.sum(TransactionModel.amount), 0.0))\
        .filter(
            TransactionModel.user_id == "default_merchant",
            TransactionModel.status == "COMPLETED",
            TransactionModel.created_at >= first_of_this_month
        ).scalar() or 0.0

    prev_month_rev = db.query(func.coalesce(func.sum(TransactionModel.amount), 0.0))\
        .filter(
            TransactionModel.user_id == "default_merchant",
            TransactionModel.status == "COMPLETED",
            TransactionModel.created_at >= first_of_prev_month,
            TransactionModel.created_at < first_of_this_month
        ).scalar() or 0.0

    if prev_month_rev > 0:
        growth_pct = round(((this_month_rev - prev_month_rev) / prev_month_rev) * 100.0, 1)
    elif this_month_rev > 0:
        growth_pct = 100.0
    else:
        growth_pct = 0.0

    # Recent transactions from DB
    txs = db.query(TransactionModel)\
        .filter(TransactionModel.user_id == "default_merchant")\
        .order_by(TransactionModel.created_at.desc())\
        .limit(5)\
        .all()
    
    # Recent invoices from DB
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
        revenue_growth_pct=growth_pct,
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
    """Time-series timeline and invoice status distribution calculated from real records."""
    now = datetime.now(timezone.utc)
    
    # Calculate real monthly timeline for the past 6 months
    timeline = []
    for i in range(5, -1, -1):
        # Calculate month start and end
        month_target = now.month - i
        year_target = now.year
        while month_target <= 0:
            month_target += 12
            year_target -= 1
        
        m_start = datetime(year_target, month_target, 1, 0, 0, 0, tzinfo=timezone.utc)
        if month_target == 12:
            m_end = datetime(year_target + 1, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        else:
            m_end = datetime(year_target, month_target + 1, 1, 0, 0, 0, tzinfo=timezone.utc)

        month_label = m_start.strftime("%b")

        rev = db.query(func.coalesce(func.sum(TransactionModel.amount), 0.0)).filter(
            TransactionModel.user_id == "default_merchant",
            TransactionModel.status == "COMPLETED",
            TransactionModel.created_at >= m_start,
            TransactionModel.created_at < m_end
        ).scalar() or 0.0

        inv = db.query(func.coalesce(func.sum(InvoiceModel.amount), 0.0)).filter(
            InvoiceModel.user_id == "default_merchant",
            InvoiceModel.created_at >= m_start,
            InvoiceModel.created_at < m_end
        ).scalar() or 0.0

        timeline.append(DashboardChartItem(
            period=month_label,
            revenue=round(float(rev), 2),
            invoiced=round(float(inv), 2)
        ))

    # Real status distribution from database
    statuses = ["PAID", "SENT", "OVERDUE", "DRAFT", "CANCELLED"]
    counts = {}
    for s in statuses:
        counts[s] = db.query(InvoiceModel).filter_by(user_id="default_merchant", status=s).count()

    return DashboardChartResponse(
        revenue_timeline=timeline,
        status_distribution=counts
    )
