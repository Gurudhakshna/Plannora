"""
POST /api/v1/teach

Interactive Teach Me conceptual lesson service via Groq.
"""

from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException
from app.schemas.ai import TeachMeRequest, TeachMeResponse
from app.services.groq_service import GroqServiceError
from app.services.teach_service import teach_service

logger = logging.getLogger("plannora.routes.teach")
router = APIRouter()


@router.post("", response_model=TeachMeResponse)
@router.post("/lesson", response_model=TeachMeResponse)
async def teach_concept(body: TeachMeRequest) -> TeachMeResponse:
    """
    Generate deep-dive conceptual lesson across Beginner, Intermediate, or Advanced levels.
    """
    try:
        response = await teach_service.teach_concept(
            concept=body.concept,
            context=body.context,
            student_level=body.student_level,
        )
        return response
    except GroqServiceError as exc:
        raise HTTPException(
            status_code=503 if exc.code in ("AI_NOT_CONFIGURED", "AI_RATE_LIMITED", "AI_SERVICE_UNAVAILABLE") else 400,
            detail=exc.message
        )
    except Exception as exc:
        logger.error(f"Error in teach_concept: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate conceptual lesson. Please try again."
        )
