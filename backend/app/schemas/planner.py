"""
Pydantic schemas for Planner endpoints.
"""

from datetime import date as dt_date, datetime as dt_datetime
from typing import Optional
from pydantic import BaseModel


class PlannerItemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    date: Optional[dt_date] = None
    status: str = "pending"


class PlannerItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[dt_date] = None
    status: Optional[str] = None


class PlannerItemResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str] = None
    date: Optional[dt_date] = None
    status: str
    created_at: dt_datetime
    updated_at: dt_datetime

    model_config = {"from_attributes": True}
