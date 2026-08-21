import type { StudyMaterial, MaterialStatus } from "../types/study-material";

interface MaterialsListProps {
  materials: StudyMaterial[];
  onViewNotes: (materialId: string) => void;
  onAnalyze: (materialId: string) => void;
  onDelete: (materialId: string) => void;
  onUpload: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function statusBadge(status: MaterialStatus): { label: string; className: string } {
  switch (status) {
    case "uploaded": return { label: "Uploaded", className: "status-uploaded" };
    case "analyzing": return { label: "Analyzing", className: "status-analyzing" };
    case "analyzed": return { label: "Analyzed", className: "status-analyzed" };
    case "failed": return { label: "Failed", className: "status-failed" };
  }
}

function typeIcon(type: string) {
  if (type === "pdf") {
    return (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M4 2H11L14 5V16H4V2Z" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M11 2V5H14" stroke="currentColor" strokeWidth="1.3"/>
      </svg>
    );
  }
  if (type === "image") {
    return (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="3" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <circle cx="6.5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M2 13L6 9L9 12L12 8L16 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <path d="M3 4H15M3 8H11M3 12H15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

export default function MaterialsList({ materials, onViewNotes, onAnalyze, onDelete, onUpload }: MaterialsListProps) {
  if (materials.length === 0) {
    return (
      <div className="materials-page">
        <div className="dash-section" style={{ textAlign: "center", padding: "32px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "4px" }}>
            No study materials yet
          </h3>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
            Upload PDFs, notes, or images to let Plannora analyze concepts and build study plans.
          </p>
          <button className="btn btn-primary" onClick={onUpload}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 2V12M3 7L8 2L13 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Upload Material
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="materials-page">
      <div className="materials-table-card">
        <table className="materials-table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Topic / Subject</th>
              <th>Status</th>
              <th>Added</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => {
              const status = statusBadge(m.analysisStatus);
              return (
                <tr key={m.id}>
                  <td>
                    <div className="material-title-cell">
                      <div className="material-file-icon">{typeIcon(m.type)}</div>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: "500", color: "var(--text-primary)" }}>{m.title}</span>
                        {m.fileName && <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{m.fileName}</span>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      {m.topic || "General"}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${status.className}`}>{status.label}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{formatDate(m.createdAt)}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                      {m.analysisStatus === "uploaded" && (
                        <button className="btn btn-primary btn-sm" onClick={() => onAnalyze(m.id)}>
                          Analyze
                        </button>
                      )}
                      {m.analysisStatus === "analyzed" && (
                        <button className="btn btn-secondary btn-sm" onClick={() => onViewNotes(m.id)}>
                          View Notes
                        </button>
                      )}
                      {m.analysisStatus === "analyzing" && (
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Analyzing...</span>
                      )}
                      {m.analysisStatus === "failed" && (
                        <button className="btn btn-secondary btn-sm" onClick={() => onAnalyze(m.id)}>
                          Retry
                        </button>
                      )}
                      <button
                        className="task-action-btn delete-btn"
                        onClick={() => onDelete(m.id)}
                        aria-label={`Delete ${m.title}`}
                        title="Delete material"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2.5 3.5H11.5M5 3.5V2C5 1.7 5.2 1.5 5.5 1.5H8.5C8.8 1.5 9 1.7 9 2V3.5M10.5 3.5V11.5C10.5 11.8 10.3 12 10 12H4C3.7 12 3.5 11.8 3.5 11.5V3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
