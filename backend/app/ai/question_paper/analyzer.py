"""
AI-assisted question paper analysis.

Analyses previous exam / question papers to extract:
  - individual questions with metadata
  - topic frequency
  - marks distribution
  - topic importance
  - recommended study priority

Terminology: "AI-assisted topic priority analysis"
(never claims exact exam prediction).
"""

from __future__ import annotations

import json
import os
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from typing import Any, Optional

from app.ai.embeddings.embedding_service import ConfigurationError
from app.ai.rag.rag_service import LLMProvider, OpenAILLMProvider


# ------------------------------------------------------------------
# Data classes
# ------------------------------------------------------------------

@dataclass
class ExtractedQuestion:
    question: str
    topic: str
    marks: Optional[int] = None
    difficulty: str = "medium"
    year: Optional[int] = None

    def to_dict(self) -> dict:
        return {
            "question": self.question,
            "topic": self.topic,
            "marks": self.marks,
            "difficulty": self.difficulty,
            "year": self.year,
        }


@dataclass
class TopicAnalysisResult:
    topic: str
    frequency: int = 0
    total_marks: int = 0
    importance_score: float = 0.0
    recommended_priority: str = "medium"

    def to_dict(self) -> dict:
        return {
            "topic": self.topic,
            "frequency": self.frequency,
            "total_marks": self.total_marks,
            "importance_score": round(self.importance_score, 3),
            "recommended_priority": self.recommended_priority,
        }


@dataclass
class PaperAnalysis:
    questions: list[ExtractedQuestion] = field(default_factory=list)
    topic_analysis: list[TopicAnalysisResult] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "questions": [q.to_dict() for q in self.questions],
            "topic_analysis": [t.to_dict() for t in self.topic_analysis],
        }


# ------------------------------------------------------------------
# System prompt for LLM extraction
# ------------------------------------------------------------------

_SYSTEM_PROMPT = """\
You are an academic question paper analyzer for the Plannora study platform.

Given the text of a previous exam question paper, extract every question.

Return a JSON array where each element has:
{
  "question": "the full question text",
  "topic": "the academic topic this question covers",
  "marks": <integer or null>,
  "difficulty": "easy|medium|hard",
  "year": <integer or null>
}

Rules:
1. Extract ALL questions from the paper.
2. Infer the topic from the question content.
3. Infer difficulty: easy = recall, medium = application, hard = analysis/synthesis.
4. Extract marks if indicated (e.g. "[5 marks]", "(3M)").
5. Extract year if apparent from the paper header.
6. Return ONLY the JSON array, no extra text.
"""


# ------------------------------------------------------------------
# Analyzer
# ------------------------------------------------------------------

class QuestionPaperAnalyzer:
    """
    AI-assisted question paper analysis.

    Combines LLM extraction (for structured question parsing) with
    deterministic analytics (frequency, marks distribution, priority).
    """

    def __init__(self, llm_provider: Optional[LLMProvider] = None) -> None:
        self._llm = llm_provider

    def _ensure_llm(self) -> LLMProvider:
        if self._llm is not None:
            return self._llm

        api_key = os.getenv("AI_API_KEY")
        if not api_key:
            raise ConfigurationError(
                "AI_API_KEY is required for question paper analysis. "
                "Set it in your .env file or environment."
            )
        model = os.getenv("LLM_MODEL", "gpt-4o-mini")
        base_url = os.getenv("AI_BASE_URL")
        self._llm = OpenAILLMProvider(
            api_key=api_key, model=model, base_url=base_url
        )
        return self._llm

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def analyze(self, paper_text: str) -> PaperAnalysis:
        """
        Analyse a question paper end-to-end.

        1. LLM extracts structured questions.
        2. Deterministic analysis computes topic stats.
        """
        questions = await self._extract_questions(paper_text)
        topic_analysis = self.compute_topic_analysis(questions)
        return PaperAnalysis(
            questions=questions,
            topic_analysis=topic_analysis,
        )

    def compute_topic_analysis(
        self, questions: list[ExtractedQuestion]
    ) -> list[TopicAnalysisResult]:
        """
        Deterministic topic analytics from extracted questions.

        This is independently testable without an LLM.
        """
        if not questions:
            return []

        freq: Counter[str] = Counter()
        marks_map: defaultdict[str, int] = defaultdict(int)

        for q in questions:
            freq[q.topic] += 1
            if q.marks is not None:
                marks_map[q.topic] += q.marks

        total_questions = len(questions)
        total_marks = sum(marks_map.values()) or 1  # avoid div-by-zero

        results: list[TopicAnalysisResult] = []
        for topic, count in freq.most_common():
            freq_score = count / total_questions
            marks_score = marks_map[topic] / total_marks if marks_map[topic] else 0
            importance = 0.6 * freq_score + 0.4 * marks_score

            if importance >= 0.25:
                priority = "high"
            elif importance >= 0.10:
                priority = "medium"
            else:
                priority = "low"

            results.append(
                TopicAnalysisResult(
                    topic=topic,
                    frequency=count,
                    total_marks=marks_map[topic],
                    importance_score=importance,
                    recommended_priority=priority,
                )
            )

        return results

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    async def _extract_questions(
        self, paper_text: str
    ) -> list[ExtractedQuestion]:
        llm = self._ensure_llm()
        raw = await llm.generate(
            system_prompt=_SYSTEM_PROMPT,
            user_prompt=f"Question Paper:\n\n{paper_text}",
            temperature=0.2,
        )
        return self._parse_questions(raw)

    @staticmethod
    def _parse_questions(raw: str) -> list[ExtractedQuestion]:
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[-1]
        if raw.endswith("```"):
            raw = raw.rsplit("```", 1)[0]
        raw = raw.strip()

        try:
            items = json.loads(raw)
            if not isinstance(items, list):
                return []
        except json.JSONDecodeError:
            return []

        results: list[ExtractedQuestion] = []
        for item in items:
            if not isinstance(item, dict):
                continue
            results.append(
                ExtractedQuestion(
                    question=item.get("question", ""),
                    topic=item.get("topic", "Unknown"),
                    marks=item.get("marks"),
                    difficulty=item.get("difficulty", "medium"),
                    year=item.get("year"),
                )
            )
        return results
