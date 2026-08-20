"""
Tests for authentication endpoints and JWT-based user access.

Covers:
1. Registration (success)
2. Duplicate email registration (400)
3. Login (success)
4. Login with wrong password (401)
5. Login with non-existent email (401)
6. JWT authentication — GET /users/me with valid token
7. GET /users/me without token (401)
8. PUT /users/me — update name
9. PUT /users/me — update email
10. PUT /users/me — duplicate email check
"""

from tests.conftest import register_user, login_user, auth_header


# ===================================================================
# 1. Registration
# ===================================================================

class TestRegistration:
    def test_register_success(self, client):
        resp = register_user(client)
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Test User"
        assert data["email"] == "test@example.com"
        assert "id" in data
        assert "created_at" in data
        assert "hashed_password" not in data
        assert "password" not in data

    def test_register_duplicate_email(self, client):
        register_user(client)
        resp = register_user(client)  # same email again
        assert resp.status_code == 400
        assert "already registered" in resp.json()["detail"].lower()

    def test_register_invalid_email(self, client):
        resp = client.post("/api/v1/auth/register", json={
            "name": "Bad Email",
            "email": "not-an-email",
            "password": "StrongPass123!",
        })
        assert resp.status_code == 422  # Pydantic validation error


# ===================================================================
# 2. Login
# ===================================================================

class TestLogin:
    def test_login_success(self, client):
        register_user(client)
        resp = login_user(client)
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 0

    def test_login_wrong_password(self, client):
        register_user(client)
        resp = login_user(client, password="WrongPassword!")
        assert resp.status_code == 401
        assert "invalid" in resp.json()["detail"].lower()

    def test_login_nonexistent_email(self, client):
        resp = login_user(client, email="nobody@example.com")
        assert resp.status_code == 401
        assert "invalid" in resp.json()["detail"].lower()


# ===================================================================
# 3. JWT Authentication
# ===================================================================

class TestJWTAuthentication:
    def test_get_me_with_valid_token(self, client):
        headers = auth_header(client)
        resp = client.get("/api/v1/users/me", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "test@example.com"
        assert "id" in data
        assert "hashed_password" not in data

    def test_get_me_without_token(self, client):
        resp = client.get("/api/v1/users/me")
        assert resp.status_code == 401

    def test_get_me_with_invalid_token(self, client):
        resp = client.get("/api/v1/users/me", headers={
            "Authorization": "Bearer invalid.token.here"
        })
        assert resp.status_code == 401

    def test_get_me_with_expired_token(self, client):
        """A completely bogus token should be rejected."""
        resp = client.get("/api/v1/users/me", headers={
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTk5IiwiZXhwIjoxfQ.invalid"
        })
        assert resp.status_code == 401


# ===================================================================
# 4. User Profile Update
# ===================================================================

class TestUserUpdate:
    def test_update_name(self, client):
        headers = auth_header(client)
        resp = client.put("/api/v1/users/me", json={"name": "Updated Name"}, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated Name"
        assert resp.json()["email"] == "test@example.com"  # unchanged

    def test_update_email(self, client):
        headers = auth_header(client)
        resp = client.put("/api/v1/users/me", json={"email": "new@example.com"}, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["email"] == "new@example.com"

    def test_update_duplicate_email(self, client):
        # Register two users
        register_user(client, name="User A", email="a@example.com", password="PassA123!")
        headers_b = auth_header(client, email="b@example.com", password="PassB123!")

        # User B tries to take User A's email
        resp = client.put("/api/v1/users/me", json={"email": "a@example.com"}, headers=headers_b)
        assert resp.status_code == 400
        assert "already registered" in resp.json()["detail"].lower()

    def test_update_without_auth(self, client):
        resp = client.put("/api/v1/users/me", json={"name": "Hacker"})
        assert resp.status_code == 401
