"""
Topic performance analyser.

Classifies topic mastery from quiz/attempt statistics
and identifies weak topics ordered by priority.

Entirely deterministic — no LLM calls required.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class MasteryLevel(str, Enum):
    WEAK = "Weak"
    NEEDS_IMPROVEMENT = "Needs Improvement"
    GOOD = "Good"
    STRONG = "Strong"


@dataclass
class TopicPerformance:
    """Performance record for a single topic."""

    topic: str
    attempt_count: int
    correct_count: int

    @property
    def accuracy(self) -> float:
        if self.attempt_count == 0:
            return 0.0
        return self.correct_count / self.attempt_count

    @property
    def accuracy_percent(self) -> float:
        return self.accuracy * 100

    @property
    def mastery(self) -> MasteryLevel:
        pct = self.accuracy_percent
        if pct < 50:
            return MasteryLevel.WEAK
        if pct < 70:
            return MasteryLevel.NEEDS_IMPROVEMENT
        if pct < 85:
            return MasteryLevel.GOOD
        return MasteryLevel.STRONG

    def to_dict(self) -> dict:
        return {
            "topic": self.topic,
            "attempt_count": self.attempt_count,
            "correct_count": self.correct_count,
            "accuracy": round(self.accuracy_percent, 1),
            "mastery": self.mastery.value,
        }


class TopicAnalyzer:
    """
    Analyse topic-level quiz performance.

    Accepts raw performance data and returns classified results,
    with weak topics prioritised for the student.
    """

    @staticmethod
    def classify(
        performances: list[TopicPerformance],
    ) -> list[TopicPerformance]:
        """Return all topics with computed mastery, sorted by accuracy ASC."""
        return sorted(performances, key=lambda p: p.accuracy)

    @staticmethod
    def get_weak_topics(
        performances: list[TopicPerformance],
    ) -> list[TopicPerformance]:
        """
        Return topics where mastery is *Weak* or *Needs Improvement*,
        ordered by accuracy ascending (weakest first).
        """
        weak = [
            p
            for p in performances
            if p.mastery
            in (MasteryLevel.WEAK, MasteryLevel.NEEDS_IMPROVEMENT)
        ]
        return sorted(weak, key=lambda p: p.accuracy)
