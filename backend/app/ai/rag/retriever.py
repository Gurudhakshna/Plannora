"""
Semantic retriever over pgvector.

Embeds a query, performs cosine-similarity search in PostgreSQL with
pgvector, and enforces strict user/subject scoping so that a user
can never access another user's documents.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional, Protocol

from app.ai.embeddings.embedding_service import EmbeddingService


# ------------------------------------------------------------------
# Result model
# ------------------------------------------------------------------

@dataclass
class RetrievalResult:
    document_id: str
    document_name: str
    chunk_id: str
    content: str
    page_number: Optional[int]
    similarity: float

    def to_dict(self) -> dict:
        return {
            "document_id": self.document_id,
            "document_name": self.document_name,
            "chunk_id": self.chunk_id,
            "content": self.content,
            "page_number": self.page_number,
            "similarity": self.similarity,
        }


# ------------------------------------------------------------------
# Database interface (to be implemented by the backend teammate)
# ------------------------------------------------------------------

class VectorRepository(Protocol):
    """
    Interface the database/backend teammate should implement.

    The AI layer calls this; the backend teammate provides the
    concrete SQLAlchemy / asyncpg implementation that talks to
    PostgreSQL + pgvector.
    """

    async def similarity_search(
        self,
        embedding: list[float],
        user_id: str,
        subject_id: Optional[str],
        top_k: int,
    ) -> list[dict[str, Any]]:
        """
        Return the *top_k* most similar chunks.

        Each dict must contain:
          document_id, document_name, chunk_id, content,
          page_number (nullable), similarity (float 0–1).

        **SECURITY**: The implementation MUST filter by ``user_id``
        so that a user never retrieves another user's documents.
        If ``subject_id`` is provided it must also be filtered.
        """
        ...


# ------------------------------------------------------------------
# Retriever service
# ------------------------------------------------------------------

class Retriever:
    """
    Orchestrates: query → embedding → pgvector search → results.

    Parameters
    ----------
    embedding_service : EmbeddingService
        Used to embed the query text.
    vector_repo : VectorRepository
        Database-layer dependency (provided by the backend teammate).
    """

    def __init__(
        self,
        embedding_service: EmbeddingService,
        vector_repo: VectorRepository,
    ) -> None:
        self._embedding = embedding_service
        self._repo = vector_repo

    async def retrieve(
        self,
        query: str,
        user_id: str,
        subject_id: Optional[str] = None,
        top_k: int = 5,
    ) -> list[RetrievalResult]:
        """
        Retrieve the most relevant chunks for *query*.

        Pipeline:
        1. Embed the query.
        2. pgvector cosine-similarity search (filtered by user + subject).
        3. Return top-K results.
        """
        query_embedding = await self._embedding.embed_text(query)

        raw_results = await self._repo.similarity_search(
            embedding=query_embedding,
            user_id=user_id,
            subject_id=subject_id,
            top_k=top_k,
        )

        return [
            RetrievalResult(
                document_id=r["document_id"],
                document_name=r["document_name"],
                chunk_id=r["chunk_id"],
                content=r["content"],
                page_number=r.get("page_number"),
                similarity=r["similarity"],
            )
            for r in raw_results
        ]
