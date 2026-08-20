"""
Tests for Subject CRUD endpoints.

Covers:
1. Create subject
2. List subjects (only own)
3. Get subject by ID
4. Update subject
5. Delete subject
6. Unauthenticated access (401)
7. User cannot access another user's subject (404)
"""

from tests.conftest import register_user, login_user, auth_header


def _create_subject(client, headers, name="Mathematics", description="Number theory"):
    """Helper to create a subject and return the response."""
    return client.post(
        "/api/v1/subjects",
        json={"name": name, "description": description},
        headers=headers,
    )


# ===================================================================
# 1. Create subject
# ===================================================================

class TestCreateSubject:
    def test_create_subject_success(self, client):
        headers = auth_header(client)
        resp = _create_subject(client, headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Mathematics"
        assert data["description"] == "Number theory"
        assert "id" in data
        assert "user_id" in data
        assert "created_at" in data

    def test_create_subject_minimal(self, client):
        headers = auth_header(client)
        resp = client.post(
            "/api/v1/subjects",
            json={"name": "Physics"},
            headers=headers,
        )
        assert resp.status_code == 201
        assert resp.json()["name"] == "Physics"
        assert resp.json()["description"] is None

    def test_create_subject_unauthenticated(self, client):
        resp = client.post("/api/v1/subjects", json={"name": "Test"})
        assert resp.status_code == 401


# ===================================================================
# 2. List subjects
# ===================================================================

class TestListSubjects:
    def test_list_empty(self, client):
        headers = auth_header(client)
        resp = client.get("/api/v1/subjects", headers=headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_own_subjects(self, client):
        headers = auth_header(client)
        _create_subject(client, headers, name="Math")
        _create_subject(client, headers, name="Science")
        resp = client.get("/api/v1/subjects", headers=headers)
        assert resp.status_code == 200
        names = [s["name"] for s in resp.json()]
        assert "Math" in names
        assert "Science" in names

    def test_list_subjects_isolation(self, client):
        """User A's subjects are not visible to User B."""
        headers_a = auth_header(client, email="a@example.com", password="PassA123!")
        _create_subject(client, headers_a, name="User A Subject")

        headers_b = auth_header(client, email="b@example.com", password="PassB123!")
        resp = client.get("/api/v1/subjects", headers=headers_b)
        assert resp.status_code == 200
        assert len(resp.json()) == 0

    def test_list_unauthenticated(self, client):
        resp = client.get("/api/v1/subjects")
        assert resp.status_code == 401


# ===================================================================
# 3. Get subject
# ===================================================================

class TestGetSubject:
    def test_get_subject_success(self, client):
        headers = auth_header(client)
        create_resp = _create_subject(client, headers)
        subject_id = create_resp.json()["id"]

        resp = client.get(f"/api/v1/subjects/{subject_id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == subject_id

    def test_get_nonexistent_subject(self, client):
        headers = auth_header(client)
        resp = client.get("/api/v1/subjects/9999", headers=headers)
        assert resp.status_code == 404

    def test_get_other_users_subject(self, client):
        """User B cannot access User A's subject."""
        headers_a = auth_header(client, email="a@example.com", password="PassA123!")
        create_resp = _create_subject(client, headers_a)
        subject_id = create_resp.json()["id"]

        headers_b = auth_header(client, email="b@example.com", password="PassB123!")
        resp = client.get(f"/api/v1/subjects/{subject_id}", headers=headers_b)
        assert resp.status_code == 404


# ===================================================================
# 4. Update subject
# ===================================================================

class TestUpdateSubject:
    def test_update_name(self, client):
        headers = auth_header(client)
        create_resp = _create_subject(client, headers)
        subject_id = create_resp.json()["id"]

        resp = client.put(
            f"/api/v1/subjects/{subject_id}",
            json={"name": "Advanced Mathematics"},
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Advanced Mathematics"
        assert resp.json()["description"] == "Number theory"  # unchanged

    def test_update_description(self, client):
        headers = auth_header(client)
        create_resp = _create_subject(client, headers)
        subject_id = create_resp.json()["id"]

        resp = client.put(
            f"/api/v1/subjects/{subject_id}",
            json={"description": "Updated description"},
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["description"] == "Updated description"

    def test_update_other_users_subject(self, client):
        headers_a = auth_header(client, email="a@example.com", password="PassA123!")
        create_resp = _create_subject(client, headers_a)
        subject_id = create_resp.json()["id"]

        headers_b = auth_header(client, email="b@example.com", password="PassB123!")
        resp = client.put(
            f"/api/v1/subjects/{subject_id}",
            json={"name": "Hacked"},
            headers=headers_b,
        )
        assert resp.status_code == 404


# ===================================================================
# 5. Delete subject
# ===================================================================

class TestDeleteSubject:
    def test_delete_subject_success(self, client):
        headers = auth_header(client)
        create_resp = _create_subject(client, headers)
        subject_id = create_resp.json()["id"]

        resp = client.delete(f"/api/v1/subjects/{subject_id}", headers=headers)
        assert resp.status_code == 204

        # Confirm it's gone
        resp = client.get(f"/api/v1/subjects/{subject_id}", headers=headers)
        assert resp.status_code == 404

    def test_delete_nonexistent_subject(self, client):
        headers = auth_header(client)
        resp = client.delete("/api/v1/subjects/9999", headers=headers)
        assert resp.status_code == 404

    def test_delete_other_users_subject(self, client):
        headers_a = auth_header(client, email="a@example.com", password="PassA123!")
        create_resp = _create_subject(client, headers_a)
        subject_id = create_resp.json()["id"]

        headers_b = auth_header(client, email="b@example.com", password="PassB123!")
        resp = client.delete(f"/api/v1/subjects/{subject_id}", headers=headers_b)
        assert resp.status_code == 404
