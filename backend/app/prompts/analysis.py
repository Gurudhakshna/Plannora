"""
Prompt template for study material analysis.
Grounded in supplied academic material; extracts structured concepts, definitions, formulas, order, and tasks.
"""

ANALYSIS_SYSTEM_PROMPT = """\
You are an expert academic tutor for the Plannora study platform.
Analyze the supplied study material strictly based on the text provided.

CRITICAL INSTRUCTIONS:
1. Ground every detected concept, definition, formula, example, and explanation in the provided text.
2. Do not hallucinate or invent outside facts.
3. If information is not in the material, do not pretend it is.
4. Concept names MUST be concise academic noun phrases (2-6 words, e.g. "Newton's Second Law"). Never use full sentences as concept names.
5. Material title must be the primary academic topic derived from the text.
6. Return a valid JSON object with the exact schema requested.
"""

ANALYSIS_USER_PROMPT_TEMPLATE = """\
Extract structured learning concepts, definitions, formulas, study roadmap, and tasks from this academic material:

{material_text}

Return a single JSON object with this exact structure:
{{
  "materialTitle": "Exact academic title from material",
  "executiveSummary": "Concise 2-4 sentence summary of core ideas taught in this material",
  "detectedTopics": ["Topic 1", "Topic 2"],
  "concepts": [
    {{
      "id": "concept_1",
      "name": "Concise Concept Name",
      "priority": "high",
      "category": "law",
      "estimatedMinutes": 15,
      "dependencies": [],
      "simpleExplanation": "Clear 1-2 sentence plain-language explanation",
      "detailedExplanation": "In-depth breakdown explaining the mechanism or theory",
      "example": "Worked or practical example from the text",
      "commonMistake": "Common student error or misconception",
      "keyTakeaway": "Essential takeaway point",
      "analogy": "Helpful intuitive analogy",
      "miniQuestion": "A quick self-check question",
      "miniQuestionAnswer": "The exact correct answer",
      "status": "not-started"
    }}
  ],
  "definitions": [
    {{
      "term": "Term",
      "definition": "Exact definition from the material"
    }}
  ],
  "formulas": [
    {{
      "name": "Formula Name",
      "formula": "Equation (e.g. F = m * a)",
      "when": "When to apply it"
    }}
  ],
  "stepByStepExplanations": [
    {{
      "topic": "Concept Name",
      "steps": ["Step 1 explanation", "Step 2 explanation"]
    }}
  ],
  "examples": [
    {{
      "title": "Example Title",
      "detail": "Worked application"
    }}
  ],
  "commonMistakes": ["Mistake 1", "Mistake 2"],
  "memoryTricks": ["Mnemonic or memory aid"],
  "examIntelligence": {{
    "mustKnow": ["Key concept 1", "Key concept 2"],
    "highPriority": ["Exam focus area"],
    "likelyQuestions": [
      {{
        "question": "Sample exam question testing this material",
        "type": "theory",
        "topic": "Related concept"
      }}
    ]
  }},
  "studyOrder": [
    {{
      "step": 1,
      "topic": "Concept Name",
      "reason": "Why study this first"
    }}
  ],
  "estimatedStudyDuration": 60,
  "tasks": [
    {{
      "id": "task_1",
      "title": "Master Concept Name",
      "priority": "High",
      "estimatedMinutes": 20,
      "conceptRef": "Concept Name",
      "taskType": "learn"
    }}
  ]
}}
"""
