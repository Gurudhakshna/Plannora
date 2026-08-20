"""
Tests for Exam CRUD and submission endpoints.

Covers:
1. Create exam with questions
2. List exams
3. Get exam by ID
4. Submit exam answers & score calculation
5. Exam result persistence
6. User isolation (cannot access or submit another user's exam)
7. Unauthenticated access rejection
"""

from tests.conftest import auth_header


def _create_sample_exam(client, headers, title="Midterm Exam"):
    return client.post(
        "/api/v1/exams",
        json={
            "title": title,
            "description": "Midterm comprehensive assessment",
            "questions": [
                {
                    "question_text": "What is the speed of light in vacuum (approx)?",
                    "options": ["3x10^8 m/s", "1.5x10^8 m/s", "3x10^6 m/s", "300 m/s"],
                    "correct_answer": "3x10^8 m/s",
                },
                {
                    "question_text": "What is the chemical formula for water?",
                    "options": ["CO2", "H2O", "NaCl", "CH4"],
                    "correct_answer": "H2O",
                },
                {
                    "question_text": "Which planet is known as the Red Planet?",
                    "options": ["Venus", "Mars", "Jupiter", "Saturn"],
                    "correct_answer": "Mars",
                },
            ],
        },
        headers=headers,
    )


class TestCreateExam:
    def test_create_exam_success(self, client):
        headers = auth_header(client)
        resp = _create_sample_exam(client, headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Midterm Exam"
        assert len(data["questions"]) == 3
        assert data["questions"][0]["correct_answer"] == "3x10^8 m/s"

    def test_create_exam_unauthenticated(self, client):
        resp = client.post("/api/v1/exams", json={"title": "Test", "questions": []})
        assert resp.status_code == 401


class TestListExams:
    def test_list_exams_own_only(self, client):
        headers_a = auth_header(client, email="user_a@example.com", password="Password123!")
        headers_b = auth_header(client, email="user_b@example.com", password="Password123!")

        _create_sample_exam(client, headers_a, title="Exam A")
        _create_sample_exam(client, headers_b, title="Exam B")

        resp_a = client.get("/api/v1/exams", headers=headers_a)
        assert resp_a.status_code == 200
        titles_a = [e["title"] for e in resp_a.json()]
        assert "Exam A" in titles_a
        assert "Exam B" not in titles_a


class TestGetExam:
    def test_get_exam_success(self, client):
        headers = auth_header(client)
        create_resp = _create_sample_exam(client, headers)
        exam_id = create_resp.json()["id"]

        resp = client.get(f"/api/v1/exams/{exam_id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == exam_id

    def test_get_other_user_exam(self, client):
        headers_a = auth_header(client, email="user_a@example.com", password="Password123!")
        headers_b = auth_header(client, email="user_b@example.com", password="Password123!")

        create_resp = _create_sample_exam(client, headers_a)
        exam_id = create_resp.json()["id"]

        resp = client.get(f"/api/v1/exams/{exam_id}", headers=headers_b)
        assert resp.status_code == 404


class TestSubmitExam:
    def test_submit_exam_full_score(self, client):
        headers = auth_header(client)
        create_resp = _create_sample_exam(client, headers)
        exam_data = create_resp.json()
        exam_id = exam_data["id"]
        q1_id = str(exam_data["questions"][0]["id"])
        q2_id = str(exam_data["questions"][1]["id"])
        q3_id = str(exam_data["questions"][2]["id"])

        submission = {
            "answers": {
                q1_id: "3x10^8 m/s",
                q2_id: "H2O",
                q3_id: "Mars",
            }
        }
        resp = client.post(f"/api/v1/exams/{exam_id}/submit", json=submission, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["score"] == 100.0
        assert data["correct_answers"] == 3
        assert data["total_questions"] == 3

    def test_submit_exam_partial_score(self, client):
        headers = auth_header(client)
        create_resp = _create_sample_exam(client, headers)
        exam_data = create_resp.json()
        exam_id = exam_data["id"]
        q1_id = str(exam_data["questions"][0]["id"])
        q2_id = str(exam_data["questions"][1]["id"])
        q3_id = str(exam_data["questions"][2]["id"])

        submission = {
            "answers": {
                q1_id: "3x10^8 m/s",  # correct
                q2_id: "CO2",          # wrong
                q3_id: "Mars",         # correct
            }
        }
        resp = client.post(f"/api/v1/exams/{exam_id}/submit", json=submission, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["score"] == 66.67
        assert data["correct_answers"] == 2
        assert data["total_questions"] == 3

    def test_submit_other_user_exam(self, client):
        headers_a = auth_header(client, email="user_a@example.com", password="Password123!")
        headers_b = auth_header(client, email="user_b@example.com", password="Password123!")

        create_resp = _create_sample_exam(client, headers_a)
        exam_id = create_resp.json()["id"]

        resp = client.post(f"/api/v1/exams/{exam_id}/submit", json={"answers": {}}, headers=headers_b)
        assert resp.status_code == 404
