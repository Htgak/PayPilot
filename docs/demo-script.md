# PayPilot — 3-Minute Hackathon Demo Script

**PayPal AI Hackathon 2026**  
**Role:** AI Financial Operations Copilot for Independent Businesses  

---

## 🎬 Act 1: The Problem (0:00 - 0:30)
* **Visual:** Open PayPilot Dashboard (`http://localhost:3000/dashboard`).
* **Narrator:** *"Independent freelancers, creators, and agencies lose hours juggling invoices, reconciling payments, and chasing overdue clients across spreadsheets and payment consoles. Traditional dashboards only show static data. PayPilot transforms business intent into real PayPal financial execution through an approval-governed AI agent."*
* **Highlight:** Point to the Monef-inspired dark executive dashboard with real-time Net Revenue, Outstanding Invoices, and the AI Copilot side-dock.

---

## 🚀 Act 2: Natural-Language Invoice Creation & Approval Gate (0:30 - 1:30)
* **Visual:** Click into the AI Copilot (`/assistant`) or open the side drawer.
* **Action:** Type:  
  `"Create an invoice for $750 for Brand Identity & UI Design for Sarah Connor at sarah@skynet.com due in 14 days."`
* **Agent Reasoning:** AI parses customer details, extracts line items, validates monetary units, and creates an **Approval Card**.
* **Key Demonstration:** Notice the safety gate! AI **does not** unilaterally transmit invoices or withdraw money. It presents the structured invoice card:
  - Recipient: Sarah Connor (sarah@skynet.com)
  - Amount: $750.00 USD
  - Item: Brand Identity & UI Design
  - Status: *Pending Merchant Approval*
* **Execution:** Merchant reviews and clicks **"Approve & Execute PayPal Invoicing"**.
* **Result:** Backend invokes PayPal Invoicing API v2 (`POST /v2/invoicing/invoices`), creating draft `INV2-XXXX-XXXX`, and generates the shareable payment link!

---

## 💳 Act 3: Customer Sandbox Checkout & Real-time Webhook (1:30 - 2:15)
* **Visual:** Switch to Customer Payment Portal / PayPal Sandbox Checkout (`/checkout/[order_id]` or PayPal Sandbox approval).
* **Action:** Customer pays using PayPal Sandbox test account or 1-click test simulation.
* **Backend Flow:** PayPal emits `PAYMENT.CAPTURE.COMPLETED`. PayPilot webhook verifies signature, deduplicates event ID, updates invoice status to `PAID`, and logs the capture ID.
* **Instant Refresh:** In PayPilot, the invoice instantly flips to **PAID** and Net Revenue increases by $750.00!

---

## 🧠 Act 4: Financial Intelligence & Smart Reminders (2:15 - 2:45)
* **Visual:** Return to AI Copilot.
* **Action 1:** Ask: `"What is my total revenue this month and which invoices are still outstanding?"`
  - Agent computes real decimal totals from the database and provides a clear breakdown.
* **Action 2:** Ask: `"Which invoices are overdue? Prepare a reminder for any unpaid invoice."`
  - Agent detects overdue invoices, drafts a cordial yet professional reminder, and provides an **"Approve & Send PayPal Reminder"** action card.
* **Action 3:** Click **"Download PDF"** on an invoice to showcase formatted, professional PDF generation.

---

## 🏁 Act 5: Summary & Tech Stack (2:45 - 3:00)
* **Visual:** Show Settings page with PayPal Sandbox connection status & Audit Log.
* **Narrator:** *"PayPilot combines Next.js, FastAPI, Supabase, and PayPal REST APIs (Invoicing v2, Orders v2, and Webhooks) with an approval-based AI agent. Real PayPal workflows, zero hallucination risk, total financial control."*
