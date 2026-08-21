# Plannora AI Backend

> AI Engineering module for the Plannora study platform.  
> **Owner:** Deveash (Member 3 — AI Engineer)  
> **Branch:** `feature/ai`

## Quick Start

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Copy env template
cp .env.example .env
# Edit .env with your API keys

# Run the server
uvicorn app.main:app --reload --port 8000
```

The API docs are at: **http://localhost:8000/docs**

## Running Tests

```bash
cd backend
pytest tests/ -v
```

Tests are fully offline — no API key needed.

## API Endpoints

| Method | Endpoint                        | Description                        |
| ------ | ------------------------------- | ---------------------------------- |
| GET    | `/health`                       | Health check                       |
| POST   | `/api/v1/chat/ask`              | RAG question answering             |
| POST   | `/api/v1/quizzes/generate`      | AI quiz generation                 |
| POST   | `/api/v1/flashcards/generate`   | AI flashcard generation            |
| POST   | `/api/v1/exams/analyze`         | Question paper analysis            |
| POST   | `/api/v1/planner/recommendations` | Study plan recommendations       |

## Architecture

See [`docs/AI_ARCHITECTURE.md`](../docs/AI_ARCHITECTURE.md) for the full architecture documentation.

## Integration Guide for Backend Teammate

The AI services are designed to be plugged in by the backend/database teammate:

1. **VectorRepository**: Implement the `VectorRepository` protocol in `app/ai/rag/retriever.py` using SQLAlchemy + pgvector.
2. **Authentication**: The AI routes accept `user_id` from request bodies — wire this to your auth middleware.
3. **Database models**: The AI layer does NOT own database models. It expects data through clean interfaces.

See the architecture doc for detailed integration instructions.
