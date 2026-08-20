"""
AI / RAG Service Interface.

This module acts as the isolated boundary for AI/LLM/RAG integration.
If an external AI provider (e.g. Gemini, OpenAI, or local RAG) is configured later,
it can be implemented here without touching any routers or schemas.
"""

from typing import Optional


class AIServiceInterface:
    """Interface for AI model interaction and response generation."""

    def generate_response(self, message: str, context: Optional[str] = None) -> str:
        """
        Generate a conversational response given a user prompt and optional document context.
        Default fallback indicates readiness for an AI engine to be connected.
        """
        return (
            "AI chat is not configured yet. The chat API is ready for an AI/RAG service to be connected."
        )


# Default singleton instance
ai_service = AIServiceInterface()
