/**
 * aiEngine.ts — Content-aware AI analysis engine.
 *
 * CRITICAL DIRECTIVE:
 * - Filename is NEVER treated as content.
 * - NO fake heuristic fallbacks or template phrase generation.
 * - If text extraction or Groq API call fails, throws an error so the UI shows a clean failure state.
 */

import type {
  AIStudyNotes,
  AIStudyTask,
  AIStudyPlan,
  AIAnalysis,
  TaskType,
} from "../types/study-material";

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export async function analyzeWithBackend(
  text: string,
  filename?: string
): Promise<AIAnalysis> {
  const res = await fetch(`${API_BASE}/analyze/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, filename }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new Error(errBody?.detail || `AI analysis failed (HTTP ${res.status}). Please try again.`);
  }

  const data = await res.json();
  if (data.success && data.analysis && Array.isArray(data.analysis.concepts) && data.analysis.concepts.length > 0) {
    return data.analysis as AIAnalysis;
  }

  throw new Error("AI analysis response did not contain valid concept structures.");
}

export async function analyzeContent(
  text: string,
  filename?: string
): Promise<AIAnalysis> {
  if (!text || text.trim().length < 30) {
    throw new Error(
      "This PDF does not contain extractable text. OCR is required for scanned/image-only PDFs."
    );
  }

  return await analyzeWithBackend(text, filename);
}

export function analysisToNotes(
  analysis: AIAnalysis,
  materialId: string,
  userId: string
): AIStudyNotes {
  return {
    id: generateId(),
    materialId,
    topic: analysis.materialTitle,
    summary: analysis.executiveSummary || `Material covering ${analysis.materialTitle}.`,
    keyConcepts: (analysis.concepts || []).map((c) => c.name),
    definitions: analysis.definitions || [],
    formulas: analysis.formulas || [],
    importantPoints: (analysis.concepts || [])
      .filter((c) => c.priority === "high")
      .map((c) => c.keyTakeaway || c.simpleExplanation),
    examples: (analysis.concepts || [])
      .filter((c) => c.example)
      .map((c) => ({ title: c.name, detail: c.example })),
    quickRevision: analysis.examFocusedNotes || [],
    thingsToRemember: analysis.memoryTricks || [],
    createdAt: new Date().toISOString(),
    userId,
    /* Store full DetectedConcept[] objects from Groq on AIStudyNotes */
    concepts: analysis.concepts || [],
    executiveSummary: analysis.executiveSummary,
    stepByStepExplanations: analysis.stepByStepExplanations || (analysis.concepts || [])
      .filter((c) => c.detailedExplanation)
      .map((c) => ({
        topic: c.name,
        steps: c.detailedExplanation.split(". ").filter(Boolean),
      })),
    commonMistakes: analysis.commonMistakes || [],
    memoryTricks: analysis.memoryTricks || [],
    examFocusedNotes: analysis.examFocusedNotes || [],
  };
}

export function analysisToTasks(
  analysis: AIAnalysis,
  materialId: string,
  userId: string
): AIStudyTask[] {
  const now = todayStr();
  return (analysis.tasks || []).map((t, i) => ({
    id: generateId(),
    materialId,
    title: t.title,
    completed: false,
    priority: t.priority || "Medium",
    estimatedMinutes: t.estimatedMinutes || 15,
    topic: analysis.materialTitle,
    dueDate: i === 0 ? now : undefined,
    createdAt: new Date().toISOString(),
    userId,
    conceptRef: t.conceptRef,
    taskType: t.taskType || ("learn" as TaskType),
  }));
}

export function analysisToPlan(
  analysis: AIAnalysis,
  materialId: string,
  userId: string
): AIStudyPlan {
  const today = new Date();
  const days: AIStudyPlan["days"] = [];
  const studyOrder = analysis.studyOrder || [];

  for (let i = 0; i < Math.min(3, Math.max(1, Math.ceil(studyOrder.length / 3))); i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const label =
      i === 0
        ? "Today"
        : i === 1
          ? "Tomorrow"
          : d.toLocaleDateString("en-US", { weekday: "long" });
    const slice = studyOrder.slice(i * 3, (i + 1) * 3);
    days.push({
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      label,
      sessions: slice.map((s) => ({
        duration: `${analysis.concepts?.find((c) => c.name === s.topic)?.estimatedMinutes || 15} min`,
        activity: `Study: ${s.topic}`,
      })),
    });
  }

  if (days.length === 0) {
    days.push({
      date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`,
      label: "Today",
      sessions: [{ duration: "30 min", activity: `Study: ${analysis.materialTitle}` }],
    });
  }

  return {
    id: generateId(),
    materialId,
    days,
    createdAt: new Date().toISOString(),
    userId,
  };
}
