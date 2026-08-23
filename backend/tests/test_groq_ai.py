"""
Comprehensive tests for Plannora Groq AI backend integration.
Validates Groq service, schemas, deterministic scoring, json repair, chunking, and API endpoints.
"""

from __future__ import annotations

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.schemas.ai import (
    AnalysisResultData,
    ConceptModel,
    QuizGenerateResponse,
    QuizQuestionModel,
    QuizSubmitItem,
    FlashcardsGenerateResponse,
    FlashcardItemModel,
    ConceptMapGenerateResponse,
    ConceptMapNodeModel,
    ConceptMapEdgeModel,
    TeachMeResponse,
    TeachPracticeQuestion,
    TopicActivityData,
    StudyPlanGenerateRequest,
)
from app.services.analysis_service import analysis_service
from app.services.concept_map_service import concept_map_service
from app.services.flashcard_service import flashcard_service
from app.services.groq_service import GroqService, GroqServiceError
from app.services.quiz_service import quiz_service
from app.services.study_plan_service import study_plan_service
from app.services.teach_service import teach_service
from app.services.weak_topic_service import weak_topic_service
from app.utils.chunking import chunk_text
from app.utils.json_repair import extract_and_repair_json

client = TestClient(app)


# ============================================================================
# 1. JSON Extraction & Repair Tests
# ============================================================================

def test_json_repair_clean_json():
    raw = '{"key": "value", "numbers": [1, 2, 3]}'
    parsed = extract_and_repair_json(raw)
    assert parsed == {"key": "value", "numbers": [1, 2, 3]}


def test_json_repair_markdown_fences():
    raw = '```json\n{"status": "ok"}\n```'
    parsed = extract_and_repair_json(raw)
    assert parsed == {"status": "ok"}


def test_json_repair_trailing_commas():
    raw = '{"items": ["a", "b",], "done": true,}'
    parsed = extract_and_repair_json(raw)
    assert parsed == {"items": ["a", "b"], "done": True}


def test_json_repair_unclosed_brackets():
    raw = '{"title": "Truncated", "items": [{"id": 1}, {"id": 2'
    parsed = extract_and_repair_json(raw)
    assert parsed is not None
    assert parsed.get("title") == "Truncated"


def test_chunking_utility():
    text = "Paragraph 1.\n\nParagraph 2 with more sentences. Another sentence.\n\nParagraph 3."
    chunks = chunk_text(text, max_chunk_chars=35, overlap_chars=5)
    assert len(chunks) >= 2


# ============================================================================
# 2. Health Check Endpoint Test
# ============================================================================

def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["ai_provider"] == "groq"
    assert "model" in data
    assert "api_key" not in data  # Never expose credentials


# ============================================================================
# 3. Deterministic Quiz Scoring Tests
# ============================================================================

def test_deterministic_quiz_scoring():
    answers = [
        QuizSubmitItem(question_id="q1", selected_option=1, correct_answer=1, topic="Linear Algebra"),
        QuizSubmitItem(question_id="q2", selected_option=2, correct_answer=2, topic="Linear Algebra"),
        QuizSubmitItem(question_id="q3", selected_option=0, correct_answer=3, topic="Calculus"),
        QuizSubmitItem(question_id="q4", selected_option=1, correct_answer=1, topic="Calculus"),
    ]
    result = quiz_service.calculate_score(topic="Math", answers=answers)
    assert result.score == 3
    assert result.total == 4
    assert result.percentage == 75.0
    assert result.correct == 3
    assert result.incorrect == 1
    # Check topic breakdown
    la_perf = next(tp for tp in result.topic_performance if tp.topic == "Linear Algebra")
    assert la_perf.accuracy == 100.0
    calc_perf = next(tp for tp in result.topic_performance if tp.topic == "Calculus")
    assert calc_perf.accuracy == 50.0
    assert "Calculus" in result.weak_topics


# ============================================================================
# 4. Weak Topic Calculation Tests
# ============================================================================

@pytest.mark.asyncio
async def test_weak_topics_deterministic_classification():
    activity = [
        TopicActivityData(topic="Eigenvalues", subject="Math", correct_count=2, total_count=6),  # 33% -> Weak
        TopicActivityData(topic="Derivatives", subject="Math", correct_count=6, total_count=10), # 60% -> Needs Practice
        TopicActivityData(topic="Matrices", subject="Math", correct_count=9, total_count=10),    # 90% -> Strong
    ]
    
    with patch("app.services.groq_service.groq_service.generate_json", new_callable=AsyncMock) as mock_groq:
        from pydantic import BaseModel
        class _MockRec(BaseModel):
            topic: str = ""
            recommendation: str = "Review basic properties."
            action_steps: list[str] = ["Step 1"]

        mock_groq.return_value = _MockRec(topic="Eigenvalues", recommendation="Practice characteristic equations.")

        result = await weak_topic_service.calculate_weak_topics(activity_data=activity)
        assert len(result.weak_topics) == 3
        # Weakest topic first
        assert result.weak_topics[0].topic == "Eigenvalues"
        assert result.weak_topics[0].weakness_level == "Weak"
        assert result.weak_topics[1].weakness_level == "Needs Practice"
        assert result.weak_topics[2].weakness_level == "Strong"


# ============================================================================
# 5. Groq Service Mocked Generation Tests
# ============================================================================

@pytest.mark.asyncio
async def test_material_analysis_service():
    mock_data = AnalysisResultData(
        materialTitle="Newtonian Mechanics",
        executiveSummary="Covers Newton's three laws of motion and inertia.",
        detectedTopics=["Inertia", "Force", "Action-Reaction"],
        concepts=[
            ConceptModel(
                id="c1",
                name="Law of Inertia",
                priority="high",
                category="law",
                estimatedMinutes=15,
                simpleExplanation="An object stays at rest unless acted upon.",
                detailedExplanation="First law establishes reference frames and resistance to acceleration.",
            )
        ],
        definitions=[],
        formulas=[],
        stepByStepExplanations=[],
        examples=[],
        commonMistakes=["Confusing mass with weight"],
        memoryTricks=[],
        studyOrder=[],
        estimatedStudyDuration=45,
        tasks=[]
    )

    with patch("app.services.groq_service.groq_service.generate_json", new_callable=AsyncMock) as mock_groq:
        mock_groq.return_value = mock_data

        analysis = await analysis_service.analyze_text("Newtonian mechanics principles and laws of motion.")
        assert analysis.materialTitle == "Newtonian Mechanics"
        assert len(analysis.concepts) == 1
        assert len(analysis.tasks) == 1  # Auto-generated task safeguard


@pytest.mark.asyncio
async def test_quiz_generation_service():
    mock_response = MagicMock()
    mock_response.title = "Operating Systems Quiz"
    mock_response.questions = [
        QuizQuestionModel(
            id="q1",
            question="What is a deadlock condition?",
            options=["Mutual Exclusion", "Paging", "Caching", "Virtual Memory"],
            correct_answer=0,
            explanation="Mutual exclusion is one of the four Coffman conditions.",
            topic="Deadlocks",
            difficulty="medium",
        )
    ]

    with patch("app.services.groq_service.groq_service.generate_json", new_callable=AsyncMock) as mock_groq:
        mock_groq.return_value = mock_response

        quiz = await quiz_service.generate_quiz(
            subject="Computer Science",
            topic="Deadlocks",
            context="Deadlock requires mutual exclusion, hold and wait, no preemption, circular wait.",
            question_count=1,
            difficulty="medium"
        )
        assert quiz.success is True
        assert len(quiz.questions) == 1
        assert quiz.questions[0].correct_answer == 0


@pytest.mark.asyncio
async def test_flashcard_generation_service():
    mock_response = MagicMock()
    mock_response.title = "Algorithms Flashcards"
    mock_response.cards = [
        FlashcardItemModel(
            id="c1",
            front="What is the average time complexity of QuickSort?",
            back="O(n log n)",
            topic="Sorting",
            difficulty="medium"
        )
    ]

    with patch("app.services.groq_service.groq_service.generate_json", new_callable=AsyncMock) as mock_groq:
        mock_groq.return_value = mock_response

        deck = await flashcard_service.generate_flashcards(
            topic="Sorting",
            context="QuickSort divides an array using a pivot element.",
            count=1
        )
        assert deck.success is True
        assert len(deck.cards) == 1
        assert deck.cards[0].back == "O(n log n)"


@pytest.mark.asyncio
async def test_concept_map_service():
    mock_response = MagicMock()
    mock_response.topic = "Data Structures"
    mock_response.nodes = [
        ConceptMapNodeModel(id="n1", label="Arrays", description="Sequential memory", importance="high"),
        ConceptMapNodeModel(id="n2", label="Dynamic Arrays", description="Resizable arrays", importance="high"),
    ]
    mock_response.edges = [
        ConceptMapEdgeModel(source="n1", target="n2", relationship="prerequisite", label="Required for")
    ]

    with patch("app.services.groq_service.groq_service.generate_json", new_callable=AsyncMock) as mock_groq:
        mock_groq.return_value = mock_response

        cmap = await concept_map_service.generate_concept_map(topic="Data Structures")
        assert cmap.success is True
        assert len(cmap.nodes) == 2
        assert len(cmap.edges) == 1


@pytest.mark.asyncio
async def test_teach_me_service():
    mock_teach = TeachMeResponse(
        success=True,
        concept="Recursion",
        level="beginner",
        simple_explanation="A function calling itself until a base case is reached.",
        detailed_explanation="Recursion breaks problems into smaller identical sub-problems.",
        analogy="Russian nesting dolls (Matryoshka).",
        example="Calculating factorial: n * fact(n-1)",
        common_mistakes=["Forgetting the base case (Stack Overflow)"],
        key_takeaways=["Always define a base case", "Ensure step progresses toward base case"],
        practice_question=TeachPracticeQuestion(
            question="What happens if a recursive function lacks a base case?",
            answer="It runs indefinitely until the call stack runs out of memory (Stack Overflow)."
        )
    )

    with patch("app.services.groq_service.groq_service.generate_json", new_callable=AsyncMock) as mock_groq:
        mock_groq.return_value = mock_teach

        lesson = await teach_service.teach_concept(concept="Recursion", student_level="beginner")
        assert lesson.success is True
        assert lesson.concept == "Recursion"
        assert "nesting dolls" in lesson.analogy


@pytest.mark.asyncio
async def test_study_plan_generation_service():
    from app.services.study_plan_service import _RawStudyPlanResponse, _ModuleBreakdown, _TopicBreakdown
    mock_plan = _RawStudyPlanResponse(
        title="Python Mastery",
        overview="Two-week intensive roadmap",
        modules=[
            _ModuleBreakdown(
                module_name="Basics",
                subject="Python",
                topics=[
                    _TopicBreakdown(name="Variables & Loops", priority="high", difficulty="easy", estimated_hours=2.0)
                ]
            )
        ]
    )

    with patch("app.services.groq_service.groq_service.generate_json", new_callable=AsyncMock) as mock_groq:
        mock_groq.return_value = mock_plan

        req = StudyPlanGenerateRequest(
            goal="Python Exam",
            subjects=["Python"],
            available_hours_per_day=2.0,
            days_per_week=5,
            start_date="2026-09-01",
            target_date="2026-09-14"
        )
        plan = await study_plan_service.generate_plan(req)
        assert plan.success is True
        assert len(plan.days) > 0
        assert plan.days[0].date == "2026-09-01"


# ============================================================================
# 6. API Route Integration Tests
# ============================================================================

def test_api_quizzes_submit_endpoint():
    payload = {
        "topic": "Algorithms",
        "answers": [
            {"question_id": "q1", "selected_option": 1, "correct_answer": 1, "topic": "Sorting"},
            {"question_id": "q2", "selected_option": 0, "correct_answer": 2, "topic": "Graphs"}
        ]
    }
    response = client.post("/api/v1/quizzes/submit", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["score"] == 1
    assert data["total"] == 2
    assert data["percentage"] == 50.0
    assert "Graphs" in data["weak_topics"]


def test_api_flashcards_rate_endpoint():
    payload = {
        "card_id": "card_1",
        "rating": "hard",
        "topic": "Neural Networks"
    }
    response = client.post("/api/v1/flashcards/rate", json=payload)
    assert response.status_code == 200
    assert response.json()["success"] is True


def test_api_weak_topics_get_endpoint():
    response = client.get("/api/v1/weak-topics")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["weak_topics"], list)
