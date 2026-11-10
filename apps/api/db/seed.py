"""
Database Seeding Script for PayPilot
Seeds demo merchant data, customers, invoices, transactions, approval requests,
and registers the default owner user (from .env) both locally and directly on Supabase.
"""

import os
import sys
from datetime import datetime, timezone, timedelta, date
import uuid

# Add workspace root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

import httpx
from sqlalchemy.orm import Session
from apps.api.config import settings
from apps.api.db.database import SessionLocal, init_db, engine
from apps.api.db.models import (
    Base, ProfileModel, AuthUserModel, CustomerModel,
    InvoiceModel, InvoiceItemModel, TransactionModel,
    ApprovalModel, AuditLogModel
)
from apps.api.api.auth import _password_hash

DEMO_EMAIL = (os.getenv("DEFAULT_USER_EMAIL") or settings.default_user_email or "").strip().lower()
DEMO_PASSWORD = os.getenv("DEFAULT_USER_PASSWORD") or settings.default_user_password or ""
TENANT_ID = "default_merchant"

if not DEMO_EMAIL or not DEMO_PASSWORD:
    print("[!] Error: DEFAULT_USER_EMAIL and DEFAULT_USER_PASSWORD must be configured in .env.")
    sys.exit(1)

def utc_now():
    return datetime.now(timezone.utc)

def seed_supabase_user():
    """Directly creates or updates default user on Supabase Auth with email auto-confirmed."""
    supabase_url = settings.supabase_url
    service_role_key = settings.supabase_service_role_key

    if not supabase_url or not service_role_key:
        print("[-] Supabase URL or Service Role Key not set in environment. Skipping Supabase sync.")
        return

    print(f"[*] Connecting directly to Supabase Auth Admin at: {supabase_url}...")
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json"
    }

    try:
        # Check existing users in Supabase Auth
        list_url = f"{supabase_url.rstrip('/')}/auth/v1/admin/users"
        resp = httpx.get(list_url, headers=headers, timeout=10.0)

        existing_user_id = None
        if resp.status_code == 200:
            users_data = resp.json().get("users", [])
            for u in users_data:
                if u.get("email", "").lower() == DEMO_EMAIL.lower():
                    existing_user_id = u.get("id")
                    break

        if existing_user_id:
            # Update password and ensure email_confirm is True
            update_url = f"{supabase_url.rstrip('/')}/auth/v1/admin/users/{existing_user_id}"
            up_resp = httpx.put(update_url, headers=headers, json={
                "password": DEMO_PASSWORD,
                "email_confirm": True
            }, timeout=10.0)
            if up_resp.status_code in (200, 204):
                print(f"[+] Successfully updated Supabase user '{DEMO_EMAIL}' with confirmed email.")
            else:
                print(f"[!] Supabase user update returned status {up_resp.status_code}: {up_resp.text}")
        else:
            # Create user directly with email_confirm: True (no verification email sent)
            create_resp = httpx.post(list_url, headers=headers, json={
                "email": DEMO_EMAIL,
                "password": DEMO_PASSWORD,
                "email_confirm": True,
                "user_metadata": {
                    "name": "Demo User",
                    "role": "owner"
                }
            }, timeout=10.0)
            if create_resp.status_code in (200, 201):
                print(f"[+] Successfully created '{DEMO_EMAIL}' directly on Supabase (email confirmed, no email sent).")
            else:
                print(f"[!] Supabase user creation returned status {create_resp.status_code}: {create_resp.text}")

    except Exception as exc:
        print(f"[!] Supabase Auth sync notice: {exc}")
        print("    (Local database seeding continues normally.)")


def seed_local_db():
    """Seeds SQLite/Postgres database with complete demo datasets."""
    print("[*] Initializing database tables...")
    init_db()

    db: Session = SessionLocal()
    try:
        # 1. Seed or update Auth User
        user = db.query(AuthUserModel).filter_by(email=DEMO_EMAIL).first()
        hashed = _password_hash(DEMO_PASSWORD)
        if user:
            user.password_hash = hashed
            print(f"[+] Updated local auth credentials for: {DEMO_EMAIL}")
        else:
            user = AuthUserModel(
                id=str(uuid.uuid4()),
                email=DEMO_EMAIL,
                password_hash=hashed,
                user_id=TENANT_ID,
                created_at=utc_now()
            )
            db.add(user)
            print(f"[+] Created local auth user: {DEMO_EMAIL} (password: {DEMO_PASSWORD})")

        # 2. Seed or update Profile
        profile = db.query(ProfileModel).filter_by(user_id=TENANT_ID).first()
        if not profile:
            profile = ProfileModel(
                id=str(uuid.uuid4()),
                user_id=TENANT_ID,
                name="Alex Morgan",
                business_name="PixelCraft Studio",
                email="alex@pixelcraft.studio",
                currency="USD"
            )
            db.add(profile)
            print("[+] Created merchant profile: PixelCraft Studio (Alex Morgan)")
        else:
            profile.business_name = "PixelCraft Studio"
            profile.name = "Alex Morgan"
            profile.currency = "USD"
            print("[+] Verified merchant profile: PixelCraft Studio")

        # 3. Seed Customers
        customers_spec = [
            {
                "name": "Sarah Connor",
                "email": "sarah@cyberdyne.io",
                "company_name": "Cyberdyne Systems",
                "phone": "+1 (555) 019-2834"
            },
            {
                "name": "Marcus Vance",
                "email": "billing@acmecorp.com",
                "company_name": "Acme Global Industries",
                "phone": "+1 (555) 234-5678"
            },
            {
                "name": "Elena Rostova",
                "email": "finance@techflow.io",
                "company_name": "TechFlow Cloud Solutions",
                "phone": "+1 (555) 345-6789"
            },
            {
                "name": "Jordan Chen",
                "email": "accounts@starlight.co",
                "company_name": "Starlight Media Agency",
                "phone": "+1 (555) 876-5432"
            }
        ]

        customer_map = {}
        for c in customers_spec:
            existing = db.query(CustomerModel).filter_by(email=c["email"]).first()
            if not existing:
                cust = CustomerModel(
                    id=str(uuid.uuid4()),
                    user_id=TENANT_ID,
                    name=c["name"],
                    email=c["email"],
                    company_name=c["company_name"],
                    phone=c["phone"]
                )
                db.add(cust)
                db.flush()
                customer_map[c["email"]] = cust
            else:
                customer_map[c["email"]] = existing

        print(f"[+] Loaded {len(customer_map)} customer accounts.")

        # 4. Seed Invoices
        today = date.today()
        invoices_spec = [
            {
                "num": "INV-202611-001",
                "cust": "billing@acmecorp.com",
                "amount": 3500.00,
                "status": "PAID",
                "due": today - timedelta(days=12),
                "memo": "Full-stack Web App Development & Cloud Migration (Milestone 1)",
                "paypal_id": "INV2-SBX-ACME-001",
                "items": [
                    ("Custom Dashboard Development", 1.0, 2000.00),
                    ("PayPal Checkout & Webhook Integration", 1.0, 1500.00)
                ]
            },
            {
                "num": "INV-202611-002",
                "cust": "finance@techflow.io",
                "amount": 1250.00,
                "status": "PAID",
                "due": today - timedelta(days=5),
                "memo": "REST API Architecture & Microservice Integration",
                "paypal_id": "INV2-SBX-TECH-002",
                "items": [
                    ("REST API Implementation", 1.0, 1000.00),
                    ("Automated Verification Suite", 1.0, 250.00)
                ]
            },
            {
                "num": "INV-202611-003",
                "cust": "sarah@cyberdyne.io",
                "amount": 850.00,
                "status": "OVERDUE",
                "due": today - timedelta(days=7),
                "memo": "UX Design, Design System Tokens & High-Fidelity Prototypes",
                "paypal_id": "INV2-SBX-CYBER-003",
                "items": [
                    ("Design System Tokens", 1.0, 500.00),
                    ("Interactive Component Specs", 1.0, 350.00)
                ]
            },
            {
                "num": "INV-202611-004",
                "cust": "accounts@starlight.co",
                "amount": 2100.00,
                "status": "SENT",
                "due": today + timedelta(days=14),
                "memo": "Brand Identity Design & Content Architecture",
                "paypal_id": "INV2-SBX-STAR-004",
                "items": [
                    ("Brand Strategy & Visual Guidelines", 1.0, 1400.00),
                    ("Social Media Template Kit", 1.0, 700.00)
                ]
            },
            {
                "num": "INV-202611-005",
                "cust": "sarah@cyberdyne.io",
                "amount": 450.00,
                "status": "DRAFT",
                "due": today + timedelta(days=21),
                "memo": "Monthly Security Audit & API Observability Monitoring",
                "paypal_id": "INV2-SBX-CYBER-005",
                "items": [
                    ("Security Scan & Compliance Report", 1.0, 450.00)
                ]
            }
        ]

        invoice_count = 0
        for inv_data in invoices_spec:
            existing = db.query(InvoiceModel).filter_by(invoice_number=inv_data["num"]).first()
            if not existing:
                cust = customer_map.get(inv_data["cust"])
                inv = InvoiceModel(
                    id=str(uuid.uuid4()),
                    user_id=TENANT_ID,
                    customer_id=cust.id if cust else None,
                    invoice_number=inv_data["num"],
                    paypal_invoice_id=inv_data["paypal_id"],
                    paypal_invoice_number=inv_data["num"],
                    amount=inv_data["amount"],
                    currency="USD",
                    status=inv_data["status"],
                    due_date=inv_data["due"],
                    memo=inv_data["memo"],
                    payment_url=f"https://www.sandbox.paypal.com/invoice/p/#{inv_data['paypal_id']}",
                    created_at=utc_now() - timedelta(days=14),
                    updated_at=utc_now()
                )
                db.add(inv)
                db.flush()

                for desc, qty, price in inv_data["items"]:
                    item = InvoiceItemModel(
                        id=str(uuid.uuid4()),
                        invoice_id=inv.id,
                        description=desc,
                        quantity=qty,
                        unit_price=price,
                        total_amount=round(qty * price, 2)
                    )
                    db.add(item)
                invoice_count += 1

        print(f"[+] Added {invoice_count} demo invoices with line items.")

        # 5. Seed Transactions (Revenue)
        transactions_spec = [
            {
                "order_id": "ORD-SBX-ACME-901",
                "capture_id": "CAP-SBX-ACME-901",
                "amount": 3500.00,
                "payer_name": "Marcus Vance",
                "payer_email": "billing@acmecorp.com",
                "days_ago": 10
            },
            {
                "order_id": "ORD-SBX-TECH-902",
                "capture_id": "CAP-SBX-TECH-902",
                "amount": 1250.00,
                "payer_name": "Elena Rostova",
                "payer_email": "finance@techflow.io",
                "days_ago": 4
            },
            {
                "order_id": "ORD-SBX-DIRECT-903",
                "capture_id": "CAP-SBX-DIRECT-903",
                "amount": 650.00,
                "payer_name": "Sandbox Buyer",
                "payer_email": "buyer@sandbox.paypal.com",
                "days_ago": 1
            }
        ]

        tx_count = 0
        for tx in transactions_spec:
            existing = db.query(TransactionModel).filter_by(paypal_capture_id=tx["capture_id"]).first()
            if not existing:
                t = TransactionModel(
                    id=str(uuid.uuid4()),
                    user_id=TENANT_ID,
                    paypal_order_id=tx["order_id"],
                    paypal_capture_id=tx["capture_id"],
                    amount=tx["amount"],
                    currency="USD",
                    status="COMPLETED",
                    payment_source="paypal_checkout",
                    payer_name=tx["payer_name"],
                    payer_email=tx["payer_email"],
                    created_at=utc_now() - timedelta(days=tx["days_ago"])
                )
                db.add(t)
                tx_count += 1

        print(f"[+] Added {tx_count} revenue transactions.")

        # 6. Seed Pending Approvals for AI Agent
        approvals_spec = [
            {
                "type": "SEND_REMINDER",
                "status": "PENDING",
                "payload": {
                    "action_type": "SEND_REMINDER",
                    "invoice_number": "INV-202611-003",
                    "customer_name": "Sarah Connor",
                    "customer_email": "sarah@cyberdyne.io",
                    "amount": 850.00,
                    "currency": "USD",
                    "days_overdue": 7,
                    "reminder_copy": "Hi Sarah,\n\nA gentle reminder that invoice INV-202611-003 for $850.00 (UX Design) was due on Nov 3. You can review and complete payment securely via PayPal here: https://www.sandbox.paypal.com/invoice/p/#INV2-SBX-CYBER-003.\n\nThank you,\nPixelCraft Studio"
                }
            },
            {
                "type": "CREATE_INVOICE",
                "status": "PENDING",
                "payload": {
                    "action_type": "CREATE_INVOICE",
                    "customer_name": "Sarah Connor",
                    "customer_email": "sarah@cyberdyne.io",
                    "amount": 450.00,
                    "currency": "USD",
                    "memo": "Monthly Security Audit & API Observability Monitoring",
                    "items": [
                        {"description": "Security Scan & Compliance Report", "quantity": 1.0, "unit_price": 450.0, "total_amount": 450.0}
                    ]
                }
            }
        ]

        approval_count = 0
        for apprv in approvals_spec:
            existing = db.query(ApprovalModel).filter(
                ApprovalModel.action_type == apprv["type"],
                ApprovalModel.status == "PENDING"
            ).first()
            if not existing:
                a = ApprovalModel(
                    id=str(uuid.uuid4()),
                    user_id=TENANT_ID,
                    action_type=apprv["type"],
                    payload=apprv["payload"],
                    status="PENDING",
                    expires_at=utc_now() + timedelta(days=3),
                    created_at=utc_now()
                )
                db.add(a)
                approval_count += 1

        print(f"[+] Added {approval_count} pending agent approvals.")

        # 7. Record an Audit Log
        db.add(AuditLogModel(
            id=str(uuid.uuid4()),
            user_id=TENANT_ID,
            action="DATABASE_SEEDED",
            entity_type="SYSTEM",
            entity_id="paypilot_seed",
            payload={
                "message": "Demo datasets and demo user seeded successfully.",
                "actor": DEMO_EMAIL,
                "timestamp": utc_now().isoformat()
            },
            result="SUCCESS",
            created_at=utc_now()
        ))

        db.commit()
        print("[+] Database seeding committed successfully!")

    except Exception as exc:
        db.rollback()
        print(f"[!] Error seeding database: {exc}")
        raise
    finally:
        db.close()


def main():
    print("=" * 60)
    print("  PayPilot AI - Database Seeding & User Setup")
    print(f"  User:     {DEMO_EMAIL}")
    print(f"  Password: {DEMO_PASSWORD}")
    print("=" * 60)

    # 1. Local Database
    seed_local_db()

    # 2. Supabase User directly
    seed_supabase_user()

    print("=" * 60)
    print("  SEEDING COMPLETE!")
    print(f"  Login at http://localhost:3000/login")
    print(f"  Email:    {DEMO_EMAIL}")
    print(f"  Password: {DEMO_PASSWORD}")
    print("=" * 60)

if __name__ == "__main__":
    main()
