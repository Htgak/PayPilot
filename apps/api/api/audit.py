from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from apps.api.db.database import get_db
from apps.api.db.models import AuditLogModel

router = APIRouter(prefix="/audit-logs", tags=["Audit & Governance"])

class AuditLogResponse(BaseModel):
    id: str
    user_id: str
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    payload: Optional[dict] = None
    result: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = 100,
    action: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieve double-entry audit records for compliance and governance inspection.
    """
    query = db.query(AuditLogModel).filter(AuditLogModel.user_id == "default_merchant")
    if action:
        query = query.filter(AuditLogModel.action == action)
    
    logs = query.order_by(AuditLogModel.created_at.desc()).limit(limit).all()
    return [AuditLogResponse.model_validate(log) for log in logs]
