import type { Task, Page } from "../types/task";

interface DashboardProps {
  tasks: Task[];
  onNavigate: (page: Page) => void;
  onAddTask: () => void;
}

function formatCompactDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const taskDate = new Date(dateStr + "T00:00:00");
  return taskDate < today;
}

const priorityOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

export default function Dashboard({ tasks, onNavigate, onAddTask }: DashboardProps) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const todayTasks = tasks
    .filter((t) => t.date === todayStr)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const upcomingTasks = tasks
    .filter((t) => !t.completed && t.date > todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const overdueTasks = tasks.filter((t) => !t.completed && isOverdue(t.date));

  const priorityTasks = tasks
    .filter((t) => !t.completed && t.priority === "High")
    .slice(0, 5);

  const isEmpty = total === 0;

  if (isEmpty) {
    return (
      <div className="dashboard">
        <section className="dashboard-welcome">
          <div className="welcome-content">
            <div className="welcome-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
                <path d="M24 12L18 28H30L24 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M24 32V36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 className="welcome-title">Welcome to Plannora</h2>
            <p className="welcome-text">
              Start organizing your study schedule. Add your first task to begin tracking your progress.
            </p>
            <button className="btn btn-primary btn-lg" onClick={onAddTask}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Add Your First Task
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <section className="dashboard-stats">
        <div className="dash-stat-card" onClick={() => onNavigate("tasks")}>
          <div className="dash-stat-icon dash-stat-total">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="3" y="3" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 8H15M7 11H15M7 14H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{total}</span>
            <span className="dash-stat-label">Total Tasks</span>
          </div>
        </div>
        <div className="dash-stat-card" onClick={() => onNavigate("tasks")}>
          <div className="dash-stat-icon dash-stat-completed">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 11L10 14L15 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{completed}</span>
            <span className="dash-stat-label">Completed</span>
          </div>
        </div>
        <div className="dash-stat-card" onClick={() => onNavigate("tasks")}>
          <div className="dash-stat-icon dash-stat-pending">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 6V11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{pending}</span>
            <span className="dash-stat-label">Pending</span>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-rate">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 2V20M2 11H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
              <path d="M4 16L8 12L12 14L18 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{percentage}%</span>
            <span className="dash-stat-label">Completion Rate</span>
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        <div className="dashboard-main-col">
          {overdueTasks.length > 0 && (
            <section className="dash-section">
              <div className="dash-section-header">
                <h3 className="dash-section-title">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M9 5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="9" cy="12" r="0.75" fill="currentColor"/>
                  </svg>
                  Overdue
                </h3>
                <span className="dash-section-badge badge-red">{overdueTasks.length}</span>
              </div>
              <div className="dash-task-list">
                {overdueTasks.slice(0, 4).map((t) => (
                  <div key={t.id} className="dash-task-row">
                    <span className={`dash-priority-dot dot-${t.priority.toLowerCase()}`} />
                    <div className="dash-task-info">
                      <span className="dash-task-title">{t.title}</span>
                      <span className="dash-task-subject">{t.subject}</span>
                    </div>
                    <span className="dash-task-date overdue-text">{formatCompactDate(t.date)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="dash-section">
            <div className="dash-section-header">
              <h3 className="dash-section-title">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M9 5V9L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Today&apos;s Tasks
              </h3>
              {todayTasks.length > 0 && (
                <span className="dash-section-count">{todayTasks.length} tasks</span>
              )}
            </div>
            {todayTasks.length === 0 ? (
              <div className="dash-empty-inline">
                <p>No tasks scheduled for today.</p>
                <button className="link-btn" onClick={onAddTask}>Add a task</button>
              </div>
            ) : (
              <div className="dash-task-list">
                {todayTasks.map((t) => (
                  <div key={t.id} className={`dash-task-row ${t.completed ? "completed" : ""}`}>
                    <span className={`dash-priority-dot dot-${t.priority.toLowerCase()}`} />
                    <div className="dash-task-info">
                      <span className="dash-task-title">{t.title}</span>
                      <span className="dash-task-subject">{t.subject}</span>
                    </div>
                    {t.duration && <span className="dash-task-duration">{t.duration}</span>}
                    <span className={`dash-task-badge priority-${t.priority.toLowerCase()}`}>{t.priority}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="dash-section">
            <div className="dash-section-header">
              <h3 className="dash-section-title">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="2" y="3" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M6 1V4M12 1V4M2 8H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Upcoming Deadlines
              </h3>
              <button className="link-btn" onClick={() => onNavigate("tasks")}>View all</button>
            </div>
            {upcomingTasks.length === 0 ? (
              <div className="dash-empty-inline">
                <p>No upcoming deadlines.</p>
              </div>
            ) : (
              <div className="dash-task-list">
                {upcomingTasks.map((t) => (
                  <div key={t.id} className="dash-task-row">
                    <span className={`dash-priority-dot dot-${t.priority.toLowerCase()}`} />
                    <div className="dash-task-info">
                      <span className="dash-task-title">{t.title}</span>
                      <span className="dash-task-subject">{t.subject}</span>
                    </div>
                    <span className="dash-task-date">{formatCompactDate(t.date)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="dashboard-side-col">
          <section className="dash-section dash-progress-card">
            <div className="dash-section-header">
              <h3 className="dash-section-title">Overall Progress</h3>
            </div>
            <div className="dash-progress-ring-wrap">
              <svg className="dash-progress-ring" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" strokeWidth="8" stroke="var(--bg-inset)"/>
                <circle
                  cx="60" cy="60" r="50" fill="none" strokeWidth="8"
                  stroke="var(--primary)"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - percentage / 100)}`}
                  transform="rotate(-90 60 60)"
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
              </svg>
              <div className="dash-progress-ring-text">
                <span className="dash-progress-pct">{percentage}%</span>
                <span className="dash-progress-label">{completed} of {total}</span>
              </div>
            </div>
          </section>

          {priorityTasks.length > 0 && (
            <section className="dash-section">
              <div className="dash-section-header">
                <h3 className="dash-section-title">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 2L2 16H6L9 8L12 16H16L9 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  High Priority
                </h3>
                <span className="dash-section-badge badge-amber">{priorityTasks.length}</span>
              </div>
              <div className="dash-task-list">
                {priorityTasks.map((t) => (
                  <div key={t.id} className="dash-task-row">
                    <span className="dash-priority-dot dot-high" />
                    <div className="dash-task-info">
                      <span className="dash-task-title">{t.title}</span>
                      <span className="dash-task-subject">{t.subject}</span>
                    </div>
                    <span className="dash-task-date">{formatCompactDate(t.date)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="dash-section">
            <div className="dash-section-header">
              <h3 className="dash-section-title">Recent Tasks</h3>
            </div>
            {tasks.length === 0 ? (
              <div className="dash-empty-inline">
                <p>No tasks yet.</p>
              </div>
            ) : (
              <div className="dash-task-list">
                {[...tasks]
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .slice(0, 5)
                  .map((t) => (
                    <div key={t.id} className={`dash-task-row ${t.completed ? "completed" : ""}`}>
                      <span className={`dash-priority-dot dot-${t.priority.toLowerCase()}`} />
                      <div className="dash-task-info">
                        <span className="dash-task-title">{t.title}</span>
                        <span className="dash-task-subject">{t.subject}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
