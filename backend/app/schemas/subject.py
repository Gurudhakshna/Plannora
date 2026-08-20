"""
Pydantic schemas for subject endpoints.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SubjectCreate(BaseModel):
    """Request body for creating a subject."""
    name: str
    description: Optional[str] = None


class SubjectUpdate(BaseModel):
    """Request body for updating a subject. All fields optional."""
    name: Optional[str] = None
    description: Optional[str] = None


class SubjectResponse(BaseModel):
    """Public subject representation."""
    id: int
    user_id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
