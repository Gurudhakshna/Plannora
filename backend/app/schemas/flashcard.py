"""
Pydantic schemas for Flashcard endpoints.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class FlashcardCreate(BaseModel):
    front: str
    back: str
    subject_id: Optional[int] = None


class FlashcardUpdate(BaseModel):
    front: Optional[str] = None
    back: Optional[str] = None
    subject_id: Optional[int] = None


class FlashcardResponse(BaseModel):
    id: int
    user_id: int
    subject_id: Optional[int] = None
    front: str
    back: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
