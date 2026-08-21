import type { Task } from "../types/task";
import type { AIStudyTask } from "../types/study-material";

export function aiTaskToTask(t: AIStudyTask): Task {
  return {
    id: t.id,
    title: t.title,
    subject: t.topic,
    date: t.dueDate || t.createdAt.slice(0, 10),
    priority: t.priority,
    description: "",
    duration: t.estimatedMinutes > 0 ? `${t.estimatedMinutes} min` : "",
    notes: "",
    completed: t.completed,
    createdAt: t.createdAt,
    userId: t.userId,
    source: "ai",
  };
}
