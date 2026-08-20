"""
Exams API routes.

POST /api/v1/exams
GET  /api/v1/exams
GET  /api/v1/exams/{exam_id}
POST /api/v1/exams/{exam_id}/submit
"""

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.schemas.exam import ExamCreate, ExamResponse, ExamSubmissionRequest, ExamResultResponse
from app.services import exam_service
from app.utils.dependencies import get_current_user

router = APIRouter()


@router.post(
    "",
    response_model=ExamResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an exam with questions",
)
def create_exam(
    data: ExamCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new exam with questions owned by the authenticated user."""
    return exam_service.create_exam(db, current_user.id, data)


@router.get(
    "",
    response_model=List[ExamResponse],
    summary="List all exams",
)
def list_exams(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all exams owned by the authenticated user."""
    return exam_service.list_exams(db, current_user.id)


@router.get(
    "/{exam_id}",
    response_model=ExamResponse,
    summary="Get an exam by ID",
)
def get_exam(
    exam_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get an exam and its questions by ID."""
    return exam_service.get_exam(db, exam_id, current_user.id)


@router.post(
    "/{exam_id}/submit",
    response_model=ExamResultResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit answers and evaluate exam score",
)
def submit_exam(
    exam_id: int,
    data: ExamSubmissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit exam answers, calculate real score, and store result."""
    return exam_service.submit_exam(db, exam_id, current_user.id, data)
