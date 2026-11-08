import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    app_env: str = "development"
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"

    # PayPal Sandbox Configuration
    paypal_base_url: str = "https://api-m.sandbox.paypal.com"
    paypal_client_id: Optional[str] = None
    paypal_client_secret: Optional[str] = None
    paypal_webhook_id: Optional[str] = None

    # AI Provider Configuration
    ai_provider: str = "gemini"
    gemini_api_key: Optional[str] = None
    ai_model: str = "gemini-1.5-flash"

    # Database
    database_url: str = "sqlite:///./paypilot.db"
    supabase_url: Optional[str] = None
    supabase_service_role_key: Optional[str] = None
    supabase_anon_key: Optional[str] = None

    # Security
    jwt_secret: str = "supersecret-paypilot-jwt-key-2026-hackathon"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    @property
    def has_real_paypal(self) -> bool:
        return bool(
            self.paypal_client_id 
            and self.paypal_client_secret 
            and "your_paypal" not in self.paypal_client_id.lower()
        )

    @property
    def has_real_gemini(self) -> bool:
        return bool(
            self.gemini_api_key 
            and "your_gemini" not in self.gemini_api_key.lower()
        )

settings = Settings()
