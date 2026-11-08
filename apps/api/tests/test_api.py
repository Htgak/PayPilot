import pytest
from fastapi.testclient import TestClient
from apps.api.main import app
from apps.api.db.database import init_db

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    init_db()

@pytest.fixture
def client():
    return TestClient(app)

def test_root_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_dashboard_summary(client):
    res = client.get("/api/dashboard/summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_revenue" in data
    assert "outstanding_invoices_amount" in data
    assert data["total_revenue"] >= 0

def test_get_invoices(client):
    res = client.get("/api/invoices")
    assert res.status_code == 200
    invoices = res.json()
    assert isinstance(invoices, list)
    assert len(invoices) > 0

def test_ai_agent_chat_revenue(client):
    res = client.post("/api/agent/chat", json={"message": "Show my revenue this month"})
    assert res.status_code == 200
    data = res.json()
    assert "response" in data
    assert "revenue" in data["response"].lower()

def test_ai_agent_invoice_proposal_and_approval(client):
    # Step 1: User asks AI to create an invoice
    chat_res = client.post(
        "/api/agent/chat",
        json={"message": "Create an invoice for $500 for website design for Sarah Connor at sarah@cyberdyne.io"}
    )
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert len(chat_data["action_proposals"]) > 0

    proposal = chat_data["action_proposals"][0]
    approval_id = proposal["approval_id"]
    assert proposal["action_type"] == "CREATE_INVOICE"

    # Step 2: User confirms approval
    approve_res = client.post(f"/api/approvals/{approval_id}/confirm")
    assert approve_res.status_code == 200
    approve_data = approve_res.json()
    assert approve_data["status"] == "EXECUTED"
    assert "invoice_id" in approve_data["execution_result"]

def test_create_and_capture_checkout_order(client):
    # Create order
    order_res = client.post("/api/payments/orders", json={"amount": 250.0, "currency": "USD"})
    assert order_res.status_code == 200
    order_data = order_res.json()
    order_id = order_data["order_id"]
    assert order_id is not None

    # Capture order
    capture_res = client.post(f"/api/payments/{order_id}/capture")
    assert capture_res.status_code == 200
    tx_data = capture_res.json()
    assert tx_data["status"] == "COMPLETED"

def test_download_invoice_pdf(client):
    # Get first invoice
    inv_res = client.get("/api/invoices")
    inv_id = inv_res.json()[0]["id"]

    pdf_res = client.get(f"/api/invoices/{inv_id}/pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 1000
