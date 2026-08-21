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
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 2H12L15 5V18H4V2Z" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M12 2V5H15" stroke="currentColor" strokeWidth="1.3"/>
        <text x="6" y="14" fontSize="5.5" fontWeight="700" fill="currentColor" fontFamily="var(--font)">PDF</text>
      </svg>
    );
  }
  if (type === "image") {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/>
        <circle cx="7" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M2 15L6 10L10 14L13 9L18 15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M4 4H16M4 8H12M4 12H16M4 16H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

export default function MaterialsList({ materials, onViewNotes, onAnalyze, onDelete, onUpload }: MaterialsListProps) {
  if (materials.length === 0) {
    return (
      <div className="materials-page">
        <div className="empty-state">
          <div className="empty-state-icon-wrap">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <rect x="6" y="8" width="28" height="32" rx="4" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
              <path d="M20 8V14H34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.2"/>
              <path d="M24 22V34M18 28H30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
            </svg>
          </div>
          <h3 className="empty-state-title">No study materials yet</h3>
          <p className="empty-state-text">Upload your first PDF or notes to get AI-powered study notes and tasks.</p>
          <button className="btn btn-primary btn-lg" onClick={onUpload}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M8 2V12M3 7L8 2L13 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Upload Material
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="materials-page">
      <div className="materials-grid">
        {materials.map((m) => {
          const status = statusBadge(m.analysisStatus);
          return (
            <div key={m.id} className="material-card">
              <div className="material-card-header">
                <div className="material-card-icon">
                  {typeIcon(m.type)}
                </div>
                <div className="material-card-info">
                  <h3 className="material-card-title">{m.title}</h3>
                  {m.topic && <span className="material-card-topic">{m.topic}</span>}
                </div>
                <span className={`material-status-badge ${status.className}`}>
                  {status.label}
                </span>
              </div>
              <div className="material-card-meta">
                {m.fileName && <span className="material-meta-item">{m.fileName}</span>}
                <span className="material-meta-item">{formatDate(m.createdAt)}</span>
                {m.hasNotes && (
                  <span className="material-meta-item material-meta-has-notes">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Notes
                  </span>
                )}
                {m.hasTasks && (
                  <span className="material-meta-item material-meta-has-tasks">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M3.5 6L5.5 8L8.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Tasks
                  </span>
                )}
              </div>
              <div className="material-card-actions">
                {m.analysisStatus === "uploaded" && (
                  <button className="btn btn-primary btn-sm" onClick={() => onAnalyze(m.id)}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1L1 13H5L7 5L9 13H13L7 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Analyze
                  </button>
                )}
                {m.analysisStatus === "analyzed" && (
                  <button className="btn btn-primary btn-sm" onClick={() => onViewNotes(m.id)}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 2H10L12 4V12H2V2Z" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M4 7H10M4 9.5H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    View Notes
                  </button>
                )}
                {m.analysisStatus === "analyzing" && (
                  <span className="material-analyzing-text">
                    <span className="btn-spinner-sm" />
                    Analyzing...
                  </span>
                )}
                {m.analysisStatus === "failed" && (
                  <button className="btn btn-secondary btn-sm" onClick={() => onAnalyze(m.id)}>
                    Retry Analysis
                  </button>
                )}
                <button
                  className="task-action-btn delete-btn"
                  onClick={() => onDelete(m.id)}
                  aria-label={`Delete ${m.title}`}
                >
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <path d="M2.5 4H12.5M5.5 4V2.5C5.5 2.22 5.72 2 6 2H9C9.28 2 9.5 2.22 9.5 2.5V4M11.5 4V12.5C11.5 12.78 11.28 13 11 13H4C3.72 13 3.5 12.78 3.5 12.5V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
