"""
Document service — upload, retrieval, and deletion business logic.

File handling and DB operations are encapsulated here so the router stays thin.
The service is structured to allow future AI/RAG document processing to be
plugged in without changing the API layer.
"""

import os
import uuid
import shutil
from pathlib import Path
from typing import List, Optional

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models.document import Document

# ---------------------------------------------------------------------------
# Upload directory — created automatically on first use
# ---------------------------------------------------------------------------
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"


def _ensure_upload_dir() -> None:
    """Create the uploads directory if it does not exist."""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def create_document(
    db: Session,
    user_id: int,
    file: UploadFile,
    subject_id: Optional[int] = None,
) -> Document:
    """
    Save an uploaded file to local storage and create a database record.

    The file is stored under backend/uploads/ with a UUID prefix to avoid
    name collisions.
    """
    _ensure_upload_dir()

    # Generate a unique filename to avoid collisions
    ext = Path(file.filename or "file").suffix
    stored_name = f"{uuid.uuid4().hex}{ext}"
    dest_path = UPLOAD_DIR / stored_name

    # Write file to disk
    with open(dest_path, "wb") as buf:
        shutil.copyfileobj(file.file, buf)

    document = Document(
        user_id=user_id,
        subject_id=subject_id,
        filename=file.filename or "unknown",
        file_path=str(dest_path),
        content_type=file.content_type,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    # ------------------------------------------------------------------
    # Future AI/RAG integration point:
    #   After the document record is created, call an async processing
    #   function here, e.g.:
    #       await process_document_for_rag(document)
    # ------------------------------------------------------------------

    return document


def list_documents(db: Session, user_id: int) -> List[Document]:
    """Return all documents belonging to the given user."""
    return db.query(Document).filter(Document.user_id == user_id).all()


def get_document(db: Session, document_id: int, user_id: int) -> Document:
    """
    Fetch a single document by ID.

    Raises 404 if not found or does not belong to the user.
    """
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == user_id,
    ).first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return document


def delete_document(db: Session, document_id: int, user_id: int) -> None:
    """
    Delete a document record and its associated file from disk.

    Raises 404 if the document does not exist or does not belong to the user.
    """
    document = get_document(db, document_id, user_id)

    # Remove the physical file (ignore errors if file already gone)
    try:
        os.remove(document.file_path)
    except OSError:
        pass

    db.delete(document)
    db.commit()
