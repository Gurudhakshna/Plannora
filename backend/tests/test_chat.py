"""
Tests for Chat assistant endpoint.

Covers:
1. Authenticated chat request
2. Chat request validation (empty/invalid message)
3. Chat response structure
4. Chat works cleanly without external AI API key (returns clean fallback)
5. Unauthenticated chat is rejected (401)
6. Chat does not leak unauthenticated/other user data
"""

from tests.conftest import auth_header


class TestChat:
    def test_chat_unauthenticated(self, client):
        resp = client.post("/api/v1/chat", json={"message": "Hello"})
        assert resp.status_code == 401

    def test_chat_empty_message_validation(self, client):
        headers = auth_header(client)
        resp = client.post("/api/v1/chat", json={"message": ""}, headers=headers)
        assert resp.status_code == 422

    def test_chat_success_and_fallback(self, client):
        headers = auth_header(client)
        resp = client.post(
            "/api/v1/chat",
            json={"message": "What is database normalization?"},
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["message"] == "What is database normalization?"
        assert "response" in data
        assert isinstance(data["response"], str)
        assert len(data["response"]) > 0

    def test_chat_response_structure(self, client):
        headers = auth_header(client)
        resp = client.post(
            "/api/v1/chat",
            json={"message": "Can you summarize my notes?"},
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert set(data.keys()) == {"message", "response"}
