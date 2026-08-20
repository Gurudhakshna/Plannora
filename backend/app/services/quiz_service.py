"""
Quiz service — business logic for quizzes, questions, and submissions.
"""

from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.quiz import Quiz, QuizQuestion, QuizResult
from app.schemas.quiz import QuizCreate, QuizSubmissionRequest


def create_quiz(db: Session, user_id: int, data: QuizCreate) -> Quiz:
    """Create a new quiz with questions for the authenticated user."""
    quiz = Quiz(
        user_id=user_id,
        subject_id=data.subject_id,
        title=data.title,
        description=data.description,
    )
    db.add(quiz)
    db.flush()  # Populates quiz.id for child questions

    for q_data in data.questions:
        question = QuizQuestion(
            quiz_id=quiz.id,
            question_text=q_data.question_text,
            options=q_data.options,
            correct_answer=q_data.correct_answer,
        )
        db.add(question)

    db.commit()
    db.refresh(quiz)
    return quiz


def list_quizzes(db: Session, user_id: int) -> List[Quiz]:
    """List all quizzes belonging to the authenticated user."""
    return db.query(Quiz).options(joinedload(Quiz.questions)).filter(Quiz.user_id == user_id).all()


def get_quiz(db: Session, quiz_id: int, user_id: int) -> Quiz:
    """
    Get a specific quiz by ID for the authenticated user.
    Raises 404 if not found or not owned by the user.
    """
    quiz = (
        db.query(Quiz)
        .options(joinedload(Quiz.questions))
        .filter(Quiz.id == quiz_id, Quiz.user_id == user_id)
        .first()
    )
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found",
        )
    return quiz


def submit_quiz(db: Session, quiz_id: int, user_id: int, data: QuizSubmissionRequest) -> QuizResult:
    """
    Submit answers for a quiz, calculate score, store and return the result.
    """
    quiz = get_quiz(db, quiz_id, user_id)
    questions = quiz.questions

    total_questions = len(questions)
    if total_questions == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz has no questions to evaluate",
        )

    correct_count = 0
    # Match submitted answers by question id (string or int representation)
    for question in questions:
        submitted_answer = data.answers.get(str(question.id))
        if submitted_answer is not None and submitted_answer.strip().lower() == question.correct_answer.strip().lower():
            correct_count += 1

    score_percentage = round((correct_count / total_questions) * 100.0, 2)

    result = QuizResult(
        quiz_id=quiz.id,
        user_id=user_id,
        score=score_percentage,
        correct_answers=correct_count,
        total_questions=total_questions,
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result
