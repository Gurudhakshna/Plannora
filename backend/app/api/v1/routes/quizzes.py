"""
POST /api/v1/quizzes/generate

AI-powered quiz generation from academic context.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.ai.embeddings.embedding_service import ConfigurationError
from app.ai.quiz_generation.quiz_service import QuizService
from app.api.v1.schemas import QuizGenerateRequest, QuizGenerateResponse

router = APIRouter()


@router.post("/generate", response_model=QuizGenerateResponse)
async def generate_quiz(body: QuizGenerateRequest):
    """Generate quiz questions from academic content."""
    try:
        service = QuizService()
        questions = await service.generate_quiz(
            subject=body.subject,
            topic=body.topic,
            context=body.context,
            number_of_questions=body.number_of_questions,
            difficulty=body.difficulty,
        )
        return QuizGenerateResponse(questions=questions)
    except ConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI service error: {exc}")
