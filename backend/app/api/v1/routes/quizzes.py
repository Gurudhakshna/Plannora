"""
POST /api/v1/quizzes/generate
POST /api/v1/quizzes/submit

AI Quiz generation via Groq and deterministic scoring calculation in Python.
"""

from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException
from app.schemas.ai import (
    QuizGenerateRequest,
    QuizGenerateResponse,
    QuizSubmitRequest,
    QuizSubmitResponse,
)
from app.services.groq_service import GroqServiceError
from app.services.quiz_service import quiz_service

logger = logging.getLogger("plannora.routes.quizzes")
router = APIRouter()


@router.post("/generate", response_model=QuizGenerateResponse)
async def generate_quiz(body: QuizGenerateRequest) -> QuizGenerateResponse:
    """
    Generate multiple-choice questions grounded in academic material.
    """
    try:
        response = await quiz_service.generate_quiz(
            subject=body.subject,
            topic=body.topic,
            context=body.context,
            question_count=body.question_count,
            difficulty=body.difficulty,
        )
        return response
    except GroqServiceError as exc:
        raise HTTPException(
            status_code=503 if exc.code in ("AI_NOT_CONFIGURED", "AI_RATE_LIMITED", "AI_SERVICE_UNAVAILABLE") else 400,
            detail=exc.message
        )
    except Exception as exc:
        logger.error(f"Error in generate_quiz: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate quiz. Please try again."
        )


@router.post("/submit", response_model=QuizSubmitResponse)
def submit_quiz(body: QuizSubmitRequest) -> QuizSubmitResponse:
    """
    Deterministically score submitted quiz answers in Python and calculate performance metrics.
    """
    try:
        response = quiz_service.calculate_score(
            topic=body.topic,
            answers=body.answers,
        )
        return response
    except Exception as exc:
        logger.error(f"Error in submit_quiz: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Failed to score quiz submission."
        )
