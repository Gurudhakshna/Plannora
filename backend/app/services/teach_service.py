"""
Interactive Teach Me conceptual lesson service.
Delivers multi-tiered explanations (Beginner, Intermediate, Advanced) with analogies, examples, and self-checks.
"""

from __future__ import annotations

import logging
from typing import Optional
from app.prompts.teach import TEACH_SYSTEM_PROMPT, TEACH_USER_PROMPT_TEMPLATE
from app.schemas.ai import TeachMeResponse
from app.services.groq_service import groq_service

logger = logging.getLogger("plannora.teach_service")


class TeachService:
    """
    Generates tailored, pedagogical lessons on difficult concepts.
    """

    async def teach_concept(
        self,
        concept: str,
        context: Optional[str] = None,
        student_level: str = "beginner",
    ) -> TeachMeResponse:
        """
        Generate structured multi-level explanation via Groq.
        """
        clean_level = student_level.lower()
        if clean_level not in ("beginner", "intermediate", "advanced"):
            clean_level = "beginner"

        context_str = context.strip() if context else f"Academic Subject Concept: {concept}"

        user_prompt = TEACH_USER_PROMPT_TEMPLATE.format(
            concept=concept,
            level=clean_level,
            context=context_str[:6000],
        )

        response: TeachMeResponse = await groq_service.generate_json(
            system_prompt=TEACH_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            response_schema=TeachMeResponse,
            temperature=0.3,
            max_tokens=2500,
        )

        return response


teach_service = TeachService()
