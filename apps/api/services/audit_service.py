import uuid
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from apps.api.db.models import AuditLogModel

def record_audit(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    payload: Optional[Dict[str, Any]] = None,
    result: str = "SUCCESS",
    user_id: str = "default_merchant"
) -> AuditLogModel:
    """Record an immutable audit log entry for financial actions."""
    log = AuditLogModel(
        id=str(uuid.uuid4()),
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        payload=payload or {},
        result=result
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
