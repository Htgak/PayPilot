from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from apps.api.db.database import get_db
from apps.api.db.models import TransactionModel
from apps.api.models.schemas import TransactionResponse

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("", response_model=List[TransactionResponse])
def get_transactions(
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Retrieve full audit-backed transaction history."""
    query = db.query(TransactionModel).filter(TransactionModel.user_id == "default_merchant")
    if status:
        query = query.filter(TransactionModel.status == status.upper())

    txs = query.order_by(TransactionModel.created_at.desc()).limit(limit).all()
    return [TransactionResponse.model_validate(t) for t in txs]
