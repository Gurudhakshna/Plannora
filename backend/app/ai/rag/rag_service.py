"""
Retrieval-Augmented Generation service.

Orchestrates the full RAG pipeline:
  Question → Embedding → Retrieval → Context → LLM → Answer + Sources

The LLM provider is behind an abstraction so it can be swapped.
"""

from __future__ import annotations

import os
from abc import ABC, abstractmethod
from typing import Any, Optional

from app.ai.embeddings.embedding_service import ConfigurationError
from app.ai.rag.retriever import Retriever, RetrievalResult


# ------------------------------------------------------------------
# LLM abstraction
# ------------------------------------------------------------------

class LLMProvider(ABC):
    """Interface for any LLM backend (OpenAI, Gemini, local, etc.)."""

    @abstractmethod
    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
    ) -> str:
        ...


class OpenAILLMProvider(LLMProvider):
    """LLM provider using any OpenAI-compatible chat completions API."""

    def __init__(
        self,
        api_key: str,
        model: str = "gpt-4o-mini",
        base_url: Optional[str] = None,
    ) -> None:
        try:
            from openai import AsyncOpenAI  # type: ignore[import-untyped]
        except ImportError as exc:
            raise ImportError(
                "The 'openai' package is required. "
                "Install with:  pip install openai"
            ) from exc

        self._client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        self._model = model

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
    ) -> str:
        response = await self._client.chat.completions.create(
            model=self._model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
        )
        return response.choices[0].message.content or ""


# ------------------------------------------------------------------
# RAG Service
# ------------------------------------------------------------------

_SYSTEM_PROMPT = (
    "You are Plannora's academic assistant. Answer the student's question "
    "using ONLY the provided context from their study materials.\n\n"
    "Rules:\n"
    "1. Ground every claim in the retrieved material.\n"
    "2. Cite which document/page the information comes from.\n"
    "3. If the context does not contain enough information to answer, "
    "explicitly say: 'The provided study materials do not contain enough "
    "information to answer this question.'\n"
    "4. Never hallucinate or invent information.\n"
    "5. Be concise and academic."
)


class RAGService:
    """
    Full RAG pipeline service.

    Dependencies
    ------------
    retriever : Retriever
        Handles the embedding → pgvector search step.
    llm_provider : LLMProvider, optional
        If not supplied, created lazily from env vars.
    """

    def __init__(
        self,
        retriever: Retriever,
        llm_provider: Optional[LLMProvider] = None,
    ) -> None:
        self._retriever = retriever
        self._llm = llm_provider

    def _ensure_llm(self) -> LLMProvider:
        if self._llm is not None:
            return self._llm

        api_key = os.getenv("AI_API_KEY")
        if not api_key:
            raise ConfigurationError(
                "AI_API_KEY is required for RAG operations. "
                "Set it in your .env file or environment."
            )
        model = os.getenv("LLM_MODEL", "gpt-4o-mini")
        base_url = os.getenv("AI_BASE_URL")
        self._llm = OpenAILLMProvider(
            api_key=api_key, model=model, base_url=base_url
        )
        return self._llm

    async def answer_question(
        self,
        question: str,
        user_id: str,
        subject_id: Optional[str] = None,
        top_k: int = 5,
    ) -> dict[str, Any]:
        """
        End-to-end RAG:
        question → retrieval → context → LLM → answer + sources.
        """
        results: list[RetrievalResult] = await self._retriever.retrieve(
            query=question,
            user_id=user_id,
            subject_id=subject_id,
            top_k=top_k,
        )

        # Build context from retrieved chunks
        context = self._build_context(results)

        user_prompt = (
            f"Context:\n{context}\n\n"
            f"Question: {question}"
        )

        llm = self._ensure_llm()
        answer = await llm.generate(
            system_prompt=_SYSTEM_PROMPT,
            user_prompt=user_prompt,
        )

        sources = [
            {
                "document_id": r.document_id,
                "document_name": r.document_name,
                "page_number": r.page_number,
                "similarity": round(r.similarity, 4),
            }
            for r in results
        ]

        return {
            "answer": answer,
            "sources": sources,
        }

    @staticmethod
    def _build_context(results: list[RetrievalResult]) -> str:
        """Format retrieved chunks into a single context block."""
        if not results:
            return "(No relevant study material found.)"

        parts: list[str] = []
        for i, r in enumerate(results, 1):
            header = f"[Source {i}: {r.document_name}"
            if r.page_number is not None:
                header += f", p.{r.page_number}"
            header += f", similarity={r.similarity:.2f}]"
            parts.append(f"{header}\n{r.content}")
        return "\n\n".join(parts)
