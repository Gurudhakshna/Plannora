"""
AI-powered Concept Knowledge Graph and dependency mapping service.
"""

from __future__ import annotations

import logging
from typing import List, Optional
from pydantic import BaseModel
from app.prompts.concept_map import CONCEPT_MAP_SYSTEM_PROMPT, CONCEPT_MAP_USER_PROMPT_TEMPLATE
from app.schemas.ai import (
    ConceptMapEdgeModel,
    ConceptMapGenerateResponse,
    ConceptMapNodeModel,
)
from app.services.groq_service import groq_service

logger = logging.getLogger("plannora.concept_map_service")


class _RawConceptMapResponse(BaseModel):
    topic: str = "Concept Map"
    nodes: List[ConceptMapNodeModel]
    edges: List[ConceptMapEdgeModel]


class ConceptMapService:
    """
    Constructs concept dependency networks via Groq.
    """

    async def generate_concept_map(
        self,
        topic: str,
        context: Optional[str] = None,
    ) -> ConceptMapGenerateResponse:
        """
        Generate nodes and dependency relationships from material context.
        """
        context_str = context.strip() if context else f"Academic Topic: {topic}"

        user_prompt = CONCEPT_MAP_USER_PROMPT_TEMPLATE.format(
            topic=topic,
            context=context_str[:6000],
        )

        raw_map: _RawConceptMapResponse = await groq_service.generate_json(
            system_prompt=CONCEPT_MAP_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            response_schema=_RawConceptMapResponse,
            temperature=0.2,
            max_tokens=2500,
        )

        # Validate that edge sources and targets exist in nodes list
        node_ids = {n.id for n in raw_map.nodes}
        valid_edges = [
            e for e in raw_map.edges
            if e.source in node_ids and e.target in node_ids
        ]

        return ConceptMapGenerateResponse(
            success=True,
            topic=raw_map.topic or topic,
            nodes=raw_map.nodes,
            edges=valid_edges,
        )


concept_map_service = ConceptMapService()
