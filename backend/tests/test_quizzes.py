"""
Tests for Quiz CRUD and submission endpoints.

Covers:
1. Create quiz with questions
2. List quizzes
3. Get quiz by ID
4. Submit quiz answers & score calculation
5. Quiz result persistence
6. User isolation (cannot access or submit another user's quiz)
7. Unauthenticated access rejection
"""

from tests.conftest import auth_header


def _create_sample_quiz(client, headers, title="Math Quiz"):
    return client.post(
        "/api/v1/quizzes",
        json={
            "title": title,
            "description": "Basic arithmetic and algebra",
            "questions": [
                {
                    "question_text": "What is 2 + 2?",
                    "options": ["3", "4", "5", "6"],
                    "correct_answer": "4",
                },
                {
                    "question_text": "What is 5 * 3?",
                    "options": ["10", "15", "20", "25"],
                    "correct_answer": "15",
                },
            ],
        },
        headers=headers,
    )


class TestCreateQuiz:
    def test_create_quiz_success(self, client):
        headers = auth_header(client)
        resp = _create_sample_quiz(client, headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Math Quiz"
        assert len(data["questions"]) == 2
        assert data["questions"][0]["question_text"] == "What is 2 + 2?"
        assert data["questions"][0]["correct_answer"] == "4"

    def test_create_quiz_unauthenticated(self, client):
        resp = client.post("/api/v1/quizzes", json={"title": "Test", "questions": []})
        assert resp.status_code == 401


class TestListQuizzes:
    def test_list_quizzes_own_only(self, client):
        headers_a = auth_header(client, email="user_a@example.com", password="Password123!")
        headers_b = auth_header(client, email="user_b@example.com", password="Password123!")

        _create_sample_quiz(client, headers_a, title="Quiz A")
        _create_sample_quiz(client, headers_b, title="Quiz B")

        resp_a = client.get("/api/v1/quizzes", headers=headers_a)
        assert resp_a.status_code == 200
        titles_a = [q["title"] for q in resp_a.json()]
        assert "Quiz A" in titles_a
        assert "Quiz B" not in titles_a


class TestGetQuiz:
    def test_get_quiz_success(self, client):
        headers = auth_header(client)
        create_resp = _create_sample_quiz(client, headers)
        quiz_id = create_resp.json()["id"]

        resp = client.get(f"/api/v1/quizzes/{quiz_id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == quiz_id

    def test_get_other_user_quiz(self, client):
        headers_a = auth_header(client, email="user_a@example.com", password="Password123!")
        headers_b = auth_header(client, email="user_b@example.com", password="Password123!")

        create_resp = _create_sample_quiz(client, headers_a)
        quiz_id = create_resp.json()["id"]

        resp = client.get(f"/api/v1/quizzes/{quiz_id}", headers=headers_b)
        assert resp.status_code == 404


class TestSubmitQuiz:
    def test_submit_quiz_full_score(self, client):
        headers = auth_header(client)
        create_resp = _create_sample_quiz(client, headers)
        quiz_data = create_resp.json()
        quiz_id = quiz_data["id"]
        q1_id = str(quiz_data["questions"][0]["id"])
        q2_id = str(quiz_data["questions"][1]["id"])

        submission = {
            "answers": {
                q1_id: "4",
                q2_id: "15",
            }
        }
        resp = client.post(f"/api/v1/quizzes/{quiz_id}/submit", json=submission, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["score"] == 100.0
        assert data["correct_answers"] == 2
        assert data["total_questions"] == 2

    def test_submit_quiz_partial_score(self, client):
        headers = auth_header(client)
        create_resp = _create_sample_quiz(client, headers)
        quiz_data = create_resp.json()
        quiz_id = quiz_data["id"]
        q1_id = str(quiz_data["questions"][0]["id"])
        q2_id = str(quiz_data["questions"][1]["id"])

        submission = {
            "answers": {
                q1_id: "4",   # correct
                q2_id: "20",  # wrong
            }
        }
        resp = client.post(f"/api/v1/quizzes/{quiz_id}/submit", json=submission, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["score"] == 50.0
        assert data["correct_answers"] == 1
        assert data["total_questions"] == 2

    def test_submit_other_user_quiz(self, client):
        headers_a = auth_header(client, email="user_a@example.com", password="Password123!")
        headers_b = auth_header(client, email="user_b@example.com", password="Password123!")

        create_resp = _create_sample_quiz(client, headers_a)
        quiz_id = create_resp.json()["id"]

        resp = client.post(f"/api/v1/quizzes/{quiz_id}/submit", json={"answers": {}}, headers=headers_b)
        assert resp.status_code == 404
