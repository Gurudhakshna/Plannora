"""
Planner API routes.

POST   /api/v1/planner
GET    /api/v1/planner
GET    /api/v1/planner/{item_id}
PUT    /api/v1/planner/{item_id}
DELETE /api/v1/planner/{item_id}
"""

from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.schemas.planner import PlannerItemCreate, PlannerItemUpdate, PlannerItemResponse
from app.services import planner_service
from app.utils.dependencies import get_current_user

router = APIRouter()


@router.post(
    "",
    response_model=PlannerItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a planner item",
)
def create_planner_item(
    data: PlannerItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new study planner item for the authenticated user."""
    return planner_service.create_planner_item(db, current_user.id, data)


@router.get(
    "",
    response_model=List[PlannerItemResponse],
    summary="List planner items",
)
def list_planner_items(
    status: Optional[str] = Query(None, description="Filter by status (e.g. pending, completed)"),
    date: Optional[date] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List study planner items belonging to the authenticated user."""
    return planner_service.list_planner_items(db, current_user.id, status, date)


@router.get(
    "/{item_id}",
    response_model=PlannerItemResponse,
    summary="Get a planner item by ID",
)
def get_planner_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific planner item by ID."""
    return planner_service.get_planner_item(db, item_id, current_user.id)


@router.put(
    "/{item_id}",
    response_model=PlannerItemResponse,
    summary="Update a planner item",
)
def update_planner_item(
    item_id: int,
    data: PlannerItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a planner item."""
    return planner_service.update_planner_item(db, item_id, current_user.id, data)


@router.delete(
    "/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a planner item",
)
def delete_planner_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a planner item."""
    planner_service.delete_planner_item(db, item_id, current_user.id)
