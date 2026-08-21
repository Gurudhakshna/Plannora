"""
Database-focused unit tests for Plannora.

Tests model creation, relationships, cascade behavior, constraints,
user data isolation, and query functions.

These tests use SQLite in-memory (via conftest.py) and do NOT require
PostgreSQL or pgvector. Vector-specific tests will be added after
Member 3 confirms the embedding dimension.
"""

import pytest
from sqlalchemy.exc import IntegrityError

from app.models.user import User
from app.models.subject import Subject
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.quiz import Quiz, QuizQuestion, QuizResult
from app.models.flashcard import Flashcard
from app.models.exam import Exam, ExamQuestion, ExamResult
from app.models.planner import PlannerItem
from app.models.chat_message import ChatMessage
from app.database.queries import document_chunks as chunk_queries
from app.database.queries import chat_messages as chat_queries
from app.database.queries import analytics as analytics_queries
from app.database.queries import search as search_queries


# -------------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------------

def _create_user(db, name="Test User", email="test@example.com"):
    """Helper to create a user."""
    user = User(
        name=name,
        email=email,
        hashed_password="$fakehash$notreal",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _create_subject(db, user_id, name="Math"):
    """Helper to create a subject."""
    subject = Subject(user_id=user_id, name=name, description=f"Description for {name}")
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


def _create_document(db, user_id, subject_id=None, filename="test.pdf"):
    """Helper to create a document."""
    doc = Document(
        user_id=user_id,
        subject_id=subject_id,
        filename=filename,
        file_path=f"/uploads/{filename}",
        content_type="application/pdf",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


# =========================================================================
# Phase 1 — DocumentChunk Model Tests
# =========================================================================

class TestDocumentChunkModel:
    """Tests for the DocumentChunk model."""

    def test_create_chunk(self, db_session):
        """Test basic chunk creation with all fields."""
        user = _create_user(db_session)
        doc = _create_document(db_session, user.id)

        chunk = DocumentChunk(
            document_id=doc.id,
            user_id=user.id,
            chunk_index=0,
            content="This is a test chunk of text.",
            token_count=8,
            page_number=1,
            chunk_metadata={"section": "Introduction"},
        )
        db_session.add(chunk)
        db_session.commit()
        db_session.refresh(chunk)

        assert chunk.id is not None
        assert chunk.document_id == doc.id
        assert chunk.user_id == user.id
        assert chunk.chunk_index == 0
        assert chunk.content == "This is a test chunk of text."
        assert chunk.token_count == 8
        assert chunk.page_number == 1
        assert chunk.chunk_metadata == {"section": "Introduction"}
        assert chunk.created_at is not None

    def test_chunk_document_relationship(self, db_session):
        """Test that chunk.document navigates to the parent Document."""
        user = _create_user(db_session)
        doc = _create_document(db_session, user.id, filename="notes.pdf")

        chunk = DocumentChunk(
            document_id=doc.id, user_id=user.id, chunk_index=0, content="text"
        )
        db_session.add(chunk)
        db_session.commit()
        db_session.refresh(chunk)

        assert chunk.document is not None
        assert chunk.document.id == doc.id
        assert chunk.document.filename == "notes.pdf"

    def test_document_chunks_relationship(self, db_session):
        """Test that document.chunks navigates to child chunks."""
        user = _create_user(db_session)
        doc = _create_document(db_session, user.id)

        for i in range(3):
            db_session.add(DocumentChunk(
                document_id=doc.id, user_id=user.id,
                chunk_index=i, content=f"Chunk {i}",
            ))
        db_session.commit()
        db_session.refresh(doc)

        assert len(doc.chunks) == 3

    def test_chunk_user_relationship(self, db_session):
        """Test that chunk.owner navigates to the User."""
        user = _create_user(db_session)
        doc = _create_document(db_session, user.id)

        chunk = DocumentChunk(
            document_id=doc.id, user_id=user.id, chunk_index=0, content="text"
        )
        db_session.add(chunk)
        db_session.commit()
        db_session.refresh(chunk)

        assert chunk.owner is not None
        assert chunk.owner.id == user.id

    def test_user_document_chunks_relationship(self, db_session):
        """Test that user.document_chunks navigates to their chunks."""
        user = _create_user(db_session)
        doc = _create_document(db_session, user.id)

        for i in range(2):
            db_session.add(DocumentChunk(
                document_id=doc.id, user_id=user.id,
                chunk_index=i, content=f"Chunk {i}",
            ))
        db_session.commit()
        db_session.refresh(user)

        assert len(user.document_chunks) == 2

    def test_cascade_delete_document_deletes_chunks(self, db_session):
        """Test that deleting a document cascades to its chunks."""
        user = _create_user(db_session)
        doc = _create_document(db_session, user.id)

        for i in range(3):
            db_session.add(DocumentChunk(
                document_id=doc.id, user_id=user.id,
                chunk_index=i, content=f"Chunk {i}",
            ))
        db_session.commit()

        assert db_session.query(DocumentChunk).count() == 3

        db_session.delete(doc)
        db_session.commit()

        assert db_session.query(DocumentChunk).count() == 0

    def test_cascade_delete_user_deletes_chunks(self, db_session):
        """Test that deleting a user cascades to their chunks."""
        user = _create_user(db_session)
        doc = _create_document(db_session, user.id)
        db_session.add(DocumentChunk(
            document_id=doc.id, user_id=user.id, chunk_index=0, content="text"
        ))
        db_session.commit()

        assert db_session.query(DocumentChunk).count() == 1

        db_session.delete(user)
        db_session.commit()

        assert db_session.query(DocumentChunk).count() == 0

    def test_chunk_requires_content(self, db_session):
        """Test NOT NULL constraint on content."""
        user = _create_user(db_session)
        doc = _create_document(db_session, user.id)

        chunk = DocumentChunk(
            document_id=doc.id, user_id=user.id, chunk_index=0, content=None
        )
        db_session.add(chunk)
        with pytest.raises(IntegrityError):
            db_session.commit()
        db_session.rollback()

    def test_chunk_requires_document_id(self, db_session):
        """Test FK constraint on document_id."""
        user = _create_user(db_session)

        chunk = DocumentChunk(
            document_id=99999,  # Non-existent
            user_id=user.id,
            chunk_index=0,
            content="text",
        )
        db_session.add(chunk)
        with pytest.raises(IntegrityError):
            db_session.commit()
        db_session.rollback()

    def test_optional_fields_nullable(self, db_session):
        """Test that token_count, page_number, chunk_metadata are nullable."""
        user = _create_user(db_session)
        doc = _create_document(db_session, user.id)

        chunk = DocumentChunk(
            document_id=doc.id, user_id=user.id,
            chunk_index=0, content="minimal chunk",
        )
        db_session.add(chunk)
        db_session.commit()
        db_session.refresh(chunk)

        assert chunk.token_count is None
        assert chunk.page_number is None
        assert chunk.chunk_metadata is None

    def test_chunk_repr(self, db_session):
        """Test __repr__ method."""
        user = _create_user(db_session)
        doc = _create_document(db_session, user.id)

        chunk = DocumentChunk(
            document_id=doc.id, user_id=user.id, chunk_index=2, content="text"
        )
        db_session.add(chunk)
        db_session.commit()
        db_session.refresh(chunk)

        assert "DocumentChunk" in repr(chunk)
        assert "chunk_index=2" in repr(chunk)


# =========================================================================
# Phase 2 — ChatMessage Model Tests
# =========================================================================

class TestChatMessageModel:
    """Tests for the ChatMessage model."""

    def test_create_message(self, db_session):
        """Test basic message creation."""
        user = _create_user(db_session)

        msg = ChatMessage(
            user_id=user.id,
            session_id="sess-001",
            role="user",
            content="Hello, can you help me study?",
        )
        db_session.add(msg)
        db_session.commit()
        db_session.refresh(msg)

        assert msg.id is not None
        assert msg.user_id == user.id
        assert msg.session_id == "sess-001"
        assert msg.role == "user"
        assert msg.content == "Hello, can you help me study?"
        assert msg.created_at is not None

    def test_message_user_relationship(self, db_session):
        """Test that message.owner navigates to the User."""
        user = _create_user(db_session)

        msg = ChatMessage(
            user_id=user.id, session_id="s1", role="user", content="test"
        )
        db_session.add(msg)
        db_session.commit()
        db_session.refresh(msg)

        assert msg.owner is not None
        assert msg.owner.id == user.id

    def test_user_chat_messages_relationship(self, db_session):
        """Test that user.chat_messages navigates to messages."""
        user = _create_user(db_session)

        for i in range(3):
            db_session.add(ChatMessage(
                user_id=user.id, session_id="s1",
                role="user" if i % 2 == 0 else "assistant",
                content=f"Message {i}",
            ))
        db_session.commit()
        db_session.refresh(user)

        assert len(user.chat_messages) == 3

    def test_cascade_delete_user_deletes_messages(self, db_session):
        """Test that deleting a user cascades to their chat messages."""
        user = _create_user(db_session)
        db_session.add(ChatMessage(
            user_id=user.id, session_id="s1", role="user", content="test"
        ))
        db_session.commit()

        assert db_session.query(ChatMessage).count() == 1

        db_session.delete(user)
        db_session.commit()

        assert db_session.query(ChatMessage).count() == 0

    def test_message_requires_content(self, db_session):
        """Test NOT NULL constraint on content."""
        user = _create_user(db_session)

        msg = ChatMessage(
            user_id=user.id, session_id="s1", role="user", content=None
        )
        db_session.add(msg)
        with pytest.raises(IntegrityError):
            db_session.commit()
        db_session.rollback()

    def test_message_requires_session_id(self, db_session):
        """Test NOT NULL constraint on session_id."""
        user = _create_user(db_session)

        msg = ChatMessage(
            user_id=user.id, session_id=None, role="user", content="test"
        )
        db_session.add(msg)
        with pytest.raises(IntegrityError):
            db_session.commit()
        db_session.rollback()

    def test_message_repr(self, db_session):
        """Test __repr__ method."""
        user = _create_user(db_session)
        msg = ChatMessage(
            user_id=user.id, session_id="s1", role="user", content="test"
        )
        db_session.add(msg)
        db_session.commit()
        db_session.refresh(msg)

        assert "ChatMessage" in repr(msg)
        assert "s1" in repr(msg)


# =========================================================================
# User Data Isolation Tests
# =========================================================================

class TestUserDataIsolation:
    """Tests ensuring one user cannot access another user's data via queries."""

    def test_chunk_queries_isolate_by_user(self, db_session):
        """User A's chunks are NOT returned when querying for User B."""
        user_a = _create_user(db_session, email="a@test.com")
        user_b = _create_user(db_session, email="b@test.com")

        doc_a = _create_document(db_session, user_a.id, filename="a.pdf")
        doc_b = _create_document(db_session, user_b.id, filename="b.pdf")

        db_session.add(DocumentChunk(
            document_id=doc_a.id, user_id=user_a.id,
            chunk_index=0, content="Alice's private notes",
        ))
        db_session.add(DocumentChunk(
            document_id=doc_b.id, user_id=user_b.id,
            chunk_index=0, content="Bob's private notes",
        ))
        db_session.commit()

        # Query as user_a — should only see Alice's chunk
        alice_chunks = chunk_queries.get_chunks_by_document(
            db_session, doc_a.id, user_a.id
        )
        assert len(alice_chunks) == 1
        assert "Alice" in alice_chunks[0].content

        # Query Bob's doc as user_a — should get nothing
        wrong_chunks = chunk_queries.get_chunks_by_document(
            db_session, doc_b.id, user_a.id
        )
        assert len(wrong_chunks) == 0

    def test_chat_queries_isolate_by_user(self, db_session):
        """User A's messages are NOT returned when querying for User B."""
        user_a = _create_user(db_session, email="a@test.com")
        user_b = _create_user(db_session, email="b@test.com")

        chat_queries.create_message(
            db_session, user_id=user_a.id, session_id="s1",
            role="user", content="Alice's question",
        )
        chat_queries.create_message(
            db_session, user_id=user_b.id, session_id="s1",
            role="user", content="Bob's question",
        )

        alice_msgs = chat_queries.get_session_messages(
            db_session, user_a.id, "s1"
        )
        assert len(alice_msgs) == 1
        assert "Alice" in alice_msgs[0].content

    def test_text_search_isolates_by_user(self, db_session):
        """Text search only returns the querying user's chunks."""
        user_a = _create_user(db_session, email="a@test.com")
        user_b = _create_user(db_session, email="b@test.com")

        doc_a = _create_document(db_session, user_a.id)
        doc_b = _create_document(db_session, user_b.id)

        db_session.add(DocumentChunk(
            document_id=doc_a.id, user_id=user_a.id,
            chunk_index=0, content="Quantum physics explained",
        ))
        db_session.add(DocumentChunk(
            document_id=doc_b.id, user_id=user_b.id,
            chunk_index=0, content="Quantum computing overview",
        ))
        db_session.commit()

        # Search as user_a — should only find Alice's chunk
        results = chunk_queries.search_chunks_by_content(
            db_session, user_a.id, "Quantum"
        )
        assert len(results) == 1
        assert "physics" in results[0].content

    def test_chunk_get_by_id_isolates_by_user(self, db_session):
        """Getting a chunk by ID enforces user ownership."""
        user_a = _create_user(db_session, email="a@test.com")
        user_b = _create_user(db_session, email="b@test.com")
        doc_a = _create_document(db_session, user_a.id)

        chunk = chunk_queries.create_chunk(
            db_session, document_id=doc_a.id, user_id=user_a.id,
            chunk_index=0, content="private data",
        )

        # user_b should NOT be able to access user_a's chunk
        found = chunk_queries.get_chunk_by_id(db_session, chunk.id, user_b.id)
        assert found is None

    def test_analytics_isolates_by_user(self, db_session):
        """Analytics only counts the requesting user's data."""
        user_a = _create_user(db_session, email="a@test.com")
        user_b = _create_user(db_session, email="b@test.com")

        # Give user_a a subject and document
        _create_subject(db_session, user_a.id, "Alice Math")
        _create_document(db_session, user_a.id, filename="alice.pdf")

        # Give user_b two subjects
        _create_subject(db_session, user_b.id, "Bob Bio")
        _create_subject(db_session, user_b.id, "Bob Chem")

        summary_a = analytics_queries.get_user_study_summary(db_session, user_a.id)
        summary_b = analytics_queries.get_user_study_summary(db_session, user_b.id)

        assert summary_a["total_subjects"] == 1
        assert summary_a["total_documents"] == 1
        assert summary_b["total_subjects"] == 2
        assert summary_b["total_documents"] == 0


# =========================================================================
# Phase 3 — Query Layer Tests
# =========================================================================

class TestDocumentChunkQueries:
    """Tests for document chunk query functions."""

    def test_create_chunk_via_query(self, db_session):
        user = _create_user(db_session)
        doc = _create_document(db_session, user.id)

        chunk = chunk_queries.create_chunk(
            db_session,
            document_id=doc.id,
            user_id=user.id,
            chunk_index=0,
            content="Created via query function",
            token_count=5,
        )
        assert chunk.id is not None
        assert chunk.content == "Created via query function"
        assert chunk.token_count == 5

    def test_create_chunks_bulk(self, db_session):
        user = _create_user(db_session)
        doc = _create_document(db_session, user.id)

        chunks_data = [
            {"document_id": doc.id, "user_id": user.id,
             "chunk_index": i, "content": f"Bulk chunk {i}"}
            for i in range(5)
        ]
        chunks = chunk_queries.create_chunks_bulk(db_session, chunks=chunks_data)
        assert len(chunks) == 5
        assert all(c.id is not None for c in chunks)

    def test_get_chunks_by_document_ordered(self, db_session):
        user = _create_user(db_session)
        doc = _create_document(db_session, user.id)

        # Insert out of order
        for i in [2, 0, 1]:
            chunk_queries.create_chunk(
                db_session, document_id=doc.id, user_id=user.id,
                chunk_index=i, content=f"Chunk {i}",
            )

        chunks = chunk_queries.get_chunks_by_document(db_session, doc.id, user.id)
        assert [c.chunk_index for c in chunks] == [0, 1, 2]

    def test_get_chunk_by_id(self, db_session):
        user = _create_user(db_session)
        doc = _create_document(db_session, user.id)

        chunk = chunk_queries.create_chunk(
            db_session, document_id=doc.id, user_id=user.id,
            chunk_index=0, content="Find me",
        )
        found = chunk_queries.get_chunk_by_id(db_session, chunk.id, user.id)
        assert found is not None
        assert found.content == "Find me"

    def test_delete_chunks_by_document(self, db_session):
        user = _create_user(db_session)
        doc = _create_document(db_session, user.id)

        for i in range(3):
            chunk_queries.create_chunk(
                db_session, document_id=doc.id, user_id=user.id,
                chunk_index=i, content=f"Chunk {i}",
            )

        count = chunk_queries.delete_chunks_by_document(db_session, doc.id, user.id)
        assert count == 3
        assert chunk_queries.count_chunks_for_document(db_session, doc.id, user.id) == 0

    def test_count_chunks(self, db_session):
        user = _create_user(db_session)
        doc = _create_document(db_session, user.id)

        for i in range(4):
            chunk_queries.create_chunk(
                db_session, document_id=doc.id, user_id=user.id,
                chunk_index=i, content=f"Chunk {i}",
            )

        assert chunk_queries.count_chunks_for_document(db_session, doc.id, user.id) == 4
        assert chunk_queries.count_all_user_chunks(db_session, user.id) == 4

    def test_search_chunks_by_content(self, db_session):
        user = _create_user(db_session)
        doc = _create_document(db_session, user.id)

        chunk_queries.create_chunk(
            db_session, document_id=doc.id, user_id=user.id,
            chunk_index=0,
            content="The mitochondria is the powerhouse of the cell",
        )
        chunk_queries.create_chunk(
            db_session, document_id=doc.id, user_id=user.id,
            chunk_index=1,
            content="DNA replication occurs during the S phase",
        )

        results = chunk_queries.search_chunks_by_content(
            db_session, user.id, "mitochondria"
        )
        assert len(results) == 1
        assert "powerhouse" in results[0].content

    def test_search_empty_query_returns_empty(self, db_session):
        user = _create_user(db_session)
        results = chunk_queries.search_chunks_by_content(db_session, user.id, "")
        assert results == []


class TestChatMessageQueries:
    """Tests for chat message query functions."""

    def test_create_and_get_session(self, db_session):
        user = _create_user(db_session)

        chat_queries.create_message(
            db_session, user_id=user.id, session_id="s1",
            role="user", content="Hello",
        )
        chat_queries.create_message(
            db_session, user_id=user.id, session_id="s1",
            role="assistant", content="Hi there!",
        )

        messages = chat_queries.get_session_messages(db_session, user.id, "s1")
        assert len(messages) == 2
        assert messages[0].role == "user"
        assert messages[1].role == "assistant"

    def test_get_user_sessions(self, db_session):
        user = _create_user(db_session)

        chat_queries.create_message(
            db_session, user_id=user.id, session_id="s1",
            role="user", content="First session",
        )
        chat_queries.create_message(
            db_session, user_id=user.id, session_id="s2",
            role="user", content="Second session",
        )

        sessions = chat_queries.get_user_sessions(db_session, user.id)
        assert len(sessions) == 2
        assert set(sessions) == {"s1", "s2"}

    def test_get_latest_session_id(self, db_session):
        user = _create_user(db_session)

        chat_queries.create_message(
            db_session, user_id=user.id, session_id="old-session",
            role="user", content="old",
        )
        chat_queries.create_message(
            db_session, user_id=user.id, session_id="new-session",
            role="user", content="new",
        )

        latest = chat_queries.get_latest_session_id(db_session, user.id)
        assert latest is not None
        # Most recent message's session should be returned
        assert latest in ("old-session", "new-session")

    def test_get_latest_session_id_empty(self, db_session):
        user = _create_user(db_session)
        assert chat_queries.get_latest_session_id(db_session, user.id) is None

    def test_delete_session(self, db_session):
        user = _create_user(db_session)

        chat_queries.create_message(
            db_session, user_id=user.id, session_id="s1",
            role="user", content="msg1",
        )
        chat_queries.create_message(
            db_session, user_id=user.id, session_id="s1",
            role="assistant", content="msg2",
        )
        chat_queries.create_message(
            db_session, user_id=user.id, session_id="s2",
            role="user", content="other session",
        )

        count = chat_queries.delete_session(db_session, user.id, "s1")
        assert count == 2

        # s2 should still exist
        remaining = chat_queries.get_session_messages(db_session, user.id, "s2")
        assert len(remaining) == 1

    def test_delete_all_user_messages(self, db_session):
        user = _create_user(db_session)

        chat_queries.create_message(
            db_session, user_id=user.id, session_id="s1",
            role="user", content="msg1",
        )
        chat_queries.create_message(
            db_session, user_id=user.id, session_id="s2",
            role="user", content="msg2",
        )

        count = chat_queries.delete_all_user_messages(db_session, user.id)
        assert count == 2
        assert chat_queries.get_user_sessions(db_session, user.id) == []

    def test_count_session_messages(self, db_session):
        user = _create_user(db_session)

        chat_queries.create_message(
            db_session, user_id=user.id, session_id="s1",
            role="user", content="msg",
        )
        chat_queries.create_message(
            db_session, user_id=user.id, session_id="s1",
            role="assistant", content="reply",
        )

        assert chat_queries.count_session_messages(db_session, user.id, "s1") == 2
        assert chat_queries.count_session_messages(db_session, user.id, "nonexistent") == 0


class TestAnalyticsQueries:
    """Tests for analytics query functions."""

    def test_study_summary_empty(self, db_session):
        user = _create_user(db_session)
        summary = analytics_queries.get_user_study_summary(db_session, user.id)

        assert summary["total_subjects"] == 0
        assert summary["total_documents"] == 0
        assert summary["total_document_chunks"] == 0
        assert summary["total_quizzes"] == 0
        assert summary["total_flashcards"] == 0
        assert summary["total_exams"] == 0
        assert summary["total_planner_items"] == 0
        assert summary["total_chat_sessions"] == 0
        assert summary["average_quiz_score"] == 0.0
        assert summary["average_exam_score"] == 0.0

    def test_study_summary_with_data(self, db_session):
        user = _create_user(db_session)
        subject = _create_subject(db_session, user.id)
        doc = _create_document(db_session, user.id, subject.id)

        # Add a chunk
        db_session.add(DocumentChunk(
            document_id=doc.id, user_id=user.id,
            chunk_index=0, content="chunk text",
        ))
        # Add a flashcard
        db_session.add(Flashcard(
            user_id=user.id, subject_id=subject.id,
            front="Q", back="A",
        ))
        # Add a chat message
        db_session.add(ChatMessage(
            user_id=user.id, session_id="s1", role="user", content="hi",
        ))
        db_session.commit()

        summary = analytics_queries.get_user_study_summary(db_session, user.id)
        assert summary["total_subjects"] == 1
        assert summary["total_documents"] == 1
        assert summary["total_document_chunks"] == 1
        assert summary["total_flashcards"] == 1
        assert summary["total_chat_sessions"] == 1

    def test_document_chunk_statistics(self, db_session):
        user = _create_user(db_session)
        doc = _create_document(db_session, user.id)

        for i in range(3):
            db_session.add(DocumentChunk(
                document_id=doc.id, user_id=user.id,
                chunk_index=i, content=f"Chunk {i}",
                token_count=100 + i * 10,
            ))
        db_session.commit()

        stats = analytics_queries.get_document_chunk_statistics(db_session, user.id)
        assert stats["total_chunks"] == 3
        assert stats["documents_with_chunks"] == 1
        assert stats["total_tokens"] == 330  # 100 + 110 + 120

    def test_document_chunk_statistics_empty(self, db_session):
        user = _create_user(db_session)
        stats = analytics_queries.get_document_chunk_statistics(db_session, user.id)
        assert stats["total_chunks"] == 0
        assert stats["total_tokens"] == 0
        assert stats["documents_with_chunks"] == 0
        assert stats["average_tokens_per_chunk"] == 0.0

    def test_subject_statistics(self, db_session):
        user = _create_user(db_session)
        subject = _create_subject(db_session, user.id, "Physics")
        _create_document(db_session, user.id, subject.id, "physics.pdf")

        db_session.add(Flashcard(
            user_id=user.id, subject_id=subject.id,
            front="F=ma", back="Newton's 2nd law",
        ))
        db_session.commit()

        stats = analytics_queries.get_subject_statistics(db_session, user.id, subject.id)
        assert stats is not None
        assert stats["subject_name"] == "Physics"
        assert stats["total_documents"] == 1
        assert stats["total_flashcards"] == 1

    def test_subject_statistics_nonexistent(self, db_session):
        user = _create_user(db_session)
        stats = analytics_queries.get_subject_statistics(db_session, user.id, 9999)
        assert stats is None


class TestSearchQueries:
    """Tests for search query functions."""

    def test_text_search_chunks(self, db_session):
        user = _create_user(db_session)
        doc = _create_document(db_session, user.id, filename="biology.pdf")

        db_session.add(DocumentChunk(
            document_id=doc.id, user_id=user.id,
            chunk_index=0,
            content="Photosynthesis converts light energy into chemical energy",
        ))
        db_session.add(DocumentChunk(
            document_id=doc.id, user_id=user.id,
            chunk_index=1,
            content="Cellular respiration releases energy from glucose",
        ))
        db_session.commit()

        results = search_queries.text_search_chunks(
            db_session, user.id, "photosynthesis"
        )
        assert len(results) == 1
        assert results[0]["chunk_index"] == 0

    def test_text_search_all(self, db_session):
        user = _create_user(db_session)
        subject = _create_subject(db_session, user.id, name="Quantum Physics")
        doc = _create_document(db_session, user.id, subject.id, "quantum.pdf")

        db_session.add(DocumentChunk(
            document_id=doc.id, user_id=user.id,
            chunk_index=0, content="Quantum entanglement is a key concept",
        ))
        db_session.commit()

        results = search_queries.text_search_all(db_session, user.id, "quantum")
        assert len(results["subjects"]) == 1
        assert len(results["documents"]) == 1
        assert len(results["chunks"]) == 1

    def test_text_search_empty_query(self, db_session):
        user = _create_user(db_session)
        results = search_queries.text_search_chunks(db_session, user.id, "")
        assert results == []

        results_all = search_queries.text_search_all(db_session, user.id, "  ")
        assert results_all == {"subjects": [], "documents": [], "chunks": []}
