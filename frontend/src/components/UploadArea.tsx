import { useState, useRef, useCallback } from "react";
import type { UploadedFile } from "../types/study-material";

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
];
const ACCEPTED_EXTENSIONS = ".pdf,.png,.jpg,.jpeg";
const MAX_FILE_SIZE = 20 * 1024 * 1024;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeLabel(type: string): string {
  if (type === "application/pdf") return "PDF";
  if (type === "image/png") return "PNG";
  if (type === "image/jpeg") return "JPG";
  return type.split("/")[1]?.toUpperCase() || "File";
}

interface UploadAreaProps {
  onFilesReady: (files: UploadedFile[]) => void;
  onTextReady: (text: string, title: string) => void;
  isAnalyzing: boolean;
  initialMode?: "file" | "text";
}

export default function UploadArea({ onFilesReady, onTextReady, isAnalyzing, initialMode = "file" }: UploadAreaProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTextInput, setShowTextInput] = useState(initialMode === "text");
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textTitleRef = useRef<HTMLInputElement>(null);

  const validateAndAddFiles = useCallback((fileList: FileList | File[]) => {
    setError(null);
    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(fileList)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(`"${file.name}" is not a supported file type. Please upload PDF, PNG, or JPG files.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" exceeds the 20 MB size limit.`);
        continue;
      }
      newFiles.push({
        id: generateId(),
        name: file.name,
        type: file.type,
        size: file.size,
        progress: 0,
        status: "complete",
      });
    }

    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
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
  }

  function handleSubmit() {
    if (files.length === 0 && !textContent.trim()) return;
    if (files.length > 0) {
      onFilesReady(files);
    }
    if (textContent.trim()) {
      onTextReady(textContent.trim(), textTitle.trim() || "Untitled Notes");
    }
    setFiles([]);
    setTextContent("");
    setTextTitle("");
    setShowTextInput(false);
  }

  function switchToText() {
    setShowTextInput(true);
    window.setTimeout(() => textTitleRef.current?.focus(), 0);
  }

  const hasInput = files.length > 0 || textContent.trim().length > 0;

  return (
    <div className="upload-section">
      {!showTextInput ? (
        <>
          <div
            className={`upload-dropzone ${isDragging ? "dragging" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              multiple
              onChange={handleFileInputChange}
              onClick={(e) => e.stopPropagation()}
              className="upload-file-input"
              aria-label="Choose files to upload"
            />
            <div className="upload-dropzone-icon" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect x="4" y="8" width="32" height="28" rx="4" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                <path d="M20 16V28M14 22L20 16L26 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
                <path d="M12 8V6C12 4.9 12.9 4 14 4H26C27.1 4 28 4.9 28 6V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
              </svg>
            </div>
            <p className="upload-dropzone-text">
              {isDragging ? "Drop your files here" : "Drag & drop PDF or images here"}
            </p>
            <p className="upload-dropzone-sub">or click to browse files</p>
            <span className="upload-dropzone-formats">PDF &bull; JPG &bull; PNG supported &bull; Max 20 MB</span>
          </div>

          {error && (
            <div className="upload-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 5V8.5M8 11V11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {error}
              <button className="upload-error-close" onClick={() => setError(null)} aria-label="Dismiss error">&times;</button>
            </div>
          )}

          {files.length > 0 && (
            <ul className="upload-file-list" aria-label="Selected files">
              {files.map((f) => (
                <li key={f.id} className="upload-file-item">
                  <div className="upload-file-icon" aria-hidden="true">
                    {f.type === "application/pdf" ? (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M4 2H11L14 5V16H4V2Z" stroke="currentColor" strokeWidth="1.3"/>
                        <path d="M11 2V5H14" stroke="currentColor" strokeWidth="1.3"/>
                        <text x="6" y="12.5" fontSize="5" fontWeight="700" fill="currentColor" fontFamily="var(--font)">PDF</text>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                        <circle cx="7" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M2 13L6 9L9 12L12 8L16 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div className="upload-file-info">
                    <span className="upload-file-name">{f.name}</span>
                    <span className="upload-file-meta">
                      {getFileTypeLabel(f.type)} &bull; {formatFileSize(f.size)} &bull; Ready
                    </span>
                  </div>
                  <button
                    className="upload-file-remove"
                    onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                    aria-label={`Remove ${f.name}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="upload-divider">
            <span>or</span>
          </div>

          <button
            className="btn btn-secondary upload-type-btn"
            onClick={switchToText}
            disabled={isAnalyzing}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 3H13M3 7H10M3 11H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Type Your Notes
          </button>
        </>
      ) : (
        <div className="upload-text-input">
          <div className="upload-text-header">
            <h3>Type Your Notes</h3>
            <button className="upload-text-back" onClick={() => setShowTextInput(false)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to upload
            </button>
          </div>
          <div className="form-group">
            <label htmlFor="upload-note-title">Note title</label>
            <input
              ref={textTitleRef}
              id="upload-note-title"
              type="text"
              placeholder="e.g., Operating System Processes"
              value={textTitle}
              onChange={(e) => setTextTitle(e.target.value)}
              className="upload-text-title"
            />
          </div>
          <div className="form-group">
            <label htmlFor="upload-note-content">Note content</label>
            <textarea
              id="upload-note-content"
              placeholder="Paste or type your study notes here... Include concepts, definitions, formulas, or any study material you want analyzed."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="upload-text-area"
              rows={10}
            />
          </div>
          <div className="upload-text-footer">
            <span className="upload-text-count" aria-live="polite">
              {textContent.length > 0 ? `${textContent.split(/\s+/).filter(Boolean).length} words` : "Start typing..."}
            </span>
          </div>
        </div>
      )}

      {hasInput && (
        <div className="upload-actions">
          <button
            className="btn btn-primary btn-lg upload-analyze-btn"
            onClick={handleSubmit}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <span className="btn-spinner" aria-hidden="true" />
                Analyzing...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M9 2L2 16H6L9 8L12 16H16L9 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Analyze with AI
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
