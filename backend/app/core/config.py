"""
Plannora Backend — Application Configuration.
Robust environment loading supporting multiple working directories and paths.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import List, Optional
from dotenv import load_dotenv


def _load_env_files() -> None:
    """
    Search and load .env files from current dir, backend dir, and project root.
    """
    current_file = Path(__file__).resolve()
    core_dir = current_file.parent
    app_dir = core_dir.parent
    backend_dir = app_dir.parent
    root_dir = backend_dir.parent

    env_paths = [
        backend_dir / ".env",
        root_dir / ".env",
        Path.cwd() / ".env",
        Path.cwd() / "backend" / ".env",
    ]

    for p in env_paths:
        if p.exists() and p.is_file():
            load_dotenv(dotenv_path=p, override=True)


# Perform initial load
_load_env_files()


class Settings:
    """
    Application Settings dynamically resolved from environment variables.
    """

    PROJECT_NAME: str = "Plannora API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    @property
    def ENVIRONMENT(self) -> str:
        _load_env_files()
        return os.getenv("ENVIRONMENT", "development")

    @property
    def GROQ_API_KEY(self) -> str:
        _load_env_files()
        return os.getenv("GROQ_API_KEY") or os.getenv("AI_API_KEY") or ""

    @property
    def GROQ_MODEL(self) -> str:
        _load_env_files()
        return os.getenv("GROQ_MODEL") or os.getenv("LLM_MODEL") or "openai/gpt-oss-120b"

    @property
    def GROQ_TIMEOUT(self) -> float:
        _load_env_files()
        val = os.getenv("GROQ_TIMEOUT", "60.0")
        try:
            return float(val)
        except ValueError:
            return 60.0

    @property
    def DATABASE_URL(self) -> str:
        _load_env_files()
        return os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/plannora")

    @property
    def JWT_SECRET_KEY(self) -> str:
        _load_env_files()
        return os.getenv("JWT_SECRET_KEY", "plannora-insecure-secret-key-change-in-production")

    @property
    def JWT_ALGORITHM(self) -> str:
        _load_env_files()
        return os.getenv("JWT_ALGORITHM", "HS256")

    @property
    def ACCESS_TOKEN_EXPIRE_MINUTES(self) -> int:
        _load_env_files()
        try:
            return int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
        except ValueError:
            return 60

    @property
    def CORS_ORIGINS(self) -> List[str]:
        _load_env_files()
        raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173")
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    @property
    def cors_origins(self) -> List[str]:
        return self.CORS_ORIGINS

    @property
    def effective_groq_api_key(self) -> str:
        return self.GROQ_API_KEY

    @property
    def effective_groq_model(self) -> str:
        return self.GROQ_MODEL

    @property
    def is_groq_configured(self) -> bool:
        key = self.effective_groq_api_key
        return bool(key and len(key.strip()) > 5)


settings = Settings()
