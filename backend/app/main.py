"""
<<<<<<< HEAD
Plannora Backend — FastAPI Application Entry Point.

This module creates and configures the FastAPI application instance,
sets up CORS middleware, and includes all API routers.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Plannora API",
    description="Backend API for Plannora — a study planning and learning platform.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS — allow the frontend (and development tools) to call the API
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
=======
Plannora AI Backend — FastAPI application entry point.

All AI routes are mounted under ``/api/v1/``.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import router as v1_router

app = FastAPI(
    title="Plannora AI Backend",
    description=(
        "AI engineering services for Plannora: RAG, quiz generation, "
        "flashcards, question paper analysis, and study recommendations."
    ),
    version="0.1.0",
)

# CORS — allow the React frontend during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
>>>>>>> origin/feature/ai
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

<<<<<<< HEAD
# ---------------------------------------------------------------------------
# Health check — no authentication required
# ---------------------------------------------------------------------------

@app.get("/health", tags=["Health"])
def health_check():
    """Simple health check endpoint."""
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# API routers
# ---------------------------------------------------------------------------
from app.api import (
    auth,
    users,
    subjects,
    documents,
    quizzes,
    flashcards,
    exams,
    planner,
    analytics,
    search,
    chat,
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(subjects.router, prefix="/api/v1/subjects", tags=["Subjects"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(quizzes.router, prefix="/api/v1/quizzes", tags=["Quizzes"])
app.include_router(flashcards.router, prefix="/api/v1/flashcards", tags=["Flashcards"])
app.include_router(exams.router, prefix="/api/v1/exams", tags=["Exams"])
app.include_router(planner.router, prefix="/api/v1/planner", tags=["Planner"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(search.router, prefix="/api/v1/search", tags=["Search"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
=======
app.include_router(v1_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "plannora-ai"}
>>>>>>> origin/feature/ai
