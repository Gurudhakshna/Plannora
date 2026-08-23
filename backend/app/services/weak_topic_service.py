"""
Weak Topic detection and remediation service.
Combines deterministic calculation from student activity with Groq-generated personalized study advice.
"""

from __future__ import annotations

import logging
from typing import List, Optional
from pydantic import BaseModel
from app.prompts.weak_topics import WEAK_TOPICS_SYSTEM_PROMPT, WEAK_TOPICS_USER_PROMPT_TEMPLATE
from app.schemas.ai import (
    TopicActivityData,
    WeakTopicItemModel,
    WeakTopicsResponse,
)
from app.services.groq_service import groq_service

logger = logging.getLogger("plannora.weak_topic_service")


class _RawRemediationResponse(BaseModel):
    topic: str
    recommendation: str
    action_steps: List[str] = []


class WeakTopicService:
    """
    Computes performance analytics and produces actionable remediation plans.
    """

    async def calculate_weak_topics(
        self,
        activity_data: List[TopicActivityData],
        context: Optional[str] = None,
    ) -> WeakTopicsResponse:
        """
        Deterministically calculate topic mastery, then request Groq recommendations for weak topics.
        """
        if not activity_data:
            return WeakTopicsResponse(
                success=True,
                weak_topics=[],
                summary="No study activity recorded yet. Complete quizzes or flashcards to diagnose weak areas."
            )

        calculated_items: List[WeakTopicItemModel] = []

        for item in activity_data:
            total_attempts = item.total_count
            if total_attempts == 0:
                continue

            accuracy = round((item.correct_count / total_attempts) * 100.0, 1)

            # Account for flashcard difficulty ratings if present
            # Hard ratings reduce effective accuracy; Easy ratings improve it
            if item.ratings:
                hard_count = sum(1 for r in item.ratings if r.lower() == "hard")
                easy_count = sum(1 for r in item.ratings if r.lower() == "easy")
                rating_delta = (easy_count * 5.0) - (hard_count * 8.0)
                accuracy = max(0.0, min(100.0, accuracy + rating_delta))

            # Classify weakness level
            if accuracy < 50.0:
                weakness_level = "Weak"
                confidence = "low"
            elif accuracy < 75.0:
                weakness_level = "Needs Practice"
                confidence = "medium"
            elif accuracy < 90.0:
                weakness_level = "Good"
                confidence = "high"
            else:
                weakness_level = "Strong"
                confidence = "high"

            # For weak or practice topics, get AI remediation recommendations
            recommendation = "Review core definitions and test with active recall."
            action_steps = ["Review chapter summary", "Practice 5 targeted questions"]

            if weakness_level in ("Weak", "Needs Practice"):
                try:
                    user_prompt = WEAK_TOPICS_USER_PROMPT_TEMPLATE.format(
                        topic=item.topic,
                        subject=item.subject,
                        accuracy=int(accuracy),
                        attempts=total_attempts,
                        confidence=confidence,
                        context=(context or "")[:3000],
                    )

                    ai_remediation: _RawRemediationResponse = await groq_service.generate_json(
                        system_prompt=WEAK_TOPICS_SYSTEM_PROMPT,
                        user_prompt=user_prompt,
                        response_schema=_RawRemediationResponse,
                        temperature=0.2,
                        max_tokens=1000,
                    )
                    recommendation = ai_remediation.recommendation
                    if ai_remediation.action_steps:
                        action_steps = ai_remediation.action_steps
                except Exception as exc:
                    logger.warning(f"Could not generate AI recommendation for {item.topic}: {exc}")
                    recommendation = f"Accuracy is currently {accuracy}%. Review core principles in your study notes."

            calculated_items.append(
                WeakTopicItemModel(
                    topic=item.topic,
                    subject=item.subject,
                    accuracy=accuracy,
                    attempts=total_attempts,
                    confidence=confidence,
                    weakness_level=weakness_level,
                    recommendation=recommendation,
                    action_steps=action_steps,
                )
            )

        # Sort from lowest accuracy to highest (weakest first)
        calculated_items.sort(key=lambda x: x.accuracy)

        weak_count = sum(1 for x in calculated_items if x.weakness_level in ("Weak", "Needs Practice"))
        summary = (
            f"Identified {weak_count} high-priority topics requiring revision."
            if weak_count > 0
            else "All topics are currently performing well! Continue periodic revision."
        )

        return WeakTopicsResponse(
            success=True,
            weak_topics=calculated_items,
            summary=summary,
        )


weak_topic_service = WeakTopicService()
