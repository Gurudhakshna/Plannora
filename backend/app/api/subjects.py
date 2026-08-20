"""
Subject API routes.

POST   /api/v1/subjects
GET    /api/v1/subjects
GET    /api/v1/subjects/{id}
PUT    /api/v1/subjects/{id}
DELETE /api/v1/subjects/{id}
"""

from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.schemas.subject import SubjectCreate, SubjectUpdate, SubjectResponse
from app.services import subject_service
from app.utils.dependencies import get_current_user

router = APIRouter()


@router.post(
    "",
    response_model=SubjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new subject",
)
def create_subject(
    data: SubjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a subject belonging to the authenticated user."""
    return subject_service.create_subject(db, current_user.id, data)


@router.get(
    "",
    response_model=List[SubjectResponse],
    summary="List all subjects",
)
def list_subjects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all subjects belonging to the authenticated user."""
    return subject_service.list_subjects(db, current_user.id)


@router.get(
    "/{subject_id}",
    response_model=SubjectResponse,
    summary="Get a subject by ID",
)
def get_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return a single subject. Only the owner can access it."""
    return subject_service.get_subject(db, subject_id, current_user.id)


@router.put(
    "/{subject_id}",
    response_model=SubjectResponse,
    summary="Update a subject",
)
def update_subject(
    subject_id: int,
    data: SubjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a subject. Only the owner can modify it."""
    return subject_service.update_subject(db, subject_id, current_user.id, data)


@router.delete(
    "/{subject_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a subject",
)
def delete_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a subject and its associated documents. Only the owner can delete."""
    subject_service.delete_subject(db, subject_id, current_user.id)
