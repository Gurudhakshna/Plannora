"""
POST /api/v1/analyze/text
POST /api/v1/analyze
GET  /api/v1/ai/test
GET  /api/v1/ai/status

AI Study Material content analysis and safe connectivity diagnostics powered exclusively by Groq.
"""

from __future__ import annotations

import logging
from typing import Any, Dict
from fastapi import APIRouter, File, HTTPException, UploadFile
from app.core.config import settings
from app.schemas.ai import AnalyzeTextRequest, AnalyzeTextResponse, FileExtractionResponse
from app.services.analysis_service import analysis_service
from app.services.file_extraction_service import file_extraction_service
from app.services.groq_service import groq_service, GroqServiceError

logger = logging.getLogger("plannora.routes.analyze")
router = APIRouter()


@router.post("/file", response_model=FileExtractionResponse)
async def extract_uploaded_file(file: UploadFile = File(...)) -> FileExtractionResponse:
    """Recover text from a PDF or note photo before using the existing text AI flow."""
    content = await file.read()
    text, method, page_count = await file_extraction_service.extract(
        content, file.filename or "uploaded-material", file.content_type
    )
    return FileExtractionResponse(text=text, filename=file.filename or "uploaded-material", method=method, page_count=page_count)


@router.post("", response_model=AnalyzeTextResponse)
@router.post("/text", response_model=AnalyzeTextResponse)
@router.post("/ai/analyze-text", response_model=AnalyzeTextResponse)
async def analyze_text(body: AnalyzeTextRequest) -> AnalyzeTextResponse:
    """
    Analyze study material text using Groq to extract structured concepts,
    topics, definitions, formulas, tasks, and exam intelligence.
    """
    try:
        result = await analysis_service.analyze_text(
            text=body.text,
            filename=body.filename,
            subject=body.subject
        )
        return AnalyzeTextResponse(success=True, analysis=result)
    
    
    except Exception as exc:
        logger.error(f"Unexpected error in analyze_text: {exc}")
        print(exc)
        raise HTTPException(
            status_code=500,
            detail="Failed to analyze study material. Please verify the content and try again."
        )


@router.get("/status", tags=["AI Status"])
async def get_ai_status() -> Dict[str, Any]:
    """
    Safe development configuration diagnostic.
    Never exposes API keys or secrets.
    """
    return {
        "groq_configured": settings.is_groq_configured,
        "groq_model": settings.effective_groq_model,
        "environment": settings.ENVIRONMENT,
    }


@router.get("/test", tags=["AI Test"])
async def test_groq_connection() -> Dict[str, Any]:
    """
    Connectivity check verifying end-to-end communication with Groq LLM API.
    Never exposes credentials or raw errors.
    """
    return await groq_service.test_connection()
