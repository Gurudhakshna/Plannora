export default function AnalyzingOverlay() {
  return (
    <div className="analyzing-overlay" role="status" aria-live="polite">
      <div className="analyzing-card">
        <div className="analyzing-spinner" aria-hidden="true" />
        <h3>Analyzing your study material...</h3>
        <div className="analyzing-steps">
          <span className="analyzing-step done">Extracting important concepts...</span>
          <span className="analyzing-step active">Creating concise notes...</span>
          <span className="analyzing-step">Building your study tasks...</span>
          <span className="analyzing-step">Generating study plan...</span>
        </div>
      </div>
    </div>
  );
}
