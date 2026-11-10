// PayPilot API Client Library
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const AUTH_TOKEN_KEY = "paypilot-access-token";

export interface AuthSession { access_token: string; token_type: "bearer"; email: string; }

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  business_name: string;
  email: string;
  currency: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
}

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_amount?: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  invoice_number: string;
  paypal_invoice_id?: string;
  paypal_invoice_number?: string;
  amount: number;
  currency: string;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "SENT" | "PAID" | "PARTIALLY_PAID" | "OVERDUE" | "CANCELLED";
  due_date?: string;
  memo?: string;
  payment_url?: string;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
}

export interface Transaction {
  id: string;
  user_id: string;
  invoice_id?: string;
  paypal_order_id?: string;
  paypal_capture_id?: string;
  amount: number;
  currency: string;
  status: "COMPLETED" | "PENDING" | "REFUNDED" | "DENIED";
  payment_source?: string;
  payer_name?: string;
  payer_email?: string;
  created_at: string;
}

export interface ApprovalAction {
  id: string;
  user_id: string;
  action_type: "CREATE_INVOICE" | "SEND_INVOICE" | "CREATE_CHECKOUT_ORDER" | "SEND_REMINDER" | "CAPTURE_ORDER";
  payload: any;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXECUTED" | "FAILED";
  execution_result?: any;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ActionProposal {
  approval_id: string;
  action_type: string;
  title: string;
  description: string;
  details: any;
  status: string;
}

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  action_proposals?: ActionProposal[];
  tool_calls?: any[];
  timestamp?: string;
}

export interface DashboardSummary {
  total_revenue: number;
  revenue_growth_pct: number;
  outstanding_invoices_amount: number;
  outstanding_invoices_count: number;
  completed_payments_count: number;
  pending_approvals_count: number;
  currency: string;
  recent_transactions: Transaction[];
  recent_invoices: Invoice[];
}

export interface DashboardCharts {
  revenue_timeline: Array<{ period: string; revenue: number; invoiced: number }>;
  status_distribution: Record<string, number>;
}

export interface InsightItem {
  type: "warning" | "success" | "info" | "recommendation";
  title: string;
  message: string;
  action_prompt?: string;
}

export interface InsightsData {
  health_score: number;
  summary: string;
  insights: InsightItem[];
  cash_flow_forecast: {
    expected_30_days: number;
    confidence: number;
    top_customer: string;
  };
}

export interface SystemSettings {
  app_env: string;
  paypal_connected: boolean;
  paypal_base_url: string;
  paypal_client_id_masked?: string;
  has_gemini: boolean;
  ai_model: string;
  database_url: string;
  profile: Profile;
}

// ---------------- API Calls ----------------

async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(typeof window !== "undefined" && localStorage.getItem(AUTH_TOKEN_KEY) && !path.startsWith("/auth/") ? { Authorization: `Bearer ${localStorage.getItem(AUTH_TOKEN_KEY)}` } : {}),
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error (${res.status}): ${errorText}`);
  }

  return res.json();
}

export const api = {
  getAuthStatus: () => fetchJSON<{ account_exists: boolean }>("/auth/status"),
  login: (email: string, password: string) => fetchJSON<AuthSession>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  signup: (email: string, password: string) => fetchJSON<AuthSession>("/auth/signup", { method: "POST", body: JSON.stringify({ email, password }) }),
  // Dashboard & Insights
  getDashboardSummary: () => fetchJSON<DashboardSummary>("/dashboard/summary"),
  getDashboardCharts: () => fetchJSON<DashboardCharts>("/dashboard/charts"),
  getInsights: () => fetchJSON<InsightsData>("/insights"),

  // AI Agent Chat
  chatWithAgent: (message: string, sessionId?: string) =>
    fetchJSON<{ session_id: string; response: string; action_proposals: ActionProposal[]; tool_calls: any[] }>(
      "/agent/chat",
      {
        method: "POST",
        body: JSON.stringify({ message, session_id: sessionId }),
      }
    ),

  // Invoices
  getInvoices: (status?: string) =>
    fetchJSON<Invoice[]>(`/invoices${status ? `?status=${status}` : ""}`),
  getInvoiceDetail: (id: string) => fetchJSON<Invoice>(`/invoices/${id}`),
  createInvoiceDraft: (data: {
    customer_name?: string;
    customer_email: string;
    items: Array<{ description: string; quantity: number; unit_price: number }>;
    currency?: string;
    due_date?: string;
    memo?: string;
  }) =>
    fetchJSON<Invoice>("/invoices/draft", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  sendInvoice: (id: string) =>
    fetchJSON<{ status: string; invoice_status: string }>(`/invoices/${id}/send`, {
      method: "POST",
    }),
  remindInvoice: (id: string, subject?: string, note?: string) =>
    fetchJSON<{ status: string; message: string }>(`/invoices/${id}/remind`, {
      method: "POST",
      body: JSON.stringify({ subject, note }),
    }),
  cancelInvoice: (id: string) =>
    fetchJSON<{ status: string }>(`/invoices/${id}/cancel`, {
      method: "POST",
    }),
  getInvoicePdfUrl: (id: string) => `${API_BASE}/invoices/${id}/pdf`,

  // Approvals
  getApprovals: (status?: string) =>
    fetchJSON<ApprovalAction[]>(`/approvals${status ? `?status=${status}` : ""}`),
  confirmApproval: (id: string) =>
    fetchJSON<ApprovalAction>(`/approvals/${id}/confirm`, {
      method: "POST",
    }),
  rejectApproval: (id: string, reason?: string) =>
    fetchJSON<ApprovalAction>(`/approvals/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ decision: "REJECT", reason }),
    }),

  // Payments / Orders
  getTransactions: (status?: string) =>
    fetchJSON<Transaction[]>(`/transactions${status ? `?status=${status}` : ""}`),
  createOrder: (amount: number, currency: string = "USD", invoice_id?: string, description?: string) =>
    fetchJSON<{ order_id: string; status: string; approval_url: string }>("/payments/orders", {
      method: "POST",
      body: JSON.stringify({ amount, currency, invoice_id, description }),
    }),
  captureOrder: (order_id: string, payer_name?: string, payer_email?: string) =>
    fetchJSON<Transaction>(`/payments/${order_id}/capture`, {
      method: "POST",
      body: JSON.stringify({ order_id, payer_name, payer_email }),
    }),

  // Webhooks
  triggerTestWebhook: (eventType: string, payload: any) =>
    fetchJSON<{ status: string; event_id: string }>("/webhooks/paypal", {
      method: "POST",
      body: JSON.stringify({
        id: `EVT-SIM-${Date.now()}`,
        event_type: eventType,
        resource: payload,
      }),
    }),

  // Settings
  getSettings: () => fetchJSON<SystemSettings>("/settings"),
  updateSettings: (data: {
    paypal_client_id?: string;
    paypal_client_secret?: string;
    paypal_webhook_id?: string;
    gemini_api_key?: string;
    business_name?: string;
    currency?: string;
  }) =>
    fetchJSON<SystemSettings>("/settings", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
