import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useApp } from "../context/AppContext";
import Card, { CardHeader } from "../components/ui/Card";
import Button from "../components/ui/Button";
import PageHeader from "../components/shared/PageHeader";
import { formatDateKey } from "../utils/storage";

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { studyPlan, materials, allTasks } = useApp();

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Student";
  const initial = displayName.charAt(0).toUpperCase();
  const completedCount = allTasks.filter((t) => t.completed).length;

  return (
    <div>
      <PageHeader
        title="Student Profile"
        description="Your academic identity, enrolled course roadmaps, and global study metrics."
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        {/* User Identity Card */}
        <Card>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "16px 0" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "var(--radius-full)",
                background: "linear-gradient(135deg, #475569 0%, #334155 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: 700,
                color: "#FFFFFF",
                marginBottom: 16,
                border: "2px solid var(--border)",
              }}
            >
              {user?.photoURL ? <img src={user.photoURL} alt={displayName} style={{ width: "100%", height: "100%", borderRadius: "50%" }} /> : initial}
            </div>

            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
              {displayName}
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: 2, marginBottom: 18 }}>
              {user?.email || "user@plannora.dev"}
            </p>

            <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
              <div style={{ padding: "10px", backgroundColor: "var(--bg-elevated)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>{materials.length}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Materials</div>
              </div>
              <div style={{ padding: "10px", backgroundColor: "var(--bg-elevated)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--accent-text)" }}>{completedCount}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Tasks Done</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Study Plan Roadmap Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <CardHeader
              title="Configured Study Roadmap"
              action={
                <Button variant="secondary" size="sm" onClick={() => navigate("/setup-study-plan")}>
                  Update Plan
                </Button>
              }
            />

            {studyPlan ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: "13px" }}>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", marginBottom: 2 }}>Target Goal:</span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{studyPlan.studyGoal}</span>
                </div>

                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", marginBottom: 2 }}>Exam / Course:</span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{studyPlan.targetExam}</span>
                </div>

                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", marginBottom: 2 }}>Active Subjects:</span>
                  <span style={{ color: "var(--accent-text)", fontWeight: 500 }}>
                    {Array.isArray(studyPlan.subjects) ? studyPlan.subjects.join(", ") : studyPlan.subjects}
                  </span>
                </div>

                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", marginBottom: 2 }}>Schedule Window:</span>
                  <span style={{ color: "var(--text-primary)" }}>
                    {formatDateKey(studyPlan.startDate)} &rarr; {formatDateKey(studyPlan.endDate)}
                  </span>
                </div>

                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", marginBottom: 2 }}>Daily Study Commitment:</span>
                  <span style={{ color: "var(--text-primary)" }}>
                    {studyPlan.dailyHours} ({studyPlan.preferredStudyTime || "Flexible"})
                  </span>
                </div>

                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", marginBottom: 2 }}>Study Days / Week:</span>
                  <span style={{ color: "var(--text-primary)" }}>{studyPlan.daysPerWeek || 7} days</span>
                </div>
              </div>
            ) : (
              <div style={{ padding: "16px 0", textAlign: "center" }}>
                <p style={{ fontSize: "13.5px", color: "var(--text-muted)", marginBottom: 12 }}>
                  No study plan configured yet.
                </p>
                <Button variant="primary" size="sm" onClick={() => navigate("/setup-study-plan")}>
                  Configure Study Plan
                </Button>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Device & Storage Persistence" />
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Your workspace data is securely cached in your local environment. You can clear temporary cache or adjust developer features in the Settings menu.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
