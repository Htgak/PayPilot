# PayPilot — AI Financial Operations Agent 🧭💳

> **Submission for PayPal AI Hackathon 2026**  
> *An AI-powered financial operations copilot for freelancers, creators, agencies, and independent businesses.*

---

## 🌟 Executive Summary

PayPilot is not just another finance dashboard. It is an **approval-governed AI agent** that understands natural-language business instructions, selects the appropriate PayPal developer tools, creates structured proposals, requests merchant confirmation, and executes live operations against the **PayPal Developer Platform** (Invoicing API v2 and Orders API v2).

```
"Create an invoice for $750 for Brand Identity to Sarah Connor at sarah@cyberdyne.io"
                              │
                              ▼
                PayPilot AI Intent Parser
                              │
                              ▼
            Controlled Financial Tool Calling
                              │
                              ▼
         🛡️ Approval Gate Card (Merchant Reviews)
                              │
                       [User Approves]
                              │
                              ▼
             PayPal Invoicing API v2 Draft
                              │
                              ▼
          Customer Sandbox Checkout / Webhook
                              │
                              ▼
        Monef Corporate Finance Dashboard Synced
```

---

## 🚀 Key Differentiators

1. **Human-in-the-Loop Safety Gate**: The agent never transacts autonomously. Financial writes generate an interactive proposal card containing exact numbers and parameters for explicit merchant confirmation before hitting the PayPal API.
2. **Calculated Financial Truth**: Financial metrics and overdue calculations are computed directly from verified database records with decimal precision—never hallucinated by an LLM.
3. **Official PayPal REST APIs**:
   - **Invoicing API v2**: Draft generation (`POST /v2/invoicing/invoices`), sending (`POST /v2/invoicing/invoices/{id}/send`), reminders (`POST /v2/invoicing/invoices/{id}/remind`), and cancellations.
   - **Orders API v2**: Checkout order creation (`POST /v2/checkout/orders`) and capture (`POST /v2/checkout/orders/{id}/capture`).
   - **Webhooks**: Deduplicated event ingestion with PayPal signature verification.
4. **Monef-Inspired Dark Corporate UI**: High-end fintech dashboard built with Next.js 14, Tailwind CSS, Recharts, and Lucide icons.
5. **Dual-Mode Resilient Engine**: Operates seamlessly against the live PayPal Sandbox REST API, with intelligent self-contained simulation fallbacks for offline testing and reviewer evaluations.

---

## 🏗️ System Architecture

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
└───────────┬──────────────────────────────────────────────┬─────────────┘
            │                                              │
            ▼                                              ▼
┌───────────────────────────────┐              ┌─────────────────────────┐
│     PayPal REST APIs v2       │              │  Supabase / PostgreSQL  │
│ Invoicing · Orders · Webhooks │              │  Audit Logs & Ledger    │
└───────────────────────────────┘              └─────────────────────────┘
```

---

## 📦 Monorepo Directory Structure

```
paypilot/
├── apps/
│   ├── web/                     # Next.js TypeScript frontend (App Router)
│   │   ├── app/
│   │   │   ├── dashboard/       # Monef Executive Financial Dashboard
│   │   │   ├── assistant/       # Full-screen AI FinOps Copilot
│   │   │   ├── invoices/        # Invoicing v2 Management & PDF Generator
│   │   │   ├── transactions/    # Double-entry Transaction Ledger
│   │   │   ├── checkout/        # PayPal Sandbox Checkout Portal
│   │   │   └── settings/        # PayPal Credentials & Webhook Simulator
│   │   ├── components/          # Reusable Monef cards & ApprovalCard
│   │   └── lib/api.ts           # Type-safe API client
│   └── api/                     # FastAPI Python backend
│       ├── main.py              # Application entrypoint & CORS
│       ├── config.py            # Pydantic Settings
│       ├── db/                  # SQLite / Supabase database & models
│       ├── agents/              # Orchestrator & Gemini Flash tool loop
│       ├── tools/               # Controlled financial tools
│       ├── integrations/paypal/ # PayPal REST API client & OAuth token cache
│       ├── services/            # Audit logging & ReportLab PDF generation
│       └── api/                 # REST endpoints
├── supabase/
│   └── migrations/              # Supabase PostgreSQL schema migration
├── docs/
│   ├── architecture.md          # Full architectural breakdown & diagrams
│   ├── api.md                   # REST API specification
│   └── demo-script.md           # 3-minute hackathon presentation script
├── .env.example
├── LICENSE
└── README.md
```

---

## ⚡ Quickstart Guide

### Prerequisites
- **Node.js**: v18+ (tested on v24)
- **Python**: v3.10+ (tested on v3.13)
- **pnpm**: v9+

### 1. Backend Setup (FastAPI)
```bash
# Navigate to backend directory
cd apps/api

# Create & activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend server (auto-seeds demo records)
uvicorn apps.api.main:app --reload --port 8000
```
Backend will be live at `http://localhost:8000` (Swagger docs at `http://localhost:8000/docs`).

### 2. Frontend Setup (Next.js)
```bash
# In a new terminal, navigate to web directory
cd apps/web

# Install dependencies
pnpm install

# Start development server
pnpm dev
```
Open `http://localhost:3000` to access the PayPilot platform.

---

## ⚙️ Configuration (.env)

Copy `.env.example` to `.env`:
```ini
# Application
APP_ENV=development
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# PayPal Sandbox (Get from https://developer.paypal.com/dashboard)
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_paypal_sandbox_client_secret
PAYPAL_WEBHOOK_ID=your_paypal_sandbox_webhook_id

# AI Provider (Optional: fallback heuristic agent active if unset)
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
AI_MODEL=gemini-1.5-flash

# Database (Default uses local SQLite with zero external dependencies)
DATABASE_URL=sqlite:///./paypilot.db
```

*Note: If PayPal sandbox credentials are empty, PayPilot automatically switches to a high-fidelity sandbox simulation mode so all reviewer flows (invoice generation, approvals, payments, PDF downloads) can be evaluated without any setup barrier.*

---

## 🧪 Testing

Run backend end-to-end integration tests:
```bash
python -u apps/api/tests/verify_endpoints.py
```
This tests:
- Health check
- Dashboard financial metrics calculation
- Invoice draft creation
- AI Agent intent parsing & tool proposal generation
- Approval gate execution (`POST /api/approvals/{id}/confirm`)
- PayPal Orders v2 creation & capture
- ReportLab PDF invoice generation

---

## 📄 License
MIT License. Built for the PayPal AI Hackathon 2026.
