"""
Tests for Analytics summary endpoint.

Covers:
1. Analytics endpoint requires authentication
2. Empty database returns valid zero statistics
3. Accurate counts for subjects, documents, quizzes, flashcards, exams, planner items
4. Accurate average calculation for quiz scores
5. Accurate average calculation for exam scores
6. User isolation (User A's items do not affect User B's statistics)
"""

import io
from tests.conftest import auth_header


class TestAnalyticsSummary:
    def test_analytics_unauthenticated(self, client):
        resp = client.get("/api/v1/analytics/summary")
        assert resp.status_code == 401

    def test_analytics_empty_user(self, client):
        headers = auth_header(client)
        resp = client.get("/api/v1/analytics/summary", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_subjects"] == 0
        assert data["total_documents"] == 0
        assert data["total_quizzes"] == 0
        assert data["total_flashcards"] == 0
        assert data["total_exams"] == 0
        assert data["total_planner_items"] == 0
        assert data["average_quiz_score"] == 0.0
        assert data["average_exam_score"] == 0.0

    def test_analytics_populated_data(self, client):
        headers = auth_header(client)

        # 1. Create 2 subjects
        client.post("/api/v1/subjects", json={"name": "Math"}, headers=headers)
        client.post("/api/v1/subjects", json={"name": "Science"}, headers=headers)

        # 2. Upload 1 document
        client.post(
            "/api/v1/documents",
            files={"file": ("doc.txt", io.BytesIO(b"content"), "text/plain")},
            headers=headers,
        )

        # 3. Create 1 quiz with 2 questions and submit two results (score 100 and score 50 => avg 75.0)
        q_resp = client.post(
            "/api/v1/quizzes",
            json={
                "title": "Algebra Quiz",
                "questions": [
                    {"question_text": "1+1", "options": ["1", "2"], "correct_answer": "2"},
                    {"question_text": "2+2", "options": ["3", "4"], "correct_answer": "4"},
                ],
            },
            headers=headers,
        )
        quiz_data = q_resp.json()
        quiz_id = quiz_data["id"]
        q1_id = str(quiz_data["questions"][0]["id"])
        q2_id = str(quiz_data["questions"][1]["id"])

        # Submit 100%
        client.post(
            f"/api/v1/quizzes/{quiz_id}/submit",
            json={"answers": {q1_id: "2", q2_id: "4"}},
            headers=headers,
        )
        # Submit 50%
        client.post(
            f"/api/v1/quizzes/{quiz_id}/submit",
            json={"answers": {q1_id: "2", q2_id: "wrong"}},
            headers=headers,
        )

        # 4. Create 3 flashcards
        client.post("/api/v1/flashcards", json={"front": "F1", "back": "B1"}, headers=headers)
        client.post("/api/v1/flashcards", json={"front": "F2", "back": "B2"}, headers=headers)
        client.post("/api/v1/flashcards", json={"front": "F3", "back": "B3"}, headers=headers)

        # 5. Create 1 exam and submit 1 result (score 100.0)
        e_resp = client.post(
            "/api/v1/exams",
            json={
                "title": "Final Exam",
                "questions": [
                    {"question_text": "Capital of Japan?", "options": ["Tokyo", "Kyoto"], "correct_answer": "Tokyo"},
                ],
            },
            headers=headers,
        )
        exam_data = e_resp.json()
        exam_id = exam_data["id"]
        eq1_id = str(exam_data["questions"][0]["id"])
        client.post(
            f"/api/v1/exams/{exam_id}/submit",
            json={"answers": {eq1_id: "Tokyo"}},
            headers=headers,
        )

        # 6. Create 2 planner items
        client.post("/api/v1/planner", json={"title": "Task 1"}, headers=headers)
        client.post("/api/v1/planner", json={"title": "Task 2"}, headers=headers)

        # Verify analytics
        resp = client.get("/api/v1/analytics/summary", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_subjects"] == 2
        assert data["total_documents"] == 1
        assert data["total_quizzes"] == 1
        assert data["total_flashcards"] == 3
        assert data["total_exams"] == 1
        assert data["total_planner_items"] == 2
        assert data["average_quiz_score"] == 75.0
        assert data["average_exam_score"] == 100.0

    def test_analytics_user_isolation(self, client):
        headers_a = auth_header(client, email="user_a@example.com", password="Password123!")
        headers_b = auth_header(client, email="user_b@example.com", password="Password123!")

        # User A creates items
        client.post("/api/v1/subjects", json={"name": "A's Subject"}, headers=headers_a)
        client.post("/api/v1/flashcards", json={"front": "A", "back": "A"}, headers=headers_a)

        # User B should see 0
        resp_b = client.get("/api/v1/analytics/summary", headers=headers_b)
        assert resp_b.status_code == 200
        data_b = resp_b.json()
        assert data_b["total_subjects"] == 0
        assert data_b["total_flashcards"] == 0
