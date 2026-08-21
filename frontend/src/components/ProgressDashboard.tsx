import { useMemo } from "react";
import type { Task } from "../types/task";
import { getToday, toDateKey } from "../utils/storage";

interface ProgressDashboardProps {
  tasks: Task[];
}

function calcStreak(tasks: Task[]): number {
  const completedDates = new Set(
    tasks.filter((t) => t.completed).map((t) => t.date)
  );
  let streak = 0;
  const d = new Date();
  const todayStr = getToday();
  if (!completedDates.has(todayStr)) {
    d.setDate(d.getDate() - 1);
  }
  while (completedDates.has(toDateKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

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
  if (minutes === 0) return "0h";
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

export default function ProgressDashboard({ tasks }: ProgressDashboardProps) {
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const streak = calcStreak(tasks);

    const studiedMinutes = tasks
      .filter((t) => t.completed)
      .reduce((sum, t) => sum + parseDurationMinutes(t.duration), 0);

    const subjectMap: Record<string, { total: number; completed: number }> = {};
    tasks.forEach((t) => {
      if (!subjectMap[t.subject]) subjectMap[t.subject] = { total: 0, completed: 0 };
      subjectMap[t.subject].total++;
      if (t.completed) subjectMap[t.subject].completed++;
    });
    const subjects = Object.entries(subjectMap).map(([name, data]) => ({
      name,
      total: data.total,
      completed: data.completed,
      percentage: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    })).sort((a, b) => b.total - a.total);

    const weekDates = getWeekDates();
    const weeklyData = weekDates.map((dateStr) => {
      const dayTasks = tasks.filter((t) => t.date === dateStr);
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
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="progress-page">
        <div className="empty-state">
          <div className="empty-state-icon-wrap">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <path d="M6 40V30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.2"/>
              <path d="M14 40V22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.25"/>
              <path d="M22 40V14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.3"/>
              <path d="M30 40V10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.35"/>
              <path d="M38 40V6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
            </svg>
          </div>
          <h3 className="empty-state-title">No progress data yet</h3>
          <p className="empty-state-text">Add and complete tasks to see your study progress here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="progress-page">
      <div className="progress-stats-grid">
        <div className="progress-stat-card">
          <div className="progress-ring-container">
            <svg className="progress-ring" viewBox="0 0 120 120" role="img" aria-label={`${stats.percentage}% completion rate`}>
              <circle className="progress-ring-bg" cx="60" cy="60" r="50" fill="none" strokeWidth="10"/>
              <circle
                className="progress-ring-fill"
                cx="60"
                cy="60"
                r="50"
                fill="none"
                strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - stats.percentage / 100)}`}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <span className="progress-ring-text">{stats.percentage}%</span>
          </div>
          <span className="progress-stat-label">Completion Rate</span>
        </div>

        <div className="progress-stat-card">
          <div className="progress-stat-number completed-color">{stats.completed}</div>
          <span className="progress-stat-label">Tasks Completed</span>
        </div>

        <div className="progress-stat-card">
          <div className="progress-stat-number primary-color" title="Estimated from durations of completed tasks">
            {formatHours(stats.studiedMinutes)}
          </div>
          <span className="progress-stat-label">Est. Study Hours</span>
        </div>

        <div className="progress-stat-card">
          <div className="progress-stat-number streak-color">{stats.streak}</div>
          <span className="progress-stat-label">Day Streak</span>
        </div>
      </div>

      <div className="progress-sections">
        <div className="progress-card">
          <h3 className="progress-card-title">Weekly Activity</h3>
          <div className="weekly-chart">
            {stats.weeklyData.map((day) => (
              <div key={day.date} className="weekly-bar-container" title={`${day.label}: ${day.completed} of ${day.total} tasks completed`}>
                <div className="weekly-bar-wrapper">
                  <div className="weekly-bar-track">
                    <div
                      className="weekly-bar-fill"
                      style={{ height: `${(day.total / stats.maxWeeklyTasks) * 100}%` }}
                    />
                    <div
                      className="weekly-bar-done"
                      style={{ height: `${(day.completed / stats.maxWeeklyTasks) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="weekly-bar-label">{day.label}</span>
                <span className="weekly-bar-count">{day.completed}/{day.total}</span>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-dot legend-total" />Total</span>
            <span className="legend-item"><span className="legend-dot legend-done" />Completed</span>
          </div>
        </div>

        <div className="progress-card">
          <h3 className="progress-card-title">Subject Progress</h3>
          {stats.subjects.length === 0 ? (
            <div className="dash-empty-inline"><p>No subject data yet</p></div>
          ) : (
            <div className="subject-list">
              {stats.subjects.map((s) => (
                <div key={s.name} className="subject-progress-item">
                  <div className="subject-info">
                    <span className="subject-name">{s.name}</span>
                    <span className="subject-count">{s.completed}/{s.total} tasks</span>
                  </div>
                  <div className="subject-bar-container">
                    <div
                      className="subject-bar"
                      role="progressbar"
                      aria-valuenow={s.percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${s.name}: ${s.percentage}% complete`}
                    >
                      <div className="subject-bar-fill" style={{ width: `${s.percentage}%` }} />
                    </div>
                    <span className="subject-percentage">{s.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
