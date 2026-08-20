"""
Planner service — business logic for study planner items.
"""

from datetime import date
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.planner import PlannerItem
from app.schemas.planner import PlannerItemCreate, PlannerItemUpdate


def create_planner_item(db: Session, user_id: int, data: PlannerItemCreate) -> PlannerItem:
    """Create a new planner item for the authenticated user."""
    item = PlannerItem(
        user_id=user_id,
        title=data.title,
        description=data.description,
        date=data.date,
        status=data.status,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def list_planner_items(
    db: Session,
    user_id: int,
    status_filter: Optional[str] = None,
    date_filter: Optional[date] = None,
) -> List[PlannerItem]:
    """List planner items for the user, with optional status and date filters."""
    query = db.query(PlannerItem).filter(PlannerItem.user_id == user_id)
    if status_filter is not None:
        query = query.filter(PlannerItem.status == status_filter)
    if date_filter is not None:
        query = query.filter(PlannerItem.date == date_filter)
    return query.order_by(PlannerItem.date.asc().nulls_last(), PlannerItem.id.asc()).all()


def get_planner_item(db: Session, item_id: int, user_id: int) -> PlannerItem:
    """
    Get a specific planner item by ID.
    Raises 404 if not found or unauthorized.
    """
    item = (
        db.query(PlannerItem)
        .filter(PlannerItem.id == item_id, PlannerItem.user_id == user_id)
        .first()
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Planner item not found",
        )
    return item


def update_planner_item(
    db: Session, item_id: int, user_id: int, data: PlannerItemUpdate
) -> PlannerItem:
    """Update an existing planner item owned by the user."""
    item = get_planner_item(db, item_id, user_id)

    if data.title is not None:
        item.title = data.title
    if data.description is not None:
        item.description = data.description
    if data.date is not None:
        item.date = data.date
    if data.status is not None:
        item.status = data.status

    db.commit()
    db.refresh(item)
    return item


def delete_planner_item(db: Session, item_id: int, user_id: int) -> None:
    """Delete a planner item owned by the user."""
    item = get_planner_item(db, item_id, user_id)
    db.delete(item)
    db.commit()
