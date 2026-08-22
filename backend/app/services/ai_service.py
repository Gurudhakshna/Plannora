"""
AI / RAG Service Interface.

This module acts as the isolated boundary for AI/LLM/RAG integration.
Uses the OpenAI-compatible provider (Groq, OpenAI, etc.) configured via
environment variables: AI_API_KEY, AI_BASE_URL, LLM_MODEL.
"""

import os
from typing import Optional


class AIServiceInterface:
    """Interface for AI model interaction and response generation."""

    def __init__(self) -> None:
        self._client = None
        self._model: str = os.getenv("LLM_MODEL", "gpt-4o-mini")

    def _ensure_client(self):
        """Lazily initialise the OpenAI-compatible client."""
        if self._client is not None:
            return self._client

        api_key = os.getenv("AI_API_KEY")
        if not api_key:
            return None  # graceful fallback

        try:
            from openai import OpenAI  # type: ignore[import-untyped]
        except ImportError:
            return None

        base_url = os.getenv("AI_BASE_URL")
        self._client = OpenAI(api_key=api_key, base_url=base_url)
        self._model = os.getenv("LLM_MODEL", "gpt-4o-mini")
        return self._client

    def generate_response(self, message: str, context: Optional[str] = None) -> str:
        """
        Generate a conversational response given a user prompt and optional document context.
        Falls back to a static message when no AI provider is configured.
        """
        client = self._ensure_client()
        if client is None:
            return (
                "AI chat is not configured yet. The chat API is ready "
                "for an AI/RAG service to be connected."
            )

        system_prompt = (
            "You are Plannora AI — a helpful, friendly, and knowledgeable study assistant. "
            "You help students with their study planning, answering academic questions, "
            "explaining concepts clearly, and providing study tips. "
            "Keep answers concise but thorough. Use examples when helpful."
        )
        if context:
            system_prompt += f"\n\nRelevant context:\n{context}"

        try:
            response = client.chat.completions.create(
                model=self._model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message},
                ],
                temperature=0.7,
                max_tokens=1024,
            )
            return response.choices[0].message.content or "I couldn't generate a response."
        except Exception as exc:
            return f"AI service error: {exc}"


# Default singleton instance
ai_service = AIServiceInterface()
