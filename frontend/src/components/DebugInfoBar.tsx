import { useState } from "react";

export interface DebugState {
  filename?: string;
  charCount?: number;
  snippet?: string;
  apiUrl?: string;
  status?: "IDLE" | "EXTRACTING" | "ANALYZING" | "SUCCESS" | "ERROR";
  errorDetails?: string;
  conceptCount?: number;
}

interface DebugInfoBarProps {
  debugData: DebugState;
}

export default function DebugInfoBar({ debugData }: DebugInfoBarProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (!debugData.filename && !debugData.status) return null;

  return (
    <div className={`debug-info-bar ${collapsed ? "collapsed" : ""}`}>
      <div className="debug-bar-header">
        <span className="debug-title">🛠 DEV DEBUG PIPELINE LOG</span>
        <span className={`debug-status-pill status-${debugData.status?.toLowerCase()}`}>
          {debugData.status || "IDLE"}
        </span>
        <button
          type="button"
          className="debug-toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? "Expand Log ▲" : "Collapse Log ▼"}
        </button>
      </div>

      {!collapsed && (
        <div className="debug-bar-content">
          <div className="debug-grid">
            <div className="debug-item">
              <span className="debug-label">File:</span>
              <span className="debug-val">{debugData.filename || "N/A"}</span>
            </div>
            <div className="debug-item">
              <span className="debug-label">Text Extracted:</span>
              <span className="debug-val">
                {debugData.charCount !== undefined ? `${debugData.charCount.toLocaleString()} chars` : "N/A"}
              </span>
            </div>
            <div className="debug-item">
              <span className="debug-label">API Endpoint:</span>
              <span className="debug-val">{debugData.apiUrl || "http://localhost:8000/api/v1/analyze/text"}</span>
            </div>
            <div className="debug-item">
              <span className="debug-label">AI Source:</span>
              <span className="debug-val">Groq (openai/gpt-oss-120b)</span>
            </div>
            <div className="debug-item">
              <span className="debug-label">Concepts Detected:</span>
              <span className="debug-val">{debugData.conceptCount ?? 0}</span>
            </div>
          </div>

          {debugData.snippet && (
            <div className="debug-snippet-box">
              <span className="debug-snippet-title">First 300 Chars Extracted:</span>
              <pre className="debug-snippet">{debugData.snippet}</pre>
            </div>
          )}

          {debugData.errorDetails && (
            <div className="debug-error-box">
              <span className="debug-error-title">Error Details:</span>
              <span className="debug-error-msg">{debugData.errorDetails}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
