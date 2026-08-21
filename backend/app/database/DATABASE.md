# Plannora — Database Documentation

**Owner:** Nasrana (Member 4 — Database Engineer)
**Last Updated:** 2026-08-21

---

## Table of Contents

1. [Overview](#overview)
2. [ER Diagram](#er-diagram)
3. [Table Reference](#table-reference)
4. [Relationships](#relationships)
5. [Constraints & Indexes](#constraints--indexes)
6. [pgvector Setup](#pgvector-setup)
7. [Alembic Migrations](#alembic-migrations)
8. [Query Layer API](#query-layer-api)
9. [Seed Data](#seed-data)
10. [Testing](#testing)
11. [Environment Requirements](#environment-requirements)
12. [PENDING Items](#pending-items)
13. [Member 5 Integration Handoff](#member-5-integration-handoff)

---

## Overview

Plannora uses **PostgreSQL** with **SQLAlchemy 2.0** ORM and **Alembic** for migrations. The database supports a study planning and learning platform with:

- User authentication and profiles
- Subject and document management
- Document chunking for RAG (Retrieval-Augmented Generation)
- Quizzes, flashcards, and exams with scoring
- Study planner items
- Chat message history
- Vector similarity search (pgvector — PENDING final configuration)

**Total tables: 13** (11 existing + 2 new)

---

## ER Diagram

```mermaid
erDiagram
    users ||--o{ subjects : "owns"
    users ||--o{ documents : "owns"
    users ||--o{ document_chunks : "owns"
    users ||--o{ quizzes : "owns"
    users ||--o{ quiz_results : "takes"
    users ||--o{ flashcards : "owns"
    users ||--o{ exams : "owns"
    users ||--o{ exam_results : "takes"
    users ||--o{ planner_items : "owns"
    users ||--o{ chat_messages : "owns"

    subjects ||--o{ documents : "contains"
    subjects ||--o{ quizzes : "has"
    subjects ||--o{ flashcards : "has"
    subjects ||--o{ exams : "has"

    documents ||--o{ document_chunks : "split into"

    quizzes ||--o{ quiz_questions : "contains"
    quizzes ||--o{ quiz_results : "produces"

    exams ||--o{ exam_questions : "contains"
    exams ||--o{ exam_results : "produces"

    users {
        int id PK
        string name
        string email UK
        string hashed_password
        datetime created_at
        datetime updated_at
    }

    subjects {
        int id PK
        int user_id FK
        string name
        text description
        datetime created_at
        datetime updated_at
    }

    documents {
        int id PK
        int user_id FK
        int subject_id FK
        string filename
        string file_path
        string content_type
        datetime created_at
    }

    document_chunks {
        int id PK
        int document_id FK
        int user_id FK
        int chunk_index
        text content
        int token_count
        int page_number
        json chunk_metadata
        datetime created_at
    }

    quizzes {
        int id PK
        int user_id FK
        int subject_id FK
        string title
        text description
        datetime created_at
    }

    quiz_questions {
        int id PK
        int quiz_id FK
        text question_text
        json options
        string correct_answer
    }

    quiz_results {
        int id PK
        int quiz_id FK
        int user_id FK
        float score
        int correct_answers
        int total_questions
        datetime submitted_at
    }

    flashcards {
        int id PK
        int user_id FK
        int subject_id FK
        text front
        text back
        datetime created_at
        datetime updated_at
    }

    exams {
        int id PK
        int user_id FK
        int subject_id FK
        string title
        text description
        datetime created_at
    }

    exam_questions {
        int id PK
        int exam_id FK
        text question_text
        json options
        string correct_answer
    }

    exam_results {
        int id PK
        int exam_id FK
        int user_id FK
        float score
        int correct_answers
        int total_questions
        datetime submitted_at
    }

    planner_items {
        int id PK
        int user_id FK
        string title
        text description
        date date
        string status
        datetime created_at
        datetime updated_at
    }

    chat_messages {
        int id PK
        int user_id FK
        string session_id
        string role
        text content
        datetime created_at
    }
```

---

## Table Reference

### `users`
| Column | Type | Constraints |
|---|---|---|
| `id` | Integer | PK, indexed |
| `name` | String(255) | NOT NULL |
| `email` | String(255) | NOT NULL, UNIQUE, indexed |
| `hashed_password` | String(1024) | NOT NULL |
| `created_at` | DateTime(tz) | NOT NULL, default CURRENT_TIMESTAMP |
| `updated_at` | DateTime(tz) | NOT NULL, default CURRENT_TIMESTAMP, auto-update |

### `subjects`
| Column | Type | Constraints |
|---|---|---|
| `id` | Integer | PK, indexed |
| `user_id` | Integer | FK → users.id (CASCADE), NOT NULL, indexed |
| `name` | String(255) | NOT NULL |
| `description` | Text | nullable |
| `created_at` | DateTime(tz) | NOT NULL, default CURRENT_TIMESTAMP |
| `updated_at` | DateTime(tz) | NOT NULL, default CURRENT_TIMESTAMP, auto-update |

### `documents`
| Column | Type | Constraints |
|---|---|---|
| `id` | Integer | PK, indexed |
| `user_id` | Integer | FK → users.id (CASCADE), NOT NULL, indexed |
| `subject_id` | Integer | FK → subjects.id (SET NULL), nullable, indexed |
| `filename` | String(512) | NOT NULL |
| `file_path` | String(1024) | NOT NULL |
| `content_type` | String(255) | nullable |
| `created_at` | DateTime(tz) | NOT NULL, default CURRENT_TIMESTAMP |

### `document_chunks` *(NEW)*
| Column | Type | Constraints |
|---|---|---|
| `id` | Integer | PK, indexed |
| `document_id` | Integer | FK → documents.id (CASCADE), NOT NULL, indexed |
| `user_id` | Integer | FK → users.id (CASCADE), NOT NULL, indexed |
| `chunk_index` | Integer | NOT NULL |
| `content` | Text | NOT NULL |
| `token_count` | Integer | nullable |
| `page_number` | Integer | nullable |
| `chunk_metadata` | JSON | nullable |
| `created_at` | DateTime(tz) | NOT NULL, default CURRENT_TIMESTAMP |
| `embedding` | Vector(N) | **PENDING** — added after Member 3 confirms dimension |

### `quizzes`
| Column | Type | Constraints |
|---|---|---|
| `id` | Integer | PK, indexed |
| `user_id` | Integer | FK → users.id (CASCADE), NOT NULL, indexed |
| `subject_id` | Integer | FK → subjects.id (SET NULL), nullable, indexed |
| `title` | String(255) | NOT NULL |
| `description` | Text | nullable |
| `created_at` | DateTime(tz) | NOT NULL, default CURRENT_TIMESTAMP |

### `quiz_questions`
| Column | Type | Constraints |
|---|---|---|
| `id` | Integer | PK, indexed |
| `quiz_id` | Integer | FK → quizzes.id (CASCADE), NOT NULL, indexed |
| `question_text` | Text | NOT NULL |
| `options` | JSON | NOT NULL |
| `correct_answer` | String(255) | NOT NULL |

### `quiz_results`
| Column | Type | Constraints |
|---|---|---|
| `id` | Integer | PK, indexed |
| `quiz_id` | Integer | FK → quizzes.id (CASCADE), NOT NULL, indexed |
| `user_id` | Integer | FK → users.id (CASCADE), NOT NULL, indexed |
| `score` | Float | NOT NULL |
| `correct_answers` | Integer | NOT NULL |
| `total_questions` | Integer | NOT NULL |
| `submitted_at` | DateTime(tz) | NOT NULL, default CURRENT_TIMESTAMP |

### `flashcards`
| Column | Type | Constraints |
|---|---|---|
| `id` | Integer | PK, indexed |
| `user_id` | Integer | FK → users.id (CASCADE), NOT NULL, indexed |
| `subject_id` | Integer | FK → subjects.id (SET NULL), nullable, indexed |
| `front` | Text | NOT NULL |
| `back` | Text | NOT NULL |
| `created_at` | DateTime(tz) | NOT NULL, default CURRENT_TIMESTAMP |
| `updated_at` | DateTime(tz) | NOT NULL, default CURRENT_TIMESTAMP, auto-update |

### `exams`
| Column | Type | Constraints |
|---|---|---|
| `id` | Integer | PK, indexed |
| `user_id` | Integer | FK → users.id (CASCADE), NOT NULL, indexed |
| `subject_id` | Integer | FK → subjects.id (SET NULL), nullable, indexed |
| `title` | String(255) | NOT NULL |
| `description` | Text | nullable |
| `created_at` | DateTime(tz) | NOT NULL, default CURRENT_TIMESTAMP |

### `exam_questions`
| Column | Type | Constraints |
|---|---|---|
| `id` | Integer | PK, indexed |
| `exam_id` | Integer | FK → exams.id (CASCADE), NOT NULL, indexed |
| `question_text` | Text | NOT NULL |
| `options` | JSON | NOT NULL |
| `correct_answer` | String(255) | NOT NULL |

### `exam_results`
| Column | Type | Constraints |
|---|---|---|
| `id` | Integer | PK, indexed |
| `exam_id` | Integer | FK → exams.id (CASCADE), NOT NULL, indexed |
| `user_id` | Integer | FK → users.id (CASCADE), NOT NULL, indexed |
| `score` | Float | NOT NULL |
| `correct_answers` | Integer | NOT NULL |
| `total_questions` | Integer | NOT NULL |
| `submitted_at` | DateTime(tz) | NOT NULL, default CURRENT_TIMESTAMP |

### `planner_items`
| Column | Type | Constraints |
|---|---|---|
| `id` | Integer | PK, indexed |
| `user_id` | Integer | FK → users.id (CASCADE), NOT NULL, indexed |
| `title` | String(255) | NOT NULL |
| `description` | Text | nullable |
| `date` | Date | nullable, indexed |
| `status` | String(50) | NOT NULL, default "pending", indexed |
| `created_at` | DateTime(tz) | NOT NULL, default CURRENT_TIMESTAMP |
| `updated_at` | DateTime(tz) | NOT NULL, default CURRENT_TIMESTAMP, auto-update |

### `chat_messages` *(NEW)*
| Column | Type | Constraints |
|---|---|---|
| `id` | Integer | PK, indexed |
| `user_id` | Integer | FK → users.id (CASCADE), NOT NULL, indexed |
| `session_id` | String(255) | NOT NULL, indexed |
| `role` | String(50) | NOT NULL ("user" or "assistant") |
| `content` | Text | NOT NULL |
| `created_at` | DateTime(tz) | NOT NULL, default CURRENT_TIMESTAMP |

---

## Relationships

| Parent | Child | Type | On Delete |
|---|---|---|---|
| users | subjects | one-to-many | CASCADE |
| users | documents | one-to-many | CASCADE |
| users | document_chunks | one-to-many | CASCADE |
| users | quizzes | one-to-many | CASCADE |
| users | quiz_results | one-to-many | CASCADE |
| users | flashcards | one-to-many | CASCADE |
| users | exams | one-to-many | CASCADE |
| users | exam_results | one-to-many | CASCADE |
| users | planner_items | one-to-many | CASCADE |
| users | chat_messages | one-to-many | CASCADE |
| subjects | documents | one-to-many | SET NULL |
| subjects | quizzes | one-to-many | SET NULL |
| subjects | flashcards | one-to-many | SET NULL |
| subjects | exams | one-to-many | SET NULL |
| documents | document_chunks | one-to-many | CASCADE |
| quizzes | quiz_questions | one-to-many | CASCADE |
| quizzes | quiz_results | one-to-many | CASCADE |
| exams | exam_questions | one-to-many | CASCADE |
| exams | exam_results | one-to-many | CASCADE |

---

## Constraints & Indexes

### Unique Constraints
- `users.email` — unique, indexed

### Foreign Key Delete Behavior
- **CASCADE**: Deleting a parent deletes all children (user→everything, document→chunks, quiz→questions/results, exam→questions/results)
- **SET NULL**: Deleting a subject sets `subject_id = NULL` on related documents, quizzes, flashcards, exams

### Indexes
All primary keys, foreign keys, `users.email`, `planner_items.date`, `planner_items.status`, and `chat_messages.session_id` are indexed.

---

## pgvector Setup

### Prerequisites
1. PostgreSQL 15+ with the `pgvector` extension installed
2. Python package: `pgvector==0.3.6` (in `requirements.txt`)

### Installation

```bash
# On PostgreSQL server (Ubuntu/Debian)
sudo apt install postgresql-15-pgvector

# Or from source
cd /tmp
git clone --branch v0.8.0 https://github.com/pgvector/pgvector.git
cd pgvector
make && sudo make install

# Enable in your database
psql -d plannora -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### PENDING: Embedding Configuration

The `document_chunks.embedding` vector column is **NOT YET CREATED**.

**Waiting for Member 3 (AI/RAG) to confirm:**
1. Embedding model (e.g., OpenAI `text-embedding-3-small`, Gemini `text-embedding-004`)
2. Embedding dimension (e.g., 768, 1536, 3072)

Once confirmed, the following steps are needed:
1. Add `embedding = Column(Vector(DIMENSION), nullable=True)` to `DocumentChunk` model
2. Create a new Alembic migration that:
   - Runs `CREATE EXTENSION IF NOT EXISTS vector`
   - Adds the `embedding` column to `document_chunks`
   - Creates an HNSW index for fast similarity search
3. Uncomment vector search functions in the query layer
4. Update tests with vector-specific test cases

### Environment Variable

Add to `.env`:
```
# PostgreSQL must have pgvector extension installed
# EMBEDDING_DIMENSION=1536  # Set after Member 3 confirms
```

---

## Alembic Migrations

### Migration Chain

```
(base) ─── b8e207dd833b ─── 5febd958269d ─── 6975030d988a ─── c8f3d2e1a4b7
            │                  │                  │                  │
            │                  │                  │                  └─ document_chunks
            │                  │                  │                     chat_messages
            │                  │                  └─ planner_items
            │                  └─ quizzes, flashcards, exams
            └─ users, subjects, documents
```

### Running Migrations

```bash
cd backend

# Apply all migrations
alembic upgrade head

# Check current revision
alembic current

# View migration history
alembic history

# Downgrade one step
alembic downgrade -1

# Generate new migration (after model changes)
alembic revision --autogenerate -m "description"
```

### Future Migration (after Member 3 confirms)

A new migration will be needed to add the embedding column:

```python
# Example — DO NOT USE until dimension is confirmed
def upgrade():
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.add_column(
        "document_chunks",
        sa.Column("embedding", Vector(DIMENSION), nullable=True)
    )
    op.create_index(
        "ix_document_chunks_embedding_hnsw",
        "document_chunks",
        ["embedding"],
        postgresql_using="hnsw",
        postgresql_with={"m": 16, "ef_construction": 64},
        postgresql_ops={"embedding": "vector_cosine_ops"},
    )
```

---

## Query Layer API

All query functions are in `backend/app/database/queries/`. Every function enforces `user_id` filtering for data isolation.

### `document_chunks.py`

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `create_chunk` | db, document_id, user_id, chunk_index, content, [token_count, page_number, chunk_metadata] | `DocumentChunk` | Create a single chunk |
| `create_chunks_bulk` | db, chunks (list of dicts) | `List[DocumentChunk]` | Bulk-create chunks |
| `get_chunks_by_document` | db, document_id, user_id | `List[DocumentChunk]` | Get all chunks ordered by index |
| `get_chunk_by_id` | db, chunk_id, user_id | `Optional[DocumentChunk]` | Get single chunk |
| `delete_chunks_by_document` | db, document_id, user_id | `int` | Delete all chunks, return count |
| `count_chunks_for_document` | db, document_id, user_id | `int` | Count chunks for a document |
| `count_all_user_chunks` | db, user_id | `int` | Count all user's chunks |
| `search_chunks_by_content` | db, user_id, query, [limit] | `List[DocumentChunk]` | Text search |
| `search_similar_chunks` | db, user_id, query_embedding, [limit] | `List[DocumentChunk]` | **PENDING** — vector search |

### `chat_messages.py`

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `create_message` | db, user_id, session_id, role, content | `ChatMessage` | Create a message |
| `get_session_messages` | db, user_id, session_id | `List[ChatMessage]` | Get all messages in a session |
| `get_user_sessions` | db, user_id | `List[str]` | List session IDs, most recent first |
| `get_latest_session_id` | db, user_id | `Optional[str]` | Get most recent session ID |
| `count_session_messages` | db, user_id, session_id | `int` | Count messages in a session |
| `delete_session` | db, user_id, session_id | `int` | Delete a session, return count |
| `delete_all_user_messages` | db, user_id | `int` | Delete all user messages |

### `analytics.py`

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `get_user_study_summary` | db, user_id | `Dict` | All entity counts + average scores |
| `get_document_chunk_statistics` | db, user_id | `Dict` | Chunk/token counts and averages |
| `get_subject_statistics` | db, user_id, subject_id | `Optional[Dict]` | Per-subject entity counts |

### `search.py`

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `text_search_chunks` | db, user_id, query, [limit] | `List[Dict]` | Search chunks by text content |
| `text_search_all` | db, user_id, query, [limit] | `Dict` | Search subjects + documents + chunks |
| `vector_search_chunks` | db, user_id, query_embedding, [limit] | `List[Dict]` | **PENDING** — vector search |
| `hybrid_search_chunks` | db, user_id, query, query_embedding, ... | `List[Dict]` | **PENDING** — text + vector |

---

## Seed Data

### Running Seeds

```bash
cd backend
python -m app.database.seeds
```

### What Gets Created

| Entity | Count | Notes |
|---|---|---|
| Users | 2 | Alice (alice@example.com), Bob (bob@example.com) |
| Subjects | 4 | Mathematics, Computer Science, Physics (Alice); Biology (Bob) |
| Documents | 2 | calculus_notes.pdf, algorithms_textbook.pdf (Alice) |
| Document Chunks | 5 | 3 calculus chunks, 2 algorithm chunks (Alice) |
| Quizzes | 1 | Data Structures Basics (2 questions, 1 result) |
| Flashcards | 3 | CS, Math, Physics topics (Alice) |
| Exams | 1 | Calculus Midterm (2 questions, 1 result) |
| Planner Items | 3 | 2 pending, 1 completed (Alice) |
| Chat Messages | 4 | 1 session with 2 user + 2 assistant messages (Alice) |

**Note:** Seed passwords are placeholder hashes — NOT usable for login. Register users through the API for functional testing.

### Idempotency

The seed script checks for existing users before inserting. If data exists, it skips without error.

---

## Testing

### Running Tests

```bash
cd backend

# Run only database tests
python -m pytest tests/test_database.py -v

# Run all tests (existing + database)
python -m pytest tests/ -v

# Run with coverage
python -m pytest tests/test_database.py -v --tb=short
```

### Test Coverage

| Test Class | Tests | What's Tested |
|---|---|---|
| `TestDocumentChunkModel` | 11 | Creation, relationships, cascades, constraints, nullable fields |
| `TestChatMessageModel` | 7 | Creation, relationships, cascades, constraints |
| `TestUserDataIsolation` | 5 | Chunk isolation, chat isolation, search isolation, analytics isolation |
| `TestDocumentChunkQueries` | 8 | CRUD, bulk create, ordering, counting, text search |
| `TestChatMessageQueries` | 7 | CRUD, sessions, deletion, counting |
| `TestAnalyticsQueries` | 5 | Summary empty/populated, chunk stats, subject stats |
| `TestSearchQueries` | 3 | Text search chunks, search all, empty queries |

**Total: 46 database-specific tests**

### Test Infrastructure

Tests use **SQLite in-memory** via `conftest.py`. This means:
- No PostgreSQL required for testing
- No pgvector required for testing
- Tests run fast with zero external dependencies
- Vector-specific tests will be added after Member 3 confirms the embedding dimension

---

## Environment Requirements

### Required `.env` Variables

```bash
# PostgreSQL connection
DATABASE_URL=postgresql://postgres:password@localhost:5432/plannora

# JWT (for auth — not database-specific)
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### Required Python Packages (database-related)

```
SQLAlchemy==2.0.52
alembic==1.19.1
psycopg==3.3.4
psycopg-binary==3.3.4
pgvector==0.3.6
python-dotenv==1.2.3
```

### PostgreSQL Requirements

- PostgreSQL 15+
- pgvector extension installed (for future vector search)

---

## PENDING Items

> **These items are blocked until Member 3 (AI/RAG) provides confirmation.**

| Item | Blocked On | Impact |
|---|---|---|
| `DocumentChunk.embedding` column | Member 3: embedding model + dimension | Cannot create vector column |
| pgvector extension in migration | Member 3: dimension confirmation | Cannot create HNSW/IVFFlat index |
| `search_similar_chunks()` query | Embedding column | Cannot implement cosine distance search |
| `vector_search_chunks()` in search.py | Embedding column | Cannot implement vector search endpoint |
| `hybrid_search_chunks()` in search.py | Embedding column | Cannot implement hybrid search |
| Vector-specific tests | Embedding column | Cannot test vector operations |

### What Member 3 Needs to Provide

```
Embedding model: _______________  (e.g., text-embedding-3-small)
Embedding dimension: ___________  (e.g., 768, 1536, 3072)
```

---

## Member 5 Integration Handoff

### What's Ready

1. **13 SQLAlchemy models** — all working with relationships and constraints
2. **4 Alembic migrations** — linear chain, ready to run with `alembic upgrade head`
3. **Query layer** — `app/database/queries/` with CRUD + text search for all new models
4. **Seed data** — `python -m app.database.seeds` for development data
5. **46 database tests** — all passing with SQLite in-memory
6. **pgvector package** — added to `requirements.txt`

### Integration Points for Member 5

#### 1. Document Chunking Pipeline

When a document is uploaded via the API, the **AI/RAG service** (Member 3) should:
1. Extract text from the uploaded file
2. Split text into chunks
3. Call `chunk_queries.create_chunks_bulk()` to store chunks

```python
from app.database.queries.document_chunks import create_chunks_bulk

chunks_data = [
    {
        "document_id": document.id,
        "user_id": user.id,
        "chunk_index": i,
        "content": chunk_text,
        "token_count": len(tokenizer.encode(chunk_text)),
        "page_number": page_num,
        "chunk_metadata": {"section": section_heading},
    }
    for i, (chunk_text, page_num, section_heading) in enumerate(parsed_chunks)
]
create_chunks_bulk(db, chunks=chunks_data)
```

#### 2. Chat History Integration

The existing chat endpoint can be updated to persist messages:

```python
from app.database.queries.chat_messages import create_message, get_session_messages

# Before calling AI service, save user message
create_message(db, user_id=user.id, session_id=session_id, role="user", content=user_msg)

# Get conversation context
history = get_session_messages(db, user_id=user.id, session_id=session_id)

# After AI responds, save assistant message
create_message(db, user_id=user.id, session_id=session_id, role="assistant", content=ai_response)
```

#### 3. RAG Context Retrieval

Once the embedding column is added:

```python
from app.database.queries.document_chunks import search_similar_chunks

# Get relevant chunks for the user's question
relevant_chunks = search_similar_chunks(db, user_id=user.id, query_embedding=embedding, limit=5)
context = "\n".join([chunk.content for chunk in relevant_chunks])
```

#### 4. Enhanced Search

The existing search endpoint can be enhanced with chunk search:

```python
from app.database.queries.search import text_search_all

results = text_search_all(db, user_id=user.id, query=search_query)
# Returns {"subjects": [...], "documents": [...], "chunks": [...]}
```

#### 5. Enhanced Analytics

The analytics endpoint can include chunk statistics:

```python
from app.database.queries.analytics import get_user_study_summary

summary = get_user_study_summary(db, user_id=user.id)
# Now includes: total_document_chunks, total_chat_sessions
```

### Setup Instructions for Member 5

```bash
# 1. Install dependencies
cd backend
pip install -r requirements.txt

# 2. Set up PostgreSQL and create database
createdb plannora

# 3. Configure .env
cp .env.example .env
# Edit DATABASE_URL in .env

# 4. Run migrations
alembic upgrade head

# 5. (Optional) Seed development data
python -m app.database.seeds

# 6. Run tests to verify
python -m pytest tests/ -v

# 7. Start the server
uvicorn app.main:app --reload
```

### Files Owned by Member 4 (Nasrana)

```
backend/app/database/
├── __init__.py
├── base.py
├── connection.py
├── seeds.py                          ← NEW
├── DATABASE.md                       ← NEW (this file)
└── queries/                          ← NEW
    ├── __init__.py
    ├── document_chunks.py
    ├── chat_messages.py
    ├── analytics.py
    └── search.py

backend/app/models/
├── __init__.py                       ← MODIFIED (added 2 imports)
├── user.py                           ← MODIFIED (added 2 relationships)
├── subject.py
├── document.py                       ← MODIFIED (added 1 relationship)
├── quiz.py
├── flashcard.py
├── exam.py
├── planner.py
├── document_chunk.py                 ← NEW
└── chat_message.py                   ← NEW

backend/alembic/versions/
├── b8e207dd833b_create_users_subjects_documents.py
├── 5febd958269d_create_quizzes_flashcards_exams.py
├── 6975030d988a_create_planner_items.py
└── c8f3d2e1a4b7_add_document_chunks_chat_messages.py    ← NEW

backend/tests/
└── test_database.py                  ← NEW

backend/requirements.txt              ← MODIFIED (appended pgvector)
```
