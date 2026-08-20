"""
Subject service — CRUD business logic for subjects.
"""

from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.subject import Subject
from app.schemas.subject import SubjectCreate, SubjectUpdate


def create_subject(db: Session, user_id: int, data: SubjectCreate) -> Subject:
    """Create a new subject owned by the given user."""
    subject = Subject(
        user_id=user_id,
        name=data.name,
        description=data.description,
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


def list_subjects(db: Session, user_id: int) -> List[Subject]:
    """Return all subjects belonging to the given user."""
    return db.query(Subject).filter(Subject.user_id == user_id).all()


def get_subject(db: Session, subject_id: int, user_id: int) -> Subject:
    """
    Fetch a single subject by ID.

    Raises 404 if not found or does not belong to the user.
    """
    subject = db.query(Subject).filter(
        Subject.id == subject_id,
        Subject.user_id == user_id,
    ).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found",
        )
    return subject


def update_subject(db: Session, subject_id: int, user_id: int, data: SubjectUpdate) -> Subject:
    """
    Update allowed subject fields.

    Raises 404 if the subject does not exist or does not belong to the user.
    """
    subject = get_subject(db, subject_id, user_id)

    if data.name is not None:
        subject.name = data.name
    if data.description is not None:
        subject.description = data.description

    db.commit()
    db.refresh(subject)
    return subject


def delete_subject(db: Session, subject_id: int, user_id: int) -> None:
    """
    Delete a subject.

    Raises 404 if the subject does not exist or does not belong to the user.
    """
    subject = get_subject(db, subject_id, user_id)
    db.delete(subject)
    db.commit()
