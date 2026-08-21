"""
Unit tests for QuestionPaperAnalyzer (deterministic topic analysis).

Tests the compute_topic_analysis method which requires no LLM.
All external AI calls are mocked.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.ai.question_paper.analyzer import (
    QuestionPaperAnalyzer,
    ExtractedQuestion,
    TopicAnalysisResult,
)


class TestQuestionPaperAnalysis:
    """Tests for the deterministic topic analysis logic."""

    def _make_analyzer(self) -> QuestionPaperAnalyzer:
        return QuestionPaperAnalyzer()

    def test_empty_questions_returns_empty(self):
        analyzer = self._make_analyzer()
        result = analyzer.compute_topic_analysis([])
        assert result == []

    def test_single_topic(self):
        questions = [
            ExtractedQuestion("Q1", "Calculus", marks=5),
            ExtractedQuestion("Q2", "Calculus", marks=10),
        ]
        analyzer = self._make_analyzer()
        analysis = analyzer.compute_topic_analysis(questions)
        assert len(analysis) == 1
        assert analysis[0].topic == "Calculus"
        assert analysis[0].frequency == 2
        assert analysis[0].total_marks == 15

    def test_multiple_topics_frequency(self):
        questions = [
            ExtractedQuestion("Q1", "Calculus", marks=5),
            ExtractedQuestion("Q2", "Calculus", marks=5),
            ExtractedQuestion("Q3", "Calculus", marks=5),
            ExtractedQuestion("Q4", "Algebra", marks=10),
        ]
        analyzer = self._make_analyzer()
        analysis = analyzer.compute_topic_analysis(questions)
        topic_map = {a.topic: a for a in analysis}
        assert topic_map["Calculus"].frequency == 3
        assert topic_map["Algebra"].frequency == 1

    def test_importance_score_range(self):
        questions = [
            ExtractedQuestion("Q1", "A", marks=5),
            ExtractedQuestion("Q2", "B", marks=5),
        ]
        analyzer = self._make_analyzer()
        analysis = analyzer.compute_topic_analysis(questions)
        for a in analysis:
            assert 0 <= a.importance_score <= 1

    def test_high_frequency_gets_high_priority(self):
        """Topic appearing in most questions should get high priority."""
        questions = [
            ExtractedQuestion(f"Q{i}", "Dominant", marks=10)
            for i in range(8)
        ] + [
            ExtractedQuestion("Q9", "Minor", marks=2),
        ]
        analyzer = self._make_analyzer()
        analysis = analyzer.compute_topic_analysis(questions)
        dominant = next(a for a in analysis if a.topic == "Dominant")
        assert dominant.recommended_priority == "high"

    def test_marks_distribution_affects_importance(self):
        questions = [
            ExtractedQuestion("Q1", "LowMarks", marks=1),
            ExtractedQuestion("Q2", "HighMarks", marks=50),
        ]
        analyzer = self._make_analyzer()
        analysis = analyzer.compute_topic_analysis(questions)
        topic_map = {a.topic: a for a in analysis}
        assert topic_map["HighMarks"].importance_score >= topic_map["LowMarks"].importance_score

    def test_no_marks_still_counts_frequency(self):
        questions = [
            ExtractedQuestion("Q1", "NoMarks"),
            ExtractedQuestion("Q2", "NoMarks"),
        ]
        analyzer = self._make_analyzer()
        analysis = analyzer.compute_topic_analysis(questions)
        assert analysis[0].frequency == 2
        assert analysis[0].total_marks == 0

    def test_to_dict(self):
        r = TopicAnalysisResult(
            topic="Math", frequency=5, total_marks=25,
            importance_score=0.456, recommended_priority="high",
        )
        d = r.to_dict()
        assert d["topic"] == "Math"
        assert d["importance_score"] == 0.456

    def test_extracted_question_to_dict(self):
        q = ExtractedQuestion("What is X?", "Topic", marks=5, difficulty="hard", year=2024)
        d = q.to_dict()
        assert d["question"] == "What is X?"
        assert d["year"] == 2024
