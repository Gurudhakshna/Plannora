"""
POST /api/v1/planner/generate-plan
POST /api/v1/study-plan/generate

AI-assisted Study Roadmap generation combining Groq prioritization with deterministic calendar allocation.
"""

from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException
from app.schemas.ai import (
    StudyPlanGenerateRequest,
    StudyPlanGenerateResponse,
)
from app.services.groq_service import GroqServiceError
from app.services.study_plan_service import study_plan_service

logger = logging.getLogger("plannora.routes.planner")
router = APIRouter()


@router.post("/generate-plan", response_model=StudyPlanGenerateResponse)
@router.post("/generate", response_model=StudyPlanGenerateResponse)
async def generate_study_plan(body: StudyPlanGenerateRequest) -> StudyPlanGenerateResponse:
    """
    Generate prioritized study plan with exact dates and daily session distributions.
    """
    try:
        response = await study_plan_service.generate_plan(body)
        return response
    except GroqServiceError as exc:
        raise HTTPException(
            status_code=503 if exc.code in ("AI_NOT_CONFIGURED", "AI_RATE_LIMITED", "AI_SERVICE_UNAVAILABLE") else 400,
            detail=exc.message
        )
    except Exception as exc:
        logger.error(f"Error in generate_study_plan: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate study plan. Please try again."
        )
