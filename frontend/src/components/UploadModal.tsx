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

export default function UploadModal({ onClose, onFilesReady, onTextReady, isAnalyzing, initialMode = "file" }: UploadModalProps) {
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
        className="upload-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="upload-modal-header">
          <h2 id="upload-modal-title">Upload Study Material</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close upload dialog">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <UploadArea
          onFilesReady={onFilesReady}
          onTextReady={onTextReady}
          isAnalyzing={isAnalyzing}
          initialMode={initialMode}
        />
      </div>
    </div>
  );
}
