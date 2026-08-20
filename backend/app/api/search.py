"""
Search API router.

GET /api/v1/search?q=<query>
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.schemas.search import SearchResponse
from app.services import search_service
from app.utils.dependencies import get_current_user

router = APIRouter()


@router.get(
    "",
    response_model=SearchResponse,
    summary="Search user study materials",
)
def search(
    q: str = Query("", description="Search term across subjects and documents"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Search user-owned subjects and documents by keywords."""
    return search_service.search_user_content(db, current_user.id, q)
