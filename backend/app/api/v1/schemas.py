"""
Pydantic request / response models for the AI API.

Shared across all route modules.
"""

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


# ==================================================================
# Chat / RAG
# ==================================================================

class ChatAskRequest(BaseModel):
    question: str = Field(..., min_length=1, description="The student's question")
    user_id: str = Field(..., min_length=1, description="Authenticated user ID")
    subject_id: Optional[str] = Field(None, description="Optional subject filter")


class SourceItem(BaseModel):
    document_id: str
    document_name: str
    page_number: Optional[int] = None
    similarity: float


class ChatAskResponse(BaseModel):
    answer: str
    sources: list[SourceItem] = []


# ==================================================================
# Quizzes
# ==================================================================

class QuizGenerateRequest(BaseModel):
    subject: str = Field(..., min_length=1)
    topic: str = Field(..., min_length=1)
    context: str = Field(..., min_length=1, description="Academic text to base questions on")
    number_of_questions: int = Field(5, ge=1, le=20)
    difficulty: str = Field("medium", pattern="^(easy|medium|hard)$")


class QuizQuestion(BaseModel):
    question: str
    options: list[str]
    correct_answer: str
    explanation: str
    topic: str
    difficulty: str


class QuizGenerateResponse(BaseModel):
    questions: list[dict[str, Any]]


# ==================================================================
# Flashcards
# ==================================================================

class FlashcardGenerateRequest(BaseModel):
    context: str = Field(..., min_length=1, description="Academic text")
    num_cards: int = Field(10, ge=1, le=50)


class FlashcardItem(BaseModel):
    question: str
    answer: str
    topic: str


class FlashcardGenerateResponse(BaseModel):
    flashcards: list[dict[str, Any]]


# ==================================================================
# Exams / Question Paper Analysis
# ==================================================================

class ExamAnalyzeRequest(BaseModel):
    paper_text: str = Field(..., min_length=1, description="Question paper text")


class ExamAnalyzeResponse(BaseModel):
    questions: list[dict[str, Any]]
    topic_analysis: list[dict[str, Any]]


# ==================================================================
# Study Planner / Recommendations
# ==================================================================

class TopicPriorityInput(BaseModel):
    topic: str
    importance_score: float = Field(..., ge=0, le=1)
    recommended_priority: str = Field("medium", pattern="^(high|medium|low)$")


class WeakTopicInput(BaseModel):
    topic: str
    accuracy: float = Field(..., ge=0, le=1)
    mastery: str


class QuizPerformanceInput(BaseModel):
    topic: str
    accuracy: float = Field(..., ge=0, le=1)


class RecommendationsRequest(BaseModel):
    exam_date: Optional[str] = Field(None, description="ISO date string YYYY-MM-DD")
    topic_priorities: list[TopicPriorityInput] = []
    weak_topics: list[WeakTopicInput] = []
    quiz_performance: list[QuizPerformanceInput] = []
    available_study_time: int = Field(120, ge=15, description="Minutes")
    syllabus_topics: list[str] = []
    recently_studied: list[str] = []


class RecommendationItem(BaseModel):
    topic: str
    activity: str
    priority_score: float
    reason: str
    estimated_minutes: int


class RecommendationsResponse(BaseModel):
    recommendations: list[RecommendationItem]
