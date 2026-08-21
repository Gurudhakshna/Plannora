import type { Task, Page } from "../types/task";
import type { StudyMaterial, AIStudyTask } from "../types/study-material";
import { aiTaskToTask } from "../utils/aiTasks";
import { getToday, toDateKey, formatDateKey, isOverdueDate } from "../utils/storage";

interface DashboardProps {
  tasks: Task[];
  materials: StudyMaterial[];
  aiTasks: AIStudyTask[];
  onNavigate: (page: Page) => void;
  onAddTask: () => void;
  onUpload: (mode?: "file" | "text") => void;
  onViewNotes: (materialId: string) => void;
  onToggleAITask: (id: string) => void;
  onDeleteAITask: (id: string) => void;
}

const priorityOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

export default function Dashboard({ tasks, materials, aiTasks, onNavigate, onAddTask, onUpload, onViewNotes, onToggleAITask, onDeleteAITask }: DashboardProps) {
  const todayStr = getToday();
  const allTasks = [...tasks, ...aiTasks.map(aiTaskToTask)];
  const total = allTasks.length;
  const completed = allTasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const todayTasks = tasks
    .filter((t) => t.date === todayStr)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const overdueTasks = tasks.filter((t) => !t.completed && isOverdueDate(t.date));
  const upcomingTasks = tasks
    .filter((t) => !t.completed && t.date > todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const focusTasks = [...aiTasks]
    .sort((a, b) => Number(a.completed) - Number(b.completed))
    .slice(0, 5);
  const pendingAICount = aiTasks.filter((t) => !t.completed).length;

  const recentMaterials = [...materials]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const hasAnyData = total > 0 || materials.length > 0;

  const analyzedCount = materials.filter((m) => m.analysisStatus === "analyzed").length;

  const todayCompleted = allTasks.filter((t) => t.date === todayStr && t.completed).length;
  const weekDates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    weekDates.push(toDateKey(d));
  }
  const weekCompleted = allTasks.filter((t) => t.completed && weekDates.includes(t.date)).length;
  const weekTotal = allTasks.filter((t) => weekDates.includes(t.date)).length;
  const weekPct = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

  const streak = (() => {
    const completedDates = new Set(allTasks.filter((t) => t.completed).map((t) => t.date));
    let s = 0;
    const d = new Date();
    if (!completedDates.has(todayStr)) d.setDate(d.getDate() - 1);
    while (completedDates.has(toDateKey(d))) {
      s++;
      d.setDate(d.getDate() - 1);
    }
    return s;
  })();

  if (!hasAnyData) {
    return (
      <div className="dashboard">
        <section className="dashboard-hero">
          <div className="hero-content">
            <div className="hero-icon">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
                <rect x="4" y="8" width="48" height="40" rx="6" stroke="currentColor" strokeWidth="2" opacity="0.15"/>
                <path d="M28 18V38M18 28H38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.3"/>
                <path d="M16 8L28 2L40 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.2"/>
              </svg>
            </div>
            <h2 className="hero-title">Study smarter with your own notes</h2>
            <p className="hero-subtitle">
              Upload your notes or study materials and let Plannora turn them into focused study notes, tasks, and a personalized study plan.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary btn-lg" onClick={() => onUpload("file")}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <rect x="2" y="6" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M9 2V10M5 6L9 2L13 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Upload Notes / PDF
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => onUpload("text")}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M3 3H15M3 7H12M3 11H15M3 15H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Type Notes
              </button>
            </div>
            <p className="hero-supported">PDF &bull; PNG &bull; JPG &bull; Multiple files &bull; Drag &amp; drop</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <section className="dashboard-stats" aria-label="Study statistics">
        <button type="button" className="dash-stat-card clickable" onClick={() => onNavigate("materials")}>
          <span className="dash-stat-icon dash-stat-total" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="3" y="3" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 8H15M7 11H15M7 14H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </span>
          <span className="dash-stat-info">
            <span className="dash-stat-value">{materials.length}</span>
            <span className="dash-stat-label">Materials</span>
          </span>
        </button>
        <button type="button" className="dash-stat-card clickable" onClick={() => onNavigate("materials")}>
          <span className="dash-stat-icon dash-stat-completed" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 11L10 14L15 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="dash-stat-info">
            <span className="dash-stat-value">{analyzedCount}</span>
            <span className="dash-stat-label">Analyzed</span>
          </span>
        </button>
        <button type="button" className="dash-stat-card clickable" onClick={() => onNavigate("tasks")}>
          <span className="dash-stat-icon dash-stat-pending" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="3" y="3" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 11L10 14L15 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 7H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </span>
          <span className="dash-stat-info">
            <span className="dash-stat-value">{pending}</span>
            <span className="dash-stat-label">Tasks Pending</span>
          </span>
        </button>
        <div className="dash-stat-card">
          <span className="dash-stat-icon dash-stat-rate" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M3 17V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M7 17V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M11 17V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M15 17V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </span>
          <span className="dash-stat-info">
            <span className="dash-stat-value">{percentage}%</span>
            <span className="dash-stat-label">Completion</span>
          </span>
        </div>
      </section>

      <div className="dashboard-grid">
        <div className="dashboard-main-col">
          {focusTasks.length > 0 && (
            <section className="dash-section dash-today-focus">
              <div className="dash-section-header">
                <h3 className="dash-section-title">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M9 5V9L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Today&apos;s Focus
                </h3>
                <span className="dash-section-count">{pendingAICount} pending</span>
              </div>
              <div className="dash-task-list">
                {focusTasks.map((t) => (
                  <div key={t.id} className={`dash-task-row ${t.completed ? "completed" : ""}`}>
                    <button
                      type="button"
                      className={`checkbox checkbox-sm ${t.completed ? "checked" : ""}`}
                      onClick={() => onToggleAITask(t.id)}
                      aria-label={t.completed ? `Mark "${t.title}" incomplete` : `Mark "${t.title}" complete`}
                    >
                      {t.completed && (
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                    <div className="dash-task-info">
                      <span className="dash-task-title">{t.title}</span>
                      <span className="dash-task-subject">{t.topic}</span>
                    </div>
                    {t.estimatedMinutes > 0 && (
                      <span className="dash-task-duration">{t.estimatedMinutes} min</span>
                    )}
                    <button
                      type="button"
                      className="dash-task-dismiss"
                      onClick={() => onDeleteAITask(t.id)}
                      aria-label={`Dismiss "${t.title}"`}
                    >
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {overdueTasks.length > 0 && (
            <section className="dash-section">
              <div className="dash-section-header">
                <h3 className="dash-section-title">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
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
                    <span className={`dash-priority-dot dot-${t.priority.toLowerCase()}`} aria-hidden="true" />
                    <div className="dash-task-info">
                      <span className="dash-task-title">{t.title}</span>
                      <span className="dash-task-subject">{t.subject}</span>
                    </div>
                    <span className="dash-task-date overdue-text">{formatDateKey(t.date)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="dash-section">
            <div className="dash-section-header">
              <h3 className="dash-section-title">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
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
                    <span className={`dash-priority-dot dot-${t.priority.toLowerCase()}`} aria-hidden="true" />
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
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
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
                    <span className={`dash-priority-dot dot-${t.priority.toLowerCase()}`} aria-hidden="true" />
                    <div className="dash-task-info">
                      <span className="dash-task-title">{t.title}</span>
                      <span className="dash-task-subject">{t.subject}</span>
                    </div>
                    <span className="dash-task-date">{formatDateKey(t.date)}</span>
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
              <svg className="dash-progress-ring" viewBox="0 0 120 120" role="img" aria-label={`${percentage}% of tasks completed`}>
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

          {recentMaterials.length > 0 && (
            <section className="dash-section">
              <div className="dash-section-header">
                <h3 className="dash-section-title">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M4 2H11L14 5V16H4V2Z" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M11 2V5H14" stroke="currentColor" strokeWidth="1.3"/>
                  </svg>
                  Recent Materials
                </h3>
                <button className="link-btn" onClick={() => onNavigate("materials")}>View all</button>
              </div>
              <div className="dash-task-list">
                {recentMaterials.map((m) => {
                  const viewable = m.analysisStatus === "analyzed";
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className="dash-task-row dash-task-row-clickable"
                      onClick={viewable ? () => onViewNotes(m.id) : undefined}
                      disabled={!viewable}
                      title={viewable ? "View AI notes" : undefined}
                    >
                      <span className={`dash-priority-dot ${m.analysisStatus === "analyzed" ? "dot-low" : m.analysisStatus === "analyzing" ? "dot-medium" : "dot-high"}`} aria-hidden="true" />
                      <span className="dash-task-info">
                        <span className="dash-task-title">{m.title}</span>
                        <span className="dash-task-subject">{m.type.toUpperCase()}{m.topic ? ` \u00b7 ${m.topic}` : ""}</span>
                      </span>
                      <span className="dash-task-date">{formatDateKey(m.createdAt)}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <section className="dash-section">
            <div className="dash-section-header">
              <h3 className="dash-section-title">Study Progress</h3>
            </div>
            <div className="dash-study-progress">
              <div className="dash-progress-row">
                <span className="dash-progress-row-label">Today</span>
                <div className="dash-progress-row-bar" role="img" aria-label={`${todayCompleted} of ${todayTasks.length} tasks done today`}>
                  <div className="dash-progress-row-fill" style={{ width: todayTasks.length > 0 ? `${Math.round((todayCompleted / todayTasks.length) * 100)}%` : "0%" }} />
                </div>
                <span className="dash-progress-row-value">{todayCompleted}/{todayTasks.length}</span>
              </div>
              <div className="dash-progress-row">
                <span className="dash-progress-row-label">This week</span>
                <div className="dash-progress-row-bar" role="img" aria-label={`${weekPct}% of this week's tasks completed`}>
                  <div className="dash-progress-row-fill" style={{ width: `${weekPct}%` }} />
                </div>
                <span className="dash-progress-row-value">{weekPct}%</span>
              </div>
              <div className="dash-progress-row">
                <span className="dash-progress-row-label">Streak</span>
                <span className="dash-progress-row-streak">{streak} day{streak !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </section>

          <section className="dash-section">
            <div className="dash-section-header">
              <h3 className="dash-section-title">Quick Actions</h3>
            </div>
            <div className="dash-quick-actions">
              <button className="dash-quick-btn" onClick={() => onUpload("file")}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 2V12M3 7L8 2L13 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Upload Notes
              </button>
              <button className="dash-quick-btn" onClick={() => onUpload("file")} title="Analyze a material to generate a study plan">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M9 1L2 15H6L9 7L12 15H16L9 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Generate Plan
              </button>
              <button className="dash-quick-btn" onClick={() => onNavigate("tasks")}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M5 8L7 10L11 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                View AI Tasks
              </button>
              <button className="dash-quick-btn" onClick={() => onNavigate("calendar")}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M5 1.5V4M11 1.5V4M2 7H14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Open Calendar
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
