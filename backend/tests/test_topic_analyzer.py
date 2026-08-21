"""
Unit tests for TopicAnalyzer (weak topic classification).

No external AI calls — purely deterministic.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.ai.recommendations.topic_analyzer import (
    TopicAnalyzer,
    TopicPerformance,
    MasteryLevel,
)


class TestTopicAnalyzer:
    """Tests for topic performance classification."""

    def test_weak_classification(self):
        """< 50% accuracy → Weak."""
        p = TopicPerformance(topic="Calculus", attempt_count=10, correct_count=3)
        assert p.mastery == MasteryLevel.WEAK
        assert p.accuracy_percent == 30.0

    def test_needs_improvement_classification(self):
        """50–70% → Needs Improvement."""
        p = TopicPerformance(topic="Algebra", attempt_count=10, correct_count=6)
        assert p.mastery == MasteryLevel.NEEDS_IMPROVEMENT

    def test_good_classification(self):
        """70–85% → Good."""
        p = TopicPerformance(topic="Geometry", attempt_count=10, correct_count=8)
        assert p.mastery == MasteryLevel.GOOD

    def test_strong_classification(self):
        """> 85% → Strong."""
        p = TopicPerformance(topic="Trigonometry", attempt_count=10, correct_count=9)
        assert p.mastery == MasteryLevel.STRONG

    def test_zero_attempts(self):
        """0 attempts → 0% accuracy → Weak."""
        p = TopicPerformance(topic="Stats", attempt_count=0, correct_count=0)
        assert p.accuracy == 0.0
        assert p.mastery == MasteryLevel.WEAK

    def test_perfect_score(self):
        """100% → Strong."""
        p = TopicPerformance(topic="Logic", attempt_count=5, correct_count=5)
        assert p.mastery == MasteryLevel.STRONG
        assert p.accuracy_percent == 100.0

    def test_get_weak_topics_filters_correctly(self):
        performances = [
            TopicPerformance("Calculus", 10, 3),    # 30% Weak
            TopicPerformance("Algebra", 10, 6),      # 60% Needs Improvement
            TopicPerformance("Geometry", 10, 8),     # 80% Good
            TopicPerformance("Trig", 10, 9),         # 90% Strong
        ]
        weak = TopicAnalyzer.get_weak_topics(performances)
        assert len(weak) == 2
        assert weak[0].topic == "Calculus"   # weakest first
        assert weak[1].topic == "Algebra"

    def test_classify_sorts_by_accuracy_asc(self):
        performances = [
            TopicPerformance("A", 10, 9),
            TopicPerformance("B", 10, 3),
            TopicPerformance("C", 10, 6),
        ]
        classified = TopicAnalyzer.classify(performances)
        assert classified[0].topic == "B"
        assert classified[-1].topic == "A"

    def test_to_dict(self):
        p = TopicPerformance("Math", 20, 15)
        d = p.to_dict()
        assert d["topic"] == "Math"
        assert d["accuracy"] == 75.0
        assert d["mastery"] == "Good"

    def test_boundary_50_percent(self):
        """Exactly 50% → Needs Improvement (not Weak)."""
        p = TopicPerformance("X", 10, 5)
        assert p.mastery == MasteryLevel.NEEDS_IMPROVEMENT

    def test_boundary_70_percent(self):
        """Exactly 70% → Good (not Needs Improvement)."""
        p = TopicPerformance("Y", 10, 7)
        assert p.mastery == MasteryLevel.GOOD

    def test_boundary_85_percent(self):
        """Exactly 85% → Strong (not Good)."""
        p = TopicPerformance("Z", 20, 17)
        assert p.mastery == MasteryLevel.STRONG
