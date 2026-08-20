"""
Flashcards API routes.

POST   /api/v1/flashcards
GET    /api/v1/flashcards
GET    /api/v1/flashcards/{flashcard_id}
PUT    /api/v1/flashcards/{flashcard_id}
DELETE /api/v1/flashcards/{flashcard_id}
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.schemas.flashcard import FlashcardCreate, FlashcardUpdate, FlashcardResponse
from app.services import flashcard_service
from app.utils.dependencies import get_current_user

router = APIRouter()


@router.post(
    "",
    response_model=FlashcardResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a flashcard",
)
def create_flashcard(
    data: FlashcardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new flashcard for the authenticated user."""
    return flashcard_service.create_flashcard(db, current_user.id, data)


@router.get(
    "",
    response_model=List[FlashcardResponse],
    summary="List flashcards",
)
def list_flashcards(
    subject_id: Optional[int] = Query(None, description="Filter by subject ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List flashcards belonging to the authenticated user."""
    return flashcard_service.list_flashcards(db, current_user.id, subject_id)


@router.get(
    "/{flashcard_id}",
    response_model=FlashcardResponse,
    summary="Get a flashcard by ID",
)
def get_flashcard(
    flashcard_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific flashcard by ID."""
    return flashcard_service.get_flashcard(db, flashcard_id, current_user.id)


@router.put(
    "/{flashcard_id}",
    response_model=FlashcardResponse,
    summary="Update a flashcard",
)
def update_flashcard(
    flashcard_id: int,
    data: FlashcardUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a specific flashcard."""
    return flashcard_service.update_flashcard(db, flashcard_id, current_user.id, data)


@router.delete(
    "/{flashcard_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a flashcard",
)
def delete_flashcard(
    flashcard_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a specific flashcard."""
    flashcard_service.delete_flashcard(db, flashcard_id, current_user.id)
