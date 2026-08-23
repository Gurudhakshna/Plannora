"""
Text chunking utility for preparing large study materials for Groq analysis.
Splits text intelligently along paragraphs/sentences with overlap to prevent context truncation.
"""

from __future__ import annotations

import re
from typing import List


def chunk_text(
    text: str,
    max_chunk_chars: int = 6000,
    overlap_chars: int = 400
) -> List[str]:
    """
    Split long text into manageable chunks respecting paragraph and sentence boundaries.
    """
    text = text.strip()
    if not text or len(text) <= max_chunk_chars:
        return [text] if text else []

    # Split by double newlines (paragraphs) first
    paragraphs = re.split(r"\n\s*\n", text)
    chunks: List[str] = []
    current_chunk: List[str] = []
    current_length = 0

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        # If a single paragraph is longer than max_chunk_chars, split by sentence
        if len(para) > max_chunk_chars:
            sentences = re.split(r"(?<=[.!?])\s+", para)
            for sent in sentences:
                sent = sent.strip()
                if not sent:
                    continue
                if current_length + len(sent) > max_chunk_chars and current_chunk:
                    chunk_str = "\n\n".join(current_chunk)
                    chunks.append(chunk_str)
                    # Keep overlap from the end
                    overlap_str = chunk_str[-overlap_chars:] if len(chunk_str) > overlap_chars else ""
                    current_chunk = [overlap_str, sent] if overlap_str else [sent]
                    current_length = len(overlap_str) + len(sent)
                else:
                    current_chunk.append(sent)
                    current_length += len(sent)
        else:
            if current_length + len(para) > max_chunk_chars and current_chunk:
                chunk_str = "\n\n".join(current_chunk)
                chunks.append(chunk_str)
                overlap_str = chunk_str[-overlap_chars:] if len(chunk_str) > overlap_chars else ""
                current_chunk = [overlap_str, para] if overlap_str else [para]
                current_length = len(overlap_str) + len(para)
            else:
                current_chunk.append(para)
                current_length += len(para)

    if current_chunk:
        chunks.append("\n\n".join(current_chunk))

    return chunks
