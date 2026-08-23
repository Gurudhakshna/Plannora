import { useState, useEffect } from "react";

export interface DebugState {
  filename?: string;
  charCount?: number;
  snippet?: string;
  apiUrl?: string;
  status?: "IDLE" | "EXTRACTING" | "ANALYZING" | "SUCCESS" | "ERROR";
  errorDetails?: string;
  conceptCount?: number;
}

export interface DebugInfoBarProps {
  debugData: DebugState;
}

export default function DebugInfoBar({ debugData }: DebugInfoBarProps) {
  const [isDevMode, setIsDevMode] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    try {
      setIsDevMode(localStorage.getItem("plannora_dev_mode") === "true");
    } catch {
      setIsDevMode(false);
    }
  }, []);

  if (!isDevMode || (!debugData.filename && !debugData.status)) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        left: 12,
        zIndex: 900,
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-lg)",
        maxWidth: 480,
        fontSize: "12px",
        fontFamily: "var(--font-mono)",
      }}
    >
      <div
        style={{
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          borderBottom: collapsed ? "none" : "1px solid var(--border-subtle)",
          cursor: "pointer",
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "var(--warning)" }}>⚙ DEV PIPELINE</span>
          <span
            style={{
              padding: "1px 6px",
              borderRadius: "var(--radius-xs)",
              fontSize: "10px",
              fontWeight: 600,
              backgroundColor: debugData.status === "ERROR" ? "var(--danger-light)" : "var(--accent-light)",
              color: debugData.status === "ERROR" ? "var(--danger-text)" : "var(--accent-text)",
            }}
          >
            {debugData.status || "IDLE"}
          </span>
        </div>
        <button
          type="button"
          style={{ color: "var(--text-muted)", fontSize: "11px" }}
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed(!collapsed);
          }}
        >
          {collapsed ? "Expand ▲" : "Collapse ▼"}
        </button>
      </div>

      {!collapsed && (
        <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <div>
              <span style={{ color: "var(--text-muted)" }}>File: </span>
              <span style={{ color: "var(--text-primary)" }}>{debugData.filename || "N/A"}</span>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Chars: </span>
              <span style={{ color: "var(--text-primary)" }}>{debugData.charCount?.toLocaleString() || 0}</span>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Concepts: </span>
              <span style={{ color: "var(--text-primary)" }}>{debugData.conceptCount || 0}</span>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>AI: </span>
              <span style={{ color: "var(--text-primary)" }}>Groq / GPT-OSS</span>
            </div>
          </div>
          {debugData.errorDetails && (
            <div style={{ color: "var(--danger-text)", backgroundColor: "var(--danger-light)", padding: "6px 8px", borderRadius: "var(--radius-xs)" }}>
              {debugData.errorDetails}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
