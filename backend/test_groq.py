"""
Quick test script to verify Groq integration with Plannora AI services.

Run from backend directory:
    .\venv\Scripts\python test_groq.py
"""

import os
import sys
import asyncio

# Fix Windows console encoding
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Ensure we can import from the app package
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()


def test_chat_service():
    """Test the chat AI service (synchronous)."""
    print("=" * 60)
    print("TEST 1: Chat Service (ai_service.py)")
    print("=" * 60)

    from app.services.ai_service import ai_service

    response = ai_service.generate_response(
        message="What are 3 effective study techniques for exam preparation?"
    )
    print(f"\nResponse:\n{response}\n")
    return "error" not in response.lower() and "not configured" not in response.lower()


async def test_quiz_generation():
    """Test AI-powered quiz generation (async)."""
    print("=" * 60)
    print("TEST 2: Quiz Generation (quiz_service.py)")
    print("=" * 60)

    from app.ai.quiz_generation.quiz_service import QuizService

    service = QuizService()
    questions = await service.generate_quiz(
        subject="Computer Science",
        topic="Data Structures",
        context=(
            "A stack is a linear data structure that follows the LIFO "
            "(Last In, First Out) principle. Elements can only be added "
            "or removed from the top. Common operations include push "
            "(add to top), pop (remove from top), and peek (view top "
            "without removing). Stacks are used in function call management, "
            "expression evaluation, and undo mechanisms."
        ),
        number_of_questions=2,
        difficulty="easy",
    )
    print(f"\nGenerated {len(questions)} questions:")
    for i, q in enumerate(questions, 1):
        if "parse_error" in q:
            print(f"  [PARSE ERROR] Raw: {q.get('raw_response', '')[:200]}")
        else:
            print(f"\n  Q{i}: {q.get('question', 'N/A')}")
            for opt in q.get("options", []):
                print(f"      {opt}")
            print(f"      Answer: {q.get('correct_answer', 'N/A')}")
    print()
    return len(questions) > 0 and "parse_error" not in questions[0]


def main():
    print("\n>> Plannora -- Groq Integration Test\n")
    print(f"  AI_API_KEY:  {'[OK] Set' if os.getenv('AI_API_KEY') else '[X] Missing'}")
    print(f"  AI_BASE_URL: {os.getenv('AI_BASE_URL', '(not set)')}")
    print(f"  LLM_MODEL:   {os.getenv('LLM_MODEL', '(not set)')}")
    print()

    results = {}

    # Test 1: Chat
    try:
        results["Chat Service"] = test_chat_service()
    except Exception as e:
        print(f"  [X] Error: {e}")
        results["Chat Service"] = False

    # Test 2: Quiz Generation
    try:
        results["Quiz Generation"] = asyncio.run(test_quiz_generation())
    except Exception as e:
        print(f"  ❌ Error: {e}")
        results["Quiz Generation"] = False

    # Summary
    print("=" * 60)
    print("RESULTS SUMMARY")
    print("=" * 60)
    for name, passed in results.items():
        icon = "[PASS]" if passed else "[FAIL]"
        print(f"  {icon} {name}")
    print()

    all_passed = all(results.values())
    if all_passed:
        print("All tests passed! Groq integration is working.\n")
    else:
        print("Some tests failed. Check the output above.\n")

    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
