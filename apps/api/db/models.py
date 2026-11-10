from datetime import datetime, timezone, date
from decimal import Decimal
import uuid
from typing import Optional, List, Dict, Any

from sqlalchemy import (
    Column, String, Numeric, Integer, Float, Date, DateTime,
    ForeignKey, Text, JSON, Boolean
)
from sqlalchemy.orm import relationship
from apps.api.db.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class ProfileModel(Base):
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(100), unique=True, nullable=False, default="default_merchant")
    name = Column(String(150), nullable=False, default="Alex Morgan")
    business_name = Column(String(150), nullable=False, default="PixelCraft Studio")
    email = Column(String(150), nullable=False, default="alex@pixelcraft.studio")
    currency = Column(String(10), nullable=False, default="USD")
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

class AuthUserModel(Base):
    __tablename__ = "auth_users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(254), unique=True, nullable=False, index=True)
    password_hash = Column(String(256), nullable=False)
    user_id = Column(String(100), nullable=False, default="default_merchant", index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

class CustomerModel(Base):
    __tablename__ = "customers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(100), nullable=False, default="default_merchant", index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=True)
    company_name = Column(String(150), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    invoices = relationship("InvoiceModel", back_populates="customer", cascade="all, delete-orphan")

class InvoiceModel(Base):
    __tablename__ = "invoices"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(100), nullable=False, default="default_merchant", index=True)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    invoice_number = Column(String(50), unique=True, nullable=False)
    paypal_invoice_id = Column(String(100), unique=True, nullable=True, index=True)
    paypal_invoice_number = Column(String(100), nullable=True)
    amount = Column(Float, nullable=False, default=0.0)
    currency = Column(String(10), nullable=False, default="USD")
    status = Column(String(30), nullable=False, default="DRAFT", index=True) 
    # DRAFT, PENDING_APPROVAL, APPROVED, SENT, PAID, PARTIALLY_PAID, OVERDUE, CANCELLED
    due_date = Column(Date, nullable=True)
    memo = Column(Text, nullable=True)
    payment_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    customer = relationship("CustomerModel", back_populates="invoices")
    items = relationship("InvoiceItemModel", back_populates="invoice", cascade="all, delete-orphan")
    transactions = relationship("TransactionModel", back_populates="invoice")

class InvoiceItemModel(Base):
    __tablename__ = "invoice_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String(36), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    description = Column(String(255), nullable=False)
    quantity = Column(Float, nullable=False, default=1.0)
    unit_price = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False, default=0.0)

    invoice = relationship("InvoiceModel", back_populates="items")

class TransactionModel(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(100), nullable=False, default="default_merchant", index=True)
    invoice_id = Column(String(36), ForeignKey("invoices.id", ondelete="SET NULL"), nullable=True)
    paypal_order_id = Column(String(100), nullable=True)
    paypal_capture_id = Column(String(100), unique=True, nullable=True, index=True)
    amount = Column(Float, nullable=False, default=0.0)
    currency = Column(String(10), nullable=False, default="USD")
    status = Column(String(30), nullable=False, default="COMPLETED", index=True) 
    # COMPLETED, PENDING, REFUNDED, DENIED
    payment_source = Column(String(50), default="paypal")
    payer_name = Column(String(150), nullable=True)
    payer_email = Column(String(150), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    invoice = relationship("InvoiceModel", back_populates="transactions")

class ApprovalModel(Base):
    __tablename__ = "approvals"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(100), nullable=False, default="default_merchant", index=True)
    action_type = Column(String(50), nullable=False)
    # CREATE_INVOICE, SEND_INVOICE, CREATE_CHECKOUT_ORDER, SEND_REMINDER, CAPTURE_ORDER
    payload = Column(JSON, nullable=False)
    status = Column(String(30), nullable=False, default="PENDING", index=True)
    # PENDING, APPROVED, REJECTED, EXECUTED, FAILED
    execution_result = Column(JSON, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

class WebhookEventModel(Base):
    __tablename__ = "webhook_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    paypal_event_id = Column(String(100), unique=True, nullable=False, index=True)
    event_type = Column(String(100), nullable=False)
    payload = Column(JSON, nullable=False)
    status = Column(String(30), nullable=False, default="PROCESSED")
    processed_at = Column(DateTime(timezone=True), default=utc_now)
    created_at = Column(DateTime(timezone=True), default=utc_now)

class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(100), nullable=False, default="default_merchant", index=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(100), nullable=True)
    payload = Column(JSON, nullable=True)
    result = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

class AiSessionModel(Base):
    __tablename__ = "ai_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(100), nullable=False, default="default_merchant", index=True)
    title = Column(String(200), default="Financial Operations Assistant")
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    messages = relationship("AiMessageModel", back_populates="session", cascade="all, delete-orphan")

class AiMessageModel(Base):
    __tablename__ = "ai_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("ai_sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False) # user, assistant, system, tool
    content = Column(Text, nullable=False)
    tool_calls = Column(JSON, nullable=True)
    tool_results = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    session = relationship("AiSessionModel", back_populates="messages")
