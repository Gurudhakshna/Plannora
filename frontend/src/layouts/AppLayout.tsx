import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { AppContextProvider, useApp } from "../context/AppContext";
import AddTaskModal from "../components/AddTaskModal";
import UploadModal from "../components/UploadModal";
import AnalyzingOverlay from "../components/AnalyzingOverlay";
import ErrorBanner from "../components/shared/ErrorBanner";
import Toast from "../components/shared/Toast";
import DebugInfoBar from "../components/shared/DebugInfoBar";
import AINotesView from "../components/AINotesView";
import TeachMePanel from "../components/TeachMePanel";

function AppLayoutContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const {
    taskModalOpen,
    setTaskModalOpen,
    editingTask,
    addTask,
    editTask,
    showUploadModal,
    setShowUploadModal,
    uploadInitialMode,
    handleFilesReady,
    handleTextReady,
    isAnalyzing,
    analysisError,
    setAnalysisError,
    materials,
    viewingNotes,
    setViewingNotes,
    teachingConcept,
    setTeachingConcept,
    handleTeachConcept,
    handleMarkConceptUnderstood,
    handleAnalyzeMaterial,
    toast,
    hideToast,
    debugData,
  } = useApp();

  const viewingMaterial = viewingNotes
    ? materials.find((m) => m.id === viewingNotes.materialId)
    : undefined;

  return (
    <div className="app-container">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />
      <div className="app-main-area">
        <Header onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="app-content" id="main-content">
          {analysisError && (
            <ErrorBanner message={analysisError} onDismiss={() => setAnalysisError(null)} />
          )}
          <Outlet />
        </main>
      </div>

      {/* Global Modals & Overlays */}
      <AddTaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={(data) => {
          if (editingTask) {
            editTask(editingTask.id, data);
          } else {
            addTask(data);
          }
        }}
        editingTask={editingTask}
      />

      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onFilesReady={handleFilesReady}
          onTextReady={handleTextReady}
          isAnalyzing={isAnalyzing}
          initialMode={uploadInitialMode}
        />
      )}

      {isAnalyzing && <AnalyzingOverlay />}

      {viewingNotes && (
        <AINotesView
          notes={viewingNotes}
          materialName={viewingMaterial?.fileName || viewingMaterial?.title}
          onClose={() => setViewingNotes(null)}
          onRegenerate={() => {
            if (viewingNotes.materialId) {
              setViewingNotes(null);
              handleAnalyzeMaterial(viewingNotes.materialId);
            }
          }}
          onTeachConcept={(conceptName) => {
            setViewingNotes(null);
            handleTeachConcept(conceptName);
          }}
        />
      )}

      {teachingConcept && (
        <TeachMePanel
          concept={teachingConcept.concept}
          materialTitle={teachingConcept.materialTitle}
          onClose={() => setTeachingConcept(null)}
          onMarkUnderstood={handleMarkConceptUnderstood}
        />
      )}

      <DebugInfoBar debugData={debugData} />

      {toast && (
        <div className="toast-container">
          <Toast message={toast.message} type={toast.type} onClose={hideToast} />
        </div>
      )}
    </div>
  );
}

export default function AppLayout() {
  return (
    <AppContextProvider>
      <AppLayoutContent />
    </AppContextProvider>
  );
}
