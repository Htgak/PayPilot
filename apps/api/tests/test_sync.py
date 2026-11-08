import sys
import os
sys.path.insert(0, os.path.abspath("."))

from apps.api.db.database import SessionLocal, init_db
from apps.api.agents.orchestrator import agent_orchestrator
from apps.api.tools.financial_tools import get_financial_summary

init_db()
db = SessionLocal()
print("1. Summary:", get_financial_summary(db))

reply, proposals, calls = agent_orchestrator._run_heuristic_agent(
    db,
    "Create an invoice for $850 for UX Design to Sarah Connor at sarah@cyberdyne.io",
    "default_merchant"
)
print("2. Reply length:", len(reply))
print("3. Proposals:", len(proposals))
print("4. Proposal 0 title:", proposals[0]["title"] if proposals else "None", flush=True)

import asyncio
from apps.api.tools.financial_tools import execute_approved_action
from apps.api.services.pdf_service import generate_invoice_pdf
from apps.api.db.models import InvoiceModel, ProfileModel

approval_id = proposals[0]["approval_id"]
print("4.5 Calling execute_approved_action with id:", approval_id, flush=True)
exec_result = asyncio.run(execute_approved_action(db, approval_id))
print("5. Executed Action:", flush=True)
print("   Invoice Number:", exec_result["invoice_number"], flush=True)
print("   PayPal Invoice ID:", exec_result["paypal_invoice_id"], flush=True)
print("   Payment URL:", exec_result["payment_url"], flush=True)

# PDF Test
print("5.5 Querying invoice for PDF", flush=True)
inv = db.query(InvoiceModel).filter_by(id=exec_result["invoice_id"]).first()
prof = db.query(ProfileModel).first()
print("5.6 Generating PDF", flush=True)
pdf_bytes = generate_invoice_pdf(inv, prof)
print("6. Generated Invoice PDF size:", len(pdf_bytes), "bytes", flush=True)

print("SUCCESS!", flush=True)
