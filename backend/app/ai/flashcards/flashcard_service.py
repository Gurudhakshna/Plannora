"""
AI-powered flashcard generation service.

Generates structured flashcards (question + answer + topic)
from academic context using an LLM.
"""

from __future__ import annotations

import json
import os
from typing import Any, Optional

from app.ai.embeddings.embedding_service import ConfigurationError
from app.ai.rag.rag_service import LLMProvider, OpenAILLMProvider


_SYSTEM_PROMPT = """\
You are an expert academic flashcard generator for the Plannora study platform.

Given academic context, create study flashcards.

Return a JSON array where each element has:
{
  "question": "...",
  "answer": "...",
  "topic": "..."
}

Rules:
1. All flashcards MUST be grounded in the provided context.
2. Questions should test understanding, not just recall.
3. Answers should be concise but complete.
4. Identify the specific topic each flashcard covers.
5. Return ONLY the JSON array, no extra text.
"""


class FlashcardService:
    """
    Generates flashcards from academic content.

    Parameters
    ----------
    llm_provider : LLMProvider, optional
        If not provided, created lazily from env vars.
    """

    def __init__(self, llm_provider: Optional[LLMProvider] = None) -> None:
        self._llm = llm_provider

    def _ensure_llm(self) -> LLMProvider:
        if self._llm is not None:
            return self._llm

        api_key = os.getenv("AI_API_KEY")
        if not api_key:
            raise ConfigurationError(
                "AI_API_KEY is required for flashcard generation. "
                "Set it in your .env file or environment."
            )
        model = os.getenv("LLM_MODEL", "gpt-4o-mini")
        base_url = os.getenv("AI_BASE_URL")
        self._llm = OpenAILLMProvider(
            api_key=api_key, model=model, base_url=base_url
        )
        return self._llm

    async def generate_flashcards(
        self,
        context: str,
        num_cards: int = 10,
    ) -> list[dict[str, Any]]:
        """
        Generate flashcards from academic context.

        Parameters
        ----------
        context : str
            Academic text to create flashcards from.
        num_cards : int
            Target number of flashcards.

        Returns
        -------
        list[dict]
            Each dict has ``question``, ``answer``, ``topic``.
        """
        user_prompt = (
            f"Generate {num_cards} flashcards from the following "
            f"academic content:\n\n{context}"
        )

        llm = self._ensure_llm()
        raw = await llm.generate(
            system_prompt=_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.6,
        )

        return self._parse_flashcards(raw)

    @staticmethod
    def _parse_flashcards(raw: str) -> list[dict[str, Any]]:
        """Best-effort parse of LLM JSON response."""
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[-1]
        if raw.endswith("```"):
            raw = raw.rsplit("```", 1)[0]
        raw = raw.strip()

        try:
            cards = json.loads(raw)
            if isinstance(cards, list):
                return cards
        except json.JSONDecodeError:
            pass

        return [{"raw_response": raw, "parse_error": True}]
