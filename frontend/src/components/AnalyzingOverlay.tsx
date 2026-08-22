import { useState, useEffect } from "react";

const PROCESSING_STEPS = [
  "Reading material...",
  "Detecting topics...",
  "Understanding concepts...",
  "Building learning path...",
  "Generating teaching content...",
];

export default function AnalyzingOverlay() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) =>
        prev < PROCESSING_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 750);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="analyzing-overlay" role="status" aria-live="polite">
      <div className="analyzing-card">
        <div className="analyzing-spinner" aria-hidden="true" />
        <h3>Analyzing material with AI...</h3>
        <div className="analyzing-steps">
          {PROCESSING_STEPS.map((stepText, idx) => {
            const isDone = idx < currentStepIndex;
            const isActive = idx === currentStepIndex;
            return (
              <span
                key={idx}
                className={`analyzing-step ${isDone ? "done" : isActive ? "active" : ""}`}
              >
                {isDone ? "✓ " : isActive ? "→ " : "• "}
                {stepText}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
