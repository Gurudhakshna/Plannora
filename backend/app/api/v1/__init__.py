"""
API v1 Router — Aggregates all AI and study platform route modules.
"""

from fastapi import APIRouter

from app.api.v1.routes import (
    analyze,
    concept_map,
    flashcards,
    planner,
    quizzes,
    teach,
    weak_topics,
)

router = APIRouter()

router.include_router(analyze.router, prefix="/analyze", tags=["Content Analysis"])
router.include_router(analyze.router, prefix="/ai", tags=["AI Status & Diagnostics"])
router.include_router(quizzes.router, prefix="/quizzes", tags=["Quizzes"])
router.include_router(flashcards.router, prefix="/flashcards", tags=["Flashcards"])
router.include_router(concept_map.router, prefix="/concept-map", tags=["Concept Map"])
router.include_router(teach.router, prefix="/teach", tags=["Teach Me"])
router.include_router(weak_topics.router, prefix="/weak-topics", tags=["Weak Topics"])
router.include_router(planner.router, prefix="/planner", tags=["Study Planner"])
router.include_router(planner.router, prefix="/study-plan", tags=["Study Plan Alias"])
