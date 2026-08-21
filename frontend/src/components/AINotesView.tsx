import { useState } from "react";
import type { AIStudyNotes } from "../types/study-material";

interface AINotesViewProps {
  notes: AIStudyNotes;
  onClose: () => void;
  onSave: () => void;
  onRegenerate: () => void;
}

export default function AINotesView({ notes, onClose, onSave, onRegenerate }: AINotesViewProps) {
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
    lines.push(`# ${n.topic}`);
    lines.push("");
    if (n.summary) { lines.push("## Summary"); lines.push(n.summary); lines.push(""); }
    if (n.keyConcepts.length) { lines.push("## Key Concepts"); n.keyConcepts.forEach((c) => lines.push(`- ${c}`)); lines.push(""); }
    if (n.definitions.length) { lines.push("## Definitions"); n.definitions.forEach((d) => lines.push(`- **${d.term}**: ${d.definition}`)); lines.push(""); }
    if (n.formulas.length) { lines.push("## Formulas"); n.formulas.forEach((f) => lines.push(`- **${f.name}**: ${f.formula}`)); lines.push(""); }
    if (n.importantPoints.length) { lines.push("## Important Points"); n.importantPoints.forEach((p) => lines.push(`- ${p}`)); lines.push(""); }
    if (n.examples.length) { lines.push("## Examples"); n.examples.forEach((e) => lines.push(`### ${e.title}\n${e.detail}`)); lines.push(""); }
    if (n.quickRevision.length) { lines.push("## Quick Revision"); n.quickRevision.forEach((r) => lines.push(`- ${r}`)); lines.push(""); }
    if (n.thingsToRemember.length) { lines.push("## Things to Remember"); n.thingsToRemember.forEach((t) => lines.push(`- ${t}`)); }
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
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M10 4V3C10 2.45 9.55 2 9 2H3C2.45 2 2 2.45 2 3V9C2 9.55 2.45 10 3 10H4" stroke="currentColor" strokeWidth="1.3"/>
                  </svg>
                  Copy
                </>
              )}
            </button>
            <button className="btn btn-secondary" onClick={onRegenerate}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M11.5 2.5C10.5 1.5 9 1 7.5 1C4.5 1 2 3.5 2 6.5S4.5 12 7.5 12C10 12 12 10.5 12.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M11.5 1V5H7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Regenerate
            </button>
            <button className="btn btn-secondary" onClick={() => setFocusMode(true)}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 5V2.5C1 1.67 1.67 1 2.5 1H5M9 1H11.5C12.33 1 13 1.67 13 2.5V5M13 9V11.5C13 12.33 12.33 13 11.5 13H9M5 13H2.5C1.67 13 1 12.33 1 11.5V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Focus
            </button>
            <button className="btn btn-primary" onClick={onSave}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Done
            </button>
          </div>
        </div>
      )}

      {focusMode && (
        <button className="notes-focus-exit" onClick={() => setFocusMode(false)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Exit Focus Mode
        </button>
      )}

      <div className="notes-content">
        <h1 className="notes-topic-title">{notes.topic}</h1>

        {notes.summary && (
          <section className="notes-section">
            <h2 className="notes-section-title">Summary</h2>
            <p className="notes-summary">{notes.summary}</p>
          </section>
        )}

        {notes.keyConcepts.length > 0 && (
          <section className="notes-section">
            <h2 className="notes-section-title">Key Concepts</h2>
            <ul className="notes-list notes-concepts">
              {notes.keyConcepts.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </section>
        )}

        {notes.definitions.length > 0 && (
          <section className="notes-section">
            <h2 className="notes-section-title">Definitions</h2>
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
            <h2 className="notes-section-title">Formulas</h2>
            <div className="notes-formulas">
              {notes.formulas.map((f, i) => (
                <div key={i} className="notes-formula-item">
                  <span className="notes-formula-name">{f.name}</span>
                  <code className="notes-formula-code">{f.formula}</code>
                </div>
              ))}
            </div>
          </section>
        )}

        {notes.importantPoints.length > 0 && (
          <section className="notes-section">
            <h2 className="notes-section-title">Important Points</h2>
            <ul className="notes-list notes-points">
              {notes.importantPoints.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </section>
        )}

        {notes.examples.length > 0 && (
          <section className="notes-section">
            <h2 className="notes-section-title">Examples</h2>
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

        {notes.quickRevision.length > 0 && (
          <section className="notes-section notes-section-revision">
            <h2 className="notes-section-title">Quick Revision</h2>
            <ul className="notes-list notes-revision">
              {notes.quickRevision.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </section>
        )}

        {notes.thingsToRemember.length > 0 && (
          <section className="notes-section notes-section-remember">
            <h2 className="notes-section-title">Things to Remember</h2>
            <ul className="notes-list notes-remember">
              {notes.thingsToRemember.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
