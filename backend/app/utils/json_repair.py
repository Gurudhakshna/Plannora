"""
JSON extraction and repair utility for LLM responses.
Handles markdown fences, control characters, trailing commas, and unclosed quotes/brackets.
"""

from __future__ import annotations

import json
import re
from typing import Any, Optional


def extract_and_repair_json(raw: str) -> Optional[dict[str, Any] | list[Any]]:
    """
    Attempt to extract and safely parse a JSON object or array from LLM output.
    Returns None if parsing fails after all repair attempts.
    """
    if not raw or not raw.strip():
        return None

    cleaned = raw.strip()

    # Strip markdown code blocks (e.g. ```json ... ``` or ``` ...)
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json|JSON)?\s*", "", cleaned)
    if cleaned.endswith("```"):
        cleaned = re.sub(r"\s*```$", "", cleaned)
    cleaned = cleaned.strip()

    # If there's leading 'json' without backticks
    if cleaned.startswith("json\n") or cleaned.startswith("JSON\n"):
        cleaned = cleaned.split("\n", 1)[1].strip()

    # 1. Standard parse attempt
    try:
        return json.loads(cleaned)
    except Exception:
        pass

    # 2. Extract outermost JSON boundaries if surrounded by conversational text
    first_brace = cleaned.find("{")
    first_bracket = cleaned.find("[")

    if first_brace != -1 and (first_bracket == -1 or first_brace < first_bracket):
        last_brace = cleaned.rfind("}")
        if last_brace != -1 and last_brace > first_brace:
            cleaned_sub = cleaned[first_brace:last_brace + 1]
            try:
                return json.loads(cleaned_sub)
            except Exception:
                pass
    elif first_bracket != -1:
        last_bracket = cleaned.rfind("]")
        if last_bracket != -1 and last_bracket > first_bracket:
            cleaned_sub = cleaned[first_bracket:last_bracket + 1]
            try:
                return json.loads(cleaned_sub)
            except Exception:
                pass

    # 3. Clean control characters and trailing commas before braces/brackets
    repaired = re.sub(r"[\x00-\x1f\x7f-\x9f]", " ", cleaned)
    repaired = re.sub(r",\s*([\}\]])", r"\1", repaired)

    try:
        return json.loads(repaired)
    except Exception:
        pass

    # 4. Repair unclosed quotes
    quotes = len(re.findall(r'(?<!\\)"', repaired))
    if quotes % 2 != 0:
        repaired += '"'

    # Remove any trailing incomplete key-value colon or comma (e.g. `{"id": ` or `{"id": 2, `)
    repaired = re.sub(r",\s*$", "", repaired)

    # 5. Stack-based bracket and brace closer
    stack = []
    in_string = False
    escape = False

    for char in repaired:
        if escape:
            escape = False
            continue
        if char == "\\":
            escape = True
            continue
        if char == '"':
            in_string = not in_string
            continue
        if in_string:
            continue

        if char in ("{", "["):
            stack.append(char)
        elif char == "}":
            if stack and stack[-1] == "{":
                stack.pop()
        elif char == "]":
            if stack and stack[-1] == "[":
                stack.pop()

    # Close remaining open tokens in reverse order
    closers = []
    for token in reversed(stack):
        if token == "{":
            closers.append("}")
        elif token == "[":
            closers.append("]")

    repaired_with_closers = repaired + "".join(closers)
    # Clean any accidental trailing commas before closers
    repaired_with_closers = re.sub(r",\s*([\}\]])", r"\1", repaired_with_closers)

    try:
        return json.loads(repaired_with_closers)
    except Exception:
        pass

    # If still failing, try stripping the last incomplete token before closing
    trimmed = re.sub(r',\s*[^,:{}\[\]]+$', '', repaired)
    if trimmed != repaired:
        quotes = len(re.findall(r'(?<!\\)"', trimmed))
        if quotes % 2 != 0:
            trimmed += '"'
        trimmed_closers = []
        stack_trimmed = []
        for char in trimmed:
            if char in ("{", "["):
                stack_trimmed.append(char)
            elif char == "}":
                if stack_trimmed and stack_trimmed[-1] == "{":
                    stack_trimmed.pop()
            elif char == "]":
                if stack_trimmed and stack_trimmed[-1] == "[":
                    stack_trimmed.pop()
        for token in reversed(stack_trimmed):
            trimmed_closers.append("}" if token == "{" else "]")
        try:
            return json.loads(trimmed + "".join(trimmed_closers))
        except Exception:
            pass

    return None
