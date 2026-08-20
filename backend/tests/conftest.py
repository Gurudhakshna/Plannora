"""
Pytest fixtures for Plannora backend tests.

Uses an in-memory SQLite database so tests run without PostgreSQL.
Overrides the get_db dependency to use the test database session.
"""

import os

# Set environment variables BEFORE importing any app modules
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing-only"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database.base import Base
from app.database.connection import get_db
from app.main import app


# ---------------------------------------------------------------------------
# Test database engine — uses StaticPool so all threads share the same
# in-memory SQLite connection (required because FastAPI runs in a threadpool).
# ---------------------------------------------------------------------------
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# Enable SQLite foreign key enforcement (off by default)
@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test function."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """
    FastAPI TestClient with the get_db dependency overridden
    to use the test database session.
    """

    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def register_user(client: TestClient, name="Test User", email="test@example.com", password="StrongPass123!"):
    """Helper to register a user and return the response."""
    return client.post("/api/v1/auth/register", json={
        "name": name,
        "email": email,
        "password": password,
    })


def login_user(client: TestClient, email="test@example.com", password="StrongPass123!"):
    """Helper to login and return the response."""
    return client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password,
    })


def auth_header(client: TestClient, name="Test User", email="test@example.com", password="StrongPass123!"):
    """Helper to register, login, and return the Authorization header dict."""
    register_user(client, name=name, email=email, password=password)
    resp = login_user(client, email=email, password=password)
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
