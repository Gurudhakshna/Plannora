"""
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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "plannora-ai"}
