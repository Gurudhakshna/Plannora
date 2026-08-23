"""
Centralized Groq AI Service.
Handles dynamic AsyncGroq client instantiation, JSON mode, repair, schema validation, retry logic, and error sanitization.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Optional, Type, TypeVar
from pydantic import BaseModel, ValidationError

try:
    from groq import AsyncGroq, APIError, RateLimitError, APITimeoutError, AuthenticationError
except ImportError:
    AsyncGroq = None  # type: ignore[assignment, misc]
    APIError = Exception  # type: ignore[assignment, misc]
    RateLimitError = Exception  # type: ignore[assignment, misc]
    APITimeoutError = Exception  # type: ignore[assignment, misc]
    AuthenticationError = Exception  # type: ignore[assignment, misc]

from app.core.config import settings
from app.utils.json_repair import extract_and_repair_json

logger = logging.getLogger("plannora.groq_service")
T = TypeVar("T", bound=BaseModel)


class GroqServiceError(Exception):
    """Sanitized, user-safe exception for AI operations."""
    def __init__(self, message: str, code: str = "AI_SERVICE_ERROR"):
        super().__init__(message)
        self.message = message
        self.code = code


class GroqService:
    """
    Centralized singleton service for all Groq LLM operations.
    """

    def __init__(self) -> None:
        self._cached_client: Optional[Any] = None
        self._cached_api_key: Optional[str] = None

    def _get_client(self) -> Any:
        api_key = settings.effective_groq_api_key
        if not api_key:
            self._cached_client = None
            self._cached_api_key = None
            raise GroqServiceError(
                "Groq API key is not configured. Please set GROQ_API_KEY in the backend .env file.",
                code="AI_NOT_CONFIGURED"
            )

        if AsyncGroq is None:
            raise GroqServiceError(
                "The 'groq' Python package is not installed. Please install it using pip install groq.",
                code="DEPENDENCY_MISSING"
            )

        # Reuse existing client if key hasn't changed
        if self._cached_client is not None and self._cached_api_key == api_key:
            return self._cached_client

        self._cached_api_key = api_key
        self._cached_client = AsyncGroq(
            api_key=api_key,
            timeout=settings.GROQ_TIMEOUT
        )
        return self._cached_client

    async def test_connection(self) -> dict[str, Any]:
        """
        Safe connectivity test asking Groq a minimal query.
        Never returns or logs API key.
        """
        try:
            client = self._get_client()
            response = await client.chat.completions.create(
                model=settings.effective_groq_model,
                messages=[
                    {"role": "system", "content": "Respond with 'OK'."},
                    {"role": "user", "content": "Ping"},
                ],
                max_tokens=10,
                temperature=0.0,
            )
            return {
                "success": True,
                "provider": "groq",
                "model": settings.effective_groq_model,
                "message": "Groq connection successful",
            }
        except AuthenticationError:
            return {
                "success": False,
                "provider": "groq",
                "error": "Groq authentication failed. Please verify the API key.",
            }
        except GroqServiceError as exc:
            return {
                "success": False,
                "provider": "groq",
                "error": exc.message,
            }
        except Exception as exc:
            logger.error(f"Groq connection test failed: {exc}")
            return {
                "success": False,
                "provider": "groq",
                "error": "Unable to connect to Groq AI service.",
            }

    async def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        model: Optional[str] = None,
    ) -> str:
        """
        Generate plain text using Groq with exponential backoff on transient errors.
        """
        client = self._get_client()
        target_model = model or settings.effective_groq_model

        for attempt in range(2):
            try:
                response = await client.chat.completions.create(
                    model=target_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                return response.choices[0].message.content or ""
            except AuthenticationError:
                raise GroqServiceError(
                    "Groq authentication failed. Please check your GROQ_API_KEY.",
                    code="AI_AUTH_FAILED"
                )
            except RateLimitError:
                if attempt == 0:
                    logger.warning("Groq rate limit encountered. Retrying in 2 seconds...")
                    await asyncio.sleep(2.0)
                    continue
                raise GroqServiceError(
                    "Plannora AI is experiencing high demand. Please try again in a few moments.",
                    code="AI_RATE_LIMITED"
                )
            except APITimeoutError:
                if attempt == 0:
                    logger.warning("Groq timeout encountered. Retrying...")
                    await asyncio.sleep(1.0)
                    continue
                raise GroqServiceError(
                    "The AI request timed out. Please try again with a shorter document or topic.",
                    code="AI_TIMEOUT"
                )
            except APIError as exc:
                logger.error(f"Groq API error: {exc}")
                raise GroqServiceError(
                    "AI service encountered an issue. Please try again.",
                    code="AI_SERVICE_UNAVAILABLE"
                )
            except GroqServiceError:
                raise
            except Exception as exc:
                logger.error(f"Unexpected Groq client error: {exc}")
                raise GroqServiceError(
                    "Failed to generate AI response. Please verify backend configuration.",
                    code="INTERNAL_ERROR"
                )

        raise GroqServiceError("AI generation failed after retries.", code="AI_RETRIES_EXHAUSTED")

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: Type[T],
        temperature: float = 0.1,
        max_tokens: int = 3000,
        model: Optional[str] = None,
    ) -> T:
        """
        Generate structured JSON and validate against the supplied Pydantic schema.
        Performs automated JSON extraction/repair and single retry with correction on validation error.
        """
        client = self._get_client()
        target_model = model or settings.effective_groq_model

        last_error = None
        current_user_prompt = user_prompt

        for attempt in range(2):
            try:
                response = await client.chat.completions.create(
                    model=target_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": current_user_prompt},
                    ],
                    response_format={"type": "json_object"},
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                raw_text = response.choices[0].message.content or ""
                parsed_data = extract_and_repair_json(raw_text)

                if parsed_data is None:
                    raise ValueError(f"Could not parse valid JSON from AI response: {raw_text[:200]}")

                if isinstance(parsed_data, list):
                    fields = response_schema.model_fields
                    if len(fields) == 1:
                        key = next(iter(fields.keys()))
                        parsed_data = {key: parsed_data}

                validated = response_schema.model_validate(parsed_data)
                return validated

            except AuthenticationError:
                raise GroqServiceError(
                    "Groq authentication failed. Please check your GROQ_API_KEY.",
                    code="AI_AUTH_FAILED"
                )
            except (ValidationError, ValueError) as val_err:
                logger.warning(f"Groq output validation failed (attempt {attempt + 1}): {val_err}")
                last_error = val_err
                if attempt == 0:
                    current_user_prompt = (
                        f"{user_prompt}\n\n"
                        f"IMPORTANT: Your previous output had validation error: {str(val_err)[:250]}. "
                        "Please output ONLY valid JSON matching the exact required keys and types."
                    )
                    await asyncio.sleep(0.5)
                    continue

            except RateLimitError:
                if attempt == 0:
                    logger.warning("Groq rate limit in generate_json. Retrying in 2 seconds...")
                    await asyncio.sleep(2.0)
                    continue
                raise GroqServiceError(
                    "Plannora AI is experiencing high demand. Please try again shortly.",
                    code="AI_RATE_LIMITED"
                )
            except APITimeoutError:
                if attempt == 0:
                    logger.warning("Groq timeout in generate_json. Retrying...")
                    await asyncio.sleep(1.0)
                    continue
                raise GroqServiceError(
                    "AI generation timed out. Please try again.",
                    code="AI_TIMEOUT"
                )
            except APIError as exc:
                logger.error(f"Groq API error: {exc}")
                raise GroqServiceError(
                    "AI service is temporarily unavailable. Please try again.",
                    code="AI_SERVICE_UNAVAILABLE"
                )
            except GroqServiceError:
                raise
            except Exception as exc:
                logger.error(f"Unexpected Groq service error: {exc}")
                raise GroqServiceError(
                    "Failed to process AI response.",
                    code="AI_INVALID_RESPONSE"
                )

        raise GroqServiceError(
            f"AI returned structured output that did not match schema: {last_error}",
            code="AI_SCHEMA_MISMATCH"
        )


# Global singleton instance
groq_service = GroqService()
