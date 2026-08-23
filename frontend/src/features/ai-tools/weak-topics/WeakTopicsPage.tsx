import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../../context/AppContext";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import PageHeader from "../../../components/shared/PageHeader";
import EmptyState from "../../../components/shared/EmptyState";
import LoadingSpinner from "../../../components/shared/LoadingSpinner";
import { aiApiService, type WeakTopicItem } from "../../../services/aiApiService";

export default function WeakTopicsPage() {
  const navigate = useNavigate();
  const { userActivity, aiNotes, handleTeachConcept } = useApp();

  const [isLoading, setIsLoading] = useState(true);
  const [weakTopics, setWeakTopics] = useState<WeakTopicItem[]>([]);
  const [summary, setSummary] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function loadDiagnostics() {
      setIsLoading(true);
      try {
        // Collect real student activity data
        const activityPayload = Object.entries(userActivity.topicStats || {}).map(([topic, stat]) => ({
          topic,
          subject: stat.subject || "General",
          correct_count: stat.correctCount,
          total_count: stat.totalCount,
          ratings: stat.ratings || [],
        }));

        // If no activity yet, check if there are analyzed notes to provide preliminary review
        if (activityPayload.length === 0 && aiNotes.length > 0) {
          aiNotes.forEach((n) => {
            (n.concepts || []).forEach((c, idx) => {
              if (c.priority === "high" || idx === 0) {
                activityPayload.push({
                  topic: c.name,
                  subject: n.topic,
                  correct_count: 1,
                  total_count: 3, // Initial diagnostic baseline
                  ratings: ["hard"],
                });
              }
            });
          });
        }

        const res = await aiApiService.calculateWeakTopics(activityPayload);
        if (isMounted) {
          setWeakTopics(res.weak_topics);
          setSummary(res.summary);
        }
      } catch {
        if (isMounted) {
          setWeakTopics([]);
          setSummary("Complete a few quizzes and study sessions to identify your weak topics.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDiagnostics();
    return () => {
      isMounted = false;
    };
  }, [userActivity, aiNotes]);

  return (
    <div>
      <PageHeader
        title="Weak Topic Diagnostics"
        description="Performance gap analysis calculating actual mastery from quiz submissions and generating targeted Groq study strategies."
      />

      {isLoading ? (
        <div style={{ padding: "60px 0", textAlign: "center" }}>
          <LoadingSpinner size="lg" message="Analyzing performance and generating study advice..." />
        </div>
      ) : weakTopics.length === 0 ? (
        <EmptyState
          title="No diagnostic data available yet"
          description="Complete quizzes and flashcard review sessions. Plannora will automatically track your accuracy and identify areas needing targeted revision."
          action={
            <div style={{ display: "flex", gap: 12 }}>
              <Button variant="primary" size="md" onClick={() => navigate("/ai/quiz")}>
                Take a Quiz &rarr;
              </Button>
              <Button variant="secondary" size="md" onClick={() => navigate("/ai/flashcards")}>
                Review Flashcards
              </Button>
            </div>
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {summary && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                fontSize: "13.5px",
                color: "var(--text-secondary)",
              }}
            >
              📊 <strong>Diagnostics Summary:</strong> {summary}
            </div>
          )}

          {weakTopics.map((topic, idx) => {
            const isWeak = topic.weakness_level === "Weak";
            const isPractice = topic.weakness_level === "Needs Practice";

            return (
              <Card key={idx}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                        {topic.topic}
                      </h3>
                      <Badge variant="neutral">{topic.subject}</Badge>
                      <Badge variant={isWeak ? "danger" : isPractice ? "warning" : "success"}>
                        {topic.weakness_level}
                      </Badge>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <div style={{ flex: 1, maxWidth: 220, height: 6, backgroundColor: "var(--bg-hover)", borderRadius: 3, overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.min(100, topic.accuracy)}%`,
                            backgroundColor: isWeak ? "var(--danger)" : isPractice ? "var(--warning)" : "var(--success)",
                          }}
                        />
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {topic.accuracy}% Accuracy
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        ({topic.attempts} attempts)
                      </span>
                    </div>

                    {/* AI Recommendation */}
                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: "var(--bg-inset)",
                        border: "1px solid var(--border-subtle)",
                        marginBottom: 10,
                      }}
                    >
                      <span style={{ fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", color: "var(--accent-text)", letterSpacing: "0.05em" }}>
                        AI Remediation Advice
                      </span>
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.45 }}>
                        {topic.recommendation}
                      </p>

                      {topic.action_steps && topic.action_steps.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                            Action Steps:
                          </span>
                          <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: "12.5px", color: "var(--text-muted)" }}>
                            {topic.action_steps.map((step, sIdx) => (
                              <li key={sIdx} style={{ marginBottom: 2 }}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, alignSelf: "center" }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleTeachConcept(topic.topic, topic.subject)}
                    >
                      Teach Me &rarr;
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate("/ai/quiz")}
                    >
                      Practice Quiz
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
