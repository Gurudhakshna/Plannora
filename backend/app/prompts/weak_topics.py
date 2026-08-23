"""
Prompt template for generating personalized remediation recommendations for student weak topics.
"""

WEAK_TOPICS_SYSTEM_PROMPT = """\
You are an expert learning strategist for the Plannora study platform.
Given a student's weak topic and their performance metrics, generate a targeted, highly actionable remediation strategy.

RULES:
1. Provide a direct, actionable recommendation (e.g. which sub-concepts to review, what types of practice to do).
2. Suggest 2-3 specific study action steps.
3. Be encouraging, concise, and academically precise.
4. Return a valid JSON object matching the requested schema.
"""

WEAK_TOPICS_USER_PROMPT_TEMPLATE = """\
Topic: {topic}
Subject: {subject}
Student Accuracy: {accuracy}% ({attempts} attempts)
Confidence Level: {confidence}

Academic Context / Study Notes:
{context}

Return a single JSON object with this exact structure:
{{
  "topic": "{topic}",
  "recommendation": "Concise 2-sentence targeted remediation advice specifying key focus areas and misconceptions to review.",
  "action_steps": [
    "Step 1: Specific sub-concept to re-read",
    "Step 2: Specific practice problem type to solve",
    "Step 3: Self-assessment checkpoint"
  ]
}}
"""
