"""
Retrieval-Augmented Generation service using Groq.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Any, Optional
from app.ai.rag.retriever import Retriever, RetrievalResult
from app.services.groq_service import groq_service

logger = logging.getLogger("plannora.rag_service")


class LLMProvider(ABC):
    """Interface for any LLM backend."""

    @abstractmethod
    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
    ) -> str:
        ...


class GroqLLMProvider(LLMProvider):
    """LLM provider powered by Groq."""

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
    ) -> str:
        return await groq_service.generate_text(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=temperature,
        )


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
    """

    def __init__(
        self,
        retriever: Retriever,
        llm_provider: Optional[LLMProvider] = None,
    ) -> None:
        self._retriever = retriever
        self._llm = llm_provider or GroqLLMProvider()

    async def answer_question(
        self,
        question: str,
        user_id: str,
        subject_id: Optional[str] = None,
        top_k: int = 5,
    ) -> dict[str, Any]:
        results: list[RetrievalResult] = await self._retriever.retrieve(
            query=question,
            user_id=user_id,
            subject_id=subject_id,
            top_k=top_k,
        )

        context = self._build_context(results)

        user_prompt = (
            f"Context:\n{context}\n\n"
            f"Question: {question}"
        )

        answer = await self._llm.generate(
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
