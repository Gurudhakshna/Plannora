import { useApp } from "../../context/AppContext";
import Button from "../../components/ui/Button";
import Card, { CardHeader } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/shared/EmptyState";
import PageHeader from "../../components/shared/PageHeader";

export default function StudyPlanPage() {
  const { aiPlan, handleUpload, handleTeachConcept } = useApp();

  if (!aiPlan || !aiPlan.days || aiPlan.days.length === 0) {
    return (
      <div>
        <PageHeader
          title="Intelligent Study Roadmap"
          description="Dependency-ordered learning schedule automatically generated from your study materials."
        />
        <EmptyState
          title="No study roadmap generated yet"
          description="Upload your syllabus, lecture slides, or course notes. Plannora will break down concepts by prerequisite dependencies and build an optimal study schedule."
          action={
            <Button variant="primary" size="lg" onClick={() => handleUpload("file")}>
              Import Study Material
            </Button>
          }
        />
      </div>
    );
  }

  // Flatten all sessions across days into sequential learning order
  const allSessions: { step: number; activity: string; duration: string; dayLabel: string }[] = [];
  let stepCounter = 1;
  for (const day of aiPlan.days) {
    for (const sess of day.sessions) {
      allSessions.push({
        step: stepCounter++,
        activity: sess.activity,
        duration: sess.duration,
        dayLabel: day.label,
      });
    }
  }

  return (
    <div>
      <PageHeader
        title="Intelligent Study Roadmap"
        description="Topics ranked by prerequisite dependencies, exam weighting, and cognitive difficulty."
        action={
          <Button variant="primary" size="sm" onClick={() => handleUpload("file")}>
            + Import More Material
          </Button>
        }
      />

      {/* Hero Overview Box */}
      <Card style={{ marginBottom: 24, border: "1px solid var(--accent-border)", backgroundColor: "var(--bg-elevated)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <Badge variant="primary" style={{ marginBottom: 8 }}>
              DEPENDENCY-RANKED SYLLABUS
            </Badge>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Optimal Concept Learning Sequence
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: 600, lineHeight: 1.5 }}>
              Follow this sequence to build foundational understanding first, ensuring high memory retention and rapid mastery.
            </p>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ textAlign: "center", padding: "8px 16px", backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>{allSessions.length}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Core Steps</div>
            </div>
            <div style={{ textAlign: "center", padding: "8px 16px", backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>{aiPlan.days.length}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Study Days</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Recommended Learning Order List */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: 14 }}>
          Recommended Step-by-Step Sequence
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {allSessions.map((item) => {
            const conceptName = item.activity.replace(/^(Study:|Read:|Learn:|Review:)\s*/i, "").trim();
            return (
              <div
                key={item.step}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "14px 18px",
                  borderRadius: "var(--radius-lg)",
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  transition: "all var(--transition-fast)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "var(--radius-full)",
                      backgroundColor: "var(--accent-light)",
                      color: "var(--accent-text)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {item.step}
                  </div>
                  <div>
                    <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {item.activity}
                    </h4>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {item.duration} &bull; Scheduled for {item.dayLabel}
                    </span>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleTeachConcept(conceptName)}
                >
                  Teach Me &rarr;
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day-by-Day Study Schedule Cards */}
      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: 14 }}>
          Day-by-Day Study Breakdown
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {aiPlan.days.map((day, idx) => (
            <Card key={idx}>
              <CardHeader
                title={day.label}
                action={<Badge variant="neutral">{day.date}</Badge>}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {day.sessions.map((sess, sIdx) => (
                  <div
                    key={sIdx}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--bg-elevated)",
                      fontSize: "12.5px",
                    }}
                  >
                    <span style={{ fontWeight: 600, color: "var(--accent-text)", marginRight: 6 }}>
                      {sess.duration}
                    </span>
                    <span style={{ color: "var(--text-primary)" }}>{sess.activity}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
