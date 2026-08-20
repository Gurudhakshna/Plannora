import type { Task, Priority } from "../types/task";

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const priorityColors: Record<Priority, string> = {
  High: "priority-high",
  Medium: "priority-medium",
  Low: "priority-low",
};

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isOverdue(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const taskDate = new Date(dateStr + "T00:00:00");
  return taskDate < today;
}

export default function TaskCard({ task, onToggleComplete, onEdit, onDelete }: TaskCardProps) {
  const overdue = !task.completed && isOverdue(task.date);

  return (
    <div className={`task-card ${task.completed ? "completed" : ""} ${overdue ? "overdue" : ""}`}>
      <div className="task-card-left">
        <button
          className={`checkbox ${task.completed ? "checked" : ""}`}
          onClick={() => onToggleComplete(task.id)}
          aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        >
          {task.completed && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>
      <div className="task-card-body">
        <div className="task-card-header">
          <div className="task-card-title-group">
            <h3 className="task-card-title">{task.title}</h3>
            <span className="task-card-subject">{task.subject}</span>
          </div>
          <span className={`task-card-priority ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
        </div>
        {task.description && (
          <p className="task-card-description">{task.description}</p>
        )}
        <div className="task-card-meta">
          <span className={`task-card-date ${overdue ? "overdue-text" : ""}`}>
            {overdue && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ verticalAlign: "-2px", marginRight: "4px" }}>
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M7 4V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <circle cx="7" cy="9.5" r="0.5" fill="currentColor"/>
              </svg>
            )}
            {overdue ? "Overdue: " : ""}{formatDisplayDate(task.date)}
          </span>
          {task.duration && (
            <span className="task-card-duration">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ verticalAlign: "-2px", marginRight: "3px" }}>
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M7 4V7L9.5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {task.duration}
            </span>
          )}
          <div className="task-card-actions">
            <button className="task-action-btn edit-btn" onClick={() => onEdit(task)} aria-label="Edit task">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M10.5 2L13 4.5L4.5 13H2V10.5L10.5 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="task-action-btn delete-btn" onClick={() => onDelete(task.id)} aria-label="Delete task">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M2.5 4H12.5M5.5 4V2.5C5.5 2.22 5.72 2 6 2H9C9.28 2 9.5 2.22 9.5 2.5V4M11.5 4V12.5C11.5 12.78 11.28 13 11 13H4C3.72 13 3.5 12.78 3.5 12.5V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
