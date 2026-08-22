import { useEffect } from "react";
import type { UploadedFile } from "../types/study-material";
import UploadArea from "./UploadArea";

interface UploadModalProps {
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
    <div className="upload-modal-overlay" onClick={onClose}>
      <div
        className="upload-modal saas-upload-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="upload-modal-header">
          <div className="modal-header-titles">
            <span className="modal-eyebrow">PLANNORA WORKSPACE</span>
            <h2 id="upload-modal-title">IMPORT STUDY MATERIAL</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close dialog">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="upload-modal-body">
          <UploadArea
            onFilesReady={onFilesReady}
            onTextReady={onTextReady}
            isAnalyzing={isAnalyzing}
            initialMode={initialMode}
          />
        </div>
      </div>
    </div>
  );
}
