"""
Pydantic schemas for all AI-powered Plannora API endpoints.
Validates input requests and enforces strict schema compliance on Groq outputs.
"""

from __future__ import annotations

from typing import Any, List, Optional
from pydantic import BaseModel, Field, field_validator


# ============================================================================
# Material Analysis Schemas
# ============================================================================

class ConceptModel(BaseModel):
    id: str = Field(default_factory=lambda: "c_" + str(abs(hash(str(id)))))
    name: str = Field(..., min_length=2, description="Concise academic noun phrase")
    priority: str = Field("medium", description="high|medium|low")
    category: str = Field("concept", description="law|definition|formula|concept|algorithm|example")
    estimatedMinutes: int = Field(15, ge=1, le=240)
    dependencies: List[str] = Field(default_factory=list)
    simpleExplanation: str = Field(..., min_length=5)
    detailedExplanation: str = Field(..., min_length=10)
    example: Optional[str] = None
    commonMistake: Optional[str] = None
    keyTakeaway: Optional[str] = None
    analogy: Optional[str] = None
    miniQuestion: Optional[str] = None
    miniQuestionAnswer: Optional[str] = None
    status: str = Field("not-started")


class DefinitionModel(BaseModel):
    term: str = Field(..., min_length=1)
    definition: str = Field(..., min_length=5)


class FormulaModel(BaseModel):
    name: str = Field(..., min_length=1)
    formula: str = Field(..., min_length=1)
    when: Optional[str] = None


class StepByStepExplanationModel(BaseModel):
    topic: str
    steps: List[str] = Field(default_factory=list)


class ExampleModel(BaseModel):
    title: str
    detail: str


class LikelyQuestionModel(BaseModel):
    question: str
    type: str = "theory"
    topic: str


class ExamIntelligenceModel(BaseModel):
    mustKnow: List[str] = Field(default_factory=list)
    highPriority: List[str] = Field(default_factory=list)
    likelyQuestions: List[LikelyQuestionModel] = Field(default_factory=list)


class StudyOrderItemModel(BaseModel):
    step: int
    topic: str
    reason: str


class AnalysisTaskModel(BaseModel):
    id: str
    title: str
    priority: str = "Medium"
    estimatedMinutes: int = 15
    conceptRef: Optional[str] = None
    taskType: str = "learn"


class AnalysisResultData(BaseModel):
    materialTitle: str
    executiveSummary: str
    detectedTopics: List[str] = Field(default_factory=list)
    concepts: List[ConceptModel] = Field(default_factory=list)
    definitions: List[DefinitionModel] = Field(default_factory=list)
    formulas: List[FormulaModel] = Field(default_factory=list)
    stepByStepExplanations: List[StepByStepExplanationModel] = Field(default_factory=list)
    examples: List[ExampleModel] = Field(default_factory=list)
    commonMistakes: List[str] = Field(default_factory=list)
    memoryTricks: List[str] = Field(default_factory=list)
    examIntelligence: Optional[ExamIntelligenceModel] = None
    studyOrder: List[StudyOrderItemModel] = Field(default_factory=list)
    estimatedStudyDuration: int = 60
    tasks: List[AnalysisTaskModel] = Field(default_factory=list)


class AnalyzeTextRequest(BaseModel):
    text: str = Field(..., min_length=10, description="Raw study material text")
    filename: Optional[str] = Field(None, description="Original filename")
    subject: Optional[str] = Field(None, description="Optional subject / course")


class AnalyzeTextResponse(BaseModel):
    success: bool = True
    analysis: AnalysisResultData


# ============================================================================
# Quiz Schemas
# ============================================================================

class QuizQuestionModel(BaseModel):
    id: str = Field(default_factory=lambda: "q_" + str(abs(hash(str(id)))))
    question: str = Field(..., min_length=5)
    options: List[str] = Field(..., min_length=4, max_length=4)
    correct_answer: int = Field(..., ge=0, le=3, description="0-indexed correct option")
    explanation: str = Field(..., min_length=5)
    topic: str = Field(..., min_length=1)
    difficulty: str = Field("medium")

    @field_validator("options")
    @classmethod
    def validate_four_options(cls, v: List[str]) -> List[str]:
        if len(v) != 4:
            raise ValueError("Quiz question must contain exactly 4 options")
        return v


class QuizGenerateRequest(BaseModel):
    subject: str = Field("General", min_length=1)
    topic: str = Field(..., min_length=1)
    context: Optional[str] = Field(None, description="Academic material context to ground questions")
    question_count: int = Field(5, ge=1, le=20)
    difficulty: str = Field("medium", pattern="^(easy|medium|hard|Easy|Medium|Hard)$")


class QuizGenerateResponse(BaseModel):
    success: bool = True
    quiz_id: str
    title: str
    questions: List[QuizQuestionModel]


class QuizSubmitItem(BaseModel):
    question_id: str
    selected_option: int = Field(..., ge=0, le=3)
    correct_answer: int = Field(..., ge=0, le=3)
    topic: str


class QuizSubmitRequest(BaseModel):
    quiz_id: Optional[str] = None
    subject: str = "General"
    topic: str
    answers: List[QuizSubmitItem]


class TopicPerformanceItem(BaseModel):
    topic: str
    correct: int
    total: int
    accuracy: float


class QuizSubmitResponse(BaseModel):
    success: bool = True
    score: int
    total: int
    percentage: float
    correct: int
    incorrect: int
    topic_performance: List[TopicPerformanceItem]
    weak_topics: List[str]
    message: str


# ============================================================================
# Flashcards Schemas
# ============================================================================

class FlashcardItemModel(BaseModel):
    id: str = Field(default_factory=lambda: "card_" + str(abs(hash(str(id)))))
    front: str = Field(..., min_length=3)
    back: str = Field(..., min_length=3)
    topic: str = Field(..., min_length=1)
    difficulty: str = Field("medium")


class FlashcardsGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=1)
    context: Optional[str] = Field(None, description="Academic material context")
    count: int = Field(10, ge=1, le=50)
    difficulty: str = Field("medium", pattern="^(easy|medium|hard|Easy|Medium|Hard)$")


class FlashcardsGenerateResponse(BaseModel):
    success: bool = True
    deck_id: str
    title: str
    cards: List[FlashcardItemModel]


class FlashcardRateRequest(BaseModel):
    card_id: str
    rating: str = Field(..., pattern="^(easy|medium|hard|Easy|Medium|Hard)$")
    topic: str


class FlashcardRateResponse(BaseModel):
    success: bool = True
    message: str


# ============================================================================
# Concept Map Schemas
# ============================================================================

class ConceptMapNodeModel(BaseModel):
    id: str
    label: str
    description: str
    importance: str = "high"  # high|medium|low
    category: str = "concept"
    mastery: Optional[str] = "not-started"


class ConceptMapEdgeModel(BaseModel):
    id: Optional[str] = None
    source: str
    target: str
    relationship: str = "depends_on"  # prerequisite|depends_on|related_to|part_of|causes
    label: Optional[str] = None


class ConceptMapGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=1)
    context: Optional[str] = Field(None, description="Material text or summary")


class ConceptMapGenerateResponse(BaseModel):
    success: bool = True
    topic: str
    nodes: List[ConceptMapNodeModel]
    edges: List[ConceptMapEdgeModel]


# ============================================================================
# Teach Me Schemas
# ============================================================================

class TeachPracticeQuestion(BaseModel):
    question: str
    answer: str


class TeachMeRequest(BaseModel):
    concept: str = Field(..., min_length=1)
    context: Optional[str] = Field(None, description="Academic source context")
    student_level: str = Field("beginner", pattern="^(beginner|intermediate|advanced|Beginner|Intermediate|Advanced)$")


class TeachMeResponse(BaseModel):
    success: bool = True
    concept: str
    level: str
    simple_explanation: str
    detailed_explanation: str
    analogy: str
    example: str
    common_mistakes: List[str] = Field(default_factory=list)
    key_takeaways: List[str] = Field(default_factory=list)
    practice_question: TeachPracticeQuestion


# ============================================================================
# Weak Topics Schemas
# ============================================================================

class TopicActivityData(BaseModel):
    topic: str
    subject: str = "General"
    correct_count: int = Field(0, ge=0)
    total_count: int = Field(0, ge=0)
    ratings: List[str] = Field(default_factory=list)  # list of "easy", "medium", "hard"


class WeakTopicItemModel(BaseModel):
    topic: str
    subject: str
    accuracy: float
    attempts: int
    confidence: str  # low | medium | high
    weakness_level: str  # Weak | Needs Practice | Good | Strong
    recommendation: str
    action_steps: List[str] = Field(default_factory=list)


class WeakTopicsCalculateRequest(BaseModel):
    activity_data: List[TopicActivityData] = Field(default_factory=list)
    context: Optional[str] = None


class WeakTopicsResponse(BaseModel):
    success: bool = True
    weak_topics: List[WeakTopicItemModel]
    summary: str


# ============================================================================
# Study Plan Schemas
# ============================================================================

class StudyPlanDaySessionModel(BaseModel):
    topic: str
    activity: str
    duration_minutes: int
    notes: Optional[str] = None


class StudyPlanDayModel(BaseModel):
    date: str  # ISO format YYYY-MM-DD
    label: str  # "Today", "Tomorrow", "Monday", etc.
    sessions: List[StudyPlanDaySessionModel]


class StudyPlanGenerateRequest(BaseModel):
    goal: str = Field(..., min_length=2)
    subjects: List[str] = Field(..., min_length=1)
    available_hours_per_day: float = Field(2.0, ge=0.5, le=16.0)
    days_per_week: int = Field(5, ge=1, le=7)
    start_date: Optional[str] = None  # YYYY-MM-DD
    target_date: Optional[str] = None  # YYYY-MM-DD
    context: Optional[str] = None


class StudyPlanGenerateResponse(BaseModel):
    success: bool = True
    plan_id: str
    title: str
    overview: str
    total_study_hours: float
    days: List[StudyPlanDayModel]
