import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useApp } from "../../context/AppContext";
import { getToday, toDateKey, formatDateKey, isOverdueDate } from "../../utils/storage";
import Button from "../../components/ui/Button";
import Card, { CardHeader } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/shared/EmptyState";
import type { DetectedConcept } from "../../types/study-material";

const priorityOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    tasks,
    materials,
    aiTasks,
    aiNotes,
    toggleTaskComplete,
    toggleAITask,
    deleteAITask,
    handleUpload,
    setTaskModalOpen,
    setEditingTask,
    setViewingNotes,
    handleTeachConcept,
  } = useApp();

  const userName = user?.displayName || user?.email?.split("@")[0] || "Student";
  const todayStr = getToday();

  const allTasks = useMemo(() => [...tasks, ...aiTasks.map((t) => ({
    id: t.id,
    title: t.title,
    subject: t.topic,
    date: t.dueDate || todayStr,
    priority: t.priority,
    description: "",
    duration: t.estimatedMinutes ? `${t.estimatedMinutes}m` : "",
    notes: "",
    completed: t.completed,
    createdAt: t.createdAt,
    userId: t.userId,
    source: "ai" as const,
  }))], [tasks, aiTasks, todayStr]);

  const total = allTasks.length;
  const completed = allTasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const todayTasks = tasks
    .filter((t) => t.date === todayStr)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const overdueTasks = tasks.filter((t) => !t.completed && isOverdueDate(t.date));

  const focusTasks = useMemo(
    () => [...aiTasks].sort((a, b) => Number(a.completed) - Number(b.completed)).slice(0, 6),
    [aiTasks]
  );
  const pendingAICount = aiTasks.filter((t) => !t.completed).length;

  const recentMaterials = useMemo(
    () => [...materials].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    [materials]
  );
  const analyzedMaterials = materials.filter((m) => m.analysisStatus === "analyzed");
  const activeMaterial = analyzedMaterials[0] || materials[0] || null;

  // Active recommended concept
  const activeConceptTask = aiTasks.find((t) => !t.completed) || aiTasks[0] || null;
  const currentConceptName = activeConceptTask
    ? activeConceptTask.conceptRef || activeConceptTask.title.replace(/^(Learn:|Understand:|Practice:|Test:|Recall:)\s*/i, "").trim()
    : "Fundamental Concepts";

  const activeNote = aiNotes?.find((n) => n.materialId === activeMaterial?.id) || aiNotes?.[0];
  const activeConceptObj = activeNote?.concepts?.find(
    (c: DetectedConcept) =>
      c.name.toLowerCase() === currentConceptName.toLowerCase() ||
      currentConceptName.toLowerCase().includes(c.name.toLowerCase())
  );
  const activeReason = activeConceptObj?.simpleExplanation
    ? activeConceptObj.simpleExplanation
    : "Recommended based on prerequisite hierarchy and syllabus sequence.";

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

  const streak = useMemo(() => {
    const completedDates = new Set(allTasks.filter((t) => t.completed).map((t) => t.date));
    let s = 0;
    const d = new Date();
    if (!completedDates.has(todayStr)) d.setDate(d.getDate() - 1);
    while (completedDates.has(toDateKey(d))) {
      s++;
      d.setDate(d.getDate() - 1);
    }
    return s;
  }, [allTasks, todayStr]);

  const hasAnyData = total > 0 || materials.length > 0;

  const handleAddNewTask = () => {
    setEditingTask(null);
    setTaskModalOpen(true);
  };

  return (
    <div className="dashboard-view">
      {/* Top Greeting Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          {getTimeGreeting()}, {userName}
        </h2>
        <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginTop: 4 }}>
          Here&apos;s your learning overview for today.
        </p>
      </div>

      {/* Welcome Card if no data */}
      {!hasAnyData && (
        <Card style={{ marginBottom: 24, border: "1px solid var(--accent-border)", backgroundColor: "var(--bg-elevated)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                Welcome to your AI Study Workspace
              </h3>
              <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", maxWidth: 560 }}>
                Import lecture slides, course PDFs, or handwritten notes to generate concept graphs, smart study plans, and interactive quizzes.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="primary" size="md" onClick={() => handleUpload("file")}>
                Import Material
              </Button>
              <Button variant="secondary" size="md" onClick={() => handleUpload("text")}>
                Paste Notes
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 4 Compact Stat Cards */}
      <div className="stat-cards-grid">
        <div
          className="stat-card-compact"
          onClick={() => navigate("/tasks")}
          style={{ cursor: "pointer" }}
          title="View all tasks"
        >
          <div className="stat-icon-wrap indigo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div>
            <div className="stat-number">{total}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
        </div>

        <div
          className="stat-card-compact"
          onClick={() => navigate("/materials")}
          style={{ cursor: "pointer" }}
          title="View all materials"
        >
          <div className="stat-icon-wrap green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div>
            <div className="stat-number">{analyzedMaterials.length}</div>
            <div className="stat-label">Materials Analyzed</div>
          </div>
        </div>

        <div
          className="stat-card-compact"
          onClick={() => navigate("/tasks")}
          style={{ cursor: "pointer" }}
          title="View pending tasks"
        >
          <div className="stat-icon-wrap amber">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <div className="stat-number">{pending}</div>
            <div className="stat-label">Tasks Pending</div>
          </div>
        </div>

        <div
          className="stat-card-compact"
          onClick={() => navigate("/progress")}
          style={{ cursor: "pointer" }}
          title="View study streak"
        >
          <div className="stat-icon-wrap sky">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
          </div>
          <div>
            <div className="stat-number">{streak} <span style={{ fontSize: "13px", fontWeight: 500 }}>days</span></div>
            <div className="stat-label">Study Streak</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column & Right Sidebar */}
      <div className="dashboard-grid">
        {/* Left Primary Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Continue Learning Section */}
          <Card>
            <CardHeader
              title={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>Continue Learning</span>
                </div>
              }
              action={
                activeMaterial && (
                  <Badge variant="neutral">{activeMaterial.title}</Badge>
                )
              }
            />

            {activeMaterial ? (
              <div style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--accent-text)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      RECOMMENDED NEXT CONCEPT
                    </span>
                    <h4 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", margin: "4px 0 8px 0" }}>
                      {currentConceptName}
                    </h4>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: 540, lineHeight: 1.5 }}>
                      {activeReason}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => handleTeachConcept(currentConceptName, activeMaterial.title)}
                    >
                      Teach Me This Concept &rarr;
                    </Button>
                    {activeMaterial.hasNotes && activeNote && (
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => setViewingNotes(activeNote)}
                      >
                        Full Notes
                      </Button>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 20, marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border-subtle)", fontSize: "12px", color: "var(--text-muted)", flexWrap: "wrap" }}>
                  <span><strong>Topic:</strong> {activeMaterial.topic || activeMaterial.title}</span>
                  <span><strong>Est. Time:</strong> {activeConceptTask?.estimatedMinutes || 15} min</span>
                  <span><strong>Mastery:</strong> {percentage}% completed</span>
                </div>
              </div>
            ) : (
              <EmptyState
                compact
                title="No study material imported yet"
                description="Upload course slides or notes to unlock concept breakdown and step-by-step guides."
                action={
                  <Button variant="primary" size="sm" onClick={() => handleUpload("file")}>
                    Import First Material
                  </Button>
                }
              />
            )}
          </Card>

          {/* AI Concept Learning Tasks */}
          <Card>
            <CardHeader
              title={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                  <span>Concept Learning Tasks</span>
                </div>
              }
              action={<Badge variant="primary">{pendingAICount} pending</Badge>}
            />

            {focusTasks.length === 0 ? (
              <EmptyState
                compact
                title="No AI concept tasks yet"
                description="Upload material to have Plannora automatically build your prerequisite practice tasks."
              />
            ) : (
              <div>
                {focusTasks.map((t) => {
                  const conceptName = t.conceptRef || t.title.replace(/^(Learn:|Understand:|Practice:|Test:|Recall:)\s*/i, "").trim();
                  return (
                    <div key={t.id} className={`task-row ${t.completed ? "completed" : ""}`}>
                      <button
                        type="button"
                        className={`custom-checkbox ${t.completed ? "checked" : ""}`}
                        onClick={() => toggleAITask(t.id)}
                        aria-label={t.completed ? "Mark incomplete" : "Mark complete"}
                      >
                        {t.completed && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span className="task-title-text" style={{ fontSize: "13.5px", fontWeight: 500, color: "var(--text-primary)", display: "block" }}>
                          {t.title}
                        </span>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{t.topic}</span>
                      </div>

                      {t.taskType && (
                        <Badge variant="neutral" style={{ textTransform: "uppercase", fontSize: "10px" }}>
                          {t.taskType}
                        </Badge>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTeachConcept(conceptName, t.topic)}
                        style={{ fontSize: "12px" }}
                      >
                        Teach Me
                      </Button>

                      <button
                        type="button"
                        onClick={() => deleteAITask(t.id)}
                        style={{ color: "var(--text-muted)", padding: 4 }}
                        aria-label={`Dismiss task ${t.title}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Overdue Tasks Alert (if any) */}
          {overdueTasks.length > 0 && (
            <Card style={{ border: "1px solid var(--danger-border)", backgroundColor: "var(--danger-light)" }}>
              <CardHeader
                title={<span style={{ color: "var(--danger-text)" }}>Overdue Tasks</span>}
                action={<Badge variant="danger">{overdueTasks.length}</Badge>}
              />
              <div>
                {overdueTasks.slice(0, 3).map((t) => (
                  <div key={t.id} className="task-row" style={{ backgroundColor: "var(--bg-card)" }}>
                    <span className={`priority-dot ${t.priority.toLowerCase()}`} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: "13.5px", fontWeight: 500, color: "var(--text-primary)" }}>{t.title}</span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>{t.subject}</span>
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--danger-text)", fontWeight: 600 }}>
                      {formatDateKey(t.date)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Scheduled Personal Tasks for Today */}
          <Card>
            <CardHeader
              title="Today's Personal Tasks"
              action={
                <Button variant="ghost" size="sm" onClick={handleAddNewTask}>
                  + Add Task
                </Button>
              }
            />
            {todayTasks.length === 0 ? (
              <EmptyState
                compact
                title="No personal tasks scheduled for today"
                action={
                  <Button variant="secondary" size="sm" onClick={handleAddNewTask}>
                    Create a task
                  </Button>
                }
              />
            ) : (
              <div>
                {todayTasks.map((t) => (
                  <div key={t.id} className={`task-row ${t.completed ? "completed" : ""}`}>
                    <button
                      type="button"
                      className={`custom-checkbox ${t.completed ? "checked" : ""}`}
                      onClick={() => toggleTaskComplete(t.id)}
                    >
                      {t.completed && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                    <div style={{ flex: 1 }}>
                      <span className="task-title-text" style={{ fontSize: "13.5px", fontWeight: 500, color: "var(--text-primary)" }}>
                        {t.title}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>{t.subject}</span>
                    </div>
                    {t.duration && <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{t.duration}</span>}
                    <Badge variant={t.priority === "High" ? "danger" : t.priority === "Medium" ? "warning" : "success"}>
                      {t.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Secondary Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Completion Rate Widget */}
          <Card>
            <CardHeader title="Completion Rate" />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0" }}>
              <div style={{ position: "relative", width: 130, height: 130, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="130" height="130" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="48" fill="none" strokeWidth="8" stroke="var(--bg-elevated)" />
                  {percentage > 0 && (
                    <circle
                      cx="60"
                      cy="60"
                      r="48"
                      fill="none"
                      strokeWidth="8"
                      stroke="var(--accent)"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 48}`}
                      strokeDashoffset={`${2 * Math.PI * 48 * (1 - percentage / 100)}`}
                      transform="rotate(-90 60 60)"
                      style={{ transition: "stroke-dashoffset 0.6s ease" }}
                    />
                  )}
                </svg>
                <div style={{ position: "absolute", textAlign: "center" }}>
                  <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)" }}>{percentage}%</span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>{completed}/{total} done</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Recent Materials */}
          <Card>
            <CardHeader
              title="Recent Materials"
              action={
                <Button variant="ghost" size="sm" onClick={() => navigate("/materials")}>
                  View all
                </Button>
              }
            />
            {recentMaterials.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center", padding: 12 }}>
                No materials uploaded.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recentMaterials.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      if (m.analysisStatus === "analyzed") {
                        const note = aiNotes.find((n) => n.materialId === m.id);
                        if (note) setViewingNotes(note);
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 10px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                      cursor: m.analysisStatus === "analyzed" ? "pointer" : "default",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {m.title}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {formatDateKey(m.createdAt)} &bull; {m.analysisStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Weekly Progress Bar Summary */}
          <Card>
            <CardHeader title="Weekly Activity" />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", marginBottom: 6 }}>
                  <span style={{ color: "var(--text-secondary)" }}>Today</span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{todayCompleted}/{todayTasks.length} tasks</span>
                </div>
                <div style={{ height: 6, borderRadius: "var(--radius-full)", backgroundColor: "var(--bg-elevated)", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: todayTasks.length > 0 ? `${Math.round((todayCompleted / todayTasks.length) * 100)}%` : "0%",
                      backgroundColor: "var(--accent)",
                      borderRadius: "var(--radius-full)",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", marginBottom: 6 }}>
                  <span style={{ color: "var(--text-secondary)" }}>7-Day Average</span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{weekPct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: "var(--radius-full)", backgroundColor: "var(--bg-elevated)", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${weekPct}%`,
                      backgroundColor: "var(--success)",
                      borderRadius: "var(--radius-full)",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Tools Access */}
          <Card>
            <CardHeader title="AI Shortcuts" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Button variant="secondary" size="sm" onClick={() => navigate("/ai/pomodoro")}>
                Pomodoro Focus
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate("/ai/flashcards")}>
                Flashcards
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate("/ai/quiz")}>
                AI Quiz
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate("/ai/concept-map")}>
                Concept Map
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
