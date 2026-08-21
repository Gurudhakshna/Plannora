"""
Database search queries — text-based and vector similarity search.

Provides search functions that can be used by the search and chat services.
All functions enforce user_id filtering to ensure data isolation.

PENDING — Vector Search:
    Vector similarity search will be implemented after Member 3 (AI/RAG)
    confirms the embedding model and dimension, and the embedding column
    is added to the DocumentChunk model.
"""

from typing import List, Dict, Any

from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.subject import Subject
from app.models.document import Document
from app.models.document_chunk import DocumentChunk


def text_search_chunks(
    db: Session,
    user_id: int,
    query: str,
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """
    Full-text search across document chunks belonging to a user.
    Uses case-insensitive substring matching.
    Enforces user ownership.

    Returns list of dicts with chunk info and parent document details.
    """
    if not query.strip():
        return []

    search_pattern = f"%{query.strip()}%"
    chunks = (
        db.query(DocumentChunk)
        .filter(
            DocumentChunk.user_id == user_id,
            DocumentChunk.content.ilike(search_pattern),
        )
        .order_by(DocumentChunk.document_id, DocumentChunk.chunk_index)
        .limit(limit)
        .all()
    )

    results = []
    for chunk in chunks:
        results.append({
            "chunk_id": chunk.id,
            "document_id": chunk.document_id,
            "chunk_index": chunk.chunk_index,
            "content": chunk.content,
            "page_number": chunk.page_number,
            "token_count": chunk.token_count,
            "document_filename": chunk.document.filename if chunk.document else None,
        })
    return results


def text_search_all(
    db: Session,
    user_id: int,
    query: str,
    limit: int = 20,
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Search across subjects, documents, and document chunks.
    Returns results grouped by type.
    Enforces user ownership.
    """
    if not query.strip():
        return {"subjects": [], "documents": [], "chunks": []}

    search_pattern = f"%{query.strip()}%"

    # Search subjects
    subjects = (
        db.query(Subject)
        .filter(
            Subject.user_id == user_id,
            or_(
                Subject.name.ilike(search_pattern),
                Subject.description.ilike(search_pattern),
            ),
        )
        .limit(limit)
        .all()
    )

    # Search documents by filename
    documents = (
        db.query(Document)
        .filter(
            Document.user_id == user_id,
            Document.filename.ilike(search_pattern),
        )
        .limit(limit)
        .all()
    )

    # Search document chunks by content
    chunks = (
        db.query(DocumentChunk)
        .filter(
            DocumentChunk.user_id == user_id,
            DocumentChunk.content.ilike(search_pattern),
        )
        .order_by(DocumentChunk.document_id, DocumentChunk.chunk_index)
        .limit(limit)
        .all()
    )

    return {
        "subjects": [
            {
                "id": s.id,
                "name": s.name,
                "description": s.description,
            }
            for s in subjects
        ],
        "documents": [
            {
                "id": d.id,
                "filename": d.filename,
                "content_type": d.content_type,
                "subject_id": d.subject_id,
            }
            for d in documents
        ],
        "chunks": [
            {
                "chunk_id": c.id,
                "document_id": c.document_id,
                "chunk_index": c.chunk_index,
                "content": c.content,
                "page_number": c.page_number,
            }
            for c in chunks
        ],
    }


# ---------------------------------------------------------------------
# PENDING — Vector Similarity Search
# ---------------------------------------------------------------------
# The following functions will be implemented after Member 3 (AI/RAG)
# confirms the embedding model and dimension.
#
# def vector_search_chunks(
#     db: Session,
#     user_id: int,
#     query_embedding: List[float],
#     limit: int = 5,
# ) -> List[Dict[str, Any]]:
#     """
#     Vector similarity search using pgvector cosine distance.
#     Returns the most semantically similar chunks to the query.
#     Enforces user ownership.
#     """
#     ...
#
# def hybrid_search_chunks(
#     db: Session,
#     user_id: int,
#     query: str,
#     query_embedding: List[float],
#     limit: int = 10,
#     text_weight: float = 0.3,
#     vector_weight: float = 0.7,
# ) -> List[Dict[str, Any]]:
#     """
#     Combined text + vector search with weighted scoring.
#     Enforces user ownership.
#     """
#     ...
# ---------------------------------------------------------------------
