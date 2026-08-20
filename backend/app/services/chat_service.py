"""
Chat service — handles chat queries, context preparation, and calls the AI service interface.
"""

from sqlalchemy.orm import Session

from app.schemas.chat import ChatMessageRequest, ChatMessageResponse
from app.services.ai_service import ai_service


def handle_chat_message(
    db: Session, user_id: int, request: ChatMessageRequest
) -> ChatMessageResponse:
    """
    Process incoming user prompt through the AI service interface.
    """
    # In future: retrieve relevant document context for user_id and pass to ai_service
    ai_response_text = ai_service.generate_response(
        message=request.message, context=None
    )

    return ChatMessageResponse(
        message=request.message,
        response=ai_response_text,
    )
