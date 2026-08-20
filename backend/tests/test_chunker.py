"""
Unit tests for DocumentChunker.

No external AI calls — purely deterministic.
"""

import pytest
import sys
import os

# Ensure backend/ is on sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.ai.document_analysis.chunker import DocumentChunker, Chunk


class TestDocumentChunker:
    """Tests for the DocumentChunker class."""

    def test_empty_text_returns_no_chunks(self):
        chunker = DocumentChunker()
        assert chunker.chunk_text("") == []
        assert chunker.chunk_text("   ") == []

    def test_short_text_single_chunk(self):
        chunker = DocumentChunker(chunk_size=500, chunk_overlap=50)
        text = "This is a short academic text."
        chunks = chunker.chunk_text(text)
        assert len(chunks) == 1
        assert chunks[0].text == text
        assert chunks[0].chunk_index == 0

    def test_chunk_indices_sequential(self):
        chunker = DocumentChunker(chunk_size=100, chunk_overlap=20)
        text = "A" * 500
        chunks = chunker.chunk_text(text)
        for i, chunk in enumerate(chunks):
            assert chunk.chunk_index == i

    def test_overlap_present(self):
        """Consecutive chunks should share overlapping content."""
        chunker = DocumentChunker(chunk_size=100, chunk_overlap=30)
        text = "word " * 200  # ~1000 chars
        chunks = chunker.chunk_text(text)
        assert len(chunks) > 1
        # Check that the last part of chunk i appears in chunk i+1
        for i in range(len(chunks) - 1):
            tail = chunks[i].text[-20:]
            assert tail in chunks[i + 1].text or chunks[i + 1].text.startswith(tail[:10])

    def test_page_markers_detected(self):
        text = "[PAGE 1] Introduction to calculus. [PAGE 2] Derivatives and limits."
        chunker = DocumentChunker(chunk_size=500, chunk_overlap=50)
        chunks = chunker.chunk_text(text)
        assert len(chunks) >= 1
        assert chunks[0].page_number is not None

    def test_metadata_propagated(self):
        chunker = DocumentChunker(chunk_size=500, chunk_overlap=50)
        meta = {"document_id": "doc-123", "subject": "Math"}
        chunks = chunker.chunk_text("Some academic text here.", metadata=meta)
        assert len(chunks) == 1
        assert chunks[0].metadata["document_id"] == "doc-123"
        assert chunks[0].metadata["subject"] == "Math"

    def test_chunk_to_dict(self):
        chunk = Chunk(text="Hello", chunk_index=0, page_number=3, metadata={"k": "v"})
        d = chunk.to_dict()
        assert d["text"] == "Hello"
        assert d["chunk_index"] == 0
        assert d["page_number"] == 3
        assert d["metadata"]["k"] == "v"

    def test_overlap_greater_than_size_raises(self):
        with pytest.raises(ValueError):
            DocumentChunker(chunk_size=100, chunk_overlap=100)

    def test_large_text_produces_multiple_chunks(self):
        chunker = DocumentChunker(chunk_size=200, chunk_overlap=50)
        text = "This is a sentence. " * 100  # ~2000 chars
        chunks = chunker.chunk_text(text)
        assert len(chunks) > 5
