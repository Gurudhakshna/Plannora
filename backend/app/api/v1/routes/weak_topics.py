"""
POST /api/v1/weak-topics/calculate
GET /api/v1/weak-topics

Performance gap analysis and Groq study recommendations.
"""

from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException
from app.schemas.ai import (
    WeakTopicsCalculateRequest,
    WeakTopicsResponse,
)
from app.services.groq_service import GroqServiceError
from app.services.weak_topic_service import weak_topic_service

logger = logging.getLogger("plannora.routes.weak_topics")
router = APIRouter()


@router.post("/calculate", response_model=WeakTopicsResponse)
async def calculate_weak_topics(body: WeakTopicsCalculateRequest) -> WeakTopicsResponse:
    """
    Calculate topic accuracy from student quiz/flashcard activity and generate targeted Groq remediation steps.
    """
    try:
        response = await weak_topic_service.calculate_weak_topics(
            activity_data=body.activity_data,
            context=body.context,
        )
        return response
    except GroqServiceError as exc:
        raise HTTPException(
            status_code=503 if exc.code in ("AI_NOT_CONFIGURED", "AI_RATE_LIMITED", "AI_SERVICE_UNAVAILABLE") else 400,
            detail=exc.message
        )
    except Exception as exc:
        logger.error(f"Error in calculate_weak_topics: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Failed to calculate weak topics."
        )


@router.get("", response_model=WeakTopicsResponse)
async def get_weak_topics() -> WeakTopicsResponse:
    """
    Default weak topics overview when no specific activity dataset is supplied in request body.
    """
    return WeakTopicsResponse(
        success=True,
        weak_topics=[],
        summary="Complete quizzes and flashcard sessions to populate your diagnostic weak topics overview."
    )
