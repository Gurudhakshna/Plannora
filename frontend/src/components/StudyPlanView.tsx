import { useMemo } from "react";
import type { AIStudyPlan } from "../types/study-material";
import { getToday, formatDateKey } from "../utils/storage";

interface StudyPlanViewProps {
  plan: AIStudyPlan | null;
  onUpload: () => void;
}

type DayStatus = "past" | "today" | "upcoming";

function parseMinutes(duration: string): number {
  const minMatch = duration.match(/(\d+)\s*min/i);
  if (minMatch) return parseInt(minMatch[1], 10);
  const hourMatch = duration.match(/(\d+(?:\.\d+)?)\s*h/i);
  if (hourMatch) return Math.round(parseFloat(hourMatch[1]) * 60);
  return 0;
}

function formatTotalTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const STATUS_META: Record<DayStatus, { label: string; className: string }> = {
  past: { label: "Past", className: "plan-day-badge-past" },
  today: { label: "Today", className: "plan-day-badge-today" },
  upcoming: { label: "Upcoming", className: "plan-day-badge-upcoming" },
};

export default function StudyPlanView({ plan, onUpload }: StudyPlanViewProps) {
  const todayStr = getToday();

  const summary = useMemo(() => {
    if (!plan || plan.days.length === 0) return null;
    const totalSessions = plan.days.reduce((sum, d) => sum + d.sessions.length, 0);
    const totalMinutes = plan.days.reduce(
      (sum, d) => sum + d.sessions.reduce((s, sess) => s + parseMinutes(sess.duration), 0),
      0
    );
    const pastDays = plan.days.filter((d) => d.date < todayStr).length;
    const upcomingDays = plan.days.filter((d) => d.date > todayStr).length;
    const todayPlan = plan.days.find((d) => d.date === todayStr) ?? null;
    const todaySessions = todayPlan?.sessions.length ?? 0;
    return { totalSessions, totalMinutes, pastDays, upcomingDays, todayPlan, todaySessions };
  }, [plan, todayStr]);

  if (!plan || !summary) {
    return (
      <div className="plan-page">
        <div className="empty-state">
          <div className="empty-state-icon-wrap">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <path d="M8 10C8 7.79 9.79 6 12 6H36C38.21 6 40 7.79 40 10V38C40 40.21 38.21 42 36 42H12C9.79 42 8 40.21 8 38V10Z" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
              <path d="M16 14H32M16 21H32M16 28H26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
              <path d="M24 34L27 37L33 31" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
            </svg>
          </div>
          <h3 className="empty-state-title">No study plan yet</h3>
          <p className="empty-state-text">
            Upload your study material and Plannora will build a day-by-day study plan for you.
          </p>
          <button className="btn btn-primary btn-lg" onClick={onUpload}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M8 2V12M3 7L8 2L13 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Upload Material
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="plan-page">
      <section className="plan-summary-card">
        <div className="plan-summary-info">
          <span className="plan-summary-eyebrow">AI Generated</span>
          <h2 className="plan-summary-title">Your Personalized Study Plan</h2>
          <p className="plan-summary-date">Created {new Date(plan.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
        </div>
        <div className="plan-meta-stats">
          <div className="plan-meta-stat">
            <span className="plan-meta-value">{summary.totalSessions}</span>
            <span className="plan-meta-label">Sessions</span>
          </div>
          <div className="plan-meta-stat">
            <span className="plan-meta-value">{formatTotalTime(summary.totalMinutes)}</span>
            <span className="plan-meta-label">Total Time</span>
          </div>
          <div className="plan-meta-stat">
            <span className="plan-meta-value">{summary.todaySessions}</span>
            <span className="plan-meta-label">Today</span>
          </div>
        </div>
      </section>

      {summary.todayPlan && (
        <section className="dash-section plan-today-focus">
          <div className="dash-section-header">
            <h3 className="dash-section-title">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M9 5V9L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Today&apos;s Sessions
            </h3>
            <span className="dash-section-count">{formatDateKey(summary.todayPlan.date, { weekday: "long", month: "short", day: "numeric" })}</span>
          </div>
          <div className="plan-session-list">
            {summary.todayPlan.sessions.map((sess, i) => (
              <div key={i} className="plan-session-item current">
                <span className="plan-session-duration">{sess.duration}</span>
                <span className="plan-session-activity">{sess.activity}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="plan-days-grid">
        {plan.days.map((day) => {
          const status: DayStatus = day.date === todayStr ? "today" : day.date < todayStr ? "past" : "upcoming";
          const meta = STATUS_META[status];
          return (
            <div key={day.date} className={`plan-day-card ${status}`}>
              <div className="plan-day-head">
                <div className="plan-day-titles">
                  <span className="plan-day-label">{day.label}</span>
                  <span className="plan-day-date">{formatDateKey(day.date, { weekday: "short", month: "short", day: "numeric" })}</span>
                </div>
                <span className={`plan-day-badge ${meta.className}`}>{meta.label}</span>
              </div>
              <div className="plan-session-list">
                {day.sessions.map((sess, i) => (
                  <div key={i} className={`plan-session-item ${status === "today" ? "current" : ""}`}>
                    <span className="plan-session-duration">{sess.duration}</span>
                    <span className="plan-session-activity">{sess.activity}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="plan-legend" aria-hidden="true">
        <span className="legend-item"><span className="legend-dot plan-dot-past" />Past</span>
        <span className="legend-item"><span className="legend-dot plan-dot-today" />Current</span>
        <span className="legend-item"><span className="legend-dot plan-dot-upcoming" />Upcoming</span>
      </div>
    </div>
  );
}
