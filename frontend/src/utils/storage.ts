import type { Task, StudyPlan } from "../types/task";

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
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
