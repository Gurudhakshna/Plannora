"""
Tests for Search endpoints.

Covers:
1. Authenticated search
2. Search subject by name
3. Search subject by description
4. Search document by filename
5. Search returns only current user's data (user isolation)
6. Search with no matching results
7. Empty query returns empty results
8. Unauthenticated search is rejected (401)
"""

import io
from tests.conftest import auth_header


class TestSearch:
    def test_search_unauthenticated(self, client):
        resp = client.get("/api/v1/search?q=test")
        assert resp.status_code == 401

    def test_search_empty_query(self, client):
        headers = auth_header(client)
        resp = client.get("/api/v1/search?q=", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["query"] == ""
        assert data["results"] == []

    def test_search_subject_by_name(self, client):
        headers = auth_header(client)
        client.post(
            "/api/v1/subjects",
            json={"name": "Linear Algebra", "description": "Matrices and vectors"},
            headers=headers,
        )

        resp = client.get("/api/v1/search?q=Algebra", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["results"]) >= 1
        assert any(r["type"] == "subject" and "Algebra" in r["title"] for r in data["results"])

    def test_search_subject_by_description(self, client):
        headers = auth_header(client)
        client.post(
            "/api/v1/subjects",
            json={"name": "Biology 101", "description": "Study of living organisms and cellular biology"},
            headers=headers,
        )

        resp = client.get("/api/v1/search?q=cellular", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["results"]) >= 1
        assert any(r["type"] == "subject" and r["title"] == "Biology 101" for r in data["results"])

    def test_search_document_by_filename(self, client):
        headers = auth_header(client)
        client.post(
            "/api/v1/documents",
            files={"file": ("quantum_physics_lecture1.pdf", io.BytesIO(b"Notes"), "application/pdf")},
            headers=headers,
        )

        resp = client.get("/api/v1/search?q=quantum", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["results"]) >= 1
        assert any(r["type"] == "document" and "quantum" in r["title"] for r in data["results"])

    def test_search_no_results(self, client):
        headers = auth_header(client)
        resp = client.get("/api/v1/search?q=nonexistenttermxyz", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["query"] == "nonexistenttermxyz"
        assert data["results"] == []

    def test_search_user_isolation(self, client):
        headers_a = auth_header(client, email="user_a@example.com", password="Password123!")
        headers_b = auth_header(client, email="user_b@example.com", password="Password123!")

        client.post(
            "/api/v1/subjects",
            json={"name": "Secret Subject", "description": "Classified"},
            headers=headers_a,
        )

        # User B searches for User A's subject
        resp_b = client.get("/api/v1/search?q=Secret", headers=headers_b)
        assert resp_b.status_code == 200
        assert len(resp_b.json()["results"]) == 0
