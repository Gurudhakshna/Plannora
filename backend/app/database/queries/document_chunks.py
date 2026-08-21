"""
Database queries for DocumentChunk model.

All functions enforce user_id filtering to ensure data isolation —
one user's chunks are never returned for another user.
"""

from typing import List, Optional, Dict, Any

from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func

from app.models.document_chunk import DocumentChunk


def create_chunk(
    db: Session,
    *,
    document_id: int,
    user_id: int,
    chunk_index: int,
    content: str,
    token_count: Optional[int] = None,
    page_number: Optional[int] = None,
    chunk_metadata: Optional[Dict[str, Any]] = None,
) -> DocumentChunk:
    """Create a single document chunk."""
    chunk = DocumentChunk(
        document_id=document_id,
        user_id=user_id,
        chunk_index=chunk_index,
        content=content,
        token_count=token_count,
        page_number=page_number,
        chunk_metadata=chunk_metadata,
    )
    db.add(chunk)
    db.commit()
    db.refresh(chunk)
    return chunk


def create_chunks_bulk(
    db: Session,
    *,
    chunks: List[Dict[str, Any]],
) -> List[DocumentChunk]:
    """
    Bulk-create document chunks.

    Each dict in ``chunks`` should contain:
        document_id, user_id, chunk_index, content,
        and optionally: token_count, page_number, chunk_metadata
    """
    chunk_objects = [DocumentChunk(**chunk_data) for chunk_data in chunks]
    db.add_all(chunk_objects)
    db.commit()
    for chunk in chunk_objects:
        db.refresh(chunk)
    return chunk_objects


def get_chunks_by_document(
    db: Session, document_id: int, user_id: int
) -> List[DocumentChunk]:
    """Get all chunks for a document, ordered by chunk_index. Enforces user ownership."""
    return (
        db.query(DocumentChunk)
        .filter(
            DocumentChunk.document_id == document_id,
            DocumentChunk.user_id == user_id,
        )
        .order_by(DocumentChunk.chunk_index)
        .all()
    )


def get_chunk_by_id(
    db: Session, chunk_id: int, user_id: int
) -> Optional[DocumentChunk]:
    """Get a single chunk by ID. Enforces user ownership."""
    return (
        db.query(DocumentChunk)
        .filter(
            DocumentChunk.id == chunk_id,
            DocumentChunk.user_id == user_id,
        )
        .first()
    )


def delete_chunks_by_document(
    db: Session, document_id: int, user_id: int
) -> int:
    """Delete all chunks for a document. Returns count of deleted chunks. Enforces user ownership."""
    count = (
        db.query(DocumentChunk)
        .filter(
            DocumentChunk.document_id == document_id,
            DocumentChunk.user_id == user_id,
        )
        .delete(synchronize_session="fetch")
    )
    db.commit()
    return count


def count_chunks_for_document(
    db: Session, document_id: int, user_id: int
) -> int:
    """Count chunks for a document. Enforces user ownership."""
    return (
        db.query(sa_func.count(DocumentChunk.id))
        .filter(
            DocumentChunk.document_id == document_id,
            DocumentChunk.user_id == user_id,
        )
        .scalar()
    ) or 0


def count_all_user_chunks(db: Session, user_id: int) -> int:
    """Count total chunks across all documents for a user."""
    return (
        db.query(sa_func.count(DocumentChunk.id))
        .filter(DocumentChunk.user_id == user_id)
        .scalar()
    ) or 0


def search_chunks_by_content(
    db: Session,
    user_id: int,
    query: str,
    limit: int = 10,
) -> List[DocumentChunk]:
    """
    Text-based search across chunk content for a user.
    Uses case-insensitive substring matching.
    Enforces user ownership.
    """
    if not query.strip():
        return []
    search_pattern = f"%{query.strip()}%"
    return (
        db.query(DocumentChunk)
        .filter(
            DocumentChunk.user_id == user_id,
            DocumentChunk.content.ilike(search_pattern),
        )
        .order_by(DocumentChunk.document_id, DocumentChunk.chunk_index)
        .limit(limit)
        .all()
    )


# ---------------------------------------------------------------------
# PENDING — Vector Similarity Search
# ---------------------------------------------------------------------
# The following function will be implemented after Member 3 (AI/RAG)
# confirms the embedding model and dimension, and the embedding column
# is added to the DocumentChunk model.
#
# def search_similar_chunks(
#     db: Session,
#     user_id: int,
#     query_embedding: List[float],
#     limit: int = 5,
# ) -> List[DocumentChunk]:
#     """
#     Vector similarity search using pgvector cosine distance.
#     Returns the closest chunks to the query embedding.
#     Enforces user ownership.
#     """
#     return (
#         db.query(DocumentChunk)
#         .filter(
#             DocumentChunk.user_id == user_id,
#             DocumentChunk.embedding.isnot(None),
#         )
#         .order_by(
#             DocumentChunk.embedding.cosine_distance(query_embedding)
#         )
#         .limit(limit)
#         .all()
#     )
# ---------------------------------------------------------------------
