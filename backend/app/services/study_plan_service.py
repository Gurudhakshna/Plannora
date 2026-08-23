"""
AI Study Plan Generation Service.
Combines Groq prioritization with deterministic calendar allocation in Python.
"""

from __future__ import annotations

import datetime
import logging
import uuid
from typing import List, Optional
from pydantic import BaseModel
from app.prompts.study_plan import STUDY_PLAN_SYSTEM_PROMPT, STUDY_PLAN_USER_PROMPT_TEMPLATE
from app.schemas.ai import (
    StudyPlanDayModel,
    StudyPlanDaySessionModel,
    StudyPlanGenerateRequest,
    StudyPlanGenerateResponse,
)
from app.services.groq_service import groq_service

logger = logging.getLogger("plannora.study_plan_service")


class _TopicBreakdown(BaseModel):
    name: str
    priority: str = "medium"
    difficulty: str = "medium"
    estimated_hours: float = 2.0
    recommended_activity: str = "Study"


class _ModuleBreakdown(BaseModel):
    module_name: str
    subject: str
    topics: List[_TopicBreakdown] = []


class _RawStudyPlanResponse(BaseModel):
    title: str
    overview: str
    modules: List[_ModuleBreakdown] = []


class StudyPlanService:
    """
    Orchestrates study plan generation and deterministic calendar assignment.
    """

    async def generate_plan(self, req: StudyPlanGenerateRequest) -> StudyPlanGenerateResponse:
        """
        Generate a multi-day structured study plan.
        """
        start_dt = datetime.date.today()
        if req.start_date:
            try:
                start_dt = datetime.date.fromisoformat(req.start_date)
            except ValueError:
                pass

        target_dt = start_dt + datetime.timedelta(days=14)
        if req.target_date:
            try:
                parsed_target = datetime.date.fromisoformat(req.target_date)
                if parsed_target > start_dt:
                    target_dt = parsed_target
            except ValueError:
                pass

        user_prompt = STUDY_PLAN_USER_PROMPT_TEMPLATE.format(
            goal=req.goal,
            subjects=", ".join(req.subjects),
            available_hours=req.available_hours_per_day,
            days_per_week=req.days_per_week,
            start_date=start_dt.isoformat(),
            target_date=target_dt.isoformat(),
            context=(req.context or "")[:4000],
        )

        raw_plan: _RawStudyPlanResponse = await groq_service.generate_json(
            system_prompt=STUDY_PLAN_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            response_schema=_RawStudyPlanResponse,
            temperature=0.2,
            max_tokens=3000,
        )

        # Collect all prioritized topics from modules
        flattened_topics: List[_TopicBreakdown] = []
        for mod in raw_plan.modules:
            for t in mod.topics:
                flattened_topics.append(t)

        if not flattened_topics:
            for s in req.subjects:
                flattened_topics.append(
                    _TopicBreakdown(
                        name=f"{s} Core Concepts",
                        priority="high",
                        difficulty="medium",
                        estimated_hours=2.0,
                        recommended_activity="Study"
                    )
                )

        # Deterministically schedule topics across days
        days: List[StudyPlanDayModel] = []
        current_date = start_dt
        topic_idx = 0
        total_days_span = min(30, max(3, (target_dt - start_dt).days + 1))
        daily_minutes_budget = int(req.available_hours_per_day * 60)
        total_hours = 0.0

        for day_num in range(total_days_span):
            # Respect days_per_week by skipping weekends if days_per_week <= 5
            weekday = current_date.weekday()  # 0 is Monday, 6 is Sunday
            if req.days_per_week <= 5 and weekday in (5, 6):
                current_date += datetime.timedelta(days=1)
                continue

            label = (
                "Today" if current_date == datetime.date.today()
                else "Tomorrow" if current_date == datetime.date.today() + datetime.timedelta(days=1)
                else current_date.strftime("%A, %b %d")
            )

            day_sessions: List[StudyPlanDaySessionModel] = []
            minutes_left = daily_minutes_budget

            # Allocate 1-3 sessions per day
            while minutes_left >= 30 and topic_idx < len(flattened_topics):
                topic = flattened_topics[topic_idx]
                session_duration = min(minutes_left, max(30, int(topic.estimated_hours * 30)))
                minutes_left -= session_duration
                total_hours += session_duration / 60.0

                day_sessions.append(
                    StudyPlanDaySessionModel(
                        topic=topic.name,
                        activity=topic.recommended_activity or "Study",
                        duration_minutes=session_duration,
                        notes=f"Priority: {topic.priority.capitalize()} • Difficulty: {topic.difficulty.capitalize()}"
                    )
                )
                topic_idx += 1

            if not day_sessions and topic_idx >= len(flattened_topics):
                # Review session
                day_sessions.append(
                    StudyPlanDaySessionModel(
                        topic="Comprehensive Revision & Practice",
                        activity="Revision",
                        duration_minutes=min(60, daily_minutes_budget),
                        notes="Active recall of key formulas and concepts"
                    )
                )
                total_hours += day_sessions[-1].duration_minutes / 60.0

            days.append(
                StudyPlanDayModel(
                    date=current_date.isoformat(),
                    label=label,
                    sessions=day_sessions
                )
            )

            current_date += datetime.timedelta(days=1)
            if len(days) >= 14:  # Schedule maximum 2 weeks initial view
                break

        plan_id = f"plan_{uuid.uuid4().hex[:8]}"

        return StudyPlanGenerateResponse(
            success=True,
            plan_id=plan_id,
            title=raw_plan.title or f"Study Plan for {req.goal}",
            overview=raw_plan.overview or "Structured learning roadmap powered by Plannora AI.",
            total_study_hours=round(total_hours, 1),
            days=days
        )


study_plan_service = StudyPlanService()
