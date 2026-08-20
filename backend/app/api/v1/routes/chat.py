"""
POST /api/v1/chat/ask

RAG-based question answering over the student's uploaded documents.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.ai.embeddings.embedding_service import EmbeddingService, ConfigurationError
from app.ai.rag.retriever import Retriever
from app.ai.rag.rag_service import RAGService
from app.api.v1.schemas import ChatAskRequest, ChatAskResponse

router = APIRouter()

# ------------------------------------------------------------------
# Stub vector repository (backend teammate will replace)
# ------------------------------------------------------------------

class _StubVectorRepo:
    """
    Placeholder that the database/backend teammate will replace with
    a real SQLAlchemy + pgvector implementation.
    """

    async def similarity_search(self, embedding, user_id, subject_id, top_k):
        return []


# ------------------------------------------------------------------
# Service factory (thin — will evolve with DI later)
# ------------------------------------------------------------------

def _build_rag_service() -> RAGService:
    embedding_service = EmbeddingService()
    vector_repo = _StubVectorRepo()
    retriever = Retriever(embedding_service=embedding_service, vector_repo=vector_repo)
    return RAGService(retriever=retriever)


# ------------------------------------------------------------------
# Route
# ------------------------------------------------------------------

@router.post("/ask", response_model=ChatAskResponse)
async def chat_ask(body: ChatAskRequest):
    """Answer a student question using RAG over their documents."""
    try:
        service = _build_rag_service()
        result = await service.answer_question(
            question=body.question,
            user_id=body.user_id,
            subject_id=body.subject_id,
        )
        return ChatAskResponse(**result)
    except ConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI service error: {exc}")
