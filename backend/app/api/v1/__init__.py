"""API v1 router — aggregates all AI route modules."""

from fastapi import APIRouter

from app.api.v1.routes import chat, quizzes, flashcards, exams, planner, analyze

router = APIRouter()

router.include_router(chat.router, prefix="/chat", tags=["Chat / RAG"])
router.include_router(quizzes.router, prefix="/quizzes", tags=["Quizzes"])
router.include_router(flashcards.router, prefix="/flashcards", tags=["Flashcards"])
router.include_router(exams.router, prefix="/exams", tags=["Exams"])
router.include_router(planner.router, prefix="/planner", tags=["Study Planner"])
router.include_router(analyze.router, prefix="/analyze", tags=["Content Analysis"])

