# Plannora Backend API Documentation

This document describes the API endpoints, schemas, authentication mechanism, and integration points for the **Plannora FastAPI Backend**.

---

## 1. Base URL & Configuration

- **Base URL**: `http://localhost:8000/api/v1`
- **Swagger Interactive Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`
- **Health Check**: `GET http://localhost:8000/health` (Returns `{"status": "ok"}`)

---

## 2. Authentication Flow

Authentication uses **OAuth2 Password Bearer with JWT (JSON Web Tokens)**.

1. **Register** a user via `POST /api/v1/auth/register`.
2. **Login** via `POST /api/v1/auth/login` to receive an `access_token` and `token_type: "bearer"`.
3. Include the token in subsequent authenticated requests using the header:
   ```http
   Authorization: Bearer <your_access_token>
   ```

---

## 3. API Endpoints

### 3.1. Auth (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register a new user (`name`, `email`, `password`) | No |
| `POST` | `/api/v1/auth/login` | Login with `email` and `password`, returns JWT | No |

**Register Request**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePassword123!"
}
```

**Login Response**:
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer"
}
```

---

### 3.2. Users (`/api/v1/users`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/users/me` | Get current authenticated user profile | Yes |
| `PUT` | `/api/v1/users/me` | Update current user profile (`name`, `email`) | Yes |

---

### 3.3. Subjects (`/api/v1/subjects`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/subjects` | Create subject (`name`, `description`) | Yes |
| `GET` | `/api/v1/subjects` | List all subjects owned by the user | Yes |
| `GET` | `/api/v1/subjects/{id}` | Get single subject by ID | Yes |
| `PUT` | `/api/v1/subjects/{id}` | Update subject (`name`, `description`) | Yes |
| `DELETE` | `/api/v1/subjects/{id}` | Delete subject (204 No Content) | Yes |

---

### 3.4. Documents (`/api/v1/documents`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/documents` | Upload file (multipart `file: UploadFile`, optional `subject_id: int`) | Yes |
| `GET` | `/api/v1/documents` | List all uploaded documents for the user | Yes |
| `GET` | `/api/v1/documents/{id}` | Get document metadata by ID | Yes |
| `DELETE` | `/api/v1/documents/{id}` | Delete document record and clean up local file (204) | Yes |

---

### 3.5. Quizzes (`/api/v1/quizzes`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/quizzes` | Create quiz with questions | Yes |
| `GET` | `/api/v1/quizzes` | List user quizzes | Yes |
| `GET` | `/api/v1/quizzes/{id}` | Get quiz with questions | Yes |
| `POST` | `/api/v1/quizzes/{id}/submit` | Submit answers and evaluate score | Yes |

**Quiz Creation Payload**:
```json
{
  "title": "Computer Networks Quiz",
  "description": "OSI and TCP/IP models",
  "subject_id": 1,
  "questions": [
    {
      "question_text": "How many layers are in the OSI model?",
      "options": ["5", "6", "7", "8"],
      "correct_answer": "7"
    }
  ]
}
```

**Quiz Submission Payload**:
```json
{
  "answers": {
    "1": "7"
  }
}
```

**Quiz Submission Response**:
```json
{
  "id": 1,
  "quiz_id": 1,
  "user_id": 1,
  "score": 100.0,
  "correct_answers": 1,
  "total_questions": 1,
  "submitted_at": "2026-08-20T23:30:00Z"
}
```

---

### 3.6. Flashcards (`/api/v1/flashcards`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/flashcards` | Create flashcard (`front`, `back`, optional `subject_id`) | Yes |
| `GET` | `/api/v1/flashcards` | List flashcards (supports optional `?subject_id=1` filter) | Yes |
| `GET` | `/api/v1/flashcards/{id}` | Get flashcard by ID | Yes |
| `PUT` | `/api/v1/flashcards/{id}` | Update flashcard (`front`, `back`, `subject_id`) | Yes |
| `DELETE` | `/api/v1/flashcards/{id}` | Delete flashcard (204 No Content) | Yes |

---

### 3.7. Exams (`/api/v1/exams`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/exams` | Create exam with questions | Yes |
| `GET` | `/api/v1/exams` | List user exams | Yes |
| `GET` | `/api/v1/exams/{id}` | Get exam with questions | Yes |
| `POST` | `/api/v1/exams/{id}/submit` | Submit answers and evaluate exam score | Yes |

---

### 3.8. Study Planner (`/api/v1/planner`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/planner` | Create planner item (`title`, `description`, `date`, `status`) | Yes |
| `GET` | `/api/v1/planner` | List planner items (supports `?status=pending` and `?date=YYYY-MM-DD`) | Yes |
| `GET` | `/api/v1/planner/{id}` | Get planner item by ID | Yes |
| `PUT` | `/api/v1/planner/{id}` | Update planner item | Yes |
| `DELETE` | `/api/v1/planner/{id}` | Delete planner item (204 No Content) | Yes |

---

### 3.9. Analytics (`/api/v1/analytics`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/analytics/summary` | Get aggregated study statistics from PostgreSQL | Yes |

**Summary Response Example**:
```json
{
  "total_subjects": 4,
  "total_documents": 2,
  "total_quizzes": 3,
  "total_flashcards": 15,
  "total_exams": 1,
  "total_planner_items": 5,
  "average_quiz_score": 85.0,
  "average_exam_score": 90.0
}
```

---

### 3.10. Search (`/api/v1/search`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/search?q=<query>` | Case-insensitive search across user subjects & documents | Yes |

**Search Response Example**:
```json
{
  "query": "algebra",
  "results": [
    {
      "type": "subject",
      "id": 2,
      "title": "Linear Algebra",
      "description": "Matrices, eigenvalues, and vectors"
    }
  ]
}
```

---

### 3.11. Chat Assistant (`/api/v1/chat`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/chat` | Send message to AI assistant interface | Yes |

**Chat Request**:
```json
{
  "message": "What are primary keys in SQL?"
}
```

**Chat Response**:
```json
{
  "message": "What are primary keys in SQL?",
  "response": "AI chat is not configured yet. The chat API is ready for an AI/RAG service to be connected."
}
```

---

## 4. AI / RAG Integration Interface

To plug in an external LLM (OpenAI, Gemini) or custom RAG pipeline:
- Locate [`app/services/ai_service.py`](file:///c:/Users/Shruthi%20S/Plannora/backend/app/services/ai_service.py).
- Implement the `AIServiceInterface.generate_response(message, context)` method.
- No router or database schema changes are required.
