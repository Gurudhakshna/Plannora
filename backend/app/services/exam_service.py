"""
Exam service — business logic for exams, questions, and submissions.
"""

from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.exam import Exam, ExamQuestion, ExamResult
from app.schemas.exam import ExamCreate, ExamSubmissionRequest


def create_exam(db: Session, user_id: int, data: ExamCreate) -> Exam:
    """Create a new exam with questions for the authenticated user."""
    exam = Exam(
        user_id=user_id,
        subject_id=data.subject_id,
        title=data.title,
        description=data.description,
    )
    db.add(exam)
    db.flush()  # Populates exam.id for child questions

    for q_data in data.questions:
        question = ExamQuestion(
            exam_id=exam.id,
            question_text=q_data.question_text,
            options=q_data.options,
            correct_answer=q_data.correct_answer,
        )
        db.add(question)

    db.commit()
    db.refresh(exam)
    return exam


def list_exams(db: Session, user_id: int) -> List[Exam]:
    """List all exams belonging to the authenticated user."""
    return db.query(Exam).options(joinedload(Exam.questions)).filter(Exam.user_id == user_id).all()


def get_exam(db: Session, exam_id: int, user_id: int) -> Exam:
    """
    Get a specific exam by ID for the authenticated user.
    Raises 404 if not found or unauthorized.
    """
    exam = (
        db.query(Exam)
        .options(joinedload(Exam.questions))
        .filter(Exam.id == exam_id, Exam.user_id == user_id)
        .first()
    )
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found",
        )
    return exam


def submit_exam(db: Session, exam_id: int, user_id: int, data: ExamSubmissionRequest) -> ExamResult:
    """
    Submit answers for an exam, calculate score, store and return the result.
    """
    exam = get_exam(db, exam_id, user_id)
    questions = exam.questions

    total_questions = len(questions)
    if total_questions == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Exam has no questions to evaluate",
        )

    correct_count = 0
    # Match submitted answers by question id (string or int representation)
    for question in questions:
        submitted_answer = data.answers.get(str(question.id))
        if submitted_answer is not None and submitted_answer.strip().lower() == question.correct_answer.strip().lower():
            correct_count += 1

    score_percentage = round((correct_count / total_questions) * 100.0, 2)

    result = ExamResult(
        exam_id=exam.id,
        user_id=user_id,
        score=score_percentage,
        correct_answers=correct_count,
        total_questions=total_questions,
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result
