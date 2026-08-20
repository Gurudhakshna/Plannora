"""
Pydantic schemas for Analytics endpoints.
"""

from pydantic import BaseModel


class AnalyticsSummaryResponse(BaseModel):
    total_subjects: int
    total_documents: int
    total_quizzes: int
    total_flashcards: int
    total_exams: int
    total_planner_items: int
    average_quiz_score: float
    average_exam_score: float
