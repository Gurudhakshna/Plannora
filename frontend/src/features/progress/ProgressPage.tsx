import { useMemo } from "react";
import { useApp } from "../../context/AppContext";
import Card, { CardHeader } from "../../components/ui/Card";
import PageHeader from "../../components/shared/PageHeader";
import EmptyState from "../../components/shared/EmptyState";
import { getToday, toDateKey } from "../../utils/storage";

function parseDurationMinutes(duration: string): number {
  if (!duration) return 0;
  const hourMin = duration.match(/(\d+(?:\.\d+)?)\s*h(?:our)?s?\s*(\d+)?\s*m?/i);
  if (hourMin) {
    const hours = parseFloat(hourMin[1]);
    const mins = hourMin[2] ? parseInt(hourMin[2], 10) : 0;
    return Math.round(hours * 60 + mins);
  }
  const minMatch = duration.match(/(\d+)\s*m/i);
  if (minMatch) return parseInt(minMatch[1], 10);
  return 0;
}

function formatHours(minutes: number): string {
  if (minutes === 0) return "0 hrs";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function getWeekDates(): string[] {
  const dates: string[] = [];
  const d = new Date();
  d.setDate(d.getDate() - 6);
  for (let i = 0; i < 7; i++) {
    const cur = new Date(d);
    cur.setDate(cur.getDate() + i);
    dates.push(toDateKey(cur));
  }
  return dates;
}

export default function ProgressPage() {
  const { allTasks } = useApp();
  const todayStr = getToday();

  const stats = useMemo(() => {
    const total = allTasks.length;
    const completed = allTasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    const studiedMinutes = allTasks
      .filter((t) => t.completed)
      .reduce((sum, t) => sum + parseDurationMinutes(t.duration), 0);

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

    // Subject breakdown
    const subjectMap: Record<string, { total: number; completed: number }> = {};
    allTasks.forEach((t) => {
      const subj = t.subject || "General";
      if (!subjectMap[subj]) subjectMap[subj] = { total: 0, completed: 0 };
      subjectMap[subj].total++;
      if (t.completed) subjectMap[subj].completed++;
    });

    const subjects = Object.entries(subjectMap)
      .map(([name, data]) => ({
        name,
        total: data.total,
        completed: data.completed,
        percentage: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // 7-day weekly activity
    const weekDates = getWeekDates();
    const weeklyData = weekDates.map((dateStr) => {
      const dayTasks = allTasks.filter((t) => t.date === dateStr);
      const dayCompleted = dayTasks.filter((t) => t.completed).length;
      return {
        date: dateStr,
        label: new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }),
        total: dayTasks.length,
        completed: dayCompleted,
      };
    });

    const maxWeeklyTasks = Math.max(...weeklyData.map((d) => d.total), 1);

    return { total, completed, pending, percentage, streak, studiedMinutes, subjects, weeklyData, maxWeeklyTasks };
  }, [allTasks, todayStr]);

  if (allTasks.length === 0) {
    return (
      <div>
        <PageHeader
          title="Progress & Analytics"
          description="Track overall syllabus coverage, retention trends, and subject-level mastery."
        />
        <EmptyState
          title="No study activity recorded yet"
          description="Complete scheduled tasks and take practice quizzes to populate your retention metrics."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Progress & Analytics"
        description="Comprehensive diagnostic metrics on task throughput, retention velocity, and subject mastery."
      />

      {/* Top 4 Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
        <Card style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative", width: 68, height: 68, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="68" height="68" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="48" fill="none" strokeWidth="10" stroke="var(--bg-elevated)" />
              {stats.percentage > 0 && (
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  strokeWidth="10"
                  stroke="var(--accent)"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 48}`}
                  strokeDashoffset={`${2 * Math.PI * 48 * (1 - stats.percentage / 100)}`}
                  transform="rotate(-90 60 60)"
                />
              )}
            </svg>
            <span style={{ position: "absolute", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
              {stats.percentage}%
            </span>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
              Completion Rate
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
              {stats.completed}/{stats.total}
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>
            Tasks Completed
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--success-text)" }}>
            {stats.completed}
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{stats.pending} remaining</span>
        </Card>

        <Card>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>
            Est. Study Time
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--accent-text)" }}>
            {formatHours(stats.studiedMinutes)}
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>From completed sessions</span>
        </Card>

        <Card>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>
            Current Streak
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--warning-text)" }}>
            {stats.streak} <span style={{ fontSize: "14px", fontWeight: 500 }}>days</span>
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Consistent daily practice</span>
        </Card>
      </div>

      {/* Grid: 7-Day Activity & Subject Mastery */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24 }}>
        {/* Weekly Chart */}
        <Card>
          <CardHeader title="7-Day Activity Velocity" subtitle="Daily completion volume" />
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: 180, padding: "20px 10px 0 10px", gap: 12 }}>
            {stats.weeklyData.map((d) => {
              const heightPct = (d.total / stats.maxWeeklyTasks) * 100;
              const doneHeightPct = (d.completed / stats.maxWeeklyTasks) * 100;

              return (
                <div key={d.date} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 8 }}>
                  <div style={{ width: "100%", maxWidth: 36, height: 120, position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                    <div
                      style={{
                        position: "absolute",
                        width: "100%",
                        height: `${Math.max(heightPct, 6)}%`,
                        backgroundColor: "var(--bg-elevated)",
                        borderRadius: "var(--radius-sm)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        width: "100%",
                        height: `${Math.max(doneHeightPct, d.completed > 0 ? 6 : 0)}%`,
                        backgroundColor: "var(--accent)",
                        borderRadius: "var(--radius-sm)",
                        transition: "height 0.4s ease",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{d.label}</span>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-primary)" }}>{d.completed}/{d.total}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Subject Breakdown */}
        <Card>
          <CardHeader title="Subject Mastery" subtitle="Completion by course module" />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {stats.subjects.map((s) => (
              <div key={s.name}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: 4 }}>
                  <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{s.name}</span>
                  <span style={{ color: "var(--text-muted)" }}>{s.completed}/{s.total} ({s.percentage}%)</span>
                </div>
                <div style={{ height: 6, borderRadius: "var(--radius-full)", backgroundColor: "var(--bg-elevated)", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${s.percentage}%`,
                      backgroundColor: s.percentage >= 80 ? "var(--success)" : s.percentage >= 40 ? "var(--accent)" : "var(--warning)",
                      borderRadius: "var(--radius-full)",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
