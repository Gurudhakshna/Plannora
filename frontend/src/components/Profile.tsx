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
  if (!dateStr) return "Not set";
  const d = new Date(dateStr.length > 10 ? dateStr : dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function cleanValue(val?: string | null): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (trimmed.length < 2) return null;
  const dummyStrings = ["jj", "jh", "hj", "ih", "test", "asdf", "null", "undefined", "a", "b", "x"];
  if (dummyStrings.includes(trimmed.toLowerCase())) return null;
  return trimmed;
}

export default function Profile({ user, tasks, materials, onNavigate }: ProfileProps) {
  const rawPlan = useMemo<StudyPlan | null>(() => loadStudyPlan(user.uid), [user.uid]);

  const validatedPlan = useMemo(() => {
    if (!rawPlan) return null;
    const goal = cleanValue(rawPlan.studyGoal);
    const exam = cleanValue(rawPlan.targetExam);
    const cleanSubjects = (rawPlan.subjects || []).map(cleanValue).filter((s): s is string => s !== null);

    // If goal, exam, and subjects are all invalid/placeholder, treat plan as empty
    if (!goal && !exam && cleanSubjects.length === 0) {
      return null;
    }

    return {
      ...rawPlan,
      studyGoal: goal || "Not set",
      targetExam: exam || "Not set",
      subjects: cleanSubjects.length > 0 ? cleanSubjects : ["Not set"],
      dailyHours: cleanValue(rawPlan.dailyHours) || "Not set",
      preferredStudyTime: cleanValue(rawPlan.preferredStudyTime),
      prioritySubjects: cleanValue(rawPlan.prioritySubjects),
      dailyTarget: cleanValue(rawPlan.dailyTarget),
    };
  }, [rawPlan]);

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
        {validatedPlan ? (
          <dl className="profile-plan-grid">
            <div className="profile-plan-item">
              <dt>Goal</dt>
              <dd>{validatedPlan.studyGoal}</dd>
            </div>
            <div className="profile-plan-item">
              <dt>Target Exam / Course</dt>
              <dd>{validatedPlan.targetExam}</dd>
            </div>
            <div className="profile-plan-item">
              <dt>Subjects</dt>
              <dd>{validatedPlan.subjects.join(", ")}</dd>
            </div>
            <div className="profile-plan-item">
              <dt>Duration</dt>
              <dd>
                {formatLongDate(validatedPlan.startDate)} &rarr; {formatLongDate(validatedPlan.endDate)}
              </dd>
            </div>
            <div className="profile-plan-item">
              <dt>Daily Hours</dt>
              <dd>{validatedPlan.dailyHours}</dd>
            </div>
            {validatedPlan.preferredStudyTime && (
              <div className="profile-plan-item">
                <dt>Preferred Time</dt>
                <dd className="profile-plan-capitalize">{validatedPlan.preferredStudyTime}</dd>
              </div>
            )}
            {validatedPlan.prioritySubjects && (
              <div className="profile-plan-item">
                <dt>Priority Subjects</dt>
                <dd>{validatedPlan.prioritySubjects}</dd>
              </div>
            )}
            {validatedPlan.dailyTarget && (
              <div className="profile-plan-item">
                <dt>Daily Target</dt>
                <dd>{validatedPlan.dailyTarget}</dd>
              </div>
            )}
          </dl>
        ) : (
          <div className="dash-empty-inline">
            <p>No study plan configured yet.</p>
            <button className="link-btn" onClick={() => onNavigate("plan")}>
              Create a study plan
            </button>
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
