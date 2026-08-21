"""
Unit tests for StudyRecommender.

No external AI calls — purely deterministic.
"""

import sys
import os
from datetime import date, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.ai.recommendations.study_recommender import (
    StudyRecommender,
    TopicPriority,
    WeakTopic,
    ActivityType,
)


class TestStudyRecommender:
    """Tests for the recommendation engine."""

    def _make_recommender(self) -> StudyRecommender:
        return StudyRecommender()

    def test_empty_input_returns_empty(self):
        rec = self._make_recommender()
        results = rec.generate_recommendations()
        assert results == []

    def test_syllabus_topics_appear(self):
        rec = self._make_recommender()
        results = rec.generate_recommendations(
            syllabus_topics=["Calculus", "Algebra"],
        )
        topics = {r.topic for r in results}
        assert "Calculus" in topics
        assert "Algebra" in topics

    def test_weak_topics_ranked_higher(self):
        rec = self._make_recommender()
        results = rec.generate_recommendations(
            weak_topics=[
                WeakTopic(topic="Calculus", accuracy=0.2, mastery="Weak"),
            ],
            syllabus_topics=["Calculus", "Algebra"],
        )
        # Calculus (weak) should be ranked above Algebra
        calc = next(r for r in results if r.topic == "Calculus")
        alg = next(r for r in results if r.topic == "Algebra")
        assert calc.priority_score > alg.priority_score

    def test_exam_urgency_boosts_scores(self):
        rec = self._make_recommender()
        # Exam in 2 days
        soon = date.today() + timedelta(days=2)
        results_urgent = rec.generate_recommendations(
            exam_date=soon,
            topic_priorities=[
                TopicPriority("Calculus", 0.8, "high"),
            ],
            syllabus_topics=["Calculus"],
        )
        # Exam in 30 days
        far = date.today() + timedelta(days=30)
        results_relaxed = rec.generate_recommendations(
            exam_date=far,
            topic_priorities=[
                TopicPriority("Calculus", 0.8, "high"),
            ],
            syllabus_topics=["Calculus"],
        )
        urgent_score = results_urgent[0].priority_score
        relaxed_score = results_relaxed[0].priority_score
        assert urgent_score > relaxed_score

    def test_recently_studied_deprioritised(self):
        rec = self._make_recommender()
        results = rec.generate_recommendations(
            syllabus_topics=["Calculus", "Algebra"],
            recently_studied={"Calculus"},
        )
        calc = next(r for r in results if r.topic == "Calculus")
        alg = next(r for r in results if r.topic == "Algebra")
        # Algebra (not recently studied) should get the recency boost
        assert alg.priority_score > calc.priority_score

    def test_activity_types_assigned(self):
        rec = self._make_recommender()
        results = rec.generate_recommendations(
            weak_topics=[
                WeakTopic("Hard Topic", 0.2, "Weak"),
                WeakTopic("Medium Topic", 0.55, "Needs Improvement"),
            ],
            quiz_performance={"Easy Topic": 0.9},
            syllabus_topics=["Hard Topic", "Medium Topic", "Easy Topic"],
        )
        activities = {r.topic: r.activity for r in results}
        assert activities["Hard Topic"] == ActivityType.STUDY.value
        assert activities["Medium Topic"] == ActivityType.PRACTICE.value
        assert activities["Easy Topic"] == ActivityType.FLASHCARDS.value

    def test_recommendations_sorted_by_priority_desc(self):
        rec = self._make_recommender()
        results = rec.generate_recommendations(
            weak_topics=[
                WeakTopic("A", 0.1, "Weak"),
                WeakTopic("B", 0.4, "Weak"),
            ],
            syllabus_topics=["A", "B", "C"],
        )
        scores = [r.priority_score for r in results]
        assert scores == sorted(scores, reverse=True)

    def test_estimated_minutes_within_bounds(self):
        rec = self._make_recommender()
        results = rec.generate_recommendations(
            syllabus_topics=["A", "B"],
            available_study_time=120,
        )
        for r in results:
            assert 15 <= r.estimated_minutes <= 90

    def test_to_dict_keys(self):
        rec = self._make_recommender()
        results = rec.generate_recommendations(
            syllabus_topics=["Math"],
        )
        d = results[0].to_dict()
        assert "topic" in d
        assert "activity" in d
        assert "priority_score" in d
        assert "reason" in d
        assert "estimated_minutes" in d
