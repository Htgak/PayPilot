from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apps.api.config import settings
from apps.api.db.database import init_db

# Import routers
from apps.api.api.agent import router as agent_router
from apps.api.api.dashboard import router as dashboard_router
from apps.api.api.insights import router as insights_router
from apps.api.api.invoices import router as invoices_router
from apps.api.api.payments import router as payments_router
from apps.api.api.approvals import router as approvals_router
from apps.api.api.transactions import router as transactions_router
from apps.api.api.webhooks import router as webhooks_router
from apps.api.api.settings import router as settings_router
from apps.api.api.audit import router as audit_router
from apps.api.api.auth import router as auth_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables and seed initial demo data
    init_db()
    print("=" * 60)
    print("🚀 PayPilot AI Backend started successfully!")
    print(f"📡 Environment: {settings.app_env}")
    print(f"💳 PayPal Base URL: {settings.paypal_base_url}")
    print(f"🔑 Live PayPal Configured: {settings.has_real_paypal}")
    print(f"🤖 Gemini Configured: {settings.has_real_gemini}")
    print("=" * 60)
    yield

app = FastAPI(
    title="PayPilot AI API",
    description="AI-Powered Financial Operations Agent for Independent Businesses & PayPal Developer Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration - allow all origins for cloud deployments, preview URLs, and local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health & Root endpoints
@app.get("/")
def root():
    return {
        "name": "PayPilot AI API",
        "version": "1.0.0",
        "status": "operational",
        "hackathon": "PayPal AI Hackathon 2026",
        "docs_url": "/docs"
    }

@app.get("/health")
@app.get("/api/health")
def health():
    return {"status": "healthy"}

# Mount API Routers
app.include_router(agent_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(insights_router, prefix="/api")
app.include_router(invoices_router, prefix="/api")
app.include_router(payments_router, prefix="/api")
app.include_router(approvals_router, prefix="/api")
app.include_router(transactions_router, prefix="/api")
app.include_router(webhooks_router, prefix="/api")
app.include_router(settings_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(auth_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("apps.api.main:app", host="0.0.0.0", port=8000, reload=True)
