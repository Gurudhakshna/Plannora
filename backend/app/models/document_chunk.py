"""
DocumentChunk SQLAlchemy ORM model.

Stores chunked text content extracted from uploaded documents, enabling
RAG (Retrieval-Augmented Generation) search and context retrieval.

Each document is split into sequential chunks. Each chunk stores the
text content and metadata needed for retrieval.

PENDING — Embedding Column:
    The ``embedding`` vector column (pgvector) will be added after
    Member 3 (AI/RAG) confirms the embedding model and dimension.
    A separate Alembic migration will add the column and vector indexes
    at that time. See DATABASE.md for details.
"""

from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(
        Integer,
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    token_count = Column(Integer, nullable=True)
    page_number = Column(Integer, nullable=True)
    chunk_metadata = Column(JSON, nullable=True)  # Extra metadata (section heading, etc.)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # -----------------------------------------------------------------
    # PENDING — Vector Embedding Column
    # -----------------------------------------------------------------
    # After Member 3 (AI/RAG) confirms the embedding model and
    # dimension, add:
    #
    #     from pgvector.sqlalchemy import Vector
    #     embedding = Column(Vector(DIMENSION), nullable=True)
    #
    # Then create a new Alembic migration to add the column and
    # a vector similarity index (HNSW recommended).
    # -----------------------------------------------------------------

    # Relationships
    document = relationship("Document", back_populates="chunks")
    owner = relationship("User", back_populates="document_chunks")

    def __repr__(self) -> str:
        return (
            f"<DocumentChunk id={self.id} document_id={self.document_id} "
            f"chunk_index={self.chunk_index}>"
        )
