"""
Content analyzer service — sends study material text to Groq
and returns structured analysis grounded strictly in the provided content.
Includes JSON mode and automatic JSON repair for truncated outputs.
"""

from __future__ import annotations

import json
import os
import re
from typing import Any, Optional

from openai import OpenAI  # type: ignore[import-untyped]
from dotenv import load_dotenv

load_dotenv()

_SYSTEM_PROMPT = """\
You are an expert university study tutor.

Analyze the supplied study material itself.

Do not invent concepts.
Do not create generic study advice.
Do not generate placeholders.
Do not use the filename as a source of knowledge.
Every detected concept, definition, formula, example and explanation must be grounded in the supplied material.

Extract the actual topics and teach them to the student.
If information is not present in the material, do not claim that it is.

Return a SINGLE JSON object with this exact structure:

{
  "materialTitle": "Exact academic subject title from material (e.g., Newton's Laws of Motion)",
  "executiveSummary": "Detailed 2-4 sentence summary of the core principles taught in the material",
  "detectedTopics": ["Topic 1", "Topic 2", ...],
  "concepts": [
    {
      "name": "Concise concept name (2-5 words, e.g., Newton's First Law)",
      "priority": "high|medium|low",
      "category": "law|definition|formula|concept|algorithm|example",
      "estimatedMinutes": 10,
      "dependencies": ["Prerequisite concept name if any"],
      "simpleExplanation": "Plain-language 1-2 sentence explanation derived from the text",
      "detailedExplanation": "Thorough breakdown explaining the mechanism/theory from the text",
      "example": "Concrete example or numerical application from the text",
      "commonMistake": "Common misconception or student error related to this concept",
      "keyTakeaway": "Essential point to remember",
      "analogy": "Real-world analogy illustrating the principle",
      "miniQuestion": "A short self-check question based on this concept",
      "miniQuestionAnswer": "The precise answer"
    }
  ],
  "definitions": [
    {"term": "Term Name", "definition": "Exact definition from the material"}
  ],
  "formulas": [
    {"name": "Formula Name", "formula": "Mathematical equation (e.g. F = ma)", "when": "When to apply it"}
  ],
  "stepByStepExplanations": [
    {
      "topic": "Concept Name",
      "steps": ["Step 1 explanation", "Step 2 explanation", "Step 3 explanation"]
    }
  ],
  "examples": [
    {"title": "Example Title", "detail": "Worked example from the text"}
  ],
  "commonMistakes": ["Misconception 1", "Misconception 2"],
  "memoryTricks": ["Mnemonic or memory aid"],
  "examIntelligence": {
    "mustKnow": ["Must know concept 1", "Must know concept 2"],
    "highPriority": ["High priority exam area"],
    "likelyQuestions": [
      {
        "question": "Sample exam question testing this material",
        "type": "theory|programming|application",
        "topic": "Related concept name"
      }
    ]
  },
  "studyOrder": [
    {
      "step": 1,
      "topic": "Concept Name",
      "reason": "Why this concept should be studied first (e.g., Inertia is prerequisite for F=ma)"
    }
  ],
  "estimatedStudyDuration": 60
}

Rules:
1. Limit to 6-8 key concepts so response fits cleanly in JSON output.
2. Concept names MUST be short academic noun phrases (2-6 words max, e.g. "Newton's Second Law", "Law of Inertia"). Never use full sentences as concept names.
3. Material title MUST be the main academic topic derived from text. Never use filenames.
4. Return ONLY valid JSON object.
"""


def analyze_content(text: str, filename: Optional[str] = None) -> dict[str, Any]:
    """
    Send study material text to Groq and return structured analysis.
    Throws RuntimeError if API key missing or AI call fails.
    """
    api_key = os.getenv("AI_API_KEY")
    if not api_key:
        raise RuntimeError("Groq API key (AI_API_KEY) is missing in backend configuration.")

    base_url = os.getenv("AI_BASE_URL")
    model = os.getenv("LLM_MODEL", "openai/gpt-oss-120b")

    client = OpenAI(api_key=api_key, base_url=base_url)

    user_prompt = f"Study Material Content:\n\n{text[:8000]}"

    try:
        # Request JSON mode explicitly with max_tokens within TPM limits (<= 2500)
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=2500,
        )
        raw = response.choices[0].message.content or ""
        return _parse_json(raw)
    except Exception as exc:
        raise RuntimeError(f"AI analysis failed: {exc}")


def _parse_json(raw: str) -> dict[str, Any]:
    """Clean and repair JSON output from Groq."""
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1]
    if raw.endswith("```"):
        raw = raw.rsplit("```", 1)[0]
    raw = raw.strip()
    if raw.startswith("json"):
        raw = raw[4:].strip()

    # Try standard json parse
    try:
        result = json.loads(raw)
        if isinstance(result, dict) and "concepts" in result and len(result["concepts"]) > 0:
            return result
    except Exception:
        pass

    # Clean control characters and trailing commas
    cleaned = re.sub(r'[\x00-\x1f\x7f-\x9f]', ' ', raw)
    cleaned = re.sub(r',\s*([\}\]])', r'\1', cleaned)

    try:
        result = json.loads(cleaned)
        if isinstance(result, dict) and "concepts" in result and len(result["concepts"]) > 0:
            return result
    except Exception:
        pass

    # Repair unclosed quotes and brackets if truncated at max tokens
    repaired = cleaned
    quotes = len(re.findall(r'(?<!\\)"', repaired))
    if quotes % 2 != 0:
        repaired += '"'

    open_b = repaired.count('[') - repaired.count(']')
    open_c = repaired.count('{') - repaired.count('}')

    if open_b > 0:
        repaired += ']' * open_b
    if open_c > 0:
        repaired += '}' * open_c

    repaired = re.sub(r',\s*([\}\]])', r'\1', repaired)

    try:
        result = json.loads(repaired)
        if isinstance(result, dict) and "concepts" in result and len(result["concepts"]) > 0:
            return result
    except json.JSONDecodeError as err:
        raise RuntimeError(f"AI returned invalid JSON: {err}")

    raise RuntimeError("AI response did not contain structured concepts.")
