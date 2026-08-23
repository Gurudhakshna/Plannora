"""
Prompt template for AI-assisted study roadmap prioritization and topic breakdown.
"""

STUDY_PLAN_SYSTEM_PROMPT = """\
You are an expert curriculum planner for the Plannora AI study platform.
Analyze the student's study goal, syllabus/subjects, and context to generate prioritized topic recommendations and learning sequence.

RULES:
1. Break down the goal into a coherent sequence of study modules and topics.
2. Estimate realistic difficulty and study priority for each topic.
3. Highlight prerequisites between topics.
4. Return a valid JSON object matching the requested schema.
"""

STUDY_PLAN_USER_PROMPT_TEMPLATE = """\
Goal: {goal}
Subjects: {subjects}
Available Hours / Day: {available_hours}
Days per Week: {days_per_week}
Start Date: {start_date}
Target Exam Date: {target_date}

Academic Material Context (if provided):
{context}

Return a single JSON object with this exact structure:
{{
  "title": "Study Roadmap for {goal}",
  "overview": "Summary of the study trajectory and milestone objectives",
  "modules": [
    {{
      "module_name": "Module 1: Foundations",
      "subject": "Main Subject",
      "topics": [
        {{
          "name": "Topic Name",
          "priority": "high",
          "difficulty": "medium",
          "estimated_hours": 3.5,
          "prerequisites": [],
          "recommended_activity": "Study"
        }}
      ]
    }}
  ]
}}
"""
