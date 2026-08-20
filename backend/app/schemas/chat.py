"""
Pydantic schemas for Chat endpoints.
"""

from pydantic import BaseModel, Field


class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User's query or prompt")


class ChatMessageResponse(BaseModel):
    message: str
    response: str
