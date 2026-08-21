"""
Study recommendation engine.

Generates structured study plan recommendations by combining:
  1. Exam relevance / topic priority from paper analysis
  2. Weak topics from quiz performance
  3. Frequently-appearing topics
  4. Recency of study (topics not recently studied)

Entirely deterministic — no LLM calls required.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, timedelta
from enum import Enum
from typing import Optional


# ------------------------------------------------------------------
# Data models
# ------------------------------------------------------------------

class ActivityType(str, Enum):
    STUDY = "Study"
    PRACTICE = "Practice"
    QUIZ = "Quiz"
    REVISION = "Revision"
    FLASHCARDS = "Flashcards"


@dataclass
class TopicPriority:
    """Priority signal from question paper analysis."""

    topic: str
    importance_score: float  # 0–1
    recommended_priority: str  # "high" / "medium" / "low"


@dataclass
class WeakTopic:
    """Weak-topic signal from quiz performance analysis."""

    topic: str
    accuracy: float  # 0–1
    mastery: str  # "Weak" / "Needs Improvement"


@dataclass
class StudyRecommendation:
    """A single recommendation item in the study plan."""

    topic: str
    activity: ActivityType
    priority_score: float
    reason: str
    estimated_minutes: int = 30

    def to_dict(self) -> dict:
        return {
            "topic": self.topic,
            "activity": self.activity.value,
            "priority_score": round(self.priority_score, 3),
            "reason": self.reason,
            "estimated_minutes": self.estimated_minutes,
        }


# ------------------------------------------------------------------
# Recommender
# ------------------------------------------------------------------

class StudyRecommender:
    """
    Generates a prioritised list of study recommendations.

    Inputs
    ------
    exam_date : date, optional
    topic_priorities : list[TopicPriority]
        From question paper analysis.
    weak_topics : list[WeakTopic]
        From quiz performance analysis.
    quiz_performance : dict[str, float]
        ``{topic: accuracy}`` across all quizzes.
    available_study_time : int
        Total available study minutes.
    syllabus_topics : list[str]
        Full list of topics in the syllabus.
    recently_studied : set[str]
        Topics studied in the last 3 days.
    """

    # Weight factors
    W_EXAM_RELEVANCE = 0.35
    W_WEAKNESS = 0.30
    W_FREQUENCY = 0.20
    W_RECENCY = 0.15

    def generate_recommendations(
        self,
        exam_date: Optional[date] = None,
        topic_priorities: Optional[list[TopicPriority]] = None,
        weak_topics: Optional[list[WeakTopic]] = None,
        quiz_performance: Optional[dict[str, float]] = None,
        available_study_time: int = 120,
        syllabus_topics: Optional[list[str]] = None,
        recently_studied: Optional[set[str]] = None,
    ) -> list[StudyRecommendation]:
        topic_priorities = topic_priorities or []
        weak_topics = weak_topics or []
        quiz_performance = quiz_performance or {}
        syllabus_topics = syllabus_topics or []
        recently_studied = recently_studied or set()

        # Build a set of all known topics
        all_topics: set[str] = set(syllabus_topics)
        all_topics.update(tp.topic for tp in topic_priorities)
        all_topics.update(wt.topic for wt in weak_topics)
        all_topics.update(quiz_performance.keys())

        if not all_topics:
            return []

        # Pre-index helpers
        priority_map = {tp.topic: tp for tp in topic_priorities}
        weak_map = {wt.topic: wt for wt in weak_topics}

        # Urgency multiplier based on days to exam
        urgency = self._exam_urgency(exam_date)

        recommendations: list[StudyRecommendation] = []

        for topic in all_topics:
            score, reasons, activity = self._score_topic(
                topic=topic,
                priority_map=priority_map,
                weak_map=weak_map,
                quiz_performance=quiz_performance,
                recently_studied=recently_studied,
                urgency=urgency,
            )
            recommendations.append(
                StudyRecommendation(
                    topic=topic,
                    activity=activity,
                    priority_score=score,
                    reason="; ".join(reasons),
                    estimated_minutes=self._estimate_time(score, available_study_time),
                )
            )

        recommendations.sort(key=lambda r: r.priority_score, reverse=True)
        return recommendations

    # ------------------------------------------------------------------
    # Internal scoring
    # ------------------------------------------------------------------

    def _score_topic(
        self,
        topic: str,
        priority_map: dict[str, TopicPriority],
        weak_map: dict[str, WeakTopic],
        quiz_performance: dict[str, float],
        recently_studied: set[str],
        urgency: float,
    ) -> tuple[float, list[str], ActivityType]:
        """Return (score, reasons, recommended_activity)."""
        score = 0.0
        reasons: list[str] = []

        # 1. Exam relevance
        if topic in priority_map:
            tp = priority_map[topic]
            relevance = tp.importance_score * self.W_EXAM_RELEVANCE * urgency
            score += relevance
            reasons.append(
                f"Exam relevance ({tp.recommended_priority} priority)"
            )

        # 2. Weak topic
        if topic in weak_map:
            wt = weak_map[topic]
            weakness = (1 - wt.accuracy) * self.W_WEAKNESS
            score += weakness
            reasons.append(
                f"{wt.mastery} ({wt.accuracy * 100:.0f}% accuracy)"
            )

        # 3. Quiz performance (inverse — lower accuracy = higher score)
        if topic in quiz_performance:
            acc = quiz_performance[topic]
            perf_score = (1 - acc) * self.W_FREQUENCY
            score += perf_score
            if acc < 0.5:
                reasons.append("Low quiz performance")

        # 4. Recency — boost if not recently studied
        if topic not in recently_studied:
            score += self.W_RECENCY
            reasons.append("Not recently studied")

        if not reasons:
            reasons.append("Syllabus topic")

        # Pick activity type
        activity = self._pick_activity(topic, weak_map, quiz_performance)

        return score, reasons, activity

    @staticmethod
    def _pick_activity(
        topic: str,
        weak_map: dict[str, WeakTopic],
        quiz_performance: dict[str, float],
    ) -> ActivityType:
        """Heuristic to pick the best activity for a topic."""
        if topic in weak_map and weak_map[topic].accuracy < 0.3:
            return ActivityType.STUDY
        if topic in weak_map:
            return ActivityType.PRACTICE
        acc = quiz_performance.get(topic, 0.5)
        if acc < 0.5:
            return ActivityType.QUIZ
        if acc >= 0.85:
            return ActivityType.FLASHCARDS
        return ActivityType.REVISION

    @staticmethod
    def _exam_urgency(exam_date: Optional[date]) -> float:
        """Return a multiplier 1.0–2.0 based on proximity to exam."""
        if exam_date is None:
            return 1.0
        days_left = (exam_date - date.today()).days
        if days_left <= 0:
            return 2.0
        if days_left <= 3:
            return 1.8
        if days_left <= 7:
            return 1.5
        if days_left <= 14:
            return 1.3
        return 1.0

    @staticmethod
    def _estimate_time(score: float, total_available: int) -> int:
        """Estimate minutes to allocate (proportional to score)."""
        base = max(15, int(total_available * score * 0.3))
        return min(base, 90)  # cap at 90 min per topic
