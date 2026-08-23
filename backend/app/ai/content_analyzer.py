"""
Content analyzer service adapter for backward compatibility.
Delegates all content analysis to the central AnalysisService powered by Groq.
"""

from __future__ import annotations

import asyncio
from typing import Any, Optional
from app.services.analysis_service import analysis_service


def analyze_content(text: str, filename: Optional[str] = None) -> dict[str, Any]:
    """
    Synchronous adapter delegating to analysis_service.
    """
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    if loop.is_running():
        # In case it's called inside an active event loop
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as pool:
            future = pool.submit(asyncio.run, analysis_service.analyze_text(text=text, filename=filename))
            result = future.result()
    else:
        result = loop.run_until_complete(analysis_service.analyze_text(text=text, filename=filename))

    return result.model_dump()
