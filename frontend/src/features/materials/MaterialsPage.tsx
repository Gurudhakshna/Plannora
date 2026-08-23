import { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/shared/EmptyState";
import PageHeader from "../../components/shared/PageHeader";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import type { MaterialStatus } from "../../types/study-material";
import { formatDateKey } from "../../utils/storage";

function statusBadge(status: MaterialStatus): { label: string; variant: "neutral" | "primary" | "success" | "danger" } {
  switch (status) {
    case "uploaded":
      return { label: "Ready to analyze", variant: "neutral" };
    case "analyzing":
      return { label: "Analyzing...", variant: "primary" };
    case "analyzed":
      return { label: "Analyzed", variant: "success" };
    case "failed":
      return { label: "Analysis Failed", variant: "danger" };
  }
}

export default function MaterialsPage() {
  const {
    materials,
    aiNotes,
    handleUpload,
    handleAnalyzeMaterial,
    deleteMaterial,
    setViewingNotes,
  } = useApp();

  const [search, setSearch] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const filteredMaterials = useMemo(() => {
    if (!search.trim()) return materials;
    const q = search.toLowerCase();
    return materials.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.topic && m.topic.toLowerCase().includes(q)) ||
        (m.fileName && m.fileName.toLowerCase().includes(q))
    );
  }, [materials, search]);

  const targetMaterialToDelete = materials.find((m) => m.id === deleteTargetId);

  return (
    <div>
      <PageHeader
        title="Study Materials"
        description="Manage your uploaded PDFs, textbooks, lecture slides, and AI-extracted concept notes."
        action={
          <Button variant="primary" size="sm" onClick={() => handleUpload("file")}>
            + Upload Material
          </Button>
        }
      />

      {materials.length === 0 ? (
        <EmptyState
          title="No study materials uploaded yet"
          description="Upload course lecture notes, textbook chapters, or PDF handouts. Plannora's AI will parse key definitions, prerequisite formulas, and learning milestones."
          action={
            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="primary" size="md" onClick={() => handleUpload("file")}>
                Upload PDF Handout
              </Button>
              <Button variant="secondary" size="md" onClick={() => handleUpload("text")}>
                Type / Paste Notes
              </Button>
            </div>
          }
        />
      ) : (
        <div>
          {/* Filter / Search Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 16 }}>
            <div style={{ maxWidth: 360, width: "100%" }}>
              <Input
                placeholder="Search materials by title or topic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                }
              />
            </div>
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              {filteredMaterials.length} of {materials.length} files
            </span>
          </div>

          {/* Table Container */}
          <div className="materials-table-wrapper">
            <table className="materials-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Subject / Topic</th>
                  <th>Status</th>
                  <th>Uploaded Date</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map((m) => {
                  const status = statusBadge(m.analysisStatus);
                  const note = aiNotes.find((n) => n.materialId === m.id);

                  return (
                    <tr key={m.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "var(--radius-md)",
                              backgroundColor: "var(--bg-elevated)",
                              border: "1px solid var(--border)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--accent-text)",
                              flexShrink: 0,
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{m.title}</div>
                            {m.fileName && <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{m.fileName}</span>}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                          {m.topic || "General"}
                        </span>
                      </td>

                      <td>
                        <Badge variant={status.variant} dot>
                          {status.label}
                        </Badge>
                      </td>

                      <td>
                        <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                          {formatDateKey(m.createdAt)}
                        </span>
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                          {m.analysisStatus === "uploaded" && (
                            <Button variant="primary" size="sm" onClick={() => handleAnalyzeMaterial(m.id)}>
                              Analyze Concepts
                            </Button>
                          )}
                          {m.analysisStatus === "analyzed" && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                if (note) setViewingNotes(note);
                              }}
                            >
                              View Notes
                            </Button>
                          )}
                          {m.analysisStatus === "failed" && (
                            <Button variant="secondary" size="sm" onClick={() => handleAnalyzeMaterial(m.id)}>
                              Retry
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTargetId(m.id)}
                            aria-label={`Delete ${m.title}`}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--danger-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) {
            deleteMaterial(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        title="Delete Study Material?"
        message={
          <>
            Are you sure you want to delete <strong style={{ color: "var(--text-primary)" }}>{targetMaterialToDelete?.title}</strong>? All associated concept notes and generated AI tasks will also be removed.
          </>
        }
        confirmLabel="Delete Material"
        variant="danger"
      />
    </div>
  );
}
