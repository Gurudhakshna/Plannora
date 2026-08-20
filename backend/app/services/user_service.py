"""
User service — profile retrieval and update business logic.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserUpdate


def get_user_by_id(db: Session, user_id: int) -> User:
    """Fetch a user by primary key. Raises 404 if not found."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


def update_user(db: Session, user: User, data: UserUpdate) -> User:
    """
    Update allowed user profile fields.

    Only fields explicitly provided (not None) are updated.
    Raises 400 if the new email is already taken by another user.
    """
    if data.email is not None and data.email != user.email:
        existing = db.query(User).filter(User.email == data.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        user.email = data.email

    if data.name is not None:
        user.name = data.name

    db.commit()
    db.refresh(user)
    return user
