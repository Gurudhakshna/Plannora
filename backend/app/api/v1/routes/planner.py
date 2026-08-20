"""
POST /api/v1/planner/recommendations

Study plan recommendation generation.
"""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, HTTPException

from app.ai.recommendations.study_recommender import (
    StudyRecommender,
    TopicPriority,
    WeakTopic,
)
from app.api.v1.schemas import (
    RecommendationsRequest,
    RecommendationsResponse,
    RecommendationItem,
)

router = APIRouter()


@router.post("/recommendations", response_model=RecommendationsResponse)
async def get_recommendations(body: RecommendationsRequest):
    """Generate prioritised study recommendations."""
    try:
        recommender = StudyRecommender()

        exam_dt = None
        if body.exam_date:
            try:
                exam_dt = date.fromisoformat(body.exam_date)
            except ValueError:
                pass

        topic_priorities = [
            TopicPriority(
                topic=tp.topic,
                importance_score=tp.importance_score,
                recommended_priority=tp.recommended_priority,
            )
            for tp in body.topic_priorities
        ]

        weak_topics = [
            WeakTopic(
                topic=wt.topic,
                accuracy=wt.accuracy,
                mastery=wt.mastery,
            )
            for wt in body.weak_topics
        ]

        quiz_performance = {qp.topic: qp.accuracy for qp in body.quiz_performance}

        results = recommender.generate_recommendations(
            exam_date=exam_dt,
            topic_priorities=topic_priorities,
            weak_topics=weak_topics,
            quiz_performance=quiz_performance,
            available_study_time=body.available_study_time,
            syllabus_topics=body.syllabus_topics,
            recently_studied=set(body.recently_studied),
        )

        items = [
            RecommendationItem(**r.to_dict())
            for r in results
        ]
        return RecommendationsResponse(recommendations=items)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Recommendation error: {exc}")
