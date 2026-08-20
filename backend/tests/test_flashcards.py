"""
Tests for Flashcard CRUD endpoints.

Covers:
1. Create flashcard
2. List flashcards
3. Get flashcard by ID
4. Update flashcard
5. Delete flashcard
6. User isolation (cannot access/modify/delete other user's flashcards)
7. Unauthenticated access rejection
"""

from tests.conftest import auth_header


def _create_sample_flashcard(client, headers, front="Capital of France", back="Paris", subject_id=None):
    payload = {"front": front, "back": back}
    if subject_id is not None:
        payload["subject_id"] = subject_id
    return client.post("/api/v1/flashcards", json=payload, headers=headers)


class TestCreateFlashcard:
    def test_create_flashcard_success(self, client):
        headers = auth_header(client)
        resp = _create_sample_flashcard(client, headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["front"] == "Capital of France"
        assert data["back"] == "Paris"
        assert "id" in data
        assert "user_id" in data

    def test_create_flashcard_unauthenticated(self, client):
        resp = client.post("/api/v1/flashcards", json={"front": "Q", "back": "A"})
        assert resp.status_code == 401


class TestListFlashcards:
    def test_list_flashcards_own_only(self, client):
        headers_a = auth_header(client, email="user_a@example.com", password="Password123!")
        headers_b = auth_header(client, email="user_b@example.com", password="Password123!")

        _create_sample_flashcard(client, headers_a, front="Card A")
        _create_sample_flashcard(client, headers_b, front="Card B")

        resp_a = client.get("/api/v1/flashcards", headers=headers_a)
        assert resp_a.status_code == 200
        fronts_a = [c["front"] for c in resp_a.json()]
        assert "Card A" in fronts_a
        assert "Card B" not in fronts_a


class TestGetFlashcard:
    def test_get_flashcard_success(self, client):
        headers = auth_header(client)
        create_resp = _create_sample_flashcard(client, headers)
        card_id = create_resp.json()["id"]

        resp = client.get(f"/api/v1/flashcards/{card_id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == card_id

    def test_get_other_user_flashcard(self, client):
        headers_a = auth_header(client, email="user_a@example.com", password="Password123!")
        headers_b = auth_header(client, email="user_b@example.com", password="Password123!")

        create_resp = _create_sample_flashcard(client, headers_a)
        card_id = create_resp.json()["id"]

        resp = client.get(f"/api/v1/flashcards/{card_id}", headers=headers_b)
        assert resp.status_code == 404


class TestUpdateFlashcard:
    def test_update_flashcard_success(self, client):
        headers = auth_header(client)
        create_resp = _create_sample_flashcard(client, headers)
        card_id = create_resp.json()["id"]

        update_payload = {"front": "Updated Front", "back": "Updated Back"}
        resp = client.put(f"/api/v1/flashcards/{card_id}", json=update_payload, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["front"] == "Updated Front"
        assert resp.json()["back"] == "Updated Back"

    def test_update_other_user_flashcard(self, client):
        headers_a = auth_header(client, email="user_a@example.com", password="Password123!")
        headers_b = auth_header(client, email="user_b@example.com", password="Password123!")

        create_resp = _create_sample_flashcard(client, headers_a)
        card_id = create_resp.json()["id"]

        resp = client.put(f"/api/v1/flashcards/{card_id}", json={"front": "Hack"}, headers=headers_b)
        assert resp.status_code == 404


class TestDeleteFlashcard:
    def test_delete_flashcard_success(self, client):
        headers = auth_header(client)
        create_resp = _create_sample_flashcard(client, headers)
        card_id = create_resp.json()["id"]

        del_resp = client.delete(f"/api/v1/flashcards/{card_id}", headers=headers)
        assert del_resp.status_code == 204

        get_resp = client.get(f"/api/v1/flashcards/{card_id}", headers=headers)
        assert get_resp.status_code == 404

    def test_delete_other_user_flashcard(self, client):
        headers_a = auth_header(client, email="user_a@example.com", password="Password123!")
        headers_b = auth_header(client, email="user_b@example.com", password="Password123!")

        create_resp = _create_sample_flashcard(client, headers_a)
        card_id = create_resp.json()["id"]

        resp = client.delete(f"/api/v1/flashcards/{card_id}", headers=headers_b)
        assert resp.status_code == 404
