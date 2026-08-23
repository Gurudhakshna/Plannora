"""
AI-powered Quiz generation and deterministic Python scoring service.
"""

from __future__ import annotations

import logging
import uuid
from typing import Dict, List, Optional
from pydantic import BaseModel
from app.prompts.quiz import QUIZ_SYSTEM_PROMPT, QUIZ_USER_PROMPT_TEMPLATE
from app.schemas.ai import (
    QuizGenerateResponse,
    QuizQuestionModel,
    QuizSubmitItem,
    QuizSubmitResponse,
    TopicPerformanceItem,
)
from app.services.groq_service import groq_service
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.quiz import Quiz, QuizQuestion, QuizResult
from app.schemas.quiz import QuizCreate, QuizSubmissionRequest

logger = logging.getLogger("plannora.quiz_service")


class _RawQuizResponse(BaseModel):
    title: str = "Diagnostic Quiz"
    questions: List[QuizQuestionModel]


class QuizService:
    """
    Handles Groq-based quiz generation and deterministic Python scoring.
    """

    async def generate_quiz(
        self,
        subject: str,
        topic: str,
        context: Optional[str] = None,
        question_count: int = 5,
        difficulty: str = "medium",
    ) -> QuizGenerateResponse:
        """
        Generate multiple-choice quiz questions using Groq.
        """
        context_str = context.strip() if context else f"General academic subject: {subject}, Topic: {topic}"

        user_prompt = QUIZ_USER_PROMPT_TEMPLATE.format(
            subject=subject,
            topic=topic,
            difficulty=difficulty.capitalize(),
            question_count=question_count,
            context=context_str[:6000],
        )

        raw_quiz: _RawQuizResponse = await groq_service.generate_json(
            system_prompt=QUIZ_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            response_schema=_RawQuizResponse,
            temperature=0.3,
            max_tokens=2500,
        )

        quiz_id = f"quiz_{uuid.uuid4().hex[:8]}"

        # Ensure question IDs are unique and well-formed
        for idx, q in enumerate(raw_quiz.questions):
            if not q.id or q.id.startswith("q_"):
                q.id = f"{quiz_id}_q{idx + 1}"

        return QuizGenerateResponse(
            success=True,
            quiz_id=quiz_id,
            title=raw_quiz.title or f"{topic} Quiz",
            questions=raw_quiz.questions[:question_count],
        )

    def calculate_score(
        self,
        topic: str,
        answers: List[QuizSubmitItem],
    ) -> QuizSubmitResponse:
        """
        Deterministically calculate quiz performance and identify weak areas in Python.
        Never calls Groq for deterministic math.
        """
        total = len(answers)
        if total == 0:
            return QuizSubmitResponse(
                success=True,
                score=0,
                total=0,
                percentage=0.0,
                correct=0,
                incorrect=0,
                topic_performance=[],
                weak_topics=[],
                message="No answers submitted.",
            )

        correct_count = 0
        topic_stats: Dict[str, Dict[str, int]] = {}

        for item in answers:
            t = item.topic or topic
            if t not in topic_stats:
                topic_stats[t] = {"correct": 0, "total": 0}
            
            topic_stats[t]["total"] += 1
            if item.selected_option == item.correct_answer:
                correct_count += 1
                topic_stats[t]["correct"] += 1

        incorrect_count = total - correct_count
        percentage = round((correct_count / total) * 100.0, 1)

        topic_performance: List[TopicPerformanceItem] = []
        weak_topics: List[str] = []

        for t_name, stat in topic_stats.items():
            t_acc = round((stat["correct"] / stat["total"]) * 100.0, 1) if stat["total"] > 0 else 0.0
            topic_performance.append(
                TopicPerformanceItem(
                    topic=t_name,
                    correct=stat["correct"],
                    total=stat["total"],
                    accuracy=t_acc,
                )
            )
            if t_acc < 60.0:
                weak_topics.append(t_name)

        if percentage >= 80:
            msg = "Outstanding mastery! You have a solid grasp of these concepts."
        elif percentage >= 60:
            msg = "Good effort. Reviewing a few specific topics will help solidify your understanding."
        else:
            msg = "Targeted review recommended. Focus on identified weak topics before re-attempting."

        return QuizSubmitResponse(
            success=True,
            score=correct_count,
            total=total,
            percentage=percentage,
            correct=correct_count,
            incorrect=incorrect_count,
            topic_performance=topic_performance,
            weak_topics=weak_topics,
            message=msg,
        )


quiz_service = QuizService()


# ============================================================================
# Quiz CRUD (platform persistence layer)
# ============================================================================

def create_quiz(db: Session, user_id: int, data: QuizCreate) -> Quiz:
    """Create a new quiz with questions owned by the given user."""
    quiz = Quiz(
        user_id=user_id,
        subject_id=data.subject_id,
        title=data.title,
        description=data.description,
    )
    db.add(quiz)
    db.flush()
    for q in data.questions:
        db.add(
            QuizQuestion(
                quiz_id=quiz.id,
                question_text=q.question_text,
                options=q.options,
                correct_answer=q.correct_answer,
            )
        )
    db.commit()
    db.refresh(quiz)
    return quiz


def list_quizzes(db: Session, user_id: int) -> List[Quiz]:
    """Return all quizzes belonging to the given user."""
    return (
        db.query(Quiz)
        .filter(Quiz.user_id == user_id)
        .order_by(Quiz.created_at.desc())
        .all()
    )


def get_quiz(db: Session, quiz_id: int, user_id: int) -> Quiz:
    """
    Fetch a single quiz by ID.

    Raises 404 if not found or does not belong to the user.
    """
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.user_id == user_id,
    ).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found",
        )
    return quiz


def submit_quiz(
    db: Session, quiz_id: int, user_id: int, data: QuizSubmissionRequest
) -> QuizResult:
    """
    Score submitted answers deterministically and persist a QuizResult.

    Raises 404 if the quiz does not exist or does not belong to the user.
    """
    quiz = get_quiz(db, quiz_id, user_id)

    total_questions = len(quiz.questions)
    correct_answers = 0
    for question in quiz.questions:
        submitted = data.answers.get(str(question.id))
        if submitted is not None and submitted == question.correct_answer:
            correct_answers += 1

    score = (correct_answers / total_questions * 100.0) if total_questions else 0.0

    result = QuizResult(
        quiz_id=quiz.id,
        user_id=user_id,
        score=score,
        correct_answers=correct_answers,
        total_questions=total_questions,
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result
