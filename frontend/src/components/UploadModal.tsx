import { useEffect } from "react";
import type { UploadedFile } from "../types/study-material";
import UploadArea from "./UploadArea";

export interface UploadModalProps {
  onClose: () => void;
  onFilesReady: (files: UploadedFile[]) => void;
  onTextReady: (text: string, title: string) => void;
  isAnalyzing: boolean;
  initialMode?: "file" | "text";
}

export default function UploadModal({
  onClose,
  onFilesReady,
  onTextReady,
  isAnalyzing,
  initialMode = "file",
}: UploadModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="import-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="import-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-modal-title"
        aria-describedby="import-modal-description"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="import-modal-header">
          <div className="import-modal-titles">
            <h2 id="import-modal-title" className="import-modal-title">
              Import Study Material
            </h2>
            <p id="import-modal-description" className="import-modal-subtitle">
              Upload your study material and let Plannora turn it into structured learning content.
            </p>
          </div>
          <button
            type="button"
            className="import-modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
            title="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="import-modal-body">
          <UploadArea
            onFilesReady={onFilesReady}
            onTextReady={onTextReady}
            isAnalyzing={isAnalyzing}
            initialMode={initialMode}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
