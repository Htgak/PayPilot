import os
from datetime import datetime, timezone, timedelta
from decimal import Decimal
import uuid

from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from apps.api.config import settings

Base = declarative_base()

# SQLite or PostgreSQL
connect_args = {"check_same_thread": False, "timeout": 15} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)

if settings.database_url.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from apps.api.db.models import (
        ProfileModel, CustomerModel, InvoiceModel, InvoiceItemModel,
        TransactionModel, ApprovalModel, WebhookEventModel, AuditLogModel
    )
    Base.metadata.create_all(bind=engine)
    
    # Check if seed data exists
    with SessionLocal() as db:
        existing_profile = db.query(ProfileModel).filter_by(user_id="default_merchant").first()
        if not existing_profile:
            seed_initial_data(db)

def seed_initial_data(db: Session):
    from apps.api.db.models import (
        ProfileModel, CustomerModel, InvoiceModel, InvoiceItemModel,
        TransactionModel, AuditLogModel
    )
    
    now = datetime.now(timezone.utc)
    
    # 1. Profile
    profile = ProfileModel(
        id=str(uuid.uuid4()),
        user_id="default_merchant",
        name="Alex Morgan",
        business_name="PixelCraft Studio",
        email="alex@pixelcraft.studio",
        currency="USD"
    )
    db.add(profile)
    
    # 2. Customers
    cust1 = CustomerModel(
        id=str(uuid.uuid4()),
        user_id="default_merchant",
        name="Sarah Connor",
        email="sarah@cyberdyne.io",
        phone="+1 555-0192",
        company_name="Cyberdyne Systems"
    )
    cust2 = CustomerModel(
        id=str(uuid.uuid4()),
        user_id="default_merchant",
        name="Elena Rostova",
        email="elena@novatech.co",
        phone="+1 555-0144",
        company_name="NovaTech Solutions"
    )
    cust3 = CustomerModel(
        id=str(uuid.uuid4()),
        user_id="default_merchant",
        name="Marcus Vance",
        email="marcus@vanceagency.com",
        phone="+1 555-0188",
        company_name="Vance Digital Agency"
    )
    db.add_all([cust1, cust2, cust3])
    db.flush()
    
    # 3. Invoices & Items
    # Invoice 1: Paid ($1,250.00)
    inv1_id = str(uuid.uuid4())
    inv1 = InvoiceModel(
        id=inv1_id,
        user_id="default_merchant",
        customer_id=cust1.id,
        invoice_number="INV-2026-001",
        paypal_invoice_id="INV2-PC99-TX01",
        paypal_invoice_number="INV2-001",
        amount=1250.00,
        currency="USD",
        status="PAID",
        due_date=(now - timedelta(days=10)).date(),
        memo="Q4 Brand Identity & Design System delivery",
        payment_url="https://www.sandbox.paypal.com/invoice/p/#INV2-PC99-TX01",
        created_at=now - timedelta(days=25)
    )
    inv1_item1 = InvoiceItemModel(
        id=str(uuid.uuid4()),
        invoice_id=inv1_id,
        description="Brand Identity Guidelines & Assets",
        quantity=1.0,
        unit_price=800.00,
        total_amount=800.00
    )
    inv1_item2 = InvoiceItemModel(
        id=str(uuid.uuid4()),
        invoice_id=inv1_id,
        description="UI Component Library System",
        quantity=1.0,
        unit_price=450.00,
        total_amount=450.00
    )
    
    # Invoice 2: Sent / Outstanding ($3,400.00)
    inv2_id = str(uuid.uuid4())
    inv2 = InvoiceModel(
        id=inv2_id,
        user_id="default_merchant",
        customer_id=cust2.id,
        invoice_number="INV-2026-002",
        paypal_invoice_id="INV2-PC99-TX02",
        paypal_invoice_number="INV2-002",
        amount=3400.00,
        currency="USD",
        status="SENT",
        due_date=(now + timedelta(days=7)).date(),
        memo="Full-stack Next.js web application milestone 1",
        payment_url="https://www.sandbox.paypal.com/invoice/p/#INV2-PC99-TX02",
        created_at=now - timedelta(days=5)
    )
    inv2_item = InvoiceItemModel(
        id=str(uuid.uuid4()),
        invoice_id=inv2_id,
        description="Next.js Frontend & API Integration (Sprint 1)",
        quantity=1.0,
        unit_price=3400.00,
        total_amount=3400.00
    )
    
    # Invoice 3: Overdue ($850.00)
    inv3_id = str(uuid.uuid4())
    inv3 = InvoiceModel(
        id=inv3_id,
        user_id="default_merchant",
        customer_id=cust3.id,
        invoice_number="INV-2026-003",
        paypal_invoice_id="INV2-PC99-TX03",
        paypal_invoice_number="INV2-003",
        amount=850.00,
        currency="USD",
        status="OVERDUE",
        due_date=(now - timedelta(days=4)).date(),
        memo="Monthly SEO Optimization & Performance Tuning",
        payment_url="https://www.sandbox.paypal.com/invoice/p/#INV2-PC99-TX03",
        created_at=now - timedelta(days=34)
    )
    inv3_item = InvoiceItemModel(
        id=str(uuid.uuid4()),
        invoice_id=inv3_id,
        description="Monthly Technical SEO & Core Web Vitals audit",
        quantity=1.0,
        unit_price=850.00,
        total_amount=850.00
    )

    db.add_all([inv1, inv1_item1, inv1_item2, inv2, inv2_item, inv3, inv3_item])
    db.flush()

    # 4. Transactions (completed capture from Invoice 1, plus a direct checkout order)
    tx1 = TransactionModel(
        id=str(uuid.uuid4()),
        user_id="default_merchant",
        invoice_id=inv1_id,
        paypal_order_id="ORD-94827101",
        paypal_capture_id="CAP-71049281A",
        amount=1250.00,
        currency="USD",
        status="COMPLETED",
        payment_source="paypal_invoice",
        payer_name="Sarah Connor",
        payer_email="sarah@cyberdyne.io",
        created_at=now - timedelta(days=10)
    )
    tx2 = TransactionModel(
        id=str(uuid.uuid4()),
        user_id="default_merchant",
        invoice_id=None,
        paypal_order_id="ORD-88192300",
        paypal_capture_id="CAP-99214732B",
        amount=500.00,
        currency="USD",
        status="COMPLETED",
        payment_source="paypal_checkout",
        payer_name="David Kim",
        payer_email="david@acmecorp.com",
        created_at=now - timedelta(days=2)
    )
    db.add_all([tx1, tx2])

    # 5. Audit Log
    audit = AuditLogModel(
        id=str(uuid.uuid4()),
        user_id="default_merchant",
        action="SEED_INITIAL_DATA",
        entity_type="SYSTEM",
        entity_id="SETUP",
        payload={"message": "Initial PayPilot demo seed data populated"},
        result="SUCCESS",
        created_at=now
    )
    db.add(audit)
    db.commit()
