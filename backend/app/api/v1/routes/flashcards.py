"""
POST /api/v1/flashcards/generate

AI-powered flashcard generation from academic context.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.ai.embeddings.embedding_service import ConfigurationError
from app.ai.flashcards.flashcard_service import FlashcardService
from app.api.v1.schemas import (
    FlashcardGenerateRequest,
    FlashcardGenerateResponse,
)

router = APIRouter()


@router.post("/generate", response_model=FlashcardGenerateResponse)
async def generate_flashcards(body: FlashcardGenerateRequest):
    """Generate flashcards from academic content."""
    try:
        service = FlashcardService()
        cards = await service.generate_flashcards(
            context=body.context,
            num_cards=body.num_cards,
        )
        return FlashcardGenerateResponse(flashcards=cards)
    except ConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI service error: {exc}")
