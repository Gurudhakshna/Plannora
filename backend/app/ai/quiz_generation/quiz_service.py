"""
AI-powered quiz generation service.

Generates structured multiple-choice questions from academic context
at configurable difficulty levels.
"""

from __future__ import annotations

import json
import os
from typing import Any, Optional

from app.ai.embeddings.embedding_service import ConfigurationError
from app.ai.rag.rag_service import LLMProvider, OpenAILLMProvider


# ------------------------------------------------------------------
# System prompt
# ------------------------------------------------------------------

_SYSTEM_PROMPT = """\
You are an expert academic quiz generator for the Plannora study platform.

Generate multiple-choice questions based on the provided academic context.

Return a JSON array where each element has:
{
  "question": "...",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correct_answer": "A",
  "explanation": "...",
  "topic": "...",
  "difficulty": "easy|medium|hard"
}

Rules:
1. All questions MUST be grounded in the provided context.
2. Each question MUST have exactly 4 options labelled A–D.
3. The explanation must reference the source material.
4. Difficulty guidelines:
   - easy: direct recall / definitions
   - medium: application / understanding
   - hard: analysis / synthesis / multi-step reasoning
5. Return ONLY the JSON array, no extra text.
"""


class QuizService:
    """
    Generates quiz questions from academic content.

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
                "AI_API_KEY is required for quiz generation. "
                "Set it in your .env file or environment."
            )
        model = os.getenv("LLM_MODEL", "gpt-4o-mini")
        base_url = os.getenv("AI_BASE_URL")
        self._llm = OpenAILLMProvider(
            api_key=api_key, model=model, base_url=base_url
        )
        return self._llm

    async def generate_quiz(
        self,
        subject: str,
        topic: str,
        context: str,
        number_of_questions: int = 5,
        difficulty: str = "medium",
    ) -> list[dict[str, Any]]:
        """
        Generate quiz questions.

        Parameters
        ----------
        subject : str
            Academic subject name.
        topic : str
            Specific topic within the subject.
        context : str
            Academic content to base questions on.
        number_of_questions : int
            How many questions to generate.
        difficulty : str
            One of ``easy``, ``medium``, ``hard``.

        Returns
        -------
        list[dict]
            List of structured question objects.
        """
        difficulty = difficulty.lower()
        if difficulty not in ("easy", "medium", "hard"):
            difficulty = "medium"

        user_prompt = (
            f"Subject: {subject}\n"
            f"Topic: {topic}\n"
            f"Difficulty: {difficulty}\n"
            f"Number of questions: {number_of_questions}\n\n"
            f"Academic Context:\n{context}"
        )

        llm = self._ensure_llm()
        raw = await llm.generate(
            system_prompt=_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.7,
        )

        return self._parse_questions(raw)

    @staticmethod
    def _parse_questions(raw: str) -> list[dict[str, Any]]:
        """Best-effort parse of LLM JSON response."""
        # Strip markdown code fences if present
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[-1]
        if raw.endswith("```"):
            raw = raw.rsplit("```", 1)[0]
        raw = raw.strip()

        try:
            questions = json.loads(raw)
            if isinstance(questions, list):
                return questions
        except json.JSONDecodeError:
            pass

        # Fallback: return raw as single-item list for debugging
        return [{"raw_response": raw, "parse_error": True}]
