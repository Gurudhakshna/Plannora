"""
Pydantic schemas for authentication endpoints.
"""

from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    """Request body for user registration."""
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    """Request body for user login."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Response body containing the JWT access token."""
    access_token: str
    token_type: str = "bearer"
