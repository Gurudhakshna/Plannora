"""
Authentication API routes.

POST /api/v1/auth/register
POST /api/v1/auth/login
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.schemas.user import UserResponse
from app.services.auth_service import register_user, authenticate_user

router = APIRouter()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """Create a new user account. Returns the created user (without password)."""
    user = register_user(db, data)
    return user


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and obtain a JWT token",
)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with email and password. Returns a JWT access token."""
    return authenticate_user(db, data)
