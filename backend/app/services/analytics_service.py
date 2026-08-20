"""
Analytics service — computes real database statistics for the authenticated user.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.subject import Subject
from app.models.document import Document
from app.models.quiz import Quiz, QuizResult
from app.models.flashcard import Flashcard
from app.models.exam import Exam, ExamResult
from app.models.planner import PlannerItem
from app.schemas.analytics import AnalyticsSummaryResponse


def get_analytics_summary(db: Session, user_id: int) -> AnalyticsSummaryResponse:
    """
    Calculate real user statistics from database records.
    Returns zero values if tables are empty for the user.
    """
    total_subjects = db.query(func.count(Subject.id)).filter(Subject.user_id == user_id).scalar() or 0
    total_documents = db.query(func.count(Document.id)).filter(Document.user_id == user_id).scalar() or 0
    total_quizzes = db.query(func.count(Quiz.id)).filter(Quiz.user_id == user_id).scalar() or 0
    total_flashcards = db.query(func.count(Flashcard.id)).filter(Flashcard.user_id == user_id).scalar() or 0
    total_exams = db.query(func.count(Exam.id)).filter(Exam.user_id == user_id).scalar() or 0
    total_planner_items = db.query(func.count(PlannerItem.id)).filter(PlannerItem.user_id == user_id).scalar() or 0

    avg_quiz = db.query(func.avg(QuizResult.score)).filter(QuizResult.user_id == user_id).scalar()
    average_quiz_score = round(float(avg_quiz), 2) if avg_quiz is not None else 0.0

    avg_exam = db.query(func.avg(ExamResult.score)).filter(ExamResult.user_id == user_id).scalar()
    average_exam_score = round(float(avg_exam), 2) if avg_exam is not None else 0.0

    return AnalyticsSummaryResponse(
        total_subjects=total_subjects,
        total_documents=total_documents,
        total_quizzes=total_quizzes,
        total_flashcards=total_flashcards,
        total_exams=total_exams,
        total_planner_items=total_planner_items,
        average_quiz_score=average_quiz_score,
        average_exam_score=average_exam_score,
    )
