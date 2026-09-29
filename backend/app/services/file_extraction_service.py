"""Safe, in-memory extraction for PDFs and handwritten-note images."""

from __future__ import annotations

import base64
import io
from typing import Literal

import fitz
from fastapi import HTTPException, status
from openai import (
    APIConnectionError,
    AuthenticationError,
    AsyncOpenAI,
    BadRequestError,
    RateLimitError,
)
from pypdf import PdfReader

from app.core.config import settings

MAX_UPLOAD_BYTES = 20 * 1024 * 1024
MAX_OCR_PAGES = 10
MIN_USABLE_TEXT = 30
SUPPORTED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


class FileExtractionService:
    """Extract embedded PDF text, with OpenAI vision as the OCR fallback."""

    async def extract(self, content: bytes, filename: str, content_type: str | None) -> tuple[str, str, int]:
        if not content:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The uploaded file is empty.")
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Files must be 20 MB or smaller.")

        normalized_type = (content_type or "").split(";", 1)[0].lower()
        is_pdf = normalized_type == "application/pdf" or filename.lower().endswith(".pdf")
        is_image = normalized_type in SUPPORTED_IMAGE_TYPES or filename.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
        if not is_pdf and not is_image:
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Upload a PDF, PNG, JPG, or WEBP note image.")

        if is_pdf:
            text, page_count = self._extract_pdf_text(content)
            if page_count < 1:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="The PDF has no pages to read.")
            if len(text) >= MIN_USABLE_TEXT:
                return text, "pdf_text", page_count
            images = self._render_pdf_pages(content, page_count)
            return await self._ocr_images(images), "openai_vision_ocr", page_count

        mime_type = normalized_type if normalized_type in SUPPORTED_IMAGE_TYPES else "image/jpeg"
        return await self._ocr_images([(content, mime_type)]), "openai_vision_ocr", 1

    @staticmethod
    def _extract_pdf_text(content: bytes) -> tuple[str, int]:
        try:
            reader = PdfReader(io.BytesIO(content))
            text = "\n\n".join((page.extract_text() or "") for page in reader.pages).strip()
            return text, len(reader.pages)
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The PDF could not be read. It may be encrypted or corrupted.") from exc

    @staticmethod
    def _render_pdf_pages(content: bytes, page_count: int) -> list[tuple[bytes, Literal["image/png"]]]:
        if page_count > MAX_OCR_PAGES:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Scanned PDFs are limited to {MAX_OCR_PAGES} pages.")
        try:
            document = fitz.open(stream=content, filetype="pdf")
            images: list[tuple[bytes, Literal["image/png"]]] = []
            for page in document:
                pixmap = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
                images.append((pixmap.tobytes("png"), "image/png"))
            document.close()
            return images
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The scanned PDF could not be rendered for OCR.") from exc

    async def _ocr_images(self, images: list[tuple[bytes, str]]) -> str:
        if not settings.is_openai_ocr_configured:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="OCR is not configured. Set OPENAI_API_KEY to read scanned PDFs or note photos.")

        image_parts = [
            {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{base64.b64encode(image).decode('ascii')}", "detail": "high"}}
            for image, mime in images
        ]
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        try:
            response = await client.chat.completions.create(
                model=settings.OPENAI_OCR_MODEL,
                temperature=0,
                max_tokens=6000,
                messages=[{
                    "role": "user",
                    "content": [{"type": "text", "text": "Transcribe these study notes exactly. Preserve headings, lists, formulas, and readable handwritten text. Return only the transcription; do not summarize or add commentary."}, *image_parts],
                }],
            )
        except AuthenticationError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="OpenAI OCR authentication failed. Check OPENAI_API_KEY in the backend environment.",
            ) from exc
        except RateLimitError as exc:
            message = str(exc).lower()
            if "credit_balance_exhausted" in message or "no credits remaining" in message:
                detail = "OpenAI OCR credits are exhausted. Add API credits to the selected OpenAI project and try again."
            else:
                detail = "OpenAI OCR is rate limited. Please wait a moment and try again."
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=detail) from exc
        except BadRequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="OpenAI OCR rejected this file. Confirm it is a clear PDF or image and try again.",
            ) from exc
        except APIConnectionError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to reach the OpenAI OCR service. Check your internet connection and try again.",
            ) from exc
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The OCR service returned an unexpected error. Please try again later.",
            ) from exc

        text = (response.choices[0].message.content or "").strip()
        if len(text) < MIN_USABLE_TEXT:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No readable study text was found. Please upload a clearer scan or photo.")
        return text


file_extraction_service = FileExtractionService()
