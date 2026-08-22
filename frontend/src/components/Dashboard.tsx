import type { Task, Page } from "../types/task";
import type { StudyMaterial, AIStudyTask, AIStudyNotes, DetectedConcept } from "../types/study-material";
import { aiTaskToTask } from "../utils/aiTasks";
import { getToday, toDateKey, formatDateKey, isOverdueDate } from "../utils/storage";
import { useAuth } from "../hooks/useAuth";

interface DashboardProps {
  tasks: Task[];
  materials: StudyMaterial[];
  aiTasks: AIStudyTask[];
  aiNotes?: AIStudyNotes[];
  onNavigate: (page: Page) => void;
  onAddTask: () => void;
  onUpload: (mode?: "file" | "text") => void;
  onViewNotes: (materialId: string) => void;
  onToggleAITask: (id: string) => void;
  onDeleteAITask: (id: string) => void;
  onTeachConcept?: (conceptName: string, materialTitle?: string) => void;
}

const priorityOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

export default function Dashboard({
  tasks,
  materials,
  aiTasks,
  aiNotes,
  onNavigate,
  onAddTask,
  onUpload,
  onViewNotes,
  onToggleAITask,
  onDeleteAITask,
  onTeachConcept,
}: DashboardProps) {
  const { user } = useAuth();
  const userName = user?.displayName || user?.email?.split("@")[0] || "Student";
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
    .slice(0, 6);
  const pendingAICount = aiTasks.filter((t) => !t.completed).length;

  const recentMaterials = [...materials]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const analyzedMaterials = materials.filter((m) => m.analysisStatus === "analyzed");
  const activeMaterial = analyzedMaterials[0] || materials[0] || null;

  // Determine current active concept for Continue Learning panel
  const activeConceptTask = aiTasks.find((t) => !t.completed) || aiTasks[0] || null;
  const currentConceptName = activeConceptTask
    ? (activeConceptTask.conceptRef || activeConceptTask.title.replace(/^(Learn:|Understand:|Practice:|Test:|Recall:)\s*/i, "").trim())
    : "Fundamental Concepts";

  const activeNote = aiNotes?.find((n) => n.materialId === activeMaterial?.id) || aiNotes?.[0];
  const activeConceptObj = activeNote?.concepts?.find(
    (c: DetectedConcept) => c.name.toLowerCase() === currentConceptName.toLowerCase() || currentConceptName.toLowerCase().includes(c.name.toLowerCase())
  );
  const activeReason = activeConceptObj?.simpleExplanation
    ? `Why: ${activeConceptObj.simpleExplanation}`
    : `Why: Recommended based on prerequisite structure and material sequence.`;

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

  const hasAnyData = total > 0 || materials.length > 0;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2 className="dashboard-greeting">Good day, {userName}</h2>
        <p className="dashboard-subgreeting">
          Here is what&apos;s happening with your study workload today.
        </p>
      </div>

      {!hasAnyData && (
        <div className="workspace-welcome-card">
          <div className="workspace-welcome-info">
            <h3>Welcome to Plannora AI Study Workspace</h3>
            <p>Import your study materials or notes to get content-aware AI analysis and learning paths.</p>
          </div>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => onUpload("file")}>
              Import Study Material
            </button>
            <button className="btn btn-secondary" onClick={() => onUpload("text")}>
              Type / Paste Notes
            </button>
          </div>
        </div>
      )}

      {/* 4-Card Compact Stat Grid */}
      <section className="dashboard-stats" aria-label="Study statistics">
        <button type="button" className="dash-stat-card clickable" onClick={() => onNavigate("tasks")}>
          <span className="dash-stat-icon dash-stat-total" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2.5" y="2.5" width="13" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M5.5 6.5H12.5M5.5 9H12.5M5.5 11.5H9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </span>
          <span className="dash-stat-info">
            <span className="dash-stat-value">{total}</span>
            <span className="dash-stat-label">Total Tasks</span>
          </span>
        </button>

        <button type="button" className="dash-stat-card clickable" onClick={() => onNavigate("materials")}>
          <span className="dash-stat-icon dash-stat-completed" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3.5 2H10.5L14.5 6V16H3.5V2Z" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M10.5 2V6H14.5" stroke="currentColor" strokeWidth="1.4"/>
            </svg>
          </span>
          <span className="dash-stat-info">
            <span className="dash-stat-value">{analyzedMaterials.length}</span>
            <span className="dash-stat-label">Materials Analyzed</span>
          </span>
        </button>

        <button type="button" className="dash-stat-card clickable" onClick={() => onNavigate("tasks")}>
          <span className="dash-stat-icon dash-stat-pending" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M9 5.5V9L11.5 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </span>
          <span className="dash-stat-info">
            <span className="dash-stat-value">{pending}</span>
            <span className="dash-stat-label">Tasks Pending</span>
          </span>
        </button>

        <div className="dash-stat-card">
          <span className="dash-stat-icon dash-stat-rate" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2.5 14V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M6.5 14V7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M10.5 14V4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M14.5 14V2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </span>
          <span className="dash-stat-info">
            <span className="dash-stat-value">{streak} <span style={{ fontSize: "12px", fontWeight: "normal" }}>days</span></span>
            <span className="dash-stat-label">Study Streak</span>
          </span>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        <div className="dashboard-main-col">
          {/* Continue Learning Panel (Replaces generic Today's Focus) */}
          <section className="dash-section dash-continue-learning">
            <div className="dash-section-header">
              <h3 className="dash-section-title prominent-title">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M4 2.5L12 8L4 13.5V2.5Z" fill="currentColor"/>
                </svg>
                Continue Learning
              </h3>
              {activeMaterial && (
                <span className="dash-section-count">{activeMaterial.title}</span>
              )}
            </div>

            {activeMaterial ? (
              <div className="continue-learning-card">
                <div className="continue-learning-main">
                  <div className="continue-learning-info">
                    <span className="continue-eyebrow">RECOMMENDED NEXT CONCEPT</span>
                    <h4 className="continue-concept-title">{currentConceptName}</h4>
                    <p className="continue-explanation">
                      {activeConceptTask
                        ? activeReason
                        : `You have completed initial tasks. Review concepts or add new material.`}
                    </p>
                  </div>
                  <div className="continue-action-wrap">
                    <button
                      type="button"
                      className="btn btn-primary btn-lg continue-btn"
                      onClick={() => onTeachConcept && onTeachConcept(currentConceptName, activeMaterial.title)}
                    >
                      Teach Me This Concept →
                    </button>
                    {activeMaterial.hasNotes && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => onViewNotes(activeMaterial.id)}
                      >
                        View Full Notes
                      </button>
                    )}
                  </div>
                </div>

                <div className="continue-learning-meta">
                  <span className="meta-item">
                    <strong>Topic:</strong> {activeMaterial.topic || activeMaterial.title}
                  </span>
                  <span className="meta-item">
                    <strong>Est. Time:</strong> {activeConceptTask?.estimatedMinutes || 15} min
                  </span>
                  <span className="meta-item">
                    <strong>Progress:</strong> {percentage}% understood
                  </span>
                </div>
              </div>
            ) : (
              <div className="dash-empty-inline">
                <p>No study material imported yet.</p>
                <button className="link-btn" onClick={() => onUpload("file")}>
                  Import study material to start learning
                </button>
              </div>
            )}
          </section>

          {/* Concept-Specific Learning Tasks */}
          <section className="dash-section">
            <div className="dash-section-header">
              <h3 className="dash-section-title">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M5 8L7 10L11 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                Concept Learning Tasks
              </h3>
              <span className="dash-section-count">{pendingAICount} pending</span>
            </div>

            {focusTasks.length === 0 ? (
              <div className="dash-empty-inline">
                <p>No concept tasks generated yet.</p>
              </div>
            ) : (
              <div className="dash-task-list">
                {focusTasks.map((t) => {
                  const conceptName = t.conceptRef || t.title.replace(/^(Learn:|Understand:|Practice:|Test:|Recall:)\s*/i, "").trim();
                  return (
                    <div key={t.id} className={`dash-task-row ${t.completed ? "completed" : ""}`}>
                      <button
                        type="button"
                        className={`checkbox checkbox-sm ${t.completed ? "checked" : ""}`}
                        onClick={() => onToggleAITask(t.id)}
                        aria-label={t.completed ? `Mark "${t.title}" incomplete` : `Mark "${t.title}" complete`}
                      >
                        {t.completed && (
                          <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                            <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>

                      <div className="dash-task-info">
                        <span className="dash-task-title">{t.title}</span>
                        <span className="dash-task-subject">{t.topic}</span>
                      </div>

                      {t.taskType && (
                        <span className={`task-type-badge task-type-${t.taskType}`}>
                          {t.taskType.toUpperCase()}
                        </span>
                      )}

                      {onTeachConcept && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs teach-inline-btn"
                          onClick={() => onTeachConcept(conceptName, t.topic)}
                        >
                          Teach Me
                        </button>
                      )}

                      <button
                        type="button"
                        className="dash-task-dismiss"
                        onClick={() => onDeleteAITask(t.id)}
                        aria-label={`Dismiss "${t.title}"`}
                      >
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Overdue Tasks Alert Section */}
          {overdueTasks.length > 0 && (
            <section className="dash-section">
              <div className="dash-section-header">
                <h3 className="dash-section-title">Overdue Tasks</h3>
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

          {/* Scheduled Tasks for Today */}
          <section className="dash-section dash-today-scheduled">
            <div className="dash-section-header">
              <h3 className="dash-section-title prominent-title">
                Scheduled User Tasks
              </h3>
              {todayTasks.length > 0 && (
                <span className="dash-section-count">{todayTasks.length} tasks</span>
              )}
            </div>
            {todayTasks.length === 0 ? (
              <div className="dash-empty-inline">
                <p>No personal tasks scheduled for today.</p>
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
                    <span className={`badge priority-${t.priority.toLowerCase()}`}>{t.priority}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Upcoming Deadlines */}
          <section className="dash-section">
            <div className="dash-section-header">
              <h3 className="dash-section-title">Upcoming Deadlines</h3>
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

        {/* Right Column */}
        <div className="dashboard-side-col">
          {/* Overall Completion Ring Widget */}
          <section className="dash-section">
            <div className="dash-section-header">
              <h3 className="dash-section-title">Completion Rate</h3>
            </div>
            <div className="dash-progress-ring-wrap">
              <svg className="dash-progress-ring" viewBox="0 0 120 120" role="img" aria-label={`${percentage}% completed`}>
                <circle cx="60" cy="60" r="45" fill="none" strokeWidth="7" stroke="var(--bg-inset)"/>
                {percentage > 0 && (
                  <circle
                    cx="60" cy="60" r="45" fill="none" strokeWidth="7"
                    stroke="var(--primary)"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - percentage / 100)}`}
                    transform="rotate(-90 60 60)"
                    style={{ transition: "stroke-dashoffset 0.5s ease" }}
                  />
                )}
              </svg>
              <div className="dash-progress-ring-text" style={{ display: "flex", flexDirection: "column", opacity: percentage === 0 ? 0.6 : 1 }}>
                <span className="dash-progress-pct">{percentage}%</span>
                <span className="dash-progress-label">{completed} / {total} done</span>
              </div>
            </div>
          </section>

          {/* Recent Materials */}
          <section className="dash-section">
            <div className="dash-section-header">
              <h3 className="dash-section-title">Recent Materials</h3>
              <button className="link-btn" onClick={() => onNavigate("materials")}>View all</button>
            </div>
            {recentMaterials.length === 0 ? (
              <div className="dash-empty-inline">
                <p>No study materials imported.</p>
                <button className="link-btn" onClick={() => onUpload("file")}>Import material</button>
              </div>
            ) : (
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
            )}
          </section>

          {/* Weekly Progress Bar Summary */}
          <section className="dash-section">
            <div className="dash-section-header">
              <h3 className="dash-section-title">Weekly Activity</h3>
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
                <span className="dash-progress-row-label">7 Days</span>
                <div className="dash-progress-row-bar" role="img" aria-label={`${weekPct}% of this week's tasks completed`}>
                  <div className="dash-progress-row-fill" style={{ width: `${weekPct}%` }} />
                </div>
                <span className="dash-progress-row-value">{weekPct}%</span>
              </div>
            </div>
          </section>

          {/* Quick Actions Bar */}
          <section className="dash-section">
            <div className="dash-section-header">
              <h3 className="dash-section-title">Quick Actions</h3>
            </div>
            <div className="dash-quick-actions">
              <button className="dash-quick-btn" onClick={() => onUpload("file")}>
                Import Material
              </button>
              <button className="dash-quick-btn" onClick={() => onUpload("text")}>
                Type Notes
              </button>
              <button className="dash-quick-btn" onClick={() => onNavigate("plan")}>
                Study Guide
              </button>
              <button className="dash-quick-btn" onClick={() => onNavigate("calendar")}>
                Calendar
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
