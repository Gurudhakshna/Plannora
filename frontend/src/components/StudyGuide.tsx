import type { AIStudyPlan } from "../types/study-material";

interface StudyGuideProps {
  plan: AIStudyPlan | null;
  onUpload: () => void;
  onTeachConcept?: (conceptName: string) => void;
}

export default function StudyGuide({ plan, onUpload, onTeachConcept }: StudyGuideProps) {
  if (!plan || !plan.days || plan.days.length === 0) {
    return (
      <div className="plan-page">
        <div className="empty-state">
          <div className="empty-state-icon-wrap">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <path d="M8 10C8 7.79 9.79 6 12 6H36C38.21 6 40 7.79 40 10V38C40 40.21 38.21 42 36 42H12C9.79 42 8 40.21 8 38V10Z" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
              <path d="M16 14H32M16 21H32M16 28H26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
            </svg>
          </div>
          <h3 className="empty-state-title">No intelligent study guide generated yet</h3>
          <p className="empty-state-text">
            Import your study material and Plannora will analyze dependencies and build an ordered study path for you.
          </p>
          <button className="btn btn-primary btn-lg" onClick={onUpload}>
            Import Material
          </button>
        </div>
      </div>
    );
  }

  // Flatten all sessions across days into a sequential recommended learning order
  const allSessions: { step: number; activity: string; duration: string; dayLabel: string }[] = [];
  let stepCounter = 1;
  for (const day of plan.days) {
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
    <div className="study-guide-page">
      {/* Header Banner */}
      <section className="study-guide-hero">
        <div className="hero-content">
          <span className="hero-eyebrow">INTELLIGENT STUDY PATH &bull; DEPENDENCY-RANKED</span>
          <h2 className="hero-title">Recommended Learning Sequence</h2>
          <p className="hero-desc">
            Topics ranked by prerequisite dependencies, exam weighting, and difficulty.
            Follow this order for optimal memory retention and concept mastery.
          </p>
        </div>
        <div className="hero-stats">
          <div className="hero-stat-box">
            <span className="stat-num">{allSessions.length}</span>
            <span className="stat-lbl">Steps</span>
          </div>
          <div className="hero-stat-box">
            <span className="stat-num">{plan.days.length}</span>
            <span className="stat-lbl">Study Days</span>
          </div>
        </div>
      </section>

      {/* Recommended Learning Order List */}
      <section className="study-guide-sequence">
        <h3 className="section-heading">What to Study First</h3>
        <div className="sequence-list">
          {allSessions.map((item) => {
            const conceptName = item.activity.replace(/^(Study:|Read:|Learn:|Review:)\s*/i, "").trim();
            return (
              <div key={item.step} className="sequence-card">
                <div className="step-badge">{item.step}</div>
                <div className="sequence-info">
                  <span className="step-activity">{item.activity}</span>
                  <span className="step-meta">
                    {item.duration} &bull; Scheduled for {item.dayLabel}
                  </span>
                </div>
                {onTeachConcept && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onTeachConcept(conceptName)}
                  >
                    Teach Me →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Day by Day Breakdown */}
      <section className="study-guide-days">
        <h3 className="section-heading">Day-by-Day Study Schedule</h3>
        <div className="plan-days-grid">
          {plan.days.map((day, idx) => (
            <div key={idx} className="plan-day-card">
              <div className="plan-day-head">
                <span className="plan-day-label">{day.label}</span>
                <span className="plan-day-date">{day.date}</span>
              </div>
              <div className="plan-session-list">
                {day.sessions.map((sess, sIdx) => (
                  <div key={sIdx} className="plan-session-item">
                    <span className="plan-session-duration">{sess.duration}</span>
                    <span className="plan-session-activity">{sess.activity}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
