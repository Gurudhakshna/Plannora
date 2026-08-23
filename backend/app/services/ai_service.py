"""
AI Chat Service Interface using Groq.
"""

from __future__ import annotations

import logging
from typing import Optional
from app.services.groq_service import groq_service

logger = logging.getLogger("plannora.ai_service")


class AIServiceInterface:
    """Interface for AI model interaction and response generation powered by Groq."""

    async def generate_response(self, message: str, context: Optional[str] = None) -> str:
        """
        Generate a conversational response given a user prompt and optional document context.
        """
        system_prompt = (
            "You are Plannora AI — a helpful, friendly, and knowledgeable study assistant. "
            "You help students with their study planning, answering academic questions, "
            "explaining concepts clearly, and providing study tips. "
            "Keep answers concise but thorough. Use examples when helpful."
        )
        if context:
            system_prompt += f"\n\nRelevant study context:\n{context}"

        try:
            return await groq_service.generate_text(
                system_prompt=system_prompt,
                user_prompt=message,
                temperature=0.4,
                max_tokens=1500,
            )
        except Exception as exc:
            logger.error(f"AI chat error: {exc}")
            return "Plannora AI is temporarily unavailable. Please try again in a moment."


# Default singleton instance
ai_service = AIServiceInterface()
