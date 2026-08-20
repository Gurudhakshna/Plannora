"""
Document text chunker for academic content.

Splits raw text into overlapping chunks with metadata,
suitable for embedding and semantic retrieval.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Chunk:
    """A single chunk of document text with metadata."""

    text: str
    chunk_index: int
    page_number: Optional[int] = None
    metadata: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "chunk_index": self.chunk_index,
            "page_number": self.page_number,
            "metadata": self.metadata,
        }


class DocumentChunker:
    """
    Splits academic text into overlapping chunks.

    Parameters
    ----------
    chunk_size : int
        Target character count per chunk (default 1000).
    chunk_overlap : int
        Number of overlapping characters between consecutive chunks (default 200).
    """

    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
    ) -> None:
        if chunk_overlap >= chunk_size:
            raise ValueError("chunk_overlap must be smaller than chunk_size")
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def chunk_text(
        self,
        text: str,
        metadata: Optional[dict] = None,
    ) -> list[Chunk]:
        """
        Split *text* into chunks.

        If the text contains page markers in the form ``[PAGE <n>]``
        (e.g. produced by a PDF extractor), chunk boundaries respect page
        information and each chunk records its starting page number.

        Parameters
        ----------
        text : str
            Raw academic text (may contain ``[PAGE n]`` markers).
        metadata : dict, optional
            Extra metadata attached to every chunk.

        Returns
        -------
        list[Chunk]
            Ordered list of chunks.
        """
        if not text or not text.strip():
            return []

        metadata = metadata or {}

        # Detect page markers
        pages = self._split_into_pages(text)
        if pages:
            return self._chunk_with_pages(pages, metadata)
        return self._chunk_plain(text, metadata)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    _PAGE_MARKER_RE = re.compile(r"\[PAGE\s+(\d+)\]")

    def _split_into_pages(self, text: str) -> list[tuple[int, str]]:
        """Return list of ``(page_number, page_text)`` if page markers exist."""
        parts = self._PAGE_MARKER_RE.split(text)
        if len(parts) <= 1:
            return []

        pages: list[tuple[int, str]] = []
        i = 0
        # Text before the first marker (if any) has no page number
        if parts[0].strip():
            pages.append((1, parts[0].strip()))
            i = 1
        else:
            i = 1

        while i < len(parts) - 1:
            page_num = int(parts[i])
            page_text = parts[i + 1].strip()
            if page_text:
                pages.append((page_num, page_text))
            i += 2
        return pages

    def _chunk_plain(self, text: str, metadata: dict) -> list[Chunk]:
        """Chunk text without page information."""
        text = text.strip()
        chunks: list[Chunk] = []
        start = 0
        idx = 0
        while start < len(text):
            end = start + self.chunk_size
            chunk_text = text[start:end]

            # Try to break at sentence boundary
            chunk_text = self._trim_to_sentence(chunk_text, at_end=(end < len(text)))

            if chunk_text.strip():
                chunks.append(
                    Chunk(
                        text=chunk_text.strip(),
                        chunk_index=idx,
                        page_number=None,
                        metadata=dict(metadata),
                    )
                )
                idx += 1

            start += len(chunk_text) - self.chunk_overlap
            if start <= (end - self.chunk_size):
                # Prevent infinite loop when chunk_text is very short
                start = end
        return chunks

    def _chunk_with_pages(
        self, pages: list[tuple[int, str]], metadata: dict
    ) -> list[Chunk]:
        """Chunk across page-separated text, preserving page numbers."""
        chunks: list[Chunk] = []
        buffer = ""
        current_page: Optional[int] = None
        idx = 0

        for page_num, page_text in pages:
            if current_page is None:
                current_page = page_num
            buffer += (" " if buffer else "") + page_text

            while len(buffer) >= self.chunk_size:
                chunk_text = buffer[: self.chunk_size]
                chunk_text = self._trim_to_sentence(chunk_text, at_end=True)

                chunks.append(
                    Chunk(
                        text=chunk_text.strip(),
                        chunk_index=idx,
                        page_number=current_page,
                        metadata=dict(metadata),
                    )
                )
                idx += 1
                advance = max(len(chunk_text) - self.chunk_overlap, 1)
                buffer = buffer[advance:]
                # Update page tracking (approximate)

        # Flush remaining buffer
        if buffer.strip():
            chunks.append(
                Chunk(
                    text=buffer.strip(),
                    chunk_index=idx,
                    page_number=current_page,
                    metadata=dict(metadata),
                )
            )

        return chunks

    @staticmethod
    def _trim_to_sentence(text: str, at_end: bool = True) -> str:
        """Try to break *text* at the last sentence boundary."""
        if not at_end:
            return text
        # Find last sentence-ending punctuation
        for sep in (". ", ".\n", "? ", "?\n", "! ", "!\n"):
            pos = text.rfind(sep)
            if pos != -1 and pos > len(text) * 0.5:
                return text[: pos + 1]
        return text
