"""
Flashcard service — CRUD business logic for flashcards.
"""

from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.flashcard import Flashcard
from app.schemas.flashcard import FlashcardCreate, FlashcardUpdate


def create_flashcard(db: Session, user_id: int, data: FlashcardCreate) -> Flashcard:
    """Create a new flashcard for the authenticated user."""
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


def list_flashcards(db: Session, user_id: int, subject_id: Optional[int] = None) -> List[Flashcard]:
    """List all flashcards for the user, optionally filtered by subject."""
    query = db.query(Flashcard).filter(Flashcard.user_id == user_id)
    if subject_id is not None:
        query = query.filter(Flashcard.subject_id == subject_id)
    return query.all()


def get_flashcard(db: Session, flashcard_id: int, user_id: int) -> Flashcard:
    """
    Get a specific flashcard by ID.
    Raises 404 if not found or unauthorized.
    """
    flashcard = (
        db.query(Flashcard)
        .filter(Flashcard.id == flashcard_id, Flashcard.user_id == user_id)
        .first()
    )
    if not flashcard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flashcard not found",
        )
    return flashcard


def update_flashcard(
    db: Session, flashcard_id: int, user_id: int, data: FlashcardUpdate
) -> Flashcard:
    """Update an existing flashcard owned by the user."""
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
    """Delete a flashcard owned by the user."""
    flashcard = get_flashcard(db, flashcard_id, user_id)
    db.delete(flashcard)
    db.commit()
