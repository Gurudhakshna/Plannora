"""
Search service — performs database search over user-owned subjects and documents.
Structured so that vector/RAG search can be plugged in alongside or in place of SQL search.
"""

from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.subject import Subject
from app.models.document import Document
from app.schemas.search import SearchResponse, SearchResultItem


def search_user_content(db: Session, user_id: int, query: str) -> SearchResponse:
    """
    Search subjects and documents belonging to the authenticated user.
    Uses case-insensitive substring matching.
    """
    cleaned_query = query.strip()
    if not cleaned_query:
        return SearchResponse(query=query, results=[])

    search_pattern = f"%{cleaned_query}%"
    results: List[SearchResultItem] = []

    # 1. Search Subjects
    subjects = (
        db.query(Subject)
        .filter(
            Subject.user_id == user_id,
            or_(
                Subject.name.ilike(search_pattern),
                Subject.description.ilike(search_pattern),
            ),
        )
        .all()
    )
    for subject in subjects:
        results.append(
            SearchResultItem(
                type="subject",
                id=subject.id,
                title=subject.name,
                description=subject.description,
            )
        )

    # 2. Search Documents
    documents = (
        db.query(Document)
        .filter(
            Document.user_id == user_id,
            Document.filename.ilike(search_pattern),
        )
        .all()
    )
    for doc in documents:
        results.append(
            SearchResultItem(
                type="document",
                id=doc.id,
                title=doc.filename,
                description=f"Type: {doc.content_type}" if doc.content_type else None,
            )
        )

    return SearchResponse(query=query, results=results)
