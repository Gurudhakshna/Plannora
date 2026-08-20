"""
Analytics API routes.

GET /api/v1/analytics/summary
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.schemas.analytics import AnalyticsSummaryResponse
from app.services import analytics_service
from app.utils.dependencies import get_current_user

router = APIRouter()


@router.get(
    "/summary",
    response_model=AnalyticsSummaryResponse,
    summary="Get user study analytics summary",
)
def get_analytics_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve aggregate statistics calculated from real database records for the authenticated user."""
    return analytics_service.get_analytics_summary(db, current_user.id)
