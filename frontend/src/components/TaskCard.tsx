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
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>

      <div className="task-card-body">
        <div className="task-card-title-group">
          <span className="task-card-title">{task.title}</span>
          <span className="task-card-subject">{task.subject}</span>
        </div>

        <div className="task-card-meta">
          <span className={`task-card-date ${overdue ? "overdue-text" : ""}`}>
            {overdue ? "Overdue: " : ""}{formatDisplayDate(task.date)}
          </span>
          {task.duration && (
            <span className="task-card-duration">{task.duration}</span>
          )}
          <span className={`badge ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
          <div className="task-card-actions">
            <button className="task-action-btn edit-btn" onClick={() => onEdit(task)} aria-label="Edit task" title="Edit task">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M10 1.5L12.5 4L4 12.5H1.5V10L10 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="task-action-btn delete-btn" onClick={() => onDelete(task.id)} aria-label="Delete task" title="Delete task">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 3.5H11.5M5 3.5V2C5 1.7 5.2 1.5 5.5 1.5H8.5C8.8 1.5 9 1.7 9 2V3.5M10.5 3.5V11.5C10.5 11.8 10.3 12 10 12H4C3.7 12 3.5 11.8 3.5 11.5V3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
