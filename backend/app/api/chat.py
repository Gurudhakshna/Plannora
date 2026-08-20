"""
Chat API router.

POST /api/v1/chat
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse
from app.services import chat_service
from app.utils.dependencies import get_current_user

router = APIRouter()


@router.post(
    "",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Send a chat message or question",
)
def chat(
    data: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Interact with study assistant chat interface."""
    return chat_service.handle_chat_message(db, current_user.id, data)
