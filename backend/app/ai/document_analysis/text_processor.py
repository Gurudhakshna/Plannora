"""
Text pre-processing utilities for academic documents.

Cleans and normalises raw text before chunking or embedding.
"""

from __future__ import annotations

import re
import unicodedata


class TextProcessor:
    """Stateless text-cleaning pipeline for academic content."""

    @staticmethod
    def clean(text: str) -> str:
        """
        Apply the full cleaning pipeline.

        1. Normalise Unicode (NFC)
        2. Replace non-breaking / special whitespace
        3. Collapse runs of blank lines
        4. Strip leading/trailing whitespace per line
        """
        text = TextProcessor.normalise_unicode(text)
        text = TextProcessor.normalise_whitespace(text)
        text = TextProcessor.collapse_blank_lines(text)
        text = TextProcessor.strip_lines(text)
        return text.strip()

    # ------------------------------------------------------------------
    # Individual transforms
    # ------------------------------------------------------------------

    @staticmethod
    def normalise_unicode(text: str) -> str:
        return unicodedata.normalize("NFC", text)

    @staticmethod
    def normalise_whitespace(text: str) -> str:
        """Replace non-breaking spaces and tabs with plain spaces."""
        text = text.replace("\u00a0", " ")
        text = text.replace("\t", "    ")
        return text

    @staticmethod
    def collapse_blank_lines(text: str) -> str:
        """Collapse 3+ consecutive newlines into 2."""
        return re.sub(r"\n{3,}", "\n\n", text)

    @staticmethod
    def strip_lines(text: str) -> str:
        """Strip trailing whitespace on each line."""
        return "\n".join(line.rstrip() for line in text.split("\n"))

    @staticmethod
    def remove_headers_footers(text: str) -> str:
        """
        Remove common header/footer patterns often left by PDF
        extractors (page numbers, "Page X of Y", repeated titles).
        """
        # Remove standalone page numbers
        text = re.sub(r"(?m)^\s*\d{1,4}\s*$", "", text)
        # Remove "Page X of Y"
        text = re.sub(r"(?i)page\s+\d+\s+of\s+\d+", "", text)
        return text
