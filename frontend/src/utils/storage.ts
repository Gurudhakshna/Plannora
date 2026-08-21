import type { Task, StudyPlan } from "../types/task";
import type {
  StudyMaterial,
  AIStudyNotes,
  AIStudyTask,
  AIStudyPlan,
} from "../types/study-material";

function userTasksKey(userId: string): string {
  return `plannora_tasks_${userId}`;
}

function studyPlanKey(userId: string): string {
  return `plannora_study_plan_${userId}`;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function getToday(): string {
  return toDateKey(new Date());
}

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export function formatDateKey(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(dateStr.length > 10 ? dateStr : dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", options ?? { month: "short", day: "numeric" });
}

export function isOverdueDate(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr + "T00:00:00") < today;
}

export function loadTasks(userId: string): Task[] {
  try {
    const raw = localStorage.getItem(userTasksKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed as Task[];
      }
    }
  } catch {
    // corrupted data, reset
  }
  return [];
}

export function saveTasks(userId: string, tasks: Task[]): void {
  localStorage.setItem(userTasksKey(userId), JSON.stringify(tasks));
}

export function createTask(
  userId: string,
  data: Omit<Task, "id" | "createdAt" | "completed" | "userId">
): Task {
  return {
    ...data,
    id: generateId(),
    completed: false,
    createdAt: new Date().toISOString(),
    userId,
  };
}

export function saveStudyPlan(plan: StudyPlan): void {
  localStorage.setItem(studyPlanKey(plan.userId), JSON.stringify(plan));
}

export function loadStudyPlan(userId: string): StudyPlan | null {
  try {
    const raw = localStorage.getItem(studyPlanKey(userId));
    if (raw) {
      return JSON.parse(raw) as StudyPlan;
    }
  } catch {
    // corrupted data
  }
  return null;
}

export function hasStudyPlan(userId: string): boolean {
  return localStorage.getItem(studyPlanKey(userId)) !== null;
}

/* ---- Materials Storage ---- */

function materialsKey(userId: string): string {
  return `plannora_materials_${userId}`;
}

function aiNotesKey(userId: string): string {
  return `plannora_ai_notes_${userId}`;
}

function aiTasksKey(userId: string): string {
  return `plannora_ai_tasks_${userId}`;
}

function aiPlanKey(userId: string): string {
  return `plannora_ai_plan_${userId}`;
}

export function loadMaterials(userId: string): StudyMaterial[] {
  try {
    const raw = localStorage.getItem(materialsKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as StudyMaterial[];
    }
  } catch { /* corrupted */ }
  return [];
}

export function saveMaterials(userId: string, materials: StudyMaterial[]): void {
  localStorage.setItem(materialsKey(userId), JSON.stringify(materials));
}

export function loadAINotes(userId: string): AIStudyNotes[] {
  try {
    const raw = localStorage.getItem(aiNotesKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as AIStudyNotes[];
    }
  } catch { /* corrupted */ }
  return [];
}

export function saveAINotes(userId: string, notes: AIStudyNotes[]): void {
  localStorage.setItem(aiNotesKey(userId), JSON.stringify(notes));
}

export function loadAITasks(userId: string): AIStudyTask[] {
  try {
    const raw = localStorage.getItem(aiTasksKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as AIStudyTask[];
    }
  } catch { /* corrupted */ }
  return [];
}

export function saveAITasks(userId: string, tasks: AIStudyTask[]): void {
  localStorage.setItem(aiTasksKey(userId), JSON.stringify(tasks));
}

export function loadAIPlan(userId: string): AIStudyPlan | null {
  try {
    const raw = localStorage.getItem(aiPlanKey(userId));
    if (raw) return JSON.parse(raw) as AIStudyPlan;
  } catch { /* corrupted */ }
  return null;
}

export function saveAIPlan(userId: string, plan: AIStudyPlan): void {
  localStorage.setItem(aiPlanKey(userId), JSON.stringify(plan));
}

export function clearAIPlan(userId: string): void {
  localStorage.removeItem(aiPlanKey(userId));
}

export function clearUserData(userId: string): void {
  const prefix = "plannora_";
  const suffixes = [
    `tasks_${userId}`,
    `study_plan_${userId}`,
    `materials_${userId}`,
    `ai_notes_${userId}`,
    `ai_tasks_${userId}`,
    `ai_plan_${userId}`,
  ];
  suffixes.forEach((suffix) => localStorage.removeItem(prefix + suffix));
}
