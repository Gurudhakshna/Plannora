"""
Study material analysis service.
Cleans input text, chunks large documents if necessary, and delegates structured analysis to Groq.
"""

from __future__ import annotations

import logging
from typing import Optional
from app.prompts.analysis import ANALYSIS_SYSTEM_PROMPT, ANALYSIS_USER_PROMPT_TEMPLATE
from app.schemas.ai import AnalysisResultData, AnalysisTaskModel
from app.services.groq_service import groq_service, GroqServiceError
from app.utils.chunking import chunk_text

logger = logging.getLogger("plannora.analysis_service")


class AnalysisService:
    """
    Orchestrates academic content analysis through Groq.
    """

    async def analyze_text(
        self,
        text: str,
        filename: Optional[str] = None,
        subject: Optional[str] = None
    ) -> AnalysisResultData:
        """
        Analyze study material text and return validated structured analysis.
        """
        clean_text = text.strip()
        if len(clean_text) < 20:
            raise GroqServiceError(
                "Study material contains insufficient text to analyze. Please provide at least 20 characters.",
                code="INSUFFICIENT_CONTENT"
            )

        # If the text is exceptionally large (> 12000 chars), take the most salient chunks
        chunks = chunk_text(clean_text, max_chunk_chars=7000, overlap_chars=300)
        
        # Build prompt context from primary chunk(s)
        if len(chunks) == 1:
            context_to_send = chunks[0]
        else:
            # Combine first chunk with excerpt of subsequent chunks to fit comfortably within context
            context_to_send = f"{chunks[0]}\n\n[... Additional Excerpt ...]\n\n{chunks[1][:3000]}"

        user_prompt = ANALYSIS_USER_PROMPT_TEMPLATE.format(material_text=context_to_send)

        result: AnalysisResultData = await groq_service.generate_json(
            system_prompt=ANALYSIS_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            response_schema=AnalysisResultData,
            temperature=0.1,
            max_tokens=3000,
        )

        # Fallback safeguard: if tasks were not generated, construct default concept-learning tasks
        if not result.tasks and result.concepts:
            result.tasks = [
                AnalysisTaskModel(
                    id=f"task_{idx + 1}",
                    title=f"Master {c.name}",
                    priority="High" if c.priority == "high" else "Medium",
                    estimatedMinutes=c.estimatedMinutes or 15,
                    conceptRef=c.name,
                    taskType="learn"
                )
                for idx, c in enumerate(result.concepts)
            ]

        return result


analysis_service = AnalysisService()
