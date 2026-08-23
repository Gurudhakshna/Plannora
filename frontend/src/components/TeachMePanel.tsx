import { useState, useEffect } from "react";
import type { DetectedConcept } from "../types/study-material";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import LoadingSpinner from "./shared/LoadingSpinner";
import { aiApiService, type TeachMeResponse } from "../services/aiApiService";

interface TeachMePanelProps {
  concept: DetectedConcept;
  materialTitle: string;
  onClose: () => void;
  onMarkUnderstood: (conceptName: string) => void;
}

export default function TeachMePanel({
  concept,
  materialTitle,
  onClose,
  onMarkUnderstood,
}: TeachMePanelProps) {
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [isLoading, setIsLoading] = useState(true);
  const [lesson, setLesson] = useState<TeachMeResponse | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isUnderstood, setIsUnderstood] = useState(concept.status === "understood");

  // Fetch or regenerate lesson when level changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setShowAnswer(false);

    async function fetchLesson() {
      try {
        const res = await aiApiService.teachConcept(
          concept.name,
          `${materialTitle}: ${concept.detailedExplanation || concept.simpleExplanation}`,
          level
        );
        if (isMounted) {
          setLesson(res);
        }
      } catch {
        if (isMounted) {
          // Fallback structure grounded in local concept data
          setLesson({
            success: true,
            concept: concept.name,
            level,
            simple_explanation: concept.simpleExplanation,
            detailed_explanation: concept.detailedExplanation || concept.simpleExplanation,
            analogy: concept.analogy || `Think of ${concept.name} in terms of structured real-world processes.`,
            example: concept.example || `Applying ${concept.name} to solve foundational problems.`,
            common_mistakes: concept.commonMistake ? [concept.commonMistake] : ["Confusing terminology with adjacent topics."],
            key_takeaways: concept.keyTakeaway ? [concept.keyTakeaway] : ["Master the underlying definitions."],
            practice_question: {
              question: concept.miniQuestion || `What is the core function of ${concept.name}?`,
              answer: concept.miniQuestionAnswer || concept.simpleExplanation,
            },
          });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchLesson();
    return () => {
      isMounted = false;
    };
  }, [concept, materialTitle, level]);

  function handleUnderstoodClick() {
    setIsUnderstood(true);
    onMarkUnderstood(concept.name);
  }

  return (
    <div className="teach-me-modal-overlay" onClick={onClose}>
      <div
        className="teach-me-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="teach-me-title"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 680, maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="teach-me-header">
          <div className="teach-me-header-info">
            <span className="teach-me-eyebrow">
              Teach Me &bull; {materialTitle}
            </span>
            <h2 id="teach-me-title" className="teach-me-concept-name">
              {concept.name}
            </h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close teaching panel">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Level Tabs (Beginner / Intermediate / Advanced) */}
        <div style={{ padding: "0 24px 12px 24px", display: "flex", gap: 8, borderBottom: "1px solid var(--border-subtle)" }}>
          <button
            type="button"
            className={`btn btn-sm ${level === "beginner" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setLevel("beginner")}
          >
            Beginner (Intuitive)
          </button>
          <button
            type="button"
            className={`btn btn-sm ${level === "intermediate" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setLevel("intermediate")}
          >
            Intermediate (Standard)
          </button>
          <button
            type="button"
            className={`btn btn-sm ${level === "advanced" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setLevel("advanced")}
          >
            Advanced (Theoretical)
          </button>
        </div>

        {/* Content Body */}
        <div className="teach-me-body" style={{ padding: 24 }}>
          {isLoading ? (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <LoadingSpinner size="md" message={`Preparing ${level} lesson with Groq...`} />
            </div>
          ) : lesson ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Tags */}
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <Badge variant={concept.priority === "high" ? "danger" : "primary"}>
                  {concept.priority.toUpperCase()} PRIORITY
                </Badge>
                <Badge variant="neutral">{level.toUpperCase()} LEVEL</Badge>
                {isUnderstood && <Badge variant="success">✓ Mastered</Badge>}
              </div>

              {/* Simple Explanation */}
              <div className="teach-card teach-simple">
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                  Core Idea
                </h3>
                <p style={{ fontSize: "14px", lineHeight: 1.5, color: "var(--text-secondary)" }}>
                  {lesson.simple_explanation}
                </p>
              </div>

              {/* Analogy */}
              {lesson.analogy && (
                <div
                  style={{
                    padding: "14px 18px",
                    borderRadius: "var(--radius-lg)",
                    backgroundColor: "var(--accent-light)",
                    border: "1px solid var(--accent-border)",
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--accent-text)", letterSpacing: "0.05em" }}>
                    💡 Real-World Analogy
                  </span>
                  <p style={{ fontSize: "13.5px", lineHeight: 1.5, color: "var(--text-primary)", marginTop: 4 }}>
                    {lesson.analogy}
                  </p>
                </div>
              )}

              {/* Detailed Explanation */}
              <div className="teach-card teach-detailed">
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                  Detailed Breakdown
                </h3>
                <p style={{ fontSize: "13.5px", lineHeight: 1.55, color: "var(--text-secondary)", whiteSpace: "pre-line" }}>
                  {lesson.detailed_explanation}
                </p>
              </div>

              {/* Example */}
              {lesson.example && (
                <div className="teach-card teach-example">
                  <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                    Concrete Application / Worked Example
                  </h3>
                  <div style={{ padding: "12px 14px", backgroundColor: "var(--bg-inset)", borderRadius: "var(--radius-md)", fontSize: "13px", lineHeight: 1.45, color: "var(--text-primary)" }}>
                    {lesson.example}
                  </div>
                </div>
              )}

              {/* Common Mistakes */}
              {lesson.common_mistakes && lesson.common_mistakes.length > 0 && (
                <div
                  style={{
                    padding: "14px 18px",
                    borderRadius: "var(--radius-lg)",
                    backgroundColor: "var(--danger-light)",
                    border: "1px solid var(--danger-border)",
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--danger-text)", letterSpacing: "0.05em" }}>
                    ⚠️ Common Pitfalls & Misconceptions
                  </span>
                  <ul style={{ margin: "6px 0 0 18px", padding: 0, fontSize: "13px", color: "var(--danger-text)" }}>
                    {lesson.common_mistakes.map((m, mIdx) => (
                      <li key={mIdx} style={{ marginBottom: 4 }}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Self Check Practice Question */}
              {lesson.practice_question && (
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "var(--radius-lg)",
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                    🎯 Self-Check Practice Question
                  </span>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginTop: 6, marginBottom: 10 }}>
                    {lesson.practice_question.question}
                  </div>

                  {!showAnswer ? (
                    <Button variant="secondary" size="sm" onClick={() => setShowAnswer(true)}>
                      Reveal Solution
                    </Button>
                  ) : (
                    <div style={{ padding: "10px 14px", backgroundColor: "var(--success-light)", border: "1px solid var(--success-border)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--success-text)", lineHeight: 1.45 }}>
                      <strong>Solution:</strong> {lesson.practice_question.answer}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Button variant="ghost" size="md" onClick={onClose}>
            Close
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleUnderstoodClick}
            disabled={isUnderstood}
          >
            {isUnderstood ? "✓ Marked as Understood" : "I Understand This Concept ✓"}
          </Button>
        </div>
      </div>
    </div>
  );
}
