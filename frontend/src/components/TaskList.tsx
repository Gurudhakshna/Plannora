import { useState, useMemo } from "react";
import type { Task, Priority } from "../types/task";
import TaskCard from "./TaskCard";

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

type FilterStatus = "all" | "pending" | "completed";
type SortBy = "date" | "priority";

const priorityOrder: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };

export default function TaskList({ tasks, onToggleComplete, onEdit, onDelete }: TaskListProps) {
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

  const counts = useMemo(() => ({
    all: tasks.length,
    pending: tasks.filter((t) => !t.completed).length,
    completed: tasks.filter((t) => t.completed).length,
  }), [tasks]);

  return (
    <div className="task-list-page">
      <div className="task-list-controls">
        <div className="search-box">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 12L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search tasks by title, subject, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch("")} aria-label="Clear search">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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
          >
            <option value="date">Sort by Date</option>
            <option value="priority">Sort by Priority</option>
          </select>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon-wrap">
            {search ? (
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                <path d="M30 30L40 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
                <path d="M16 20H24M16 24H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
              </svg>
            ) : tasks.length === 0 ? (
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="8" y="6" width="32" height="36" rx="4" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
                <path d="M16 18H32M16 24H32M16 30H24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
              </svg>
            ) : (
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
                <path d="M16 24L22 30L32 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
              </svg>
            )}
          </div>
          <h3 className="empty-state-title">
            {search
              ? "No tasks found"
              : filter === "completed"
                ? "No completed tasks"
                : "No tasks yet"}
          </h3>
          <p className="empty-state-text">
            {search
              ? "Try adjusting your search or filters"
              : filter === "completed"
                ? "Complete some tasks and they will appear here"
                : "Create your first study task to get started"}
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
    </div>
  );
}
