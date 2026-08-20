"""
Document API routes.

POST   /api/v1/documents
GET    /api/v1/documents
GET    /api/v1/documents/{id}
DELETE /api/v1/documents/{id}
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.schemas.document import DocumentResponse
from app.services import document_service
from app.utils.dependencies import get_current_user

router = APIRouter()


@router.post(
    "",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a document",
)
def upload_document(
    file: UploadFile = File(...),
    subject_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload a file and create a document record.

    The file is stored locally under backend/uploads/.
    Optionally associate the document with a subject via subject_id.
    """
    return document_service.create_document(db, current_user.id, file, subject_id)


@router.get(
    "",
    response_model=List[DocumentResponse],
    summary="List all documents",
)
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all documents belonging to the authenticated user."""
    return document_service.list_documents(db, current_user.id)


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Get a document by ID",
)
def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return a single document's metadata. Only the owner can access it."""
    return document_service.get_document(db, document_id, current_user.id)


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a document",
)
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a document record and its associated file. Only the owner can delete."""
    document_service.delete_document(db, document_id, current_user.id)
