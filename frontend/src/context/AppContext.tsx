import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import type { ReactNode } from "react";
import type { Task } from "../types/task";
import type { StudyMaterial, AIStudyNotes, AIStudyTask, AIStudyPlan, UploadedFile, DetectedConcept } from "../types/study-material";
import { useAuth } from "../hooks/useAuth";
import { useTaskManager } from "../hooks/useTaskManager";
import { useMaterialManager } from "../hooks/useMaterialManager";
import { useStudyPlan } from "../hooks/useStudyPlan";
import { useToast } from "../hooks/useToast";
import {
  analyzeContent,
  analysisToNotes,
  analysisToTasks,
  analysisToPlan,
  extractTextFromUpload,
  generateId,
} from "../utils/aiEngine";
import { API_BASE } from "../services/apiClient";
import { aiTaskToTask } from "../utils/aiTasks";
import type { DebugState } from "../components/shared/DebugInfoBar";

export interface UserActivityState {
  topicStats: Record<string, {
    subject: string;
    correctCount: number;
    totalCount: number;
    ratings: string[];
  }>;
}

export interface AppContextValue {
  // Tasks
  tasks: Task[];
  allTasks: Task[];
  addTask: (data: Omit<Task, "id" | "createdAt" | "completed" | "userId">) => Task | undefined;
  editTask: (id: string, data: Partial<Omit<Task, "id" | "createdAt" | "userId">>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;

  // Materials & AI notes/tasks
  materials: StudyMaterial[];
  aiNotes: AIStudyNotes[];
  aiTasks: AIStudyTask[];
  aiPlan: AIStudyPlan | null;
  addMaterial: (material: StudyMaterial) => void;
  deleteMaterial: (id: string) => void;
  toggleAITask: (id: string) => void;
  deleteAITask: (id: string) => void;

  // Study Plan
  studyPlan: ReturnType<typeof useStudyPlan>["studyPlan"];
  savePlan: ReturnType<typeof useStudyPlan>["savePlan"];
  planExists: boolean;

  // Modals & UI States
  isAnalyzing: boolean;
  analysisError: string | null;
  setAnalysisError: (err: string | null) => void;
  showUploadModal: boolean;
  setShowUploadModal: (open: boolean) => void;
  uploadInitialMode: "file" | "text";
  setUploadInitialMode: (mode: "file" | "text") => void;
  viewingNotes: AIStudyNotes | null;
  setViewingNotes: (notes: AIStudyNotes | null) => void;
  teachingConcept: { concept: DetectedConcept; materialTitle: string } | null;
  setTeachingConcept: (concept: { concept: DetectedConcept; materialTitle: string } | null) => void;
  taskModalOpen: boolean;
  setTaskModalOpen: (open: boolean) => void;
  editingTask: Task | null;
  setEditingTask: (task: Task | null) => void;

  // Activity Tracking
  userActivity: UserActivityState;
  recordQuizResult: (topic: string, subject: string, correct: number, total: number) => void;
  recordFlashcardRating: (topic: string, rating: string) => void;

  // Operations
  handleUpload: (mode?: "file" | "text") => void;
  handleFilesReady: (files: UploadedFile[]) => Promise<void>;
  handleTextReady: (text: string, title: string) => Promise<void>;
  handleAnalyzeMaterial: (materialId: string) => Promise<void>;
  handleTeachConcept: (conceptName: string, materialTitle?: string) => void;
  handleMarkConceptUnderstood: (conceptName: string) => void;
  showToast: ReturnType<typeof useToast>["showToast"];
  toast: ReturnType<typeof useToast>["toast"];
  hideToast: ReturnType<typeof useToast>["hideToast"];
  debugData: DebugState;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.uid || null;

  const { tasks, addTask, editTask, deleteTask, toggleTaskComplete } = useTaskManager(userId);
  const {
    materials,
    aiNotes,
    aiTasks,
    aiPlan,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    toggleAITask,
    deleteAITask,
    saveAnalysisResults,
  } = useMaterialManager(userId);
  const { studyPlan, savePlan, planExists } = useStudyPlan(userId);
  const { toast, showToast, hideToast } = useToast();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadInitialMode, setUploadInitialMode] = useState<"file" | "text">("file");
  const [viewingNotes, setViewingNotes] = useState<AIStudyNotes | null>(null);
  const [teachingConcept, setTeachingConcept] = useState<{ concept: DetectedConcept; materialTitle: string } | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [debugData, setDebugData] = useState<DebugState>({ status: "IDLE" });

  // Persistent User Activity State for Diagnostics
  const [userActivity, setUserActivity] = useState<UserActivityState>(() => {
    try {
      const stored = localStorage.getItem("plannora_user_activity");
      return stored ? JSON.parse(stored) : { topicStats: {} };
    } catch {
      return { topicStats: {} };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("plannora_user_activity", JSON.stringify(userActivity));
    } catch {
      // Ignored
    }
  }, [userActivity]);

  const recordQuizResult = useCallback((topic: string, subject: string, correct: number, total: number) => {
    setUserActivity((prev) => {
      const stats = { ...(prev.topicStats || {}) };
      const current = stats[topic] || { subject: subject || "General", correctCount: 0, totalCount: 0, ratings: [] };
      stats[topic] = {
        ...current,
        subject: subject || current.subject,
        correctCount: current.correctCount + correct,
        totalCount: current.totalCount + total,
      };
      return { topicStats: stats };
    });
  }, []);

  const recordFlashcardRating = useCallback((topic: string, rating: string) => {
    setUserActivity((prev) => {
      const stats = { ...(prev.topicStats || {}) };
      const current = stats[topic] || { subject: "General", correctCount: 0, totalCount: 0, ratings: [] };
      stats[topic] = {
        ...current,
        ratings: [...current.ratings, rating],
      };
      return { topicStats: stats };
    });
  }, []);

  const allTasks = useMemo(() => [...tasks, ...aiTasks.map(aiTaskToTask)], [tasks, aiTasks]);

  const handleUpload = useCallback((mode: "file" | "text" = "file") => {
    setUploadInitialMode(mode);
    setShowUploadModal(true);
  }, []);

  const analyzeMaterial = useCallback(
    async (materialId: string, topic: string, contentText?: string, filename?: string) => {
      if (!user) return;
      try {
        if (!contentText || contentText.trim().length < 30) {
          const errMsg = "This document does not contain extractable text. Please ensure it has readable text notes.";
          setDebugData((prev) => ({ ...prev, status: "ERROR", errorDetails: errMsg }));
          throw new Error(errMsg);
        }

        setDebugData((prev) => ({ ...prev, status: "ANALYZING" }));
        updateMaterial(materialId, (m) => ({ ...m, analysisStatus: "analyzing" }));

        const analysis = await analyzeContent(contentText, filename || topic);
        const notes = analysisToNotes(analysis, materialId, user.uid);
        const newTasks = analysisToTasks(analysis, materialId, user.uid);
        const plan = analysisToPlan(analysis, materialId, user.uid);

        saveAnalysisResults(materialId, notes, newTasks, plan);

        setDebugData((prev) => ({
          ...prev,
          status: "SUCCESS",
          conceptCount: analysis.concepts?.length || 0,
          errorDetails: undefined,
        }));
        showToast(`"${analysis.materialTitle}" analyzed — ${newTasks.length} concept-specific tasks created.`, "success");
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "AI analysis failed. Please try again.";
        setDebugData((prev) => ({ ...prev, status: "ERROR", errorDetails: errMsg }));
        setAnalysisError(errMsg);
        updateMaterial(materialId, (m) => ({ ...m, analysisStatus: "failed" }));
      } finally {
        setIsAnalyzing(false);
      }
    },
    [user, updateMaterial, saveAnalysisResults, showToast]
  );

  const handleFilesReady = useCallback(
    async (files: UploadedFile[]) => {
      if (!user) return;
      setAnalysisError(null);
      setShowUploadModal(false);

      const firstFile = files[0];
      let extractedText = "";

      setDebugData({
        filename: firstFile?.name || "Uploaded PDF",
        status: "EXTRACTING",
        apiUrl: `${API_BASE}/analyze/file`,
      });

      if (firstFile?.file) {
        try {
          setIsAnalyzing(true);
          const extraction = await extractTextFromUpload(firstFile.file);
          extractedText = extraction.text;
        } catch (err: unknown) {
          setIsAnalyzing(false);
          const errMsg = err instanceof Error
            ? err.message
            : "Could not read this file. Please upload a clearer PDF or photo.";
          setAnalysisError(errMsg);
          setDebugData((prev) => ({ ...prev, status: "ERROR", errorDetails: errMsg }));
          return;
        }
      }

      const topic = firstFile?.name?.replace(/\.[^/.]+$/, "") || "Uploaded Material";

      const newMaterial: StudyMaterial = {
        id: generateId(),
        title: files.map((f) => f.name).join(", "),
        type: files[0]?.type.includes("pdf") ? "pdf" : "image",
        fileName: files[0]?.name,
        fileType: files[0]?.type,
        fileSize: files[0]?.size,
        content: extractedText,
        createdAt: new Date().toISOString(),
        userId: user.uid,
        analysisStatus: "uploaded",
        hasNotes: false,
        hasTasks: false,
      };

      addMaterial(newMaterial);
      await analyzeMaterial(newMaterial.id, topic, extractedText, firstFile?.name);
    },
    [user, addMaterial, analyzeMaterial]
  );

  const handleTextReady = useCallback(
    async (text: string, title: string) => {
      if (!user) return;
      setAnalysisError(null);

      if (!text || text.trim().length < 30) {
        const errMsg = "Please enter at least 30 characters of study notes to analyze.";
        setAnalysisError(errMsg);
        return;
      }

      setDebugData({
        filename: title || "Typed Notes",
        charCount: text.length,
        snippet: text.slice(0, 300) + "...",
        status: "ANALYZING",
        apiUrl: `${API_BASE}/analyze/text`,
      });

      setShowUploadModal(false);
      setIsAnalyzing(true);

      const newMaterial: StudyMaterial = {
        id: generateId(),
        title: title || "Untitled Notes",
        type: "text",
        content: text,
        createdAt: new Date().toISOString(),
        userId: user.uid,
        analysisStatus: "uploaded",
        hasNotes: false,
        hasTasks: false,
      };

      addMaterial(newMaterial);
      await analyzeMaterial(newMaterial.id, title, text, title);
    },
    [user, addMaterial, analyzeMaterial]
  );

  const handleAnalyzeMaterial = useCallback(
    async (materialId: string) => {
      if (!user) return;
      setIsAnalyzing(true);
      setAnalysisError(null);
      const material = materials.find((m) => m.id === materialId);
      const topic = material?.title || "Study Material";
      await analyzeMaterial(materialId, topic, material?.content, material?.fileName || material?.title);
    },
    [user, materials, analyzeMaterial]
  );

  const handleTeachConcept = useCallback(
    (conceptName: string, materialTitle?: string) => {
      let foundConcept: DetectedConcept | null = null;
      let title = materialTitle || materials[0]?.title || "Study Material";

      for (const note of aiNotes) {
        if (note.concepts && note.concepts.length > 0) {
          const match = note.concepts.find(
            (c) =>
              c.name.toLowerCase() === conceptName.toLowerCase() ||
              conceptName.toLowerCase().includes(c.name.toLowerCase()) ||
              c.name.toLowerCase().includes(conceptName.toLowerCase())
          );
          if (match) {
            foundConcept = match;
            title = note.topic;
            break;
          }
        }
      }

      if (!foundConcept) {
        const activeNotes = aiNotes.find((n) => n.topic === title) || aiNotes[0];
        const matchedDef = activeNotes?.definitions?.find(
          (d) =>
            d.term.toLowerCase() === conceptName.toLowerCase() ||
            conceptName.toLowerCase().includes(d.term.toLowerCase())
        );

        foundConcept = {
          name: conceptName,
          priority: "high",
          category: "concept",
          estimatedMinutes: 15,
          dependencies: [],
          simpleExplanation: matchedDef
            ? matchedDef.definition
            : `Core concept covering ${conceptName} from ${title}.`,
          detailedExplanation: activeNotes?.summary
            ? `${activeNotes.summary} This section focuses specifically on ${conceptName}.`
            : `Thorough breakdown of ${conceptName} from your uploaded study material.`,
          example: activeNotes?.examples?.[0]?.detail || `Applying ${conceptName} in practical scenarios.`,
          commonMistake: activeNotes?.commonMistakes?.[0] || `Confusing ${conceptName} with adjacent topics.`,
          keyTakeaway: activeNotes?.importantPoints?.[0] || `Master the core principles of ${conceptName}.`,
          analogy: `Think of ${conceptName} in terms of structured real-world workflows.`,
          miniQuestion: `What is the primary function of ${conceptName}?`,
          miniQuestionAnswer: matchedDef ? matchedDef.definition : `Refer to the section on ${conceptName} in your notes.`,
          status: "not-started",
        };
      }

      setTeachingConcept({ concept: foundConcept, materialTitle: title });
    },
    [materials, aiNotes]
  );

  const handleMarkConceptUnderstood = useCallback(
    (conceptName: string) => {
      showToast(`"${conceptName}" marked as Understood! Progress updated.`, "success");
    },
    [showToast]
  );

  const value: AppContextValue = {
    tasks,
    allTasks,
    addTask,
    editTask,
    deleteTask,
    toggleTaskComplete,
    materials,
    aiNotes,
    aiTasks,
    aiPlan,
    addMaterial,
    deleteMaterial,
    toggleAITask,
    deleteAITask,
    studyPlan,
    savePlan,
    planExists,
    isAnalyzing,
    analysisError,
    setAnalysisError,
    showUploadModal,
    setShowUploadModal,
    uploadInitialMode,
    setUploadInitialMode,
    viewingNotes,
    setViewingNotes,
    teachingConcept,
    setTeachingConcept,
    taskModalOpen,
    setTaskModalOpen,
    editingTask,
    setEditingTask,
    userActivity,
    recordQuizResult,
    recordFlashcardRating,
    handleUpload,
    handleFilesReady,
    handleTextReady,
    handleAnalyzeMaterial,
    handleTeachConcept,
    handleMarkConceptUnderstood,
    showToast,
    toast,
    hideToast,
    debugData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within an AppContextProvider");
  }
  return ctx;
}
