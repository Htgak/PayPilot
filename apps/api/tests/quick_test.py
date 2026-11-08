import sys
import os
sys.path.insert(0, os.path.abspath("."))

import asyncio
from apps.api.db.database import SessionLocal, init_db
from apps.api.agents.orchestrator import agent_orchestrator
from apps.api.tools.financial_tools import execute_approved_action, get_financial_summary
from apps.api.services.pdf_service import generate_invoice_pdf
from apps.api.db.models import InvoiceModel, ProfileModel

def test_full_pipeline():
    print("STEP 0: Starting test", flush=True)
    init_db()
    print("STEP 0.5: DB initialized", flush=True)
    db = SessionLocal()
    
    # 1. Summary
    summary = get_financial_summary(db)
    print("1. Financial Summary Total Revenue:", summary["total_revenue"], flush=True)

    # 2. AI Agent Chat: create invoice
    print("STEP 1.5: Calling agent_orchestrator.process_message", flush=True)
    chat_res = asyncio.run(agent_orchestrator.process_message(
        db,
        "Create an invoice for $850 for Full-stack API integration to Sarah Connor at sarah@cyberdyne.io"
    ))
    print("2. AI Chat Response:", flush=True)
    print("   Proposals:", len(chat_res["action_proposals"]))
    assert len(chat_res["action_proposals"]) == 1
    proposal = chat_res["action_proposals"][0]
    print("   Proposal Title:", proposal["title"])
    print("   Status:", proposal["status"])

    # 3. Approve Action
    approval_id = proposal["approval_id"]
    exec_result = asyncio.run(execute_approved_action(db, approval_id))
    print("3. Executed Action Result:")
    print("   Invoice Number:", exec_result["invoice_number"])
    print("   PayPal Invoice ID:", exec_result["paypal_invoice_id"])
    print("   Payment URL:", exec_result["payment_url"])

    # 4. Overdue check & reminder proposal
    chat_reminder = asyncio.run(agent_orchestrator.process_message(
        db,
        "Which invoices are overdue? Prepare a reminder."
    ))
    print("4. Overdue Reminder Chat:")
    print("   Proposals:", len(chat_reminder["action_proposals"]))
    if chat_reminder["action_proposals"]:
        rem_prop = chat_reminder["action_proposals"][0]
        print("   Reminder Title:", rem_prop["title"])

    # 5. PDF generation
    inv = db.query(InvoiceModel).filter_by(id=exec_result["invoice_id"]).first()
    prof = db.query(ProfileModel).first()
    pdf_bytes = generate_invoice_pdf(inv, prof)
    print("5. Generated Invoice PDF size:", len(pdf_bytes), "bytes")

    print("\n✅ PIPELINE COMPLETED WITH 100% SUCCESS!")

if __name__ == "__main__":
    test_full_pipeline()
