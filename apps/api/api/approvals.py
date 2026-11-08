from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from apps.api.db.database import get_db
from apps.api.db.models import ApprovalModel
from apps.api.models.schemas import ApprovalResponse, ApprovalDecision
from apps.api.tools.financial_tools import execute_approved_action
from apps.api.services.audit_service import record_audit

router = APIRouter(prefix="/approvals", tags=["Approvals Workflow"])

@router.get("", response_model=List[ApprovalResponse])
def get_approvals(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List pending or historic approvals."""
    query = db.query(ApprovalModel).filter(ApprovalModel.user_id == "default_merchant")
    if status:
        query = query.filter(ApprovalModel.status == status.upper())
    
    approvals = query.order_by(ApprovalModel.created_at.desc()).all()
    return [ApprovalResponse.model_validate(a) for a in approvals]

@router.post("/{id}/confirm", response_model=ApprovalResponse)
async def confirm_approval_action(
    id: str,
    db: Session = Depends(get_db)
):
    """
    Merchant authorizes an action. Executes the PayPal API operation
    and stores the verified transaction/invoice record.
    """
    approval = db.query(ApprovalModel).filter_by(id=id, user_id="default_merchant").first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")

    if approval.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Action is already {approval.status}")

    try:
        result = await execute_approved_action(db=db, approval_id=id, user_id="default_merchant")
        db.refresh(approval)
        return ApprovalResponse.model_validate(approval)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Execution error: {str(e)}")

@router.post("/{id}/reject", response_model=ApprovalResponse)
def reject_approval_action(
    id: str,
    decision: Optional[ApprovalDecision] = None,
    db: Session = Depends(get_db)
):
    """Merchant rejects or cancels a proposed action."""
    approval = db.query(ApprovalModel).filter_by(id=id, user_id="default_merchant").first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")

    approval.status = "REJECTED"
    approval.execution_result = {"reason": decision.reason if decision else "Rejected by merchant"}
    db.commit()
    db.refresh(approval)

    record_audit(
        db,
        action="APPROVAL_REJECTED",
        entity_type="APPROVAL",
        entity_id=approval.id,
        payload=approval.execution_result,
        result="REJECTED"
    )

    return ApprovalResponse.model_validate(approval)
