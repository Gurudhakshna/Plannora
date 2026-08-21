import { useState, useCallback, useMemo, useEffect } from "react";
import type { Task, Page } from "./types/task";
import type { StudyMaterial, AIStudyNotes, AIStudyTask, AIStudyPlan, UploadedFile } from "./types/study-material";
import {
  loadTasks, saveTasks, createTask,
  loadMaterials, saveMaterials,
  loadAINotes, saveAINotes,
  loadAITasks, saveAITasks,
  loadAIPlan, saveAIPlan, clearAIPlan,
} from "./utils/storage";
import { generateId, extractTopic, generateMockNotes, generateMockTasks, generateMockPlan } from "./utils/mockAI";
import { aiTaskToTask } from "./utils/aiTasks";
import { useAuth } from "./hooks/useAuth";
import { useTheme } from "./context/ThemeContext";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import TaskList from "./components/TaskList";
import AddTaskModal from "./components/AddTaskModal";
import Calendar from "./components/Calendar";
import ProgressDashboard from "./components/ProgressDashboard";
import UploadModal from "./components/UploadModal";
import AnalyzingOverlay from "./components/AnalyzingOverlay";
import ErrorBanner from "./components/ErrorBanner";
import MaterialsList from "./components/MaterialsList";
import AINotesView from "./components/AINotesView";
import StudyPlanView from "./components/StudyPlanView";
import Profile from "./components/Profile";
import Settings from "./components/Settings";

type AppPage = Page;

const PAGE_TITLES: Record<AppPage, string> = {
  dashboard: "Dashboard",
  plan: "Study Plan",
  materials: "My Materials",
  tasks: "My Tasks",
  calendar: "Calendar",
  progress: "Progress",
  profile: "Profile",
  settings: "Settings",
};

export default function App() {
  const { user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>(() => (user ? loadTasks(user.uid) : []));
  const [materials, setMaterials] = useState<StudyMaterial[]>(() => (user ? loadMaterials(user.uid) : []));
  const [aiNotes, setAINotes] = useState<AIStudyNotes[]>(() => (user ? loadAINotes(user.uid) : []));
  const [aiTasks, setAITasks] = useState<AIStudyTask[]>(() => (user ? loadAITasks(user.uid) : []));
  const [aiPlan, setAIPlan] = useState<AIStudyPlan | null>(() => (user ? loadAIPlan(user.uid) : null));

  const [currentPage, setCurrentPage] = useState<AppPage>("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [viewingNotes, setViewingNotes] = useState<AIStudyNotes | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadInitialMode, setUploadInitialMode] = useState<"file" | "text">("file");
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [loadedUserId, setLoadedUserId] = useState<string | null>(user?.uid ?? null);
  if ((user?.uid ?? null) !== loadedUserId) {
    setLoadedUserId(user?.uid ?? null);
    setTasks(user ? loadTasks(user.uid) : []);
    setMaterials(user ? loadMaterials(user.uid) : []);
    setAINotes(user ? loadAINotes(user.uid) : []);
    setAITasks(user ? loadAITasks(user.uid) : []);
    setAIPlan(user ? loadAIPlan(user.uid) : null);
  }

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!viewingNotes) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewingNotes(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewingNotes]);

  const updateTasks = useCallback(
    (updater: (prev: Task[]) => Task[]) => {
      if (!user) return;
      setTasks((prev) => {
        const next = updater(prev);
        saveTasks(user.uid, next);
        return next;
      });
    },
    [user]
  );

  const updateMaterials = useCallback(
    (updater: (prev: StudyMaterial[]) => StudyMaterial[]) => {
      if (!user) return;
      setMaterials((prev) => {
        const next = updater(prev);
        saveMaterials(user.uid, next);
        return next;
      });
    },
    [user]
  );

  const updateAINotes = useCallback(
    (updater: (prev: AIStudyNotes[]) => AIStudyNotes[]) => {
      if (!user) return;
      setAINotes((prev) => {
        const next = updater(prev);
        saveAINotes(user.uid, next);
        return next;
      });
    },
    [user]
  );

  const updateAITasks = useCallback(
    (updater: (prev: AIStudyTask[]) => AIStudyTask[]) => {
      if (!user) return;
      setAITasks((prev) => {
        const next = updater(prev);
        saveAITasks(user.uid, next);
        return next;
      });
    },
    [user]
  );

  function handleAddTask() {
    setEditingTask(null);
    setModalOpen(true);
  }

  function handleEditTask(task: Task) {
    setEditingTask(task);
    setModalOpen(true);
  }

  function handleSaveTask(data: Omit<Task, "id" | "createdAt" | "completed" | "userId">) {
    if (!user) return;
    if (editingTask) {
      updateTasks((prev) =>
        prev.map((t) => (t.id === editingTask.id ? { ...t, ...data } : t))
      );
    } else {
      updateTasks((prev) => [...prev, createTask(user.uid, data)]);
    }
  }

  function handleDeleteTask(id: string) {
    updateTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function handleToggleComplete(id: string) {
    updateTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }

  function handleToggleAITask(id: string) {
    updateAITasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }

  function handleDeleteAITask(id: string) {
    updateAITasks((prev) => prev.filter((t) => t.id !== id));
  }

  function handleNavigate(page: AppPage) {
    setCurrentPage(page);
  }

  function handleUpload(mode: "file" | "text" = "file") {
    setUploadInitialMode(mode);
    setShowUploadModal(true);
  }

  async function analyzeMaterial(materialId: string, topic: string) {
    if (!user) return;
    try {
      updateMaterials((prev) =>
        prev.map((m) => m.id === materialId ? { ...m, analysisStatus: "analyzing" as const } : m)
      );

      await new Promise((r) => setTimeout(r, 2000 + Math.random() * 2000));

      const notes = generateMockNotes(topic, materialId, user.uid);
      const newTasks = generateMockTasks(topic, materialId, user.uid);
      const plan = generateMockPlan(topic, materialId, user.uid);

      updateAINotes((prev) => [...prev, notes]);
      updateAITasks((prev) => [...prev, ...newTasks]);
      setAIPlan(plan);
      saveAIPlan(user.uid, plan);

      updateMaterials((prev) =>
        prev.map((m) => m.id === materialId ? { ...m, analysisStatus: "analyzed" as const, hasNotes: true, hasTasks: true } : m)
      );
      setToast(`"${topic}" analyzed — notes, tasks and a study plan are ready.`);
    } catch {
      setAnalysisError("Unable to analyze this material right now. Please try again.");
      updateMaterials((prev) =>
        prev.map((m) => m.id === materialId ? { ...m, analysisStatus: "failed" as const } : m)
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleFilesReady(files: UploadedFile[]) {
    if (!user) return;
    setAnalysisError(null);
    setShowUploadModal(false);
    setIsAnalyzing(true);

    const newMaterial: StudyMaterial = {
      id: generateId(),
      title: files.map((f) => f.name).join(", "),
      type: files[0]?.type.includes("pdf") ? "pdf" : "image",
      fileName: files[0]?.name,
      fileType: files[0]?.type,
      fileSize: files[0]?.size,
      content: "",
      createdAt: new Date().toISOString(),
      userId: user.uid,
      analysisStatus: "uploaded",
      hasNotes: false,
      hasTasks: false,
    };

    updateMaterials((prev) => [...prev, newMaterial]);
    await analyzeMaterial(newMaterial.id, extractTopic(files.map((f) => f.name).join(" ")));
  }

  async function handleTextReady(text: string, title: string) {
    if (!user) return;
    setAnalysisError(null);
    setShowUploadModal(false);
    setIsAnalyzing(true);

    const newMaterial: StudyMaterial = {
      id: generateId(),
      title,
      type: "text",
      content: text,
      createdAt: new Date().toISOString(),
      userId: user.uid,
      analysisStatus: "uploaded",
      hasNotes: false,
      hasTasks: false,
    };

    updateMaterials((prev) => [...prev, newMaterial]);
    await analyzeMaterial(newMaterial.id, title);
  }

  function handleViewNotes(materialId: string) {
    const notes = aiNotes.find((n) => n.materialId === materialId);
    if (notes) setViewingNotes(notes);
  }

  function handleDeleteMaterial(id: string) {
    if (!user) return;
    const material = materials.find((m) => m.id === id);
    if (material && !window.confirm(`Delete "${material.title}"? Its notes and tasks will also be removed.`)) {
      return;
    }
    updateMaterials((prev) => prev.filter((m) => m.id !== id));
    updateAINotes((prev) => prev.filter((n) => n.materialId !== id));
    updateAITasks((prev) => prev.filter((t) => t.materialId !== id));
    if (aiPlan?.materialId === id) {
      setAIPlan(null);
      clearAIPlan(user.uid);
    }
  }

  async function handleAnalyzeMaterial(materialId: string) {
    if (!user) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    const material = materials.find((m) => m.id === materialId);
    const topic = material?.title || "Study Material";
    await analyzeMaterial(materialId, topic);
  }

  function handleToggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  const allTasks = useMemo(() => [...tasks, ...aiTasks.map(aiTaskToTask)], [tasks, aiTasks]);

  return (
    <div className="app-layout">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />
      <div className="app-main">
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              className="topbar-menu-btn"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
            <h1 className="topbar-title">{PAGE_TITLES[currentPage]}</h1>
          </div>
          <div className="topbar-right">
            {(currentPage === "dashboard" || currentPage === "materials") && (
              <button className="btn btn-primary" onClick={() => handleUpload("file")}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2V12M3 7L8 2L13 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Upload Material
              </button>
            )}
            {currentPage === "tasks" && (
              <button className="btn btn-primary" onClick={handleAddTask}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                New Task
              </button>
            )}
            <button
              className="icon-btn"
              onClick={handleToggleTheme}
              aria-label={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              title={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            >
              {resolvedTheme === "dark" ? (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="4" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M9 1V3M9 15V17M1 9H3M15 9H17M3.5 3.5L4.9 4.9M13.1 13.1L14.5 14.5M14.5 3.5L13.1 4.9M4.9 13.1L3.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M15.5 11.2A7 7 0 0 1 6.8 2.5a7 7 0 1 0 8.7 8.7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        </header>
        <main className="main-content" id="main-content">
          {analysisError && (
            <ErrorBanner message={analysisError} onDismiss={() => setAnalysisError(null)} />
          )}
          {currentPage === "dashboard" && (
            <Dashboard
              tasks={tasks}
              materials={materials}
              aiTasks={aiTasks}
              onNavigate={handleNavigate}
              onAddTask={handleAddTask}
              onUpload={handleUpload}
              onViewNotes={handleViewNotes}
              onToggleAITask={handleToggleAITask}
              onDeleteAITask={handleDeleteAITask}
            />
          )}
          {currentPage === "plan" && (
            <StudyPlanView plan={aiPlan} onUpload={handleUpload} />
          )}
          {currentPage === "materials" && (
            <MaterialsList
              materials={materials}
              onViewNotes={handleViewNotes}
              onAnalyze={handleAnalyzeMaterial}
              onDelete={handleDeleteMaterial}
              onUpload={handleUpload}
            />
          )}
          {currentPage === "tasks" && (
            <TaskList
              tasks={tasks}
              aiTasks={aiTasks}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onToggleAIComplete={handleToggleAITask}
              onDeleteAI={handleDeleteAITask}
            />
          )}
          {currentPage === "calendar" && (
            <Calendar tasks={allTasks} />
          )}
          {currentPage === "progress" && (
            <ProgressDashboard tasks={allTasks} />
          )}
          {currentPage === "profile" && user && (
            <Profile user={user} tasks={allTasks} materials={materials} onNavigate={handleNavigate} />
          )}
          {currentPage === "settings" && <Settings />}
        </main>
      </div>
      <AddTaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveTask}
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
        <div className="modal-backdrop" onClick={() => setViewingNotes(null)}>
          <div className="notes-view-modal" role="dialog" aria-modal="true" aria-label={`AI notes for ${viewingNotes.topic}`} onClick={(e) => e.stopPropagation()}>
            <AINotesView
              notes={viewingNotes}
              onClose={() => setViewingNotes(null)}
              onSave={() => setViewingNotes(null)}
              onRegenerate={() => {
                if (user) {
                  const regenerated = generateMockNotes(viewingNotes.topic, viewingNotes.materialId, user.uid);
                  updateAINotes((prev) =>
                    prev.map((n) => n.materialId === viewingNotes.materialId ? regenerated : n)
                  );
                  setViewingNotes(regenerated);
                }
              }}
            />
          </div>
        </div>
      )}
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.15"/>
            <path d="M5 8L7 10L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {toast}
          <button className="toast-close" onClick={() => setToast(null)} aria-label="Dismiss notification">&times;</button>
        </div>
      )}
    </div>
  );
}
