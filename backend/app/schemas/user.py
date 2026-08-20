"""
Pydantic schemas for user endpoints.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    """Public user representation — never includes the password."""
    id: int
    name: str
    email: EmailStr
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    """Fields allowed to be updated on PUT /users/me."""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
