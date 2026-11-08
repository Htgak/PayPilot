# PayPilot — System Architecture

**Hackathon:** PayPal AI Hackathon 2026  
**Product:** PayPilot — The AI Financial Operations Copilot for Independent Businesses  

---

## 1. Architectural Overview

PayPilot is architected around an **approval-based agentic workflow** where artificial intelligence assists, extracts, drafts, and analyzes financial operations, while human oversight strictly gates every external financial execution (e.g. creating PayPal invoices, sending invoices, creating checkout orders, dispatching overdue reminders).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PayPilot Web Application                        │
│             (Next.js App Router, Tailwind CSS, Lucide, Recharts)        │
│                                                                        │
│  ┌──────────────────┐  ┌───────────────────┐  ┌─────────────────────┐  │
│  │ Monef Dashboard  │  │ AI Copilot Drawer │  │ Invoices & Payments │  │
│  │  Metrics & Graph │  │  Approval Cards   │  │ PayPal Checkout UIs │  │
│  └────────┬─────────┘  └─────────┬─────────┘  └──────────┬──────────┘  │
└───────────┼──────────────────────┼───────────────────────┼─────────────┘
            │                      │                       │
            ▼                      ▼                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FastAPI Backend Engine                          │
│                                                                        │
│  ┌──────────────────┐  ┌───────────────────┐  ┌─────────────────────┐  │
│  │ REST Endpoints   │  │ Financial Agent   │  │ Approval Engine     │  │
│  │ /api/dashboard   │  │ Tool Calling Loop │  │ Action Authorization│  │
│  │ /api/invoices    │  │ Intent Extraction │  │ Idempotency Checks  │  │
│  └────────┬─────────┘  └─────────┬─────────┘  └──────────┬──────────┘  │
│           │                      │                       │             │
│           ▼                      ▼                       ▼             │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                       Services & Security                        │  │
│  │ Audit Logger · Analytics Engine · Currency Decimal Math · PDFs   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────┬────────────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌───────────────────────────────┐  ┌─────────────────────────────────────┐
│    PayPal Developer REST      │  │        Supabase / PostgreSQL        │
│  ┌─────────────────────────┐  │  │  ┌────────────────────────────────┐ │
│  │ Invoicing API v2        │  │  │  │ profiles · customers           │ │
│  │ Orders API v2           │  │  │  │ invoices · invoice_items       │ │
│  │ Webhooks Engine         │  │  │  │ transactions · audit_logs      │ │
│  │ OAuth2 Token Cache      │  │  │  │ approvals · ai_sessions        │ │
│  └─────────────────────────┘  │  │  └────────────────────────────────┘ │
└───────────────────────────────┘  └─────────────────────────────────────┘
```

---

## 2. Core Agentic Workflow & Tool Calling Loop

Traditional chatbots merely output conversational text. PayPilot turns instructions into atomic, verifiable financial operations:

```mermaid
sequenceDiagram
    autonumber
    actor Merchant as Business Owner
    participant Web as Web App (Next.js)
    participant Agent as Agent Orchestrator (FastAPI)
    participant Approvals as Approval Engine
    participant PayPal as PayPal Sandbox REST API
    participant DB as Supabase / DB

    Merchant->>Web: "Create invoice for $500 for Website Development to client@acme.com"
    Web->>Agent: POST /api/agent/chat
    Agent->>Agent: Extract parameters (Client, Amount, Currency, Line Items)
    Agent->>Approvals: Create Pending Approval Action (CREATE_INVOICE)
    Approvals-->>Agent: Action ID & Proposal Card
    Agent-->>Web: Structured Response + Interactive Approval Card
    
    Merchant->>Web: Clicks "Approve & Create PayPal Invoice"
    Web->>Approvals: POST /api/approvals/{id}/confirm
    Approvals->>PayPal: POST /v2/invoicing/invoices (Draft)
    PayPal-->>Approvals: PayPal Invoice ID (e.g. INV2-ABCD-1234)
    Approvals->>DB: Store Invoice + Items + Audit Log
    Approvals-->>Web: Action Succeeded & PayPal Status

    Merchant->>Web: "Send this invoice to the client"
    Web->>Agent: "Send invoice"
    Agent->>Approvals: Create SEND_INVOICE Action
    Merchant->>Web: Approves Send
    Approvals->>PayPal: POST /v2/invoicing/invoices/{id}/send
    PayPal-->>Approvals: Status = SENT
    Approvals->>DB: Update Status = SENT
    Approvals-->>Web: PayPal Invoice dispatched with payment link
```

---

## 3. Webhook Synchronization & Payment Capture

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Client / Payer
    participant PayPal as PayPal Sandbox
    participant Webhook as POST /api/webhooks/paypal
    participant DB as Supabase / DB
    participant Dashboard as Real-time Dashboard

    Customer->>PayPal: Pays via PayPal Checkout or Invoicing Link
    PayPal->>Webhook: Webhook Event: PAYMENT.CAPTURE.COMPLETED / INVOICING.INVOICE.PAID
    Webhook->>Webhook: Verify PayPal Signature & Check Deduplication (paypal_event_id)
    Webhook->>DB: Insert into webhook_events
    Webhook->>DB: Update invoice status -> PAID
    Webhook->>DB: Insert transaction record (paypal_capture_id, amount)
    Webhook->>DB: Record in audit_logs
    Webhook-->>Dashboard: State synchronized
```

---

## 4. Key Differentiators

1. **Approval-First Safety**: AI never transacts autonomously. Financial writes generate an approval card containing exact numbers and parameters for explicit merchant confirmation.
2. **Double-Entry Traceability**: Every operation generates an audit log record linking the user prompt, AI decision, human confirmation, PayPal API transaction ID, and database state.
3. **Resilient Dual-Mode Integration**: Operates seamlessly against the live PayPal Sandbox REST API, with intelligent self-contained simulation fallbacks for offline testing and reviewer evaluations.
4. **Calculated Financial Truth**: Financial insights, revenue calculations, and overdue reminders are computed with exact decimal math from database transactions—never hallucinated by an LLM.
