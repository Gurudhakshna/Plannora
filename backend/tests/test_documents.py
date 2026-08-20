"""
Tests for Document upload, listing, retrieval, and deletion.

Covers:
1. Upload document (file upload)
2. List documents (only own)
3. Get document by ID
4. Delete document
5. Unauthenticated access (401)
6. User cannot access another user's document (404)
7. Verify uploaded file is created on disk
"""

import io

from tests.conftest import auth_header


def _upload_document(client, headers, filename="notes.txt", content=b"Hello World", subject_id=None):
    """Helper to upload a document and return the response."""
    data = {}
    if subject_id is not None:
        data["subject_id"] = str(subject_id)

    return client.post(
        "/api/v1/documents",
        files={"file": (filename, io.BytesIO(content), "text/plain")},
        data=data,
        headers=headers,
    )


# ===================================================================
# 1. Upload document
# ===================================================================

class TestUploadDocument:
    def test_upload_success(self, client):
        headers = auth_header(client)
        resp = _upload_document(client, headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["filename"] == "notes.txt"
        assert data["content_type"] == "text/plain"
        assert "id" in data
        assert "user_id" in data
        assert "file_path" in data
        assert "created_at" in data

    def test_upload_with_subject(self, client):
        headers = auth_header(client)
        # Create a subject first
        sub_resp = client.post(
            "/api/v1/subjects",
            json={"name": "Physics"},
            headers=headers,
        )
        subject_id = sub_resp.json()["id"]

        resp = _upload_document(client, headers, subject_id=subject_id)
        assert resp.status_code == 201
        assert resp.json()["subject_id"] == subject_id

    def test_upload_unauthenticated(self, client):
        resp = client.post(
            "/api/v1/documents",
            files={"file": ("test.txt", io.BytesIO(b"data"), "text/plain")},
        )
        assert resp.status_code == 401


# ===================================================================
# 2. List documents
# ===================================================================

class TestListDocuments:
    def test_list_empty(self, client):
        headers = auth_header(client)
        resp = client.get("/api/v1/documents", headers=headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_own_documents(self, client):
        headers = auth_header(client)
        _upload_document(client, headers, filename="file1.txt")
        _upload_document(client, headers, filename="file2.txt")
        resp = client.get("/api/v1/documents", headers=headers)
        assert resp.status_code == 200
        filenames = [d["filename"] for d in resp.json()]
        assert "file1.txt" in filenames
        assert "file2.txt" in filenames

    def test_list_documents_isolation(self, client):
        """User A's documents are not visible to User B."""
        headers_a = auth_header(client, email="a@example.com", password="PassA123!")
        _upload_document(client, headers_a, filename="secret.txt")

        headers_b = auth_header(client, email="b@example.com", password="PassB123!")
        resp = client.get("/api/v1/documents", headers=headers_b)
        assert resp.status_code == 200
        assert len(resp.json()) == 0

    def test_list_unauthenticated(self, client):
        resp = client.get("/api/v1/documents")
        assert resp.status_code == 401


# ===================================================================
# 3. Get document
# ===================================================================

class TestGetDocument:
    def test_get_document_success(self, client):
        headers = auth_header(client)
        create_resp = _upload_document(client, headers)
        doc_id = create_resp.json()["id"]

        resp = client.get(f"/api/v1/documents/{doc_id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == doc_id

    def test_get_nonexistent_document(self, client):
        headers = auth_header(client)
        resp = client.get("/api/v1/documents/9999", headers=headers)
        assert resp.status_code == 404

    def test_get_other_users_document(self, client):
        """User B cannot access User A's document."""
        headers_a = auth_header(client, email="a@example.com", password="PassA123!")
        create_resp = _upload_document(client, headers_a)
        doc_id = create_resp.json()["id"]

        headers_b = auth_header(client, email="b@example.com", password="PassB123!")
        resp = client.get(f"/api/v1/documents/{doc_id}", headers=headers_b)
        assert resp.status_code == 404


# ===================================================================
# 4. Delete document
# ===================================================================

class TestDeleteDocument:
    def test_delete_document_success(self, client):
        headers = auth_header(client)
        create_resp = _upload_document(client, headers)
        doc_id = create_resp.json()["id"]

        resp = client.delete(f"/api/v1/documents/{doc_id}", headers=headers)
        assert resp.status_code == 204

        # Confirm it's gone
        resp = client.get(f"/api/v1/documents/{doc_id}", headers=headers)
        assert resp.status_code == 404

    def test_delete_nonexistent_document(self, client):
        headers = auth_header(client)
        resp = client.delete("/api/v1/documents/9999", headers=headers)
        assert resp.status_code == 404

    def test_delete_other_users_document(self, client):
        headers_a = auth_header(client, email="a@example.com", password="PassA123!")
        create_resp = _upload_document(client, headers_a)
        doc_id = create_resp.json()["id"]

        headers_b = auth_header(client, email="b@example.com", password="PassB123!")
        resp = client.delete(f"/api/v1/documents/{doc_id}", headers=headers_b)
        assert resp.status_code == 404


# ===================================================================
# 5. File handling
# ===================================================================

class TestFileHandling:
    def test_uploaded_file_exists_on_disk(self, client):
        """Verify the physical file is created after upload."""
        import os
        headers = auth_header(client)
        resp = _upload_document(client, headers, content=b"Test content 12345")
        file_path = resp.json()["file_path"]
        assert os.path.exists(file_path)

        # Verify file content
        with open(file_path, "rb") as f:
            assert f.read() == b"Test content 12345"

    def test_file_removed_on_delete(self, client):
        """Verify the physical file is removed after document deletion."""
        import os
        headers = auth_header(client)
        resp = _upload_document(client, headers, content=b"Temporary")
        doc_id = resp.json()["id"]
        file_path = resp.json()["file_path"]

        assert os.path.exists(file_path)
        client.delete(f"/api/v1/documents/{doc_id}", headers=headers)
        assert not os.path.exists(file_path)
