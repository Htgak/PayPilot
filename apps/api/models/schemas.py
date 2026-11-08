from datetime import datetime, date
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field

# Profile
class ProfileResponse(BaseModel):
    id: str
    user_id: str
    name: str
    business_name: str
    email: str
    currency: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    business_name: Optional[str] = None
    email: Optional[str] = None
    currency: Optional[str] = None

# Customer
class CustomerBase(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    company_name: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: str
    user_id: str
    created_at: datetime

    model_config = {"from_attributes": True}

# Invoice Items
class InvoiceItemCreate(BaseModel):
    description: str
    quantity: float = 1.0
    unit_price: float
    total_amount: Optional[float] = None

class InvoiceItemResponse(BaseModel):
    id: str
    description: str
    quantity: float
    unit_price: float
    total_amount: float

    model_config = {"from_attributes": True}

# Invoice
class InvoiceCreate(BaseModel):
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    items: List[InvoiceItemCreate]
    currency: str = "USD"
    due_date: Optional[date] = None
    memo: Optional[str] = None

class InvoiceResponse(BaseModel):
    id: str
    user_id: str
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    invoice_number: str
    paypal_invoice_id: Optional[str] = None
    paypal_invoice_number: Optional[str] = None
    amount: float
    currency: str
    status: str
    due_date: Optional[date] = None
    memo: Optional[str] = None
    payment_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class InvoiceDetailResponse(InvoiceResponse):
    items: List[InvoiceItemResponse] = []
    customer: Optional[CustomerResponse] = None

# Transaction
class TransactionResponse(BaseModel):
    id: str
    user_id: str
    invoice_id: Optional[str] = None
    paypal_order_id: Optional[str] = None
    paypal_capture_id: Optional[str] = None
    amount: float
    currency: str
    status: str
    payment_source: Optional[str] = "paypal"
    payer_name: Optional[str] = None
    payer_email: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}

# Approval Action
class ApprovalActionPayload(BaseModel):
    action_type: str # CREATE_INVOICE, SEND_INVOICE, CREATE_CHECKOUT_ORDER, SEND_REMINDER, CAPTURE_ORDER
    summary: str
    details: Dict[str, Any]

class ApprovalResponse(BaseModel):
    id: str
    user_id: str
    action_type: str
    payload: Dict[str, Any]
    status: str # PENDING, APPROVED, REJECTED, EXECUTED, FAILED
    execution_result: Optional[Dict[str, Any]] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class ApprovalDecision(BaseModel):
    decision: str # "APPROVE" or "REJECT"
    reason: Optional[str] = None

# Orders / Payments
class CreateOrderRequest(BaseModel):
    amount: float
    currency: str = "USD"
    invoice_id: Optional[str] = None
    description: Optional[str] = "PayPilot Service Payment"

class CaptureOrderRequest(BaseModel):
    order_id: str
    payer_name: Optional[str] = None
    payer_email: Optional[str] = None

# AI Agent Chat
class ChatMessageRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ActionProposal(BaseModel):
    approval_id: str
    action_type: str
    title: str
    description: str
    details: Dict[str, Any]
    status: str = "PENDING"

class ChatMessageResponse(BaseModel):
    session_id: str
    response: str
    action_proposals: List[ActionProposal] = []
    tool_calls: List[Dict[str, Any]] = []

# Reminders
class InvoiceRemindRequest(BaseModel):
    subject: Optional[str] = None
    note: Optional[str] = None
    send_to_recipient: bool = True

# Dashboard & Analytics
class DashboardSummaryResponse(BaseModel):
    total_revenue: float
    revenue_growth_pct: float
    outstanding_invoices_amount: float
    outstanding_invoices_count: int
    completed_payments_count: int
    pending_approvals_count: int
    currency: str
    recent_transactions: List[TransactionResponse] = []
    recent_invoices: List[InvoiceResponse] = []

class DashboardChartItem(BaseModel):
    period: str
    revenue: float
    invoiced: float

class DashboardChartResponse(BaseModel):
    revenue_timeline: List[DashboardChartItem]
    status_distribution: Dict[str, int]

class InsightItem(BaseModel):
    type: str # warning, success, info, recommendation
    title: str
    message: str
    action_prompt: Optional[str] = None

class InsightsResponse(BaseModel):
    health_score: int
    summary: str
    insights: List[InsightItem]
    cash_flow_forecast: Dict[str, Any]

# Settings
class SystemSettingsResponse(BaseModel):
    app_env: str
    paypal_connected: bool
    paypal_base_url: str
    paypal_client_id_masked: Optional[str] = None
    has_gemini: bool
    ai_model: str
    database_url: str
    profile: ProfileResponse

class SettingsUpdateRequest(BaseModel):
    paypal_client_id: Optional[str] = None
    paypal_client_secret: Optional[str] = None
    paypal_webhook_id: Optional[str] = None
    gemini_api_key: Optional[str] = None
    business_name: Optional[str] = None
    currency: Optional[str] = None
