"""
Pydantic schemas for Search endpoints.
"""

from typing import List, Optional
from pydantic import BaseModel


class SearchResultItem(BaseModel):
    type: str  # "subject", "document", etc.
    id: int
    title: str
    description: Optional[str] = None


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResultItem] = []
