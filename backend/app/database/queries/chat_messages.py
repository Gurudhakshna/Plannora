"""
Database queries for ChatMessage model.

All functions enforce user_id filtering to ensure data isolation —
one user's chat history is never returned for another user.
"""

from typing import List, Optional

from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func

from app.models.chat_message import ChatMessage


def create_message(
    db: Session,
    *,
    user_id: int,
    session_id: str,
    role: str,
    content: str,
) -> ChatMessage:
    """Create a single chat message."""
    message = ChatMessage(
        user_id=user_id,
        session_id=session_id,
        role=role,
        content=content,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def get_session_messages(
    db: Session, user_id: int, session_id: str
) -> List[ChatMessage]:
    """Get all messages in a session, ordered chronologically. Enforces user ownership."""
    return (
        db.query(ChatMessage)
        .filter(
            ChatMessage.user_id == user_id,
            ChatMessage.session_id == session_id,
        )
        .order_by(ChatMessage.created_at)
        .all()
    )


def get_user_sessions(db: Session, user_id: int) -> List[str]:
    """Get all distinct session IDs for a user, most recent first."""
    rows = (
        db.query(ChatMessage.session_id)
        .filter(ChatMessage.user_id == user_id)
        .group_by(ChatMessage.session_id)
        .order_by(sa_func.max(ChatMessage.created_at).desc())
        .all()
    )
    return [row[0] for row in rows]


def get_latest_session_id(db: Session, user_id: int) -> Optional[str]:
    """Get the most recent session ID for a user, or None if no sessions exist."""
    row = (
        db.query(ChatMessage.session_id)
        .filter(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.desc())
        .first()
    )
    return row[0] if row else None


def count_session_messages(
    db: Session, user_id: int, session_id: str
) -> int:
    """Count messages in a session. Enforces user ownership."""
    return (
        db.query(sa_func.count(ChatMessage.id))
        .filter(
            ChatMessage.user_id == user_id,
            ChatMessage.session_id == session_id,
        )
        .scalar()
    ) or 0


def delete_session(
    db: Session, user_id: int, session_id: str
) -> int:
    """Delete all messages in a session. Returns count. Enforces user ownership."""
    count = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.user_id == user_id,
            ChatMessage.session_id == session_id,
        )
        .delete(synchronize_session="fetch")
    )
    db.commit()
    return count


def delete_all_user_messages(db: Session, user_id: int) -> int:
    """Delete all chat messages for a user. Returns count."""
    count = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user_id)
        .delete(synchronize_session="fetch")
    )
    db.commit()
    return count
