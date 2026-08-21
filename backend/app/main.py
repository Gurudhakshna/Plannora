"""
Plannora Backend — FastAPI Application Entry Point.

This module creates and configures the FastAPI application instance,
sets up CORS middleware, and includes all API routers.
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import router as v1_router

app = FastAPI(
    title="Plannora API",
    description=(
        "Backend API for Plannora — a study planning and learning platform "
        "with AI-powered learning features."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS — configure the deployed frontend URL with CORS_ORIGINS.
# ---------------------------------------------------------------------------
cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "service": "plannora",
    }


# ---------------------------------------------------------------------------
# API v1
# ---------------------------------------------------------------------------
app.include_router(v1_router, prefix="/api/v1")
