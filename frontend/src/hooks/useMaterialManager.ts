import { useState, useCallback, useEffect } from "react";
import type { StudyMaterial, AIStudyNotes, AIStudyTask, AIStudyPlan } from "../types/study-material";
import {
  loadMaterials,
  saveMaterials,
  loadAINotes,
  saveAINotes,
  loadAITasks,
  saveAITasks,
  loadAIPlan,
  saveAIPlan,
  clearAIPlan,
} from "../utils/storage";

export function useMaterialManager(userId?: string | null) {
  const [materials, setMaterials] = useState<StudyMaterial[]>(() => (userId ? loadMaterials(userId) : []));
  const [aiNotes, setAINotes] = useState<AIStudyNotes[]>(() => (userId ? loadAINotes(userId) : []));
  const [aiTasks, setAITasks] = useState<AIStudyTask[]>(() => (userId ? loadAITasks(userId) : []));
  const [aiPlan, setAIPlan] = useState<AIStudyPlan | null>(() => (userId ? loadAIPlan(userId) : null));

  useEffect(() => {
    if (userId) {
      setMaterials(loadMaterials(userId));
      setAINotes(loadAINotes(userId));
      setAITasks(loadAITasks(userId));
      setAIPlan(loadAIPlan(userId));
    } else {
      setMaterials([]);
      setAINotes([]);
      setAITasks([]);
      setAIPlan(null);
    }
  }, [userId]);

  const addMaterial = useCallback(
    (material: StudyMaterial) => {
      if (!userId) return;
      setMaterials((prev) => {
        const next = [material, ...prev];
        saveMaterials(userId, next);
        return next;
      });
    },
    [userId]
  );

  const updateMaterial = useCallback(
    (id: string, updater: (prevMat: StudyMaterial) => StudyMaterial) => {
      if (!userId) return;
      setMaterials((prev) => {
        const next = prev.map((m) => (m.id === id ? updater(m) : m));
        saveMaterials(userId, next);
        return next;
      });
    },
    [userId]
  );

  const deleteMaterial = useCallback(
    (id: string) => {
      if (!userId) return;
      setMaterials((prev) => {
        const next = prev.filter((m) => m.id !== id);
        saveMaterials(userId, next);
        return next;
      });
      setAINotes((prev) => {
        const next = prev.filter((n) => n.materialId !== id);
        saveAINotes(userId, next);
        return next;
      });
      setAITasks((prev) => {
        const next = prev.filter((t) => t.materialId !== id);
        saveAITasks(userId, next);
        return next;
      });
      if (aiPlan?.materialId === id) {
        setAIPlan(null);
        clearAIPlan(userId);
      }
    },
    [userId, aiPlan]
  );

  const toggleAITask = useCallback(
    (id: string) => {
      if (!userId) return;
      setAITasks((prev) => {
        const next = prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
        saveAITasks(userId, next);
        return next;
      });
    },
    [userId]
  );

  const deleteAITask = useCallback(
    (id: string) => {
      if (!userId) return;
      setAITasks((prev) => {
        const next = prev.filter((t) => t.id !== id);
        saveAITasks(userId, next);
        return next;
      });
    },
    [userId]
  );

  const saveAnalysisResults = useCallback(
    (materialId: string, notes: AIStudyNotes, tasks: AIStudyTask[], plan: AIStudyPlan) => {
      if (!userId) return;
      setAINotes((prev) => {
        const next = [...prev.filter((n) => n.materialId !== materialId), notes];
        saveAINotes(userId, next);
        return next;
      });
      setAITasks((prev) => {
        const next = [...prev.filter((t) => t.materialId !== materialId), ...tasks];
        saveAITasks(userId, next);
        return next;
      });
      setAIPlan(plan);
      saveAIPlan(userId, plan);
      updateMaterial(materialId, (m) => ({
        ...m,
        analysisStatus: "analyzed",
        hasNotes: true,
        hasTasks: true,
      }));
    },
    [userId, updateMaterial]
  );

  return {
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
    setAINotes,
    setAIPlan,
  };
}
