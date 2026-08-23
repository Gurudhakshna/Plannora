"""
Plannora Backend — FastAPI Application Entry Point.
Production-ready configuration with CORS, health monitoring, and Groq AI services.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import router as v1_router
from app.core.config import settings
from app.services.groq_service import GroqServiceError

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("plannora")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup validation and diagnostics (safe, no secrets)
    logger.info("=" * 60)
    logger.info("✓ Plannora backend started")
    if settings.is_groq_configured:
        logger.info(f"✓ Groq configuration loaded successfully")
        logger.info(f"✓ Groq model: {settings.effective_groq_model}")
    else:
        logger.warning("! GROQ_API_KEY is not detected in backend .env file")
    logger.info("✓ API v1 routes registered")
    logger.info("=" * 60)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Plannora AI Study Platform Backend API powered exclusively by Groq.",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS Configuration
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Exception Handlers
# ---------------------------------------------------------------------------
@app.exception_handler(GroqServiceError)
async def groq_service_exception_handler(request: Request, exc: GroqServiceError):
    logger.warning(f"AI Service Error on {request.url.path}: {exc.code} - {exc.message}")
    status_code = 503 if exc.code in ("AI_NOT_CONFIGURED", "AI_RATE_LIMITED", "AI_SERVICE_UNAVAILABLE", "AI_AUTH_FAILED") else 400
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
            }
        }
    )


# ---------------------------------------------------------------------------
# Health Check Endpoint
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check verifying server status and active Groq AI configuration.
    Never exposes API credentials.
    """
    return {
        "status": "ok",
        "service": "plannora-backend",
        "ai_provider": "groq",
        "groq_configured": settings.is_groq_configured,
        "groq_model": settings.effective_groq_model,
        "model": settings.effective_groq_model,
    }


# ---------------------------------------------------------------------------
# Include API v1 Routes
# ---------------------------------------------------------------------------
app.include_router(v1_router, prefix=settings.API_V1_STR)

# ---------------------------------------------------------------------------
# Include Platform Routes (auth, users, subjects, documents, etc.)
# ---------------------------------------------------------------------------
from app.api import (  # noqa: E402
    analytics as analytics_api,
    auth as auth_api,
    chat as chat_api,
    documents as documents_api,
    exams as exams_api,
    flashcards as flashcards_api,
    planner as planner_api,
    quizzes as quizzes_api,
    search as search_api,
    subjects as subjects_api,
    users as users_api,
)

platform_routers = [
    (analytics_api, "/analytics"),
    (auth_api, "/auth"),
    (chat_api, "/chat"),
    (documents_api, "/documents"),
    (exams_api, "/exams"),
    (flashcards_api, "/flashcards"),
    (planner_api, "/planner"),
    (quizzes_api, "/quizzes"),
    (search_api, "/search"),
    (subjects_api, "/subjects"),
    (users_api, "/users"),
]

for _module, _prefix in platform_routers:
    app.include_router(_module.router, prefix=f"{settings.API_V1_STR}{_prefix}")
