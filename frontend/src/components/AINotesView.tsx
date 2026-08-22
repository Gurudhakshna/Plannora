import { useState } from "react";
import type { AIStudyNotes } from "../types/study-material";

interface AINotesViewProps {
  notes: AIStudyNotes;
  onClose: () => void;
  onSave: () => void;
  onRegenerate: () => void;
  onTeachConcept?: (conceptName: string) => void;
}

export default function AINotesView({
  notes,
  onClose,
  onSave,
  onRegenerate,
  onTeachConcept,
}: AINotesViewProps) {
  const [focusMode, setFocusMode] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const text = buildPlainText(notes);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function buildPlainText(n: AIStudyNotes): string {
    const lines: string[] = [];
    lines.push(`# ${n.topic} — Teaching Notes`);
    lines.push("");

    if (n.executiveSummary || n.summary) {
      lines.push("## Executive Summary");
      lines.push(n.executiveSummary || n.summary);
      lines.push("");
    }

    if (n.keyConcepts.length) {
      lines.push("## Key Concepts");
      n.keyConcepts.forEach((c) => lines.push(`- ${c}`));
      lines.push("");
    }

    if (n.definitions.length) {
      lines.push("## Important Definitions");
      n.definitions.forEach((d) => lines.push(`- **${d.term}**: ${d.definition}`));
      lines.push("");
    }

    if (n.stepByStepExplanations && n.stepByStepExplanations.length) {
      lines.push("## Step-by-Step Explanations");
      n.stepByStepExplanations.forEach((ex) => {
        lines.push(`### ${ex.topic}`);
        ex.steps.forEach((s, idx) => lines.push(`${idx + 1}. ${s}`));
      });
      lines.push("");
    }

    if (n.examples.length) {
      lines.push("## Worked Examples");
      n.examples.forEach((e) => lines.push(`### ${e.title}\n${e.detail}`));
      lines.push("");
    }

    if (n.commonMistakes && n.commonMistakes.length) {
      lines.push("## Common Mistakes to Avoid");
      n.commonMistakes.forEach((m) => lines.push(`- ⚠️ ${m}`));
      lines.push("");
    }

    if (n.memoryTricks && n.memoryTricks.length) {
      lines.push("## Memory Tricks & Mnemonics");
      n.memoryTricks.forEach((m) => lines.push(`- 💡 ${m}`));
      lines.push("");
    }

    if (n.examFocusedNotes && n.examFocusedNotes.length) {
      lines.push("## Exam-Focused Notes");
      n.examFocusedNotes.forEach((e) => lines.push(`- 🎯 ${e}`));
      lines.push("");
    }

    if (n.quickRevision.length) {
      lines.push("## Quick Revision Section");
      n.quickRevision.forEach((r) => lines.push(`- ${r}`));
    }

    return lines.join("\n");
  }

  return (
    <div className={`notes-view ${focusMode ? "notes-focus-mode" : ""}`}>
      {!focusMode && (
        <div className="notes-view-header">
          <button className="btn btn-secondary" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <div className="notes-view-actions">
            <button className="btn btn-secondary" onClick={handleCopy}>
              {copied ? "✓ Copied" : "Copy Notes"}
            </button>
            <button className="btn btn-secondary" onClick={onRegenerate}>
              Regenerate
            </button>
            <button className="btn btn-secondary" onClick={() => setFocusMode(true)}>
              Focus Mode
            </button>
            <button className="btn btn-primary" onClick={onSave}>
              Done
            </button>
          </div>
        </div>
      )}

      {focusMode && (
        <button className="notes-focus-exit" onClick={() => setFocusMode(false)}>
          ✕ Exit Focus Mode
        </button>
      )}

      <div className="notes-content">
        <div className="notes-meta-badge">TEACHING NOTES &bull; CONTENT-AWARE</div>
        <h1 className="notes-topic-title">{notes.topic}</h1>

        {/* 1. Executive Summary */}
        {(notes.executiveSummary || notes.summary) && (
          <section className="notes-section">
            <h2 className="notes-section-title">Executive Summary</h2>
            <p className="notes-summary">{notes.executiveSummary || notes.summary}</p>
          </section>
        )}

        {/* 2. Key Concepts (with Teach Me actions) */}
        {notes.keyConcepts.length > 0 && (
          <section className="notes-section">
            <h2 className="notes-section-title">Key Concepts Detected</h2>
            <div className="notes-concepts-grid">
              {notes.keyConcepts.map((concept, i) => (
                <div key={i} className="notes-concept-card">
                  <span className="concept-card-name">{concept}</span>
                  {onTeachConcept && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => onTeachConcept(concept)}
                    >
                      Teach Me →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. Important Definitions */}
        {notes.definitions.length > 0 && (
          <section className="notes-section">
            <h2 className="notes-section-title">Important Definitions</h2>
            <div className="notes-definitions">
              {notes.definitions.map((d, i) => (
                <div key={i} className="notes-def-item">
                  <span className="notes-def-term">{d.term}</span>
                  <span className="notes-def-text">{d.definition}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. Formulas / Algorithms */}
        {notes.formulas.length > 0 && (
          <section className="notes-section">
            <h2 className="notes-section-title">Formulas & Algorithms</h2>
            <div className="notes-formulas">
              {notes.formulas.map((f, i) => (
                <div key={i} className="notes-formula-item">
                  <span className="notes-formula-name">{f.name}</span>
                  <code className="notes-formula-code">{f.formula}</code>
                  {f.when && <span className="notes-formula-when">When: {f.when}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Step-by-Step Explanations */}
        {notes.stepByStepExplanations && notes.stepByStepExplanations.length > 0 && (
          <section className="notes-section">
            <h2 className="notes-section-title">Step-by-Step Explanations</h2>
            <div className="notes-explanations-list">
              {notes.stepByStepExplanations.map((item, idx) => (
                <div key={idx} className="notes-explanation-box">
                  <h4>{item.topic}</h4>
                  <ol className="explanation-steps">
                    {item.steps.map((step, sIdx) => (
                      <li key={sIdx}>{step}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. Worked Examples */}
        {notes.examples.length > 0 && (
          <section className="notes-section">
            <h2 className="notes-section-title">Worked Examples</h2>
            <div className="notes-examples">
              {notes.examples.map((ex, i) => (
                <div key={i} className="notes-example-item">
                  <h4 className="notes-example-title">{ex.title}</h4>
                  <p className="notes-example-detail">{ex.detail}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 7. Common Mistakes */}
        {notes.commonMistakes && notes.commonMistakes.length > 0 && (
          <section className="notes-section notes-section-warning">
            <h2 className="notes-section-title">⚠️ Common Mistakes to Avoid</h2>
            <ul className="notes-list notes-mistakes">
              {notes.commonMistakes.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </section>
        )}

        {/* 8. Memory Tricks */}
        {notes.memoryTricks && notes.memoryTricks.length > 0 && (
          <section className="notes-section notes-section-tricks">
            <h2 className="notes-section-title">💡 Memory Tricks & Mnemonics</h2>
            <ul className="notes-list notes-tricks">
              {notes.memoryTricks.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </section>
        )}

        {/* 9. Exam-Focused Notes */}
        {notes.examFocusedNotes && notes.examFocusedNotes.length > 0 && (
          <section className="notes-section notes-section-exam">
            <h2 className="notes-section-title">🎯 Exam-Focused Key Points</h2>
            <ul className="notes-list notes-exam">
              {notes.examFocusedNotes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </section>
        )}

        {/* 10. Quick Revision Section */}
        {notes.quickRevision.length > 0 && (
          <section className="notes-section notes-section-revision">
            <h2 className="notes-section-title">⚡ Quick Revision Checklist</h2>
            <ul className="notes-list notes-revision">
              {notes.quickRevision.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
