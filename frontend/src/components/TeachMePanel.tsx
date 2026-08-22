import { useState } from "react";
import type { DetectedConcept } from "../types/study-material";

interface TeachMePanelProps {
  concept: DetectedConcept;
  materialTitle: string;
  onClose: () => void;
  onMarkUnderstood: (conceptName: string) => void;
  onExplainAgain?: (conceptName: string) => void;
}

export default function TeachMePanel({
  concept,
  materialTitle,
  onClose,
  onMarkUnderstood,
  onExplainAgain,
}: TeachMePanelProps) {
  const [showDetailed, setShowDetailed] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isUnderstood, setIsUnderstood] = useState(concept.status === "understood");

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

        {/* Content Body */}
        <div className="teach-me-body">
          {/* Priority & Category Tag */}
          <div className="teach-me-tags">
            <span className={`priority-tag priority-${concept.priority}`}>
              {concept.priority.toUpperCase()} PRIORITY
            </span>
            {concept.category && (
              <span className="category-tag">{concept.category.toUpperCase()}</span>
            )}
            <span className="time-tag">⏱ {concept.estimatedMinutes || 15} min read</span>
            {isUnderstood && (
              <span className="understood-tag">✓ Understood</span>
            )}
          </div>

          {/* Simple Explanation */}
          <div className="teach-card teach-simple">
            <h3>Simple Explanation</h3>
            <p>{concept.simpleExplanation || `A core concept covering ${concept.name}.`}</p>
          </div>

          {/* Detailed Explanation Toggle */}
          <div className="teach-card teach-detailed">
            <div className="teach-card-header">
              <h3>Detailed Explanation</h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowDetailed(!showDetailed)}
              >
                {showDetailed ? "Hide details" : "Read in detail"}
              </button>
            </div>
            {showDetailed && (
              <div className="teach-detailed-content">
                <p>{concept.detailedExplanation || concept.simpleExplanation}</p>
              </div>
            )}
          </div>

          {/* Example */}
          {concept.example && (
            <div className="teach-card teach-example">
              <h3>Concrete Example</h3>
              <div className="example-box">
                <pre>{concept.example}</pre>
              </div>
            </div>
          )}

          {/* Optional Analogy */}
          {concept.analogy && (
            <div className="teach-card teach-analogy">
              <h3>Real-World Analogy</h3>
              <p>{concept.analogy}</p>
            </div>
          )}

          {/* Common Mistake */}
          {concept.commonMistake && (
            <div className="teach-card teach-mistake">
              <h3>⚠️ Common Mistake</h3>
              <p>{concept.commonMistake}</p>
            </div>
          )}

          {/* Key Point / Takeaway */}
          {concept.keyTakeaway && (
            <div className="teach-card teach-takeaway">
              <h3>💡 Key Point to Remember</h3>
              <p>{concept.keyTakeaway}</p>
            </div>
          )}

          {/* Mini Comprehension Question */}
          {concept.miniQuestion && (
            <div className="teach-card teach-question">
              <h3>Self-Check Question</h3>
              <p className="question-text">{concept.miniQuestion}</p>
              {!showAnswer ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowAnswer(true)}
                >
                  Show Answer
                </button>
              ) : (
                <div className="answer-box">
                  <span className="answer-label">Answer:</span>
                  <p>{concept.miniQuestionAnswer || "Refer to the concept takeaway."}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="teach-me-footer">
          {onExplainAgain && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onExplainAgain(concept.name)}
            >
              🔄 Explain Again
            </button>
          )}
          <button
            type="button"
            className={`btn ${isUnderstood ? "btn-secondary" : "btn-primary"} btn-lg`}
            onClick={handleUnderstoodClick}
          >
            {isUnderstood ? "✓ Marked as Understood" : "I Understand This"}
          </button>
        </div>
      </div>
    </div>
  );
}
