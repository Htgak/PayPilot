# PayPilot — REST API Specification

**Base URL:** `http://localhost:8000/api`  
**Authentication:** Bearer token / Merchant Header (default merchant user in development)

---

## Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/agent/chat` | AI Copilot conversational assistant with tool calling and proposal cards |
| `GET` | `/dashboard/summary` | Real-time financial summary metrics (Revenue, Outstanding, Pending, Volume) |
| `GET` | `/dashboard/charts` | Revenue time-series and invoice status distributions |
| `GET` | `/insights` | AI-generated financial insights and health score |
| `GET` | `/invoices` | List all merchant invoices with status filtering |
| `POST` | `/invoices/draft` | Create a draft invoice manually or from AI proposal |
| `GET` | `/invoices/{id}` | Retrieve details of a specific invoice |
| `POST` | `/invoices/{id}/approve` | Merchant approves invoice for PayPal dispatch |
| `POST` | `/invoices/{id}/send` | Send invoice via PayPal Invoicing API v2 |
| `POST` | `/invoices/{id}/remind` | Trigger PayPal invoice reminder endpoint |
| `POST` | `/invoices/{id}/cancel` | Cancel an invoice on PayPal |
| `GET` | `/invoices/{id}/pdf` | Generate and download branded invoice PDF |
| `GET` | `/transactions` | Searchable transaction log with PayPal capture references |
| `POST` | `/payments/orders` | Create a PayPal Orders v2 checkout order |
| `POST` | `/payments/{order_id}/capture` | Capture an approved PayPal checkout order |
| `GET` | `/approvals` | List pending and historic approval action cards |
| `POST` | `/approvals/{id}/confirm` | Confirm an action card and execute PayPal API |
| `POST` | `/approvals/{id}/reject` | Reject or dismiss a pending action card |
| `POST` | `/webhooks/paypal` | PayPal webhook endpoint for payment event synchronization |
| `GET` | `/settings` | Retrieve active merchant profile and PayPal configuration |
| `POST` | `/settings` | Update merchant configuration or PayPal credentials |

---

## Webhook Verification & Events

PayPal Webhooks subscribed:
- `PAYMENT.CAPTURE.COMPLETED`
- `PAYMENT.CAPTURE.DENIED`
- `PAYMENT.CAPTURE.REFUNDED`
- `INVOICING.INVOICE.PAID`
- `INVOICING.INVOICE.SENT`
- `INVOICING.INVOICE.CANCELLED`

All webhooks perform signature verification against `PAYPAL_WEBHOOK_ID` and ensure event deduplication using unique `paypal_event_id` storage.
