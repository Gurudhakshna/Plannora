# Plannora AI Architecture

> **AI-assisted study platform — Technical Architecture Document**  
> Owner: Deveash (Member 3 — AI Engineer)

---

## System Overview

Plannora's AI backend provides intelligent study assistance through a pipeline
that transforms uploaded academic documents into actionable study tools.

```
Document (PDF / text)
       │
       ▼
  Text Extraction  (handled by backend teammate)
       │
       ▼
  ┌─────────────┐
  │  Chunking    │  → overlapping text chunks with metadata
  └─────┬───────┘
        │
        ▼
  ┌─────────────┐
  │  Embedding   │  → dense vector representations
  └─────┬───────┘
        │
        ▼
  ┌─────────────┐
  │  pgvector    │  → stored in PostgreSQL with pgvector extension
  └─────┬───────┘
        │
        ▼
  ┌──────────────────┐
  │ Semantic Retrieval│  → query → embed → cosine similarity → top-K
  └─────┬────────────┘
        │
        ▼
  ┌─────────────┐
  │    RAG       │  → retrieved context + LLM → grounded answer
  └─────┬───────┘
        │
        ▼
  Answer + Sources (with document/page citations)
```

---

## Module Architecture

### 1. Document Analysis (`app/ai/document_analysis/`)

| File              | Purpose                                           |
| ----------------- | ------------------------------------------------- |
| `chunker.py`      | Splits text into overlapping chunks with metadata  |
| `text_processor.py` | Unicode normalization, whitespace cleanup, header removal |

**Chunker configuration:**
- `chunk_size` — target characters per chunk (default: 1000)
- `chunk_overlap` — overlap between consecutive chunks (default: 200)
- Supports `[PAGE n]` markers for page-aware chunking

### 2. Embeddings (`app/ai/embeddings/`)

| File                 | Purpose                                    |
| -------------------- | ------------------------------------------ |
| `embedding_service.py` | Provider-agnostic embedding facade       |

**Design decisions:**
- **Lazy initialization** — FastAPI boots without an API key
- **ConfigurationError** raised only on actual embed calls
- **Provider abstraction** — `EmbeddingProvider` ABC can be swapped (OpenAI, Google, local)

### 3. RAG (`app/ai/rag/`)

| File            | Purpose                                    |
| --------------- | ------------------------------------------ |
| `retriever.py`  | query → embed → pgvector search → results |
| `rag_service.py` | Full RAG pipeline with LLM generation     |

**Security:** The `VectorRepository` protocol enforces `user_id` filtering.
A user can NEVER retrieve another user's documents.

**Anti-hallucination:** The system prompt instructs the LLM to:
1. Only use retrieved context
2. Cite sources
3. Explicitly decline if context is insufficient

### 4. Quiz Generation (`app/ai/quiz_generation/`)

Generates structured MCQ questions at easy / medium / hard difficulty.

### 5. Flashcards (`app/ai/flashcards/`)

Generates question / answer / topic flashcards from academic text.

### 6. Question Paper Analysis (`app/ai/question_paper/`)

**AI-assisted topic priority analysis** (not exam prediction):
- LLM extracts structured questions from paper text
- Deterministic analytics compute frequency, marks, importance

### 7. Recommendations (`app/ai/recommendations/`)

| File                  | Purpose                              |
| --------------------- | ------------------------------------ |
| `topic_analyzer.py`   | Classify topic mastery from quiz data |
| `study_recommender.py` | Generate prioritized study plans     |

**Scoring factors (weighted):**
1. Exam relevance (35%)
2. Weak topics (30%)
3. Quiz performance (20%)
4. Study recency (15%)

---

## API Contract

All AI endpoints are under `/api/v1/`.

### POST `/api/v1/chat/ask`

RAG-based question answering.

**Request:**
```json
{
  "question": "Explain the chain rule in calculus",
  "user_id": "user-123",
  "subject_id": "math-101"
}
```

**Response:**
```json
{
  "answer": "The chain rule states that...",
  "sources": [
    {
      "document_id": "doc-456",
      "document_name": "Calculus Textbook.pdf",
      "page_number": 42,
      "similarity": 0.91
    }
  ]
}
```

### POST `/api/v1/quizzes/generate`

**Request:**
```json
{
  "subject": "Mathematics",
  "topic": "Derivatives",
  "context": "The derivative of a function...",
  "number_of_questions": 5,
  "difficulty": "medium"
}
```

**Response:**
```json
{
  "questions": [
    {
      "question": "What is the derivative of x²?",
      "options": ["A) x", "B) 2x", "C) x²", "D) 2"],
      "correct_answer": "B",
      "explanation": "Using the power rule...",
      "topic": "Derivatives",
      "difficulty": "easy"
    }
  ]
}
```

### POST `/api/v1/flashcards/generate`

**Request:**
```json
{
  "context": "Mitochondria are the powerhouse...",
  "num_cards": 10
}
```

**Response:**
```json
{
  "flashcards": [
    {
      "question": "What is the primary function of mitochondria?",
      "answer": "ATP production through cellular respiration",
      "topic": "Cell Biology"
    }
  ]
}
```

### POST `/api/v1/exams/analyze`

**Request:**
```json
{
  "paper_text": "Q1. [5 marks] Explain Newton's first law..."
}
```

**Response:**
```json
{
  "questions": [
    {
      "question": "Explain Newton's first law",
      "topic": "Newton's Laws",
      "marks": 5,
      "difficulty": "medium",
      "year": null
    }
  ],
  "topic_analysis": [
    {
      "topic": "Newton's Laws",
      "frequency": 3,
      "total_marks": 15,
      "importance_score": 0.456,
      "recommended_priority": "high"
    }
  ]
}
```

### POST `/api/v1/planner/recommendations`

**Request:**
```json
{
  "exam_date": "2026-09-15",
  "topic_priorities": [
    {"topic": "Calculus", "importance_score": 0.8, "recommended_priority": "high"}
  ],
  "weak_topics": [
    {"topic": "Algebra", "accuracy": 0.3, "mastery": "Weak"}
  ],
  "quiz_performance": [
    {"topic": "Algebra", "accuracy": 0.3}
  ],
  "available_study_time": 120,
  "syllabus_topics": ["Calculus", "Algebra", "Geometry"],
  "recently_studied": ["Geometry"]
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "topic": "Algebra",
      "activity": "Study",
      "priority_score": 0.85,
      "reason": "Weak (30% accuracy); Exam relevance (high priority)",
      "estimated_minutes": 45
    }
  ]
}
```

---

## Integration Guide for Backend Teammate

### 1. Implement `VectorRepository`

The AI retriever expects a repository that satisfies this protocol:

```python
class VectorRepository(Protocol):
    async def similarity_search(
        self,
        embedding: list[float],
        user_id: str,
        subject_id: str | None,
        top_k: int,
    ) -> list[dict[str, Any]]:
        """
        Returns dicts with keys:
          document_id, document_name, chunk_id,
          content, page_number, similarity
        MUST filter by user_id (security requirement).
        """
```

### 2. Wire Authentication

The AI routes accept `user_id` in request bodies. Replace this with
your auth middleware (JWT, session, etc.) using a FastAPI dependency.

### 3. Document Upload Pipeline

When a user uploads a document:

```python
from app.ai.document_analysis.text_processor import TextProcessor
from app.ai.document_analysis.chunker import DocumentChunker
from app.ai.embeddings.embedding_service import EmbeddingService

# 1. Extract text (your code)
raw_text = extract_text_from_pdf(file)

# 2. Clean
clean_text = TextProcessor.clean(raw_text)

# 3. Chunk
chunker = DocumentChunker(chunk_size=1000, chunk_overlap=200)
chunks = chunker.chunk_text(clean_text, metadata={"document_id": doc_id})

# 4. Embed
embedding_service = EmbeddingService()
vectors = await embedding_service.embed_texts([c.text for c in chunks])

# 5. Store in pgvector (your code)
for chunk, vector in zip(chunks, vectors):
    store_chunk_with_embedding(chunk, vector)
```

### 4. Environment Variables

Ensure these are set in production:

| Variable         | Required | Default                  |
| ---------------- | -------- | ------------------------ |
| `AI_API_KEY`     | Yes*     | —                        |
| `LLM_MODEL`      | No       | `gpt-4o-mini`            |
| `EMBEDDING_MODEL` | No      | `text-embedding-3-small` |
| `AI_BASE_URL`    | No       | OpenAI default           |
| `DATABASE_URL`   | Yes      | —                        |

*Only required when AI features are actually used (lazy init).

---

## Testing

All unit tests run **offline** without an API key:

```bash
cd backend
pytest tests/ -v
```

Tests cover:
- Document chunking (overlap, page markers, metadata)
- Topic mastery classification (all thresholds + boundaries)
- Question paper analysis (frequency, marks, priority)
- Study recommendation ranking (urgency, weakness, recency)
