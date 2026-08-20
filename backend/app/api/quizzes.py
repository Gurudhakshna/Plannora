"""
Quizzes API routes.

POST /api/v1/quizzes
GET  /api/v1/quizzes
GET  /api/v1/quizzes/{quiz_id}
POST /api/v1/quizzes/{quiz_id}/submit
"""

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.schemas.quiz import QuizCreate, QuizResponse, QuizSubmissionRequest, QuizResultResponse
from app.services import quiz_service
from app.utils.dependencies import get_current_user

router = APIRouter()


@router.post(
    "",
    response_model=QuizResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new quiz with questions",
)
def create_quiz(
    data: QuizCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new quiz with questions owned by the authenticated user."""
    return quiz_service.create_quiz(db, current_user.id, data)


@router.get(
    "",
    response_model=List[QuizResponse],
    summary="List all quizzes",
)
def list_quizzes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all quizzes owned by the authenticated user."""
    return quiz_service.list_quizzes(db, current_user.id)


@router.get(
    "/{quiz_id}",
    response_model=QuizResponse,
    summary="Get a quiz by ID",
)
def get_quiz(
    quiz_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a quiz and its questions by ID."""
    return quiz_service.get_quiz(db, quiz_id, current_user.id)


@router.post(
    "/{quiz_id}/submit",
    response_model=QuizResultResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit answers and evaluate quiz score",
)
def submit_quiz(
    quiz_id: int,
    data: QuizSubmissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit quiz answers, compute real score, and store result."""
    return quiz_service.submit_quiz(db, quiz_id, current_user.id, data)
