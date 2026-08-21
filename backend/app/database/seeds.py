"""
Development seed data for Plannora database.

Usage:
    cd backend
    python -m app.database.seeds

This script populates the database with sample data for development and
testing. It does NOT insert real credentials, API keys, or sensitive data.

IMPORTANT:
    - Run ``alembic upgrade head`` before seeding.
    - This script is idempotent — it checks for existing data before inserting.
    - All passwords shown below are placeholder hashes for development only.
"""

import sys
import os

# Ensure the backend package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.models.user import User
from app.models.subject import Subject
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.quiz import Quiz, QuizQuestion, QuizResult
from app.models.flashcard import Flashcard
from app.models.exam import Exam, ExamQuestion, ExamResult
from app.models.planner import PlannerItem
from app.models.chat_message import ChatMessage


# Placeholder hash — NOT a real password hash. The auth service handles hashing.
DEMO_HASHED_PASSWORD = (
    "$argon2id$v=19$m=65536,t=3,p=4$c2VlZGRlbW8$placeholderDoNotUseInProduction"
)


def seed_database(db: Session) -> None:
    """Populate the database with development sample data."""

    # Check if data already exists
    existing_users = db.query(User).count()
    if existing_users > 0:
        print(f"Database already has {existing_users} user(s). Skipping seed.")
        print("To re-seed, drop and recreate the database first.")
        return

    print("Seeding database with sample data...")

    # -----------------------------------------------------------------
    # Users
    # -----------------------------------------------------------------
    user_alice = User(
        name="Alice Johnson",
        email="alice@example.com",
        hashed_password=DEMO_HASHED_PASSWORD,
    )
    user_bob = User(
        name="Bob Smith",
        email="bob@example.com",
        hashed_password=DEMO_HASHED_PASSWORD,
    )
    db.add_all([user_alice, user_bob])
    db.flush()
    print(f"  Created users: Alice (id={user_alice.id}), Bob (id={user_bob.id})")

    # -----------------------------------------------------------------
    # Subjects
    # -----------------------------------------------------------------
    subj_math = Subject(
        user_id=user_alice.id,
        name="Mathematics",
        description="Calculus, linear algebra, and statistics",
    )
    subj_cs = Subject(
        user_id=user_alice.id,
        name="Computer Science",
        description="Data structures, algorithms, and operating systems",
    )
    subj_physics = Subject(
        user_id=user_alice.id,
        name="Physics",
        description="Mechanics, thermodynamics, and electromagnetism",
    )
    subj_bio = Subject(
        user_id=user_bob.id,
        name="Biology",
        description="Cell biology, genetics, and ecology",
    )
    db.add_all([subj_math, subj_cs, subj_physics, subj_bio])
    db.flush()
    print("  Created subjects: Mathematics, Computer Science, Physics, Biology")

    # -----------------------------------------------------------------
    # Documents
    # -----------------------------------------------------------------
    doc_calculus = Document(
        user_id=user_alice.id,
        subject_id=subj_math.id,
        filename="calculus_notes.pdf",
        file_path="/uploads/seed_calculus_notes.pdf",
        content_type="application/pdf",
    )
    doc_algorithms = Document(
        user_id=user_alice.id,
        subject_id=subj_cs.id,
        filename="algorithms_textbook.pdf",
        file_path="/uploads/seed_algorithms_textbook.pdf",
        content_type="application/pdf",
    )
    db.add_all([doc_calculus, doc_algorithms])
    db.flush()
    print("  Created documents: calculus_notes.pdf, algorithms_textbook.pdf")

    # -----------------------------------------------------------------
    # Document Chunks (sample text, no embeddings)
    # -----------------------------------------------------------------
    chunks_data = [
        {
            "document_id": doc_calculus.id,
            "user_id": user_alice.id,
            "chunk_index": 0,
            "content": (
                "A derivative measures the rate of change of a function "
                "with respect to a variable. The derivative of f(x) = x^2 "
                "is f'(x) = 2x."
            ),
            "token_count": 32,
            "page_number": 1,
            "chunk_metadata": {"section": "Introduction to Derivatives"},
        },
        {
            "document_id": doc_calculus.id,
            "user_id": user_alice.id,
            "chunk_index": 1,
            "content": (
                "Integration is the reverse process of differentiation. "
                "The integral of 2x is x^2 + C, where C is the constant "
                "of integration."
            ),
            "token_count": 28,
            "page_number": 3,
            "chunk_metadata": {"section": "Introduction to Integration"},
        },
        {
            "document_id": doc_calculus.id,
            "user_id": user_alice.id,
            "chunk_index": 2,
            "content": (
                "The Fundamental Theorem of Calculus connects differentiation "
                "and integration, showing they are inverse processes."
            ),
            "token_count": 18,
            "page_number": 5,
            "chunk_metadata": {"section": "Fundamental Theorem"},
        },
        {
            "document_id": doc_algorithms.id,
            "user_id": user_alice.id,
            "chunk_index": 0,
            "content": (
                "Binary search is an efficient algorithm for finding an "
                "element in a sorted array. It works by repeatedly dividing "
                "the search interval in half."
            ),
            "token_count": 30,
            "page_number": 1,
            "chunk_metadata": {"section": "Search Algorithms"},
        },
        {
            "document_id": doc_algorithms.id,
            "user_id": user_alice.id,
            "chunk_index": 1,
            "content": (
                "The time complexity of binary search is O(log n), making it "
                "significantly faster than linear search O(n) for large datasets."
            ),
            "token_count": 25,
            "page_number": 2,
            "chunk_metadata": {"section": "Time Complexity Analysis"},
        },
    ]
    chunk_objects = [DocumentChunk(**cd) for cd in chunks_data]
    db.add_all(chunk_objects)
    db.flush()
    print(f"  Created {len(chunk_objects)} document chunks")

    # -----------------------------------------------------------------
    # Quiz
    # -----------------------------------------------------------------
    quiz = Quiz(
        user_id=user_alice.id,
        subject_id=subj_cs.id,
        title="Data Structures Basics",
        description="Test your knowledge of fundamental data structures",
    )
    db.add(quiz)
    db.flush()

    quiz_q1 = QuizQuestion(
        quiz_id=quiz.id,
        question_text="Which data structure uses LIFO ordering?",
        options=["Queue", "Stack", "Array", "Linked List"],
        correct_answer="Stack",
    )
    quiz_q2 = QuizQuestion(
        quiz_id=quiz.id,
        question_text="What is the time complexity of accessing an array element by index?",
        options=["O(1)", "O(n)", "O(log n)", "O(n^2)"],
        correct_answer="O(1)",
    )
    db.add_all([quiz_q1, quiz_q2])
    db.flush()

    quiz_result = QuizResult(
        quiz_id=quiz.id,
        user_id=user_alice.id,
        score=100.0,
        correct_answers=2,
        total_questions=2,
    )
    db.add(quiz_result)
    db.flush()
    print("  Created quiz with 2 questions and 1 result")

    # -----------------------------------------------------------------
    # Flashcards
    # -----------------------------------------------------------------
    flashcards = [
        Flashcard(
            user_id=user_alice.id,
            subject_id=subj_cs.id,
            front="What is a hash table?",
            back="A data structure that maps keys to values using a hash function for O(1) average lookup.",
        ),
        Flashcard(
            user_id=user_alice.id,
            subject_id=subj_math.id,
            front="What is the chain rule?",
            back="If y = f(g(x)), then dy/dx = f'(g(x)) * g'(x).",
        ),
        Flashcard(
            user_id=user_alice.id,
            subject_id=subj_physics.id,
            front="Newton's Second Law",
            back="F = ma (Force equals mass times acceleration).",
        ),
    ]
    db.add_all(flashcards)
    db.flush()
    print(f"  Created {len(flashcards)} flashcards")

    # -----------------------------------------------------------------
    # Exam
    # -----------------------------------------------------------------
    exam = Exam(
        user_id=user_alice.id,
        subject_id=subj_math.id,
        title="Calculus Midterm",
        description="Covers derivatives and basic integration",
    )
    db.add(exam)
    db.flush()

    exam_q1 = ExamQuestion(
        exam_id=exam.id,
        question_text="What is the derivative of sin(x)?",
        options=["cos(x)", "-cos(x)", "sin(x)", "-sin(x)"],
        correct_answer="cos(x)",
    )
    exam_q2 = ExamQuestion(
        exam_id=exam.id,
        question_text="What is the integral of 1/x?",
        options=["x", "ln|x| + C", "1/x^2", "e^x"],
        correct_answer="ln|x| + C",
    )
    db.add_all([exam_q1, exam_q2])
    db.flush()

    exam_result = ExamResult(
        exam_id=exam.id,
        user_id=user_alice.id,
        score=50.0,
        correct_answers=1,
        total_questions=2,
    )
    db.add(exam_result)
    db.flush()
    print("  Created exam with 2 questions and 1 result")

    # -----------------------------------------------------------------
    # Planner Items
    # -----------------------------------------------------------------
    planner_items = [
        PlannerItem(
            user_id=user_alice.id,
            title="Review calculus chapter 5",
            description="Focus on integration techniques",
            date=date(2026, 8, 22),
            status="pending",
        ),
        PlannerItem(
            user_id=user_alice.id,
            title="Complete algorithms assignment",
            description="Binary search and sorting problems",
            date=date(2026, 8, 23),
            status="pending",
        ),
        PlannerItem(
            user_id=user_alice.id,
            title="Physics lab report",
            description="Write up results from mechanics experiment",
            date=date(2026, 8, 21),
            status="completed",
        ),
    ]
    db.add_all(planner_items)
    db.flush()
    print(f"  Created {len(planner_items)} planner items")

    # -----------------------------------------------------------------
    # Chat Messages (sample conversation)
    # -----------------------------------------------------------------
    chat_messages = [
        ChatMessage(
            user_id=user_alice.id,
            session_id="session-seed-001",
            role="user",
            content="What is the derivative of x^3?",
        ),
        ChatMessage(
            user_id=user_alice.id,
            session_id="session-seed-001",
            role="assistant",
            content="The derivative of x^3 is 3x^2, using the power rule: d/dx[x^n] = n*x^(n-1).",
        ),
        ChatMessage(
            user_id=user_alice.id,
            session_id="session-seed-001",
            role="user",
            content="And what about x^4?",
        ),
        ChatMessage(
            user_id=user_alice.id,
            session_id="session-seed-001",
            role="assistant",
            content="The derivative of x^4 is 4x^3, applying the same power rule.",
        ),
    ]
    db.add_all(chat_messages)
    db.flush()
    print(f"  Created {len(chat_messages)} chat messages in 1 session")

    # -----------------------------------------------------------------
    # Commit all changes
    # -----------------------------------------------------------------
    db.commit()
    print("\n" + "=" * 40)
    print("Seed data inserted successfully!")
    print(f"  Users:            2 (Alice, Bob)")
    print(f"  Subjects:         4")
    print(f"  Documents:        2")
    print(f"  Document Chunks:  {len(chunk_objects)}")
    print(f"  Quizzes:          1 (2 questions, 1 result)")
    print(f"  Flashcards:       {len(flashcards)}")
    print(f"  Exams:            1 (2 questions, 1 result)")
    print(f"  Planner Items:    {len(planner_items)}")
    print(f"  Chat Messages:    {len(chat_messages)}")
    print("=" * 40)


if __name__ == "__main__":
    print("Plannora — Database Seed Script")
    print("=" * 40)
    db = SessionLocal()
    try:
        seed_database(db)
    except Exception as e:
        db.rollback()
        print(f"\nError seeding database: {e}")
        raise
    finally:
        db.close()
