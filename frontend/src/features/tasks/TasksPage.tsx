import { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Tabs from "../../components/ui/Tabs";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/shared/EmptyState";
import PageHeader from "../../components/shared/PageHeader";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import { formatDateKey } from "../../utils/storage";
import type { Task, Priority } from "../../types/task";

const priorityOrder: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };

export default function TasksPage() {
  const {
    tasks,
    aiTasks,
    toggleTaskComplete,
    deleteTask,
    toggleAITask,
    deleteAITask,
    setTaskModalOpen,
    setEditingTask,
  } = useApp();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [sortBy, setSortBy] = useState<"date" | "priority">("date");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }

    if (filter === "pending") result = result.filter((t) => !t.completed);
    if (filter === "completed") result = result.filter((t) => t.completed);

    return [...result].sort((a, b) => {
      if (sortBy === "date") return a.date.localeCompare(b.date);
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [tasks, search, filter, sortBy]);

  const counts = useMemo(
    () => ({
      all: tasks.length,
      pending: tasks.filter((t) => !t.completed).length,
      completed: tasks.filter((t) => t.completed).length,
    }),
    [tasks]
  );

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const handleNewTask = () => {
    setEditingTask(null);
    setTaskModalOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Tasks & Milestones"
        description="Track your assignments, concept revision tasks, and self-scheduled study targets."
        action={
          <Button variant="primary" size="sm" onClick={handleNewTask}>
            + New Task
          </Button>
        }
      />

      {/* Control Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Tabs
            items={[
              { id: "all", label: "All Tasks", badge: counts.all },
              { id: "pending", label: "Pending", badge: counts.pending },
              { id: "completed", label: "Completed", badge: counts.completed },
            ]}
            activeTab={filter}
            onChange={(id) => setFilter(id as "all" | "pending" | "completed")}
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "priority")}
            className="form-select"
            style={{ width: "auto", height: 34, padding: "0 10px", fontSize: "12.5px" }}
            aria-label="Sort order"
          >
            <option value="date">Sort by Deadline</option>
            <option value="priority">Sort by Priority</option>
          </select>
        </div>

        <div style={{ maxWidth: 300, width: "100%" }}>
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Personal Tasks Section */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          compact
          title={search ? "No tasks matching your search" : filter === "completed" ? "No completed tasks yet" : "No tasks created yet"}
          description={filter === "pending" ? "All caught up! Create a new study milestone to stay ahead." : undefined}
          action={
            filter !== "completed" && !search ? (
              <Button variant="primary" size="sm" onClick={handleNewTask}>
                Create Your First Task
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
          {filteredTasks.map((task) => (
            <div key={task.id} className={`task-row ${task.completed ? "completed" : ""}`}>
              <button
                type="button"
                className={`custom-checkbox ${task.completed ? "checked" : ""}`}
                onClick={() => toggleTaskComplete(task.id)}
                aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
              >
                {task.completed && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>

              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="task-title-text" style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>
                  {task.title}
                </span>
                <div style={{ display: "flex", gap: 10, fontSize: "12px", color: "var(--text-muted)", marginTop: 2 }}>
                  <span>{task.subject}</span>
                  {task.duration && <span>&bull; {task.duration}</span>}
                  <span>&bull; Due {formatDateKey(task.date)}</span>
                </div>
              </div>

              <Badge variant={task.priority === "High" ? "danger" : task.priority === "Medium" ? "warning" : "success"}>
                {task.priority}
              </Badge>

              <Button variant="ghost" size="sm" onClick={() => handleEdit(task)} aria-label="Edit task">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </Button>

              <Button variant="ghost" size="sm" onClick={() => setDeleteTargetId(task.id)} aria-label="Delete task">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* AI Generated Study Tasks Section */}
      {aiTasks.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              AI Suggested Concept Tasks
              <Badge variant="primary">AI</Badge>
            </h3>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {aiTasks.filter((t) => !t.completed).length} pending
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {aiTasks.map((t) => (
              <div key={t.id} className={`task-row ${t.completed ? "completed" : ""}`}>
                <button
                  type="button"
                  className={`custom-checkbox ${t.completed ? "checked" : ""}`}
                  onClick={() => toggleAITask(t.id)}
                >
                  {t.completed && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="task-title-text" style={{ fontSize: "13.5px", fontWeight: 500, color: "var(--text-primary)" }}>
                    {t.title}
                  </span>
                  <div style={{ display: "flex", gap: 8, fontSize: "12px", color: "var(--text-muted)", marginTop: 2 }}>
                    <span>{t.topic}</span>
                    {t.estimatedMinutes > 0 && <span>&bull; {t.estimatedMinutes} min</span>}
                  </div>
                </div>

                <Badge variant={t.priority === "High" ? "danger" : t.priority === "Medium" ? "warning" : "success"}>
                  {t.priority}
                </Badge>

                <Button variant="ghost" size="sm" onClick={() => deleteAITask(t.id)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) {
            deleteTask(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        title="Delete Task?"
        message="Are you sure you want to remove this task? This action cannot be undone."
        confirmLabel="Delete Task"
        variant="danger"
      />
    </div>
  );
}
