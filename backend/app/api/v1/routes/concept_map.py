"""
POST /api/v1/concept-map/generate

AI Knowledge Graph and concept dependency network generation via Groq.
"""

from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException
from app.schemas.ai import (
    ConceptMapGenerateRequest,
    ConceptMapGenerateResponse,
)
from app.services.concept_map_service import concept_map_service
from app.services.groq_service import GroqServiceError

logger = logging.getLogger("plannora.routes.concept_map")
router = APIRouter()


@router.post("/generate", response_model=ConceptMapGenerateResponse)
async def generate_concept_map(body: ConceptMapGenerateRequest) -> ConceptMapGenerateResponse:
    """
    Generate interactive concept nodes and relationship edges from study material.
    """
    try:
        response = await concept_map_service.generate_concept_map(
            topic=body.topic,
            context=body.context,
        )
        return response
    except GroqServiceError as exc:
        raise HTTPException(
            status_code=503 if exc.code in ("AI_NOT_CONFIGURED", "AI_RATE_LIMITED", "AI_SERVICE_UNAVAILABLE") else 400,
            detail=exc.message
        )
    except Exception as exc:
        logger.error(f"Error in generate_concept_map: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate concept map. Please try again."
        )
