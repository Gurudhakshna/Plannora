"""
POST /api/v1/analyze/text

Lightweight AI content analysis endpoint.
Accepts raw study material text and returns structured analysis.
No database or authentication required.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Optional

from app.ai.content_analyzer import analyze_content

router = APIRouter()


class AnalyzeTextRequest(BaseModel):
    text: str = Field(..., min_length=10, description="Study material text content")
    filename: Optional[str] = Field(None, description="Original filename if available")


class AnalyzeTextResponse(BaseModel):
    success: bool
    analysis: dict[str, Any]


@router.post("/text", response_model=AnalyzeTextResponse)
@router.post("/ai/analyze-text", response_model=AnalyzeTextResponse)
def analyze_text(body: AnalyzeTextRequest):
    """
    Analyze study material text using AI (Groq) and return
    structured topics, concepts, tasks, study guide, and exam intelligence.

    No authentication required. No database access needed.
    """
    try:
        result = analyze_content(text=body.text, filename=body.filename)
        return AnalyzeTextResponse(success=True, analysis=result)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )
