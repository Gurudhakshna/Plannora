"""
Provider-agnostic embedding service.

Supports any OpenAI-compatible embedding API. The concrete provider
(OpenAI, Google, local model, etc.) is selected at runtime via
environment variables and can be swapped without touching calling code.

Configuration is read lazily — the application boots successfully
even when ``AI_API_KEY`` is not set.  A clear ``ConfigurationError``
is raised only when an embedding operation is actually requested.
"""

from __future__ import annotations

import os
from abc import ABC, abstractmethod
from typing import Optional


# ------------------------------------------------------------------
# Exceptions
# ------------------------------------------------------------------

class ConfigurationError(Exception):
    """Raised when a required AI configuration value is missing."""


# ------------------------------------------------------------------
# Abstract base
# ------------------------------------------------------------------

class EmbeddingProvider(ABC):
    """Interface every concrete embedding backend must implement."""

    @abstractmethod
    async def embed_text(self, text: str) -> list[float]:
        ...

    @abstractmethod
    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        ...


# ------------------------------------------------------------------
# OpenAI-compatible provider
# ------------------------------------------------------------------

class OpenAIEmbeddingProvider(EmbeddingProvider):
    """
    Embedding provider that talks to any OpenAI-compatible API
    (OpenAI, Azure OpenAI, LM Studio, Ollama, etc.).
    """

    def __init__(
        self,
        api_key: str,
        model: str = "text-embedding-3-small",
        base_url: Optional[str] = None,
    ) -> None:
        try:
            from openai import AsyncOpenAI  # type: ignore[import-untyped]
        except ImportError as exc:
            raise ImportError(
                "The 'openai' package is required for OpenAI embeddings. "
                "Install it with:  pip install openai"
            ) from exc

        self._client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url,
        )
        self._model = model

    async def embed_text(self, text: str) -> list[float]:
        response = await self._client.embeddings.create(
            input=[text],
            model=self._model,
        )
        return response.data[0].embedding

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        response = await self._client.embeddings.create(
            input=texts,
            model=self._model,
        )
        return [item.embedding for item in response.data]


# ------------------------------------------------------------------
# Public service (facade)
# ------------------------------------------------------------------

class EmbeddingService:
    """
    High-level facade consumed by the rest of the application.

    Reads config from environment variables on first use (lazy init)
    so that FastAPI can start even when the API key is absent.
    """

    def __init__(self, provider: Optional[EmbeddingProvider] = None) -> None:
        self._provider = provider

    def _ensure_provider(self) -> EmbeddingProvider:
        """Create the default provider on demand."""
        if self._provider is not None:
            return self._provider

        api_key = os.getenv("AI_API_KEY")
        if not api_key:
            raise ConfigurationError(
                "AI_API_KEY environment variable is required for embedding "
                "operations. Set it in your .env file or environment."
            )

        model = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
        base_url = os.getenv("AI_BASE_URL")  # optional override

        self._provider = OpenAIEmbeddingProvider(
            api_key=api_key,
            model=model,
            base_url=base_url,
        )
        return self._provider

    async def embed_text(self, text: str) -> list[float]:
        """Embed a single text string → vector."""
        return await self._ensure_provider().embed_text(text)

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        """Embed multiple texts → list of vectors."""
        return await self._ensure_provider().embed_texts(texts)
