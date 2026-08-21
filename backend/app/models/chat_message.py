"""
ChatMessage SQLAlchemy ORM model.

Persists chat conversation history for the AI study assistant.
Messages are grouped by session_id to support multi-turn conversations
and provide context for RAG-based responses.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    session_id = Column(String(255), nullable=False, index=True)
    role = Column(String(50), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    owner = relationship("User", back_populates="chat_messages")

    def __repr__(self) -> str:
        return (
            f"<ChatMessage id={self.id} session_id={self.session_id!r} "
            f"role={self.role!r}>"
        )
