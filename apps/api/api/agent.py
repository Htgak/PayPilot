from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from apps.api.db.database import get_db
from apps.api.models.schemas import ChatMessageRequest, ChatMessageResponse
from apps.api.agents.orchestrator import agent_orchestrator

router = APIRouter(prefix="/agent", tags=["AI Agent"])

@router.post("/chat", response_model=ChatMessageResponse)
async def chat_with_agent(
    req: ChatMessageRequest,
    db: Session = Depends(get_db)
):
    """
    Primary AI Copilot conversational endpoint.
    Accepts natural-language requests, executes controlled financial tools,
    and returns explanations alongside structured approval cards when action is required.
    """
    try:
        result = await agent_orchestrator.process_message(
            db=db,
            message=req.message,
            session_id=req.session_id,
            user_id="default_merchant"
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
