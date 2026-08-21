import { useMemo } from "react";
import type { Task, Page, StudyPlan } from "../types/task";
import type { StudyMaterial } from "../types/study-material";
import type { AuthUser } from "../services/authService";
import { loadStudyPlan } from "../utils/storage";

interface ProfileProps {
  user: AuthUser;
  tasks: Task[];
  materials: StudyMaterial[];
  onNavigate: (page: Page) => void;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function formatLongDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function Profile({ user, tasks, materials, onNavigate }: ProfileProps) {
  const plan = useMemo<StudyPlan | null>(() => loadStudyPlan(user.uid), [user.uid]);

  const completedCount = tasks.filter((t) => t.completed).length;
  const analyzedCount = materials.filter((m) => m.analysisStatus === "analyzed").length;

  const displayName = user.displayName || user.email?.split("@")[0] || "User";

  return (
    <div className="profile-page">
      <section className="dash-section profile-card">
        <div className="profile-identity">
          {user.photoURL ? (
            <img src={user.photoURL} alt={`${displayName}'s avatar`} className="profile-avatar" referrerPolicy="no-referrer" />
          ) : (
            <div className="profile-avatar profile-avatar-fallback" aria-hidden="true">
              {getInitials(displayName)}
            </div>
          )}
          <div className="profile-id-info">
            <h2 className="profile-name">{displayName}</h2>
            {user.email && <p className="profile-email">{user.email}</p>}
          </div>
        </div>
        <div className="profile-stats-row">
          <button type="button" className="profile-stat" onClick={() => onNavigate("materials")}>
            <span className="profile-stat-value">{materials.length}</span>
            <span className="profile-stat-label">Materials</span>
          </button>
          <button type="button" className="profile-stat" onClick={() => onNavigate("progress")}>
            <span className="profile-stat-value">{completedCount}</span>
            <span className="profile-stat-label">Tasks Done</span>
          </button>
          <button type="button" className="profile-stat" onClick={() => onNavigate("materials")}>
            <span className="profile-stat-value">{analyzedCount}</span>
            <span className="profile-stat-label">Analyzed</span>
          </button>
        </div>
      </section>

      <section className="dash-section">
        <div className="dash-section-header">
          <h3 className="dash-section-title">My Study Plan</h3>
          <button className="link-btn" onClick={() => onNavigate("plan")}>
            Open planner
          </button>
        </div>
        {plan ? (
          <dl className="profile-plan-grid">
            <div className="profile-plan-item">
              <dt>Goal</dt>
              <dd>{plan.studyGoal}</dd>
            </div>
            <div className="profile-plan-item">
              <dt>Target Exam / Course</dt>
              <dd>{plan.targetExam}</dd>
            </div>
            <div className="profile-plan-item">
              <dt>Subjects</dt>
              <dd>{plan.subjects.join(", ")}</dd>
            </div>
            <div className="profile-plan-item">
              <dt>Duration</dt>
              <dd>
                {formatLongDate(plan.startDate)} &rarr; {formatLongDate(plan.endDate)}
              </dd>
            </div>
            <div className="profile-plan-item">
              <dt>Daily Hours</dt>
              <dd>{plan.dailyHours || "Not set"}</dd>
            </div>
            {plan.preferredStudyTime && (
              <div className="profile-plan-item">
                <dt>Preferred Time</dt>
                <dd className="profile-plan-capitalize">{plan.preferredStudyTime}</dd>
              </div>
            )}
            {plan.prioritySubjects && (
              <div className="profile-plan-item">
                <dt>Priority Subjects</dt>
                <dd>{plan.prioritySubjects}</dd>
              </div>
            )}
            {plan.dailyTarget && (
              <div className="profile-plan-item">
                <dt>Daily Target</dt>
                <dd>{plan.dailyTarget}</dd>
              </div>
            )}
          </dl>
        ) : (
          <div className="dash-empty-inline">
            <p>No study plan configured.</p>
          </div>
        )}
      </section>

      <section className="dash-section">
        <div className="dash-section-header">
          <h3 className="dash-section-title">Account</h3>
        </div>
        <p className="profile-account-note">
          You are signed in locally on this device. Your tasks, materials and study plan are stored
          in this browser.
        </p>
        <div className="profile-account-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("settings")}>
            Open Settings
          </button>
        </div>
      </section>
    </div>
  );
}
