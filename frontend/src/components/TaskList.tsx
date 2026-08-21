import { useState, useMemo } from "react";
import type { Task, Priority } from "../types/task";
import type { AIStudyTask } from "../types/study-material";
import TaskCard from "./TaskCard";

interface TaskListProps {
  tasks: Task[];
  aiTasks: AIStudyTask[];
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleAIComplete: (id: string) => void;
  onDeleteAI: (id: string) => void;
}

type FilterStatus = "all" | "pending" | "completed";
type SortBy = "date" | "priority";

const priorityOrder: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };

export default function TaskList({
  tasks,
  aiTasks,
  onToggleComplete,
  onEdit,
  onDelete,
  onToggleAIComplete,
  onDeleteAI,
}: TaskListProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortBy>("date");

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.notes.toLowerCase().includes(q)
      );
    }

    if (filter === "pending") result = result.filter((t) => !t.completed);
    if (filter === "completed") result = result.filter((t) => t.completed);

    result = [...result].sort((a, b) => {
      if (sortBy === "date") {
        return a.date.localeCompare(b.date);
      }
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return result;
  }, [tasks, search, filter, sortBy]);

  const counts = useMemo(
    () => ({
      all: tasks.length,
      pending: tasks.filter((t) => !t.completed).length,
      completed: tasks.filter((t) => t.completed).length,
    }),
    [tasks]
  );

  const sortedAITasks = useMemo(
    () =>
      [...aiTasks].sort((a, b) => {
        if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
    [aiTasks]
  );

  const pendingAICount = aiTasks.filter((t) => !t.completed).length;

  return (
    <div className="task-list-page">
      <div className="task-list-controls">
        <div className="search-box">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Filter tasks by title or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
            aria-label="Search tasks"
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch("")} aria-label="Clear search">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        <div className="filter-group">
          <div className="filter-tabs">
            {(["all", "pending", "completed"] as const).map((f) => (
              <button
                key={f}
                className={`filter-tab ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                <span className="filter-count">{counts[f]}</span>
              </button>
            ))}
          </div>
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            aria-label="Sort tasks"
          >
            <option value="date">Sort by Date</option>
            <option value="priority">Sort by Priority</option>
          </select>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="dash-section" style={{ textAlign: "center", padding: "24px" }}>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            {search
              ? "No tasks match your search filter."
              : filter === "completed"
                ? "No completed tasks yet."
                : "No tasks created yet. Click 'New Task' to add one."}
          </p>
        </div>
      ) : (
        <div className="task-list">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {sortedAITasks.length > 0 && (
        <section className="ai-tasks-section">
          <div className="ai-tasks-header">
            <h3 className="ai-tasks-title">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L9.5 5.5L14 7L9.5 8.5L8 13L6.5 8.5L2 7L6.5 5.5L8 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
              AI Suggested Tasks
              <span className="badge ai-chip">AI</span>
            </h3>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {pendingAICount} pending of {sortedAITasks.length}
            </span>
          </div>
          <div className="dash-task-list">
            {sortedAITasks.map((t) => (
              <div key={t.id} className={`ai-task-item ${t.completed ? "completed" : ""}`}>
                <button
                  className={`checkbox checkbox-sm ${t.completed ? "checked" : ""}`}
                  onClick={() => onToggleAIComplete(t.id)}
                  aria-label={t.completed ? "Mark incomplete" : "Mark complete"}
                >
                  {t.completed && (
                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
                <div className="ai-task-info">
                  <span className="ai-task-title">{t.title}</span>
                  <span className="ai-task-meta">
                    {t.topic}
                    {t.dueDate && ` \u00b7 Due ${formatAIDate(t.dueDate)}`}
                    {t.estimatedMinutes > 0 && ` \u00b7 ${t.estimatedMinutes} min`}
                  </span>
                </div>
                <span className={`badge priority-${t.priority.toLowerCase()}`}>{t.priority}</span>
                <button
                  className="dash-task-dismiss"
                  onClick={() => onDeleteAI(t.id)}
                  aria-label={`Dismiss "${t.title}"`}
                >
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function formatAIDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
