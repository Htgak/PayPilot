import os
from datetime import datetime, timezone
import uuid

from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from apps.api.config import settings

Base = declarative_base()

# SQLite or PostgreSQL
connect_args = {"check_same_thread": False, "timeout": 15} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)

if settings.database_url.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from apps.api.db.models import (
        ProfileModel, CustomerModel, InvoiceModel, InvoiceItemModel,
        TransactionModel, ApprovalModel, WebhookEventModel, AuditLogModel,
        AiSessionModel, AiMessageModel
    )
    Base.metadata.create_all(bind=engine)
    
    # Check if default merchant profile exists; if not, create clean profile
    with SessionLocal() as db:
        existing_profile = db.query(ProfileModel).filter_by(user_id="default_merchant").first()
        if not existing_profile:
            profile = ProfileModel(
                id=str(uuid.uuid4()),
                user_id="default_merchant",
                name="Alex Morgan",
                business_name="PixelCraft Studio",
                email="alex@pixelcraft.studio",
                currency="USD"
            )
            db.add(profile)
            db.commit()
