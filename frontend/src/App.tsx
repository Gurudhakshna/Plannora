import { useState, useCallback } from "react";
import type { Task, Page } from "./types/task";
import { loadTasks, saveTasks, createTask } from "./utils/storage";
import { useAuth } from "./hooks/useAuth";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import TaskList from "./components/TaskList";
import AddTaskModal from "./components/AddTaskModal";
import Calendar from "./components/Calendar";
import ProgressDashboard from "./components/ProgressDashboard";

type AppPage = Page;

export default function App() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(() => (user ? loadTasks(user.uid) : []));
  const [currentPage, setCurrentPage] = useState<AppPage>("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  function handleNavigate(page: AppPage) {
    setCurrentPage(page);
  }

  return (
    <div className="app-layout">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="app-main">
        <header className="app-topbar">
          <div className="topbar-left">
            <h1 className="topbar-title">
              {currentPage === "dashboard" && "Dashboard"}
              {currentPage === "tasks" && "My Tasks"}
              {currentPage === "calendar" && "Calendar"}
              {currentPage === "progress" && "Progress"}
            </h1>
          </div>
          <div className="topbar-right">
            <button className="btn btn-primary" onClick={handleAddTask}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              New Task
            </button>
          </div>
        </header>
        <main className="main-content">
          {currentPage === "dashboard" && (
            <Dashboard
              tasks={tasks}
              onNavigate={handleNavigate}
              onAddTask={handleAddTask}
            />
          )}
          {currentPage === "tasks" && (
            <TaskList
              tasks={tasks}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
          )}
          {currentPage === "calendar" && (
            <Calendar tasks={tasks} />
          )}
          {currentPage === "progress" && (
            <ProgressDashboard tasks={tasks} />
          )}
        </main>
      </div>
      <AddTaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveTask}
        editingTask={editingTask}
      />
    </div>
  );
}
