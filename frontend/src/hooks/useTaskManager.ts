import { useState, useCallback, useEffect } from "react";
import type { Task } from "../types/task";
import { loadTasks, saveTasks, createTask } from "../utils/storage";

export function useTaskManager(userId?: string | null) {
  const [tasks, setTasks] = useState<Task[]>(() => (userId ? loadTasks(userId) : []));

  useEffect(() => {
    if (userId) {
      setTasks(loadTasks(userId));
    } else {
      setTasks([]);
    }
  }, [userId]);

  const addTask = useCallback(
    (data: Omit<Task, "id" | "createdAt" | "completed" | "userId">) => {
      if (!userId) return;
      const newTask = createTask(userId, data);
      setTasks((prev) => {
        const next = [newTask, ...prev];
        saveTasks(userId, next);
        return next;
      });
      return newTask;
    },
    [userId]
  );

  const editTask = useCallback(
    (id: string, data: Partial<Omit<Task, "id" | "createdAt" | "userId">>) => {
      if (!userId) return;
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === id ? { ...t, ...data } : t));
        saveTasks(userId, next);
        return next;
      });
    },
    [userId]
  );

  const deleteTask = useCallback(
    (id: string) => {
      if (!userId) return;
      setTasks((prev) => {
        const next = prev.filter((t) => t.id !== id);
        saveTasks(userId, next);
        return next;
      });
    },
    [userId]
  );

  const toggleTaskComplete = useCallback(
    (id: string) => {
      if (!userId) return;
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
        saveTasks(userId, next);
        return next;
      });
    },
    [userId]
  );

  return {
    tasks,
    addTask,
    editTask,
    deleteTask,
    toggleTaskComplete,
    setTasks,
  };
}
