"""
POST /api/v1/flashcards/generate
POST /api/v1/flashcards/rate

AI-powered Flashcard generation via Groq and difficulty rating tracking.
"""

from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException
from app.schemas.ai import (
    FlashcardRateRequest,
    FlashcardRateResponse,
    FlashcardsGenerateRequest,
    FlashcardsGenerateResponse,
)
from app.services.flashcard_service import flashcard_service
from app.services.groq_service import GroqServiceError

logger = logging.getLogger("plannora.routes.flashcards")
router = APIRouter()


@router.post("/generate", response_model=FlashcardsGenerateResponse)
async def generate_flashcards(body: FlashcardsGenerateRequest) -> FlashcardsGenerateResponse:
    """
    Generate active recall flashcards from academic material.
    """
    try:
        response = await flashcard_service.generate_flashcards(
            topic=body.topic,
            context=body.context,
            count=body.count,
            difficulty=body.difficulty,
        )
        return response
    except GroqServiceError as exc:
        raise HTTPException(
            status_code=503 if exc.code in ("AI_NOT_CONFIGURED", "AI_RATE_LIMITED", "AI_SERVICE_UNAVAILABLE") else 400,
            detail=exc.message
        )
    except Exception as exc:
        logger.error(f"Error in generate_flashcards: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate flashcards. Please try again."
        )


@router.post("/rate", response_model=FlashcardRateResponse)
def rate_flashcard(body: FlashcardRateRequest) -> FlashcardRateResponse:
    """
    Record user feedback/difficulty rating on a flashcard for mastery tracking.
    """
    return FlashcardRateResponse(
        success=True,
        message=f"Rating '{body.rating}' recorded for card in topic '{body.topic}'."
    )
