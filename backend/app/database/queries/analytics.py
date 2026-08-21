"""
Database analytics queries.

Provides aggregated statistics from the database for analytics and reporting.
All functions enforce user_id filtering to ensure data isolation.
"""

from typing import Dict, Any, Optional

from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func

from app.models.subject import Subject
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.quiz import Quiz, QuizResult
from app.models.flashcard import Flashcard
from app.models.exam import Exam, ExamResult
from app.models.planner import PlannerItem
from app.models.chat_message import ChatMessage


def get_user_study_summary(db: Session, user_id: int) -> Dict[str, Any]:
    """
    Get aggregated study statistics for a user.

    Returns counts for all entity types plus average scores.
    Compatible with the existing analytics endpoint schema.
    """
    total_subjects = (
        db.query(sa_func.count(Subject.id))
        .filter(Subject.user_id == user_id)
        .scalar()
    ) or 0

    total_documents = (
        db.query(sa_func.count(Document.id))
        .filter(Document.user_id == user_id)
        .scalar()
    ) or 0

    total_document_chunks = (
        db.query(sa_func.count(DocumentChunk.id))
        .filter(DocumentChunk.user_id == user_id)
        .scalar()
    ) or 0

    total_quizzes = (
        db.query(sa_func.count(Quiz.id))
        .filter(Quiz.user_id == user_id)
        .scalar()
    ) or 0

    total_flashcards = (
        db.query(sa_func.count(Flashcard.id))
        .filter(Flashcard.user_id == user_id)
        .scalar()
    ) or 0

    total_exams = (
        db.query(sa_func.count(Exam.id))
        .filter(Exam.user_id == user_id)
        .scalar()
    ) or 0

    total_planner_items = (
        db.query(sa_func.count(PlannerItem.id))
        .filter(PlannerItem.user_id == user_id)
        .scalar()
    ) or 0

    total_chat_sessions = (
        db.query(sa_func.count(sa_func.distinct(ChatMessage.session_id)))
        .filter(ChatMessage.user_id == user_id)
        .scalar()
    ) or 0

    # Average scores
    avg_quiz = (
        db.query(sa_func.avg(QuizResult.score))
        .filter(QuizResult.user_id == user_id)
        .scalar()
    )
    average_quiz_score = round(float(avg_quiz), 2) if avg_quiz is not None else 0.0

    avg_exam = (
        db.query(sa_func.avg(ExamResult.score))
        .filter(ExamResult.user_id == user_id)
        .scalar()
    )
    average_exam_score = round(float(avg_exam), 2) if avg_exam is not None else 0.0

    return {
        "total_subjects": total_subjects,
        "total_documents": total_documents,
        "total_document_chunks": total_document_chunks,
        "total_quizzes": total_quizzes,
        "total_flashcards": total_flashcards,
        "total_exams": total_exams,
        "total_planner_items": total_planner_items,
        "total_chat_sessions": total_chat_sessions,
        "average_quiz_score": average_quiz_score,
        "average_exam_score": average_exam_score,
    }


def get_document_chunk_statistics(
    db: Session, user_id: int
) -> Dict[str, Any]:
    """
    Get statistics about document chunks for a user.

    Returns total chunks, total tokens, documents with chunks, etc.
    """
    total_chunks = (
        db.query(sa_func.count(DocumentChunk.id))
        .filter(DocumentChunk.user_id == user_id)
        .scalar()
    ) or 0

    total_tokens = (
        db.query(sa_func.sum(DocumentChunk.token_count))
        .filter(DocumentChunk.user_id == user_id)
        .scalar()
    ) or 0

    documents_with_chunks = (
        db.query(sa_func.count(sa_func.distinct(DocumentChunk.document_id)))
        .filter(DocumentChunk.user_id == user_id)
        .scalar()
    ) or 0

    avg_chunk_tokens = (
        db.query(sa_func.avg(DocumentChunk.token_count))
        .filter(
            DocumentChunk.user_id == user_id,
            DocumentChunk.token_count.isnot(None),
        )
        .scalar()
    )
    avg_tokens_per_chunk = (
        round(float(avg_chunk_tokens), 1) if avg_chunk_tokens is not None else 0.0
    )

    return {
        "total_chunks": total_chunks,
        "total_tokens": int(total_tokens),
        "documents_with_chunks": documents_with_chunks,
        "average_tokens_per_chunk": avg_tokens_per_chunk,
    }


def get_subject_statistics(
    db: Session, user_id: int, subject_id: int
) -> Optional[Dict[str, Any]]:
    """
    Get statistics for a specific subject.
    Returns None if the subject doesn't exist or doesn't belong to the user.
    """
    subject = (
        db.query(Subject)
        .filter(Subject.id == subject_id, Subject.user_id == user_id)
        .first()
    )
    if not subject:
        return None

    doc_count = (
        db.query(sa_func.count(Document.id))
        .filter(Document.subject_id == subject_id, Document.user_id == user_id)
        .scalar()
    ) or 0

    quiz_count = (
        db.query(sa_func.count(Quiz.id))
        .filter(Quiz.subject_id == subject_id, Quiz.user_id == user_id)
        .scalar()
    ) or 0

    flashcard_count = (
        db.query(sa_func.count(Flashcard.id))
        .filter(Flashcard.subject_id == subject_id, Flashcard.user_id == user_id)
        .scalar()
    ) or 0

    exam_count = (
        db.query(sa_func.count(Exam.id))
        .filter(Exam.subject_id == subject_id, Exam.user_id == user_id)
        .scalar()
    ) or 0

    return {
        "subject_id": subject_id,
        "subject_name": subject.name,
        "total_documents": doc_count,
        "total_quizzes": quiz_count,
        "total_flashcards": flashcard_count,
        "total_exams": exam_count,
    }
