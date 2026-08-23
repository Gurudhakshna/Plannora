"""
AI-powered Flashcard generation service.
"""

from __future__ import annotations

import logging
import uuid
from typing import List, Optional
from pydantic import BaseModel
from app.prompts.flashcards import FLASHCARD_SYSTEM_PROMPT, FLASHCARD_USER_PROMPT_TEMPLATE
from app.schemas.ai import (
    FlashcardItemModel,
    FlashcardsGenerateResponse,
)
from app.services.groq_service import groq_service
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.flashcard import Flashcard
from app.schemas.flashcard import FlashcardCreate, FlashcardUpdate

logger = logging.getLogger("plannora.flashcard_service")


class _RawFlashcardResponse(BaseModel):
    title: str = "Study Flashcards"
    cards: List[FlashcardItemModel]


class FlashcardService:
    """
    Handles Groq-based flashcard deck generation.
    """

    async def generate_flashcards(
        self,
        topic: str,
        context: Optional[str] = None,
        count: int = 10,
        difficulty: str = "medium",
    ) -> FlashcardsGenerateResponse:
        """
        Generate active recall flashcards from academic material.
        """
        context_str = context.strip() if context else f"Academic Subject/Topic: {topic}"

        user_prompt = FLASHCARD_USER_PROMPT_TEMPLATE.format(
            topic=topic,
            difficulty=difficulty.capitalize(),
            count=count,
            context=context_str[:6000],
        )

        raw_deck: _RawFlashcardResponse = await groq_service.generate_json(
            system_prompt=FLASHCARD_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            response_schema=_RawFlashcardResponse,
            temperature=0.3,
            max_tokens=2500,
        )

        deck_id = f"deck_{uuid.uuid4().hex[:8]}"

        for idx, card in enumerate(raw_deck.cards):
            if not card.id or card.id.startswith("card_"):
                card.id = f"{deck_id}_c{idx + 1}"

        return FlashcardsGenerateResponse(
            success=True,
            deck_id=deck_id,
            title=raw_deck.title or f"{topic} Flashcards",
            cards=raw_deck.cards[:count],
        )


flashcard_service = FlashcardService()


# ============================================================================
# Flashcard CRUD (platform persistence layer)
# ============================================================================

def create_flashcard(db: Session, user_id: int, data: FlashcardCreate) -> Flashcard:
    """Create a new flashcard owned by the given user."""
    flashcard = Flashcard(
        user_id=user_id,
        subject_id=data.subject_id,
        front=data.front,
        back=data.back,
    )
    db.add(flashcard)
    db.commit()
    db.refresh(flashcard)
    return flashcard


def list_flashcards(
    db: Session, user_id: int, subject_id: Optional[int] = None
) -> List[Flashcard]:
    """Return all flashcards belonging to the given user (optionally filtered)."""
    query = db.query(Flashcard).filter(Flashcard.user_id == user_id)
    if subject_id is not None:
        query = query.filter(Flashcard.subject_id == subject_id)
    return query.order_by(Flashcard.created_at.desc()).all()


def get_flashcard(db: Session, flashcard_id: int, user_id: int) -> Flashcard:
    """
    Fetch a single flashcard by ID.

    Raises 404 if not found or does not belong to the user.
    """
    flashcard = db.query(Flashcard).filter(
        Flashcard.id == flashcard_id,
        Flashcard.user_id == user_id,
    ).first()
    if not flashcard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flashcard not found",
        )
    return flashcard


def update_flashcard(
    db: Session, flashcard_id: int, user_id: int, data: FlashcardUpdate
) -> Flashcard:
    """
    Update allowed flashcard fields.

    Raises 404 if the flashcard does not exist or does not belong to the user.
    """
    flashcard = get_flashcard(db, flashcard_id, user_id)

    if data.front is not None:
        flashcard.front = data.front
    if data.back is not None:
        flashcard.back = data.back
    if data.subject_id is not None:
        flashcard.subject_id = data.subject_id

    db.commit()
    db.refresh(flashcard)
    return flashcard


def delete_flashcard(db: Session, flashcard_id: int, user_id: int) -> None:
    """
    Delete a flashcard.

    Raises 404 if the flashcard does not exist or does not belong to the user.
    """
    flashcard = get_flashcard(db, flashcard_id, user_id)
    db.delete(flashcard)
    db.commit()
