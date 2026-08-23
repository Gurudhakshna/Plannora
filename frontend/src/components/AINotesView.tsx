import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AIStudyNotes } from "../types/study-material";

interface AINotesViewProps {
  notes: AIStudyNotes;
  materialName?: string;
  onClose: () => void;
  onRegenerate: () => void;
  onTeachConcept?: (conceptName: string) => void;
}

const CLOSE_MS = 180;

function buildPlainText(n: AIStudyNotes): string {
  const lines: string[] = [];
  lines.push(`# ${n.topic} — Teaching Notes`);
  lines.push("");

  if (n.executiveSummary || n.summary) {
    lines.push("## Overview");
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

  if (n.formulas.length) {
    lines.push("## Formulas & Algorithms");
    n.formulas.forEach((f) => {
      lines.push(`- **${f.name}**: ${f.formula}${f.when ? ` (When: ${f.when})` : ""}`);
    });
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

  const takeaways = [
    ...(n.thingsToRemember ?? []),
    ...(n.importantPoints ?? []),
  ];
  if (takeaways.length) {
    lines.push("## Key Takeaways");
    takeaways.forEach((t) => lines.push(`- ${t}`));
    lines.push("");
  }

  const practice = (n.concepts ?? []).filter((c) => c.miniQuestion);
  if (practice.length) {
    lines.push("## Practice Questions");
    practice.forEach((c) => {
      lines.push(`- **${c.name}**: ${c.miniQuestion}`);
      if (c.miniQuestionAnswer) lines.push(`  Answer: ${c.miniQuestionAnswer}`);
    });
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

export default function AINotesView({
  notes,
  materialName,
  onClose,
  onRegenerate,
  onTeachConcept,
}: AINotesViewProps) {
  const [focusMode, setFocusMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const requestClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    closeTimer.current = window.setTimeout(() => {
      onClose();
    }, CLOSE_MS);
  }, [isClosing, onClose]);

  useEffect(() => {
    return () => {
      if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    // Measure the scrollbar width before hiding it so we can compensate.
    // This prevents the layout-shift "jump" when overflow:hidden removes
    // the scrollbar and the remaining content expands to fill the gap.
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    // Push body content right by exactly the scrollbar width so nothing shifts.
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.paddingRight = previousBodyPaddingRight;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);

  function handleCopy() {
    const text = buildPlainText(notes);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    const text = buildPlainText(notes);
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${notes.topic.replace(/[^\w\s-]/g, "").trim() || "notes"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const takeaways = [
    ...(notes.thingsToRemember ?? []),
    ...(notes.importantPoints ?? []),
  ];
  const practiceItems = (notes.concepts ?? []).filter((c) => c.miniQuestion);

  const overlay = (
    /*
     * .notes-viewer-overlay is a zero-size coordination node that:
     *  1. Carries the animation class `is-closing` which drives CSS
     *     exit animations on both backdrop and panel via descendant selectors.
     *  2. Has pointer-events:none so all clicks reach the backdrop/panel.
     *
     * Both .notes-viewer-backdrop and .notes-viewer-panel are
     * position:fixed independently, so they cover the viewport regardless
     * of any parent stacking context.
     */
    <div
      className={`notes-viewer-overlay${isClosing ? " is-closing" : ""}`}
      role="presentation"
      aria-hidden="true"
    >
      {/* Backdrop: position:fixed, z-index:1200 — darkens + blurs the page */}
      <div className="notes-viewer-backdrop" onClick={requestClose} aria-hidden="true" />

      {/* Panel: position:fixed, z-index:1201 — the actual notes modal */}
      <div
        className="notes-viewer-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notes-viewer-title"
      >
        <header className="notes-viewer-header">
          <div className="notes-viewer-header-text">
            <p className="notes-viewer-kicker">Notes Viewer</p>
            <h2 id="notes-viewer-title" className="notes-viewer-title">
              {notes.topic}
            </h2>
            {materialName && (
              <p className="notes-viewer-filename">{materialName}</p>
            )}
          </div>
          <div className="notes-viewer-header-actions">
            {!focusMode && (
              <>
                <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
                  {copied ? "Copied" : "Copy"}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handleDownload}>
                  Download
                </button>
                <button className="btn btn-secondary btn-sm" onClick={onRegenerate}>
                  Regenerate
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setFocusMode(true)}>
                  Focus
                </button>
                <button className="btn btn-primary btn-sm" onClick={requestClose}>
                  Done
                </button>
              </>
            )}
            {focusMode && (
              <button className="btn btn-secondary btn-sm" onClick={() => setFocusMode(false)}>
                Exit Focus
              </button>
            )}
            <button className="modal-close-btn notes-viewer-close" onClick={requestClose} aria-label="Close notes viewer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </header>

        <div className={`notes-viewer-body${focusMode ? " notes-focus-mode" : ""}`}>
          <div className="notes-content">
            <div className="notes-meta-badge">TEACHING NOTES • CONTENT-AWARE</div>
            <h1 className="notes-topic-title">{notes.topic}</h1>

            {(notes.executiveSummary || notes.summary) && (
              <section className="notes-section">
                <h2 className="notes-section-title">Overview</h2>
                <p className="notes-summary">{notes.executiveSummary || notes.summary}</p>
              </section>
            )}

            {notes.keyConcepts.length > 0 && (
              <section className="notes-section">
                <h2 className="notes-section-title">Key Concepts</h2>
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

            {takeaways.length > 0 && (
              <section className="notes-section">
                <h2 className="notes-section-title">Key Takeaways</h2>
                <ul className="notes-list">
                  {takeaways.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>
            )}

            {practiceItems.length > 0 && (
              <section className="notes-section">
                <h2 className="notes-section-title">Practice Questions</h2>
                <div className="notes-practice-list">
                  {practiceItems.map((c, i) => (
                    <div key={i} className="notes-practice-item">
                      <span className="notes-practice-topic">{c.name}</span>
                      <p className="notes-practice-q">{c.miniQuestion}</p>
                      {c.miniQuestionAnswer && (
                        <p className="notes-practice-a">{c.miniQuestionAnswer}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {notes.commonMistakes && notes.commonMistakes.length > 0 && (
              <section className="notes-section notes-section-warning">
                <h2 className="notes-section-title">Common Mistakes to Avoid</h2>
                <ul className="notes-list notes-mistakes">
                  {notes.commonMistakes.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </section>
            )}

            {notes.memoryTricks && notes.memoryTricks.length > 0 && (
              <section className="notes-section notes-section-tricks">
                <h2 className="notes-section-title">Memory Tricks & Mnemonics</h2>
                <ul className="notes-list notes-tricks">
                  {notes.memoryTricks.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </section>
            )}

            {notes.examFocusedNotes && notes.examFocusedNotes.length > 0 && (
              <section className="notes-section notes-section-exam">
                <h2 className="notes-section-title">Exam-Focused Key Points</h2>
                <ul className="notes-list notes-exam">
                  {notes.examFocusedNotes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </section>
            )}

            {notes.quickRevision.length > 0 && (
              <section className="notes-section notes-section-revision">
                <h2 className="notes-section-title">Quick Revision Checklist</h2>
                <ul className="notes-list notes-revision">
                  {notes.quickRevision.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
