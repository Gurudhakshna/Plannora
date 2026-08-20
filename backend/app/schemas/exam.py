"""
Pydantic schemas for Exam endpoints.
"""

from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel, Field


class ExamQuestionCreate(BaseModel):
    question_text: str
    options: List[str] = Field(min_length=2)
    correct_answer: str


class ExamQuestionResponse(BaseModel):
    id: int
    exam_id: int
    question_text: str
    options: List[str]
    correct_answer: str

    model_config = {"from_attributes": True}


class ExamCreate(BaseModel):
    title: str
    description: Optional[str] = None
    subject_id: Optional[int] = None
    questions: List[ExamQuestionCreate] = Field(min_length=1)


class ExamResponse(BaseModel):
    id: int
    user_id: int
    subject_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    created_at: datetime
    questions: List[ExamQuestionResponse] = []

    model_config = {"from_attributes": True}


class ExamSubmissionRequest(BaseModel):
    """
    Submissions pass a map of question_id (as str/int) to user's chosen answer.
    Example: {"answers": {"1": "Option A", "2": "Option C"}}
    """
    answers: Dict[str, str]


class ExamResultResponse(BaseModel):
    id: int
    exam_id: int
    user_id: int
    score: float
    correct_answers: int
    total_questions: int
    submitted_at: datetime

    model_config = {"from_attributes": True}
