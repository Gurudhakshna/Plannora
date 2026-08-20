"""
POST /api/v1/exams/analyze

AI-assisted question paper analysis.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.ai.embeddings.embedding_service import ConfigurationError
from app.ai.question_paper.analyzer import QuestionPaperAnalyzer
from app.api.v1.schemas import ExamAnalyzeRequest, ExamAnalyzeResponse

router = APIRouter()


@router.post("/analyze", response_model=ExamAnalyzeResponse)
async def analyze_exam(body: ExamAnalyzeRequest):
    """AI-assisted topic priority analysis of a question paper."""
    try:
        analyzer = QuestionPaperAnalyzer()
        result = await analyzer.analyze(paper_text=body.paper_text)
        data = result.to_dict()
        return ExamAnalyzeResponse(**data)
    except ConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI service error: {exc}")
