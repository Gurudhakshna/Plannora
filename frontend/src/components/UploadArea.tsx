import { useState, useRef, useCallback } from "react";
import type { UploadedFile } from "../types/study-material";
import Button from "./ui/Button";

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];
const ACCEPTED_EXTENSIONS = ".pdf,.png,.jpg,.jpeg,.webp";
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface UploadAreaProps {
  onFilesReady: (files: UploadedFile[]) => void;
  onTextReady: (text: string, title: string) => void;
  isAnalyzing: boolean;
  initialMode?: "file" | "text";
  onCancel?: () => void;
}

export default function UploadArea({
  onFilesReady,
  onTextReady,
  isAnalyzing,
  initialMode = "file",
  onCancel,
}: UploadAreaProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTypingMode, setIsTypingMode] = useState(initialMode === "text");
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textTitleRef = useRef<HTMLInputElement>(null);

  const validateAndAddFiles = useCallback((fileList: FileList | File[]) => {
    setError(null);
    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(fileList)) {
      if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(pdf|png|jpg|jpeg|webp)$/i)) {
        setError(`"${file.name}" is not supported. Please upload PDF, PNG, JPG, or WEBP files.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" exceeds the 20 MB maximum limit.`);
        continue;
      }
      newFiles.push({
        id: generateId(),
        name: file.name,
        type: file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "image/png"),
        size: file.size,
        progress: 100,
        status: "complete",
        file,
      });
    }

    if (newFiles.length > 0) {
      setFiles(newFiles);
    }
  }, []);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
      e.target.value = "";
    }
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setError(null);
  }

  function handleSubmit() {
    if (files.length === 0 && !textContent.trim()) return;
    if (files.length > 0) {
      onFilesReady(files);
    } else if (textContent.trim()) {
      onTextReady(textContent.trim(), textTitle.trim() || "Untitled Notes");
    }
  }

  function switchToTyping() {
    setIsTypingMode(true);
    setTimeout(() => textTitleRef.current?.focus(), 50);
  }

  return (
    <div className="import-flow-container">
      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        multiple
        onChange={handleFileInputChange}
        style={{ display: "none" }}
        aria-hidden="true"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        capture="environment"
        onChange={handleFileInputChange}
        style={{ display: "none" }}
        aria-hidden="true"
      />

      {!isTypingMode ? (
        <>
          {files.length === 0 ? (
            /* Main Drag-and-Drop Zone */
            <div
              className={`import-dropzone ${isDragging ? "dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              aria-label="Upload study material file drop zone"
            >
              <div className="import-dropzone-icon" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>

              <h4 className="import-dropzone-title">
                {isDragging ? "Drop your file here" : "Drop your study material here"}
              </h4>
              <p className="import-dropzone-subtitle">
                or choose a file from your device
              </p>

              <div className="import-dropzone-cta" onClick={(e) => e.stopPropagation()}>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse Files
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  Capture Note Photo
                </Button>
              </div>

              <div className="import-dropzone-meta">
                PDF, JPG, PNG, WEBP &bull; Maximum 20 MB
              </div>
            </div>
          ) : (
            /* Selected File Ready State */
            <div className="import-selected-wrap">
              <div className="import-file-card">
                <div className="import-file-card-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="import-file-card-info">
                  <span className="import-file-card-name">{files[0].name}</span>
                  <span className="import-file-card-size">
                    {formatFileSize(files[0].size)} &bull; Ready to process
                  </span>
                </div>
                <button
                  type="button"
                  className="import-file-remove-btn"
                  onClick={() => removeFile(files[0].id)}
                  aria-label={`Remove ${files[0].name}`}
                  title="Remove file"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="import-action-bar">
                {onCancel && (
                  <Button variant="ghost" size="md" onClick={onCancel} disabled={isAnalyzing}>
                    Cancel
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSubmit}
                  loading={isAnalyzing}
                  style={{ flex: 1 }}
                >
                  {isAnalyzing ? "Processing Material..." : "Analyze Material"}
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="import-error-banner" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span style={{ flex: 1 }}>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                style={{ color: "var(--danger-text)", padding: 2 }}
                aria-label="Dismiss error"
              >
                &times;
              </button>
            </div>
          )}

          {/* Alternative Input Option */}
          {files.length === 0 && (
            <>
              <div className="import-divider">
                <span>OR</span>
              </div>

              <div className="import-notes-preview-card" onClick={switchToTyping}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="import-notes-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </div>
                  <div>
                    <h5 style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
                      Paste or type your notes
                    </h5>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      Directly enter text, definitions, or copied lecture transcripts.
                    </p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={switchToTyping}>
                  Continue with Notes &rarr;
                </Button>
              </div>
            </>
          )}
        </>
      ) : (
        /* Alternative Notes Input Workflow */
        <div className="import-typing-pane">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
              Paste or Type Notes
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsTypingMode(false)}
            >
              &larr; Back to File Upload
            </Button>
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label" htmlFor="import-note-title">
              Document / Topic Title
            </label>
            <input
              ref={textTitleRef}
              id="import-note-title"
              type="text"
              className="form-input"
              placeholder="e.g. Unit 3: Graph Search & Dijkstra's Algorithm"
              value={textTitle}
              onChange={(e) => setTextTitle(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" htmlFor="import-note-content">
              Study Content
            </label>
            <textarea
              id="import-note-content"
              className="form-textarea"
              rows={7}
              placeholder="Paste lecture notes, textbook excerpts, or formula sheets here... Plannora will detect key concepts, prerequisite structures, and schedule daily tasks."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {textContent.trim().length > 0
                ? `${textContent.trim().split(/\s+/).filter(Boolean).length} words`
                : "Enter at least 30 characters"}
            </span>

            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="ghost" size="md" onClick={() => setIsTypingMode(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSubmit}
                loading={isAnalyzing}
                disabled={textContent.trim().length < 30}
              >
                Analyze Notes &rarr;
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* What Happens Next Sequence */}
      <div className="import-next-steps">
        <span className="import-next-steps-title">What happens next?</span>
        <div className="import-steps-grid">
          <div className="import-step-item">
            <span className="import-step-num">1</span>
            <span className="import-step-text">Upload your material</span>
          </div>
          <div className="import-step-item">
            <span className="import-step-num">2</span>
            <span className="import-step-text">Plannora extracts the content</span>
          </div>
          <div className="import-step-item">
            <span className="import-step-num">3</span>
            <span className="import-step-text">AI identifies concepts & topics</span>
          </div>
          <div className="import-step-item">
            <span className="import-step-num">4</span>
            <span className="import-step-text">Your study workspace is generated</span>
          </div>
        </div>
      </div>
    </div>
  );
}
