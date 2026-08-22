import { useState, useRef, useCallback } from "react";
import type { UploadedFile } from "../types/study-material";

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
];
const ACCEPTED_EXTENSIONS = ".pdf,.png,.jpg,.jpeg";
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadAreaProps {
  onFilesReady: (files: UploadedFile[]) => void;
  onTextReady: (text: string, title: string) => void;
  isAnalyzing: boolean;
  initialMode?: "file" | "text";
}

export default function UploadArea({
  onFilesReady,
  onTextReady,
  isAnalyzing,
  initialMode = "file",
}: UploadAreaProps) {
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
      if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(pdf|png|jpg|jpeg)$/i)) {
        setError(`"${file.name}" is not supported. Please upload PDF, PNG, or JPG files.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" exceeds the 20 MB limit.`);
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
      setFiles(newFiles); // Replace or add
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

  function switchToText() {
    setShowTextInput(true);
    window.setTimeout(() => textTitleRef.current?.focus(), 0);
  }

  return (
    <div className="saas-upload-container">
      {/* Hidden file input -- never rendered directly in DOM flow */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        multiple
        onChange={handleFileInputChange}
        style={{ display: "none" }}
        aria-hidden="true"
      />

      {!showTextInput ? (
        <>
          {files.length === 0 ? (
            /* Drag and drop empty state */
            <div
              className={`saas-dropzone ${isDragging ? "dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="dropzone-icon-wrap" aria-hidden="true">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 16V4M12 4L8 8M12 4L16 8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 16.5C20 18.433 18.433 20 16.5 20H7.5C5.567 20 4 18.433 4 16.5" strokeLinecap="round"/>
                </svg>
              </div>

              <h4 className="dropzone-title">Drag and drop your study material here</h4>
              <p className="dropzone-subtitle">PDF, JPG, PNG &bull; Maximum file size: 20 MB</p>

              <div className="dropzone-buttons" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse Files
                </button>
                <span className="dropzone-or">or</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={switchToText}
                >
                  Paste / Type Notes
                </button>
              </div>
            </div>
          ) : (
            /* Selected File State */
            <div className="saas-selected-state">
              <div className="selected-file-card">
                <div className="file-icon-wrap">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" />
                    <path d="M14 2V8H20" />
                  </svg>
                </div>
                <div className="selected-file-details">
                  <span className="selected-file-name">{files[0].name}</span>
                  <span className="selected-file-meta">{formatFileSize(files[0].size)} &bull; Ready for analysis</span>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm remove-file-btn"
                  onClick={() => removeFile(files[0].id)}
                  aria-label="Remove selected file"
                >
                  Remove
                </button>
              </div>

              <div className="selected-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-lg w-full analyze-action-btn"
                  onClick={handleSubmit}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? "Analyzing Material..." : "Analyze Material"}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="saas-upload-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 5V8.5M8 11V11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>{error}</span>
              <button className="error-close" onClick={() => setError(null)} aria-label="Dismiss error">&times;</button>
            </div>
          )}
        </>
      ) : (
        /* Paste / Type Notes State */
        <div className="saas-type-notes">
          <div className="type-notes-head">
            <h4>Paste / Type Notes</h4>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setShowTextInput(false)}
            >
              ← Back to File Upload
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="notes-title-input">Material / Subject Title</label>
            <input
              ref={textTitleRef}
              id="notes-title-input"
              type="text"
              placeholder="e.g., Unit 2: Stack Data Structure & Operations"
              value={textTitle}
              onChange={(e) => setTextTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes-content-area">Study Content</label>
            <textarea
              id="notes-content-area"
              rows={8}
              placeholder="Paste or type lecture notes, textbook chapters, or topic definitions here... Plannora AI will analyze actual concepts and create learning tasks."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
            />
          </div>

          <div className="type-notes-footer">
            <span className="word-count">
              {textContent.trim().length > 0
                ? `${textContent.trim().split(/\s+/).length} words`
                : "Enter at least 20 characters of study notes"}
            </span>
            <button
              type="button"
              className="btn btn-primary btn-lg analyze-action-btn"
              onClick={handleSubmit}
              disabled={isAnalyzing || textContent.trim().length < 20}
            >
              {isAnalyzing ? "Analyzing Material..." : "Analyze Material"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
