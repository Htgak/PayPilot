from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from apps.api.config import settings
from apps.api.db.database import get_db
from apps.api.db.models import ProfileModel
from apps.api.models.schemas import SystemSettingsResponse, SettingsUpdateRequest, ProfileResponse

router = APIRouter(prefix="/settings", tags=["Settings"])

def _mask_db_url(url: str) -> str:
    if "@" in url:
        try:
            proto, rest = url.split("://", 1)
            creds, host = rest.split("@", 1)
            if ":" in creds:
                user, _ = creds.split(":", 1)
                return f"{proto}://{user}:***@{host}"
        except Exception:
            return "***"
    return url

@router.get("", response_model=SystemSettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    """Retrieve system, AI, and PayPal connection configuration."""
    profile = db.query(ProfileModel).filter_by(user_id="default_merchant").first()
    
    masked_client_id = None
    if settings.paypal_client_id:
        c = settings.paypal_client_id
        masked_client_id = f"{c[:6]}...{c[-4:]}" if len(c) > 10 else "***"

    return SystemSettingsResponse(
        app_env=settings.app_env,
        paypal_connected=settings.has_real_paypal,
        paypal_base_url=settings.paypal_base_url,
        paypal_client_id_masked=masked_client_id,
        has_gemini=settings.has_real_gemini,
        ai_model=settings.ai_model,
        database_url=_mask_db_url(settings.database_url),
        profile=ProfileResponse.model_validate(profile) if profile else None
    )

@router.post("", response_model=SystemSettingsResponse)
def update_settings(
    req: SettingsUpdateRequest,
    db: Session = Depends(get_db)
):
    """Update runtime PayPal Sandbox credentials or merchant profile."""
    if req.paypal_client_id:
        settings.paypal_client_id = req.paypal_client_id
    if req.paypal_client_secret:
        settings.paypal_client_secret = req.paypal_client_secret
    if req.paypal_webhook_id:
        settings.paypal_webhook_id = req.paypal_webhook_id
    if req.gemini_api_key:
        settings.gemini_api_key = req.gemini_api_key

    profile = db.query(ProfileModel).filter_by(user_id="default_merchant").first()
    if profile:
        if req.business_name:
            profile.business_name = req.business_name
        if req.currency:
            profile.currency = req.currency
        db.commit()
        db.refresh(profile)

    return get_settings(db=db)
