"""
Pydantic schemas for document endpoints.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    """Public document representation (metadata only, not file content)."""
    id: int
    user_id: int
    subject_id: Optional[int] = None
    filename: str
    file_path: str
    content_type: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
