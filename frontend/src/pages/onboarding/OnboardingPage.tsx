import { useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { saveStudyPlan, getToday, formatDateKey } from "../../utils/storage";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Textarea from "../../components/ui/Textarea";
import Button from "../../components/ui/Button";

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  // Form State
  const [studyGoal, setStudyGoal] = useState("");
  const [targetExam, setTargetExam] = useState("");
  const [subjects, setSubjects] = useState("");
  const [prioritySubjects, setPrioritySubjects] = useState("");
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState("6");
  const [dailyHours, setDailyHours] = useState("3 hours");
  const [preferredStudyTime, setPreferredStudyTime] = useState("evening");
  const [dailyTarget, setDailyTarget] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  function validateCurrentStep(): boolean {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!studyGoal.trim()) newErrors.studyGoal = "Please enter your study goal.";
      if (!targetExam.trim()) newErrors.targetExam = "Please enter your target course or exam name.";
    }

    if (step === 2) {
      if (!subjects.trim()) newErrors.subjects = "At least one subject is required.";
    }

    if (step === 3) {
      if (!startDate) newErrors.startDate = "Start date is required.";
      if (!endDate) {
        newErrors.endDate = "End date is required.";
      } else if (startDate && endDate && endDate < startDate) {
        newErrors.endDate = "End date must be after start date.";
      }
    }

    if (step === 4) {
      if (!dailyHours.trim()) newErrors.dailyHours = "Daily study hours is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (validateCurrentStep()) {
      setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    }
  }

  function handleBack() {
    setErrors({});
    setStep((prev) => Math.max(prev - 1, 1));
  }

  function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateCurrentStep() || !user) return;

    const validSubjects = subjects
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length >= 2);

    saveStudyPlan({
      studyGoal: studyGoal.trim(),
      subjects: validSubjects.length > 0 ? validSubjects : [subjects.trim()],
      targetExam: targetExam.trim(),
      startDate,
      endDate,
      dailyHours: dailyHours.trim(),
      preferredStudyTime: preferredStudyTime.trim(),
      daysPerWeek: daysPerWeek.trim(),
      prioritySubjects: prioritySubjects.trim(),
      dailyTarget: dailyTarget.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
      userId: user.uid,
    });

    navigate("/dashboard", { replace: true });
  }

  const progressPercentage = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div className="onboarding-container">
      <header className="onboarding-header">
        <Link to="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-md)",
              background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
            Plannora
          </span>
        </Link>
        <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          Step {step} of {TOTAL_STEPS}
        </span>
      </header>

      <main className="onboarding-body">
        <div className="onboarding-card">
          {/* Progress Bar */}
          <div className="wizard-progress-bar">
            <div className="wizard-progress-fill" style={{ width: `${progressPercentage}%` }} />
          </div>

          <form onSubmit={step === TOTAL_STEPS ? handleFinalSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            {/* Step 1 — Goal */}
            {step === 1 && (
              <div>
                <div className="wizard-step-info">
                  <span className="wizard-step-badge">STEP 1 &bull; TARGET</span>
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                  What is your primary academic goal?
                </h2>
                <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginBottom: 24 }}>
                  Define what you&apos;re preparing for so Plannora can optimize your revision timeline.
                </p>

                <Input
                  label="Study Goal"
                  placeholder="e.g. Master Linear Algebra and score an A in finals"
                  value={studyGoal}
                  onChange={(e) => setStudyGoal(e.target.value)}
                  error={errors.studyGoal}
                  required
                />

                <Input
                  label="Target Exam / Course"
                  placeholder="e.g. CS201: Algorithms & Data Structures"
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  error={errors.targetExam}
                  required
                />
              </div>
            )}

            {/* Step 2 — Subjects */}
            {step === 2 && (
              <div>
                <div className="wizard-step-info">
                  <span className="wizard-step-badge">STEP 2 &bull; CURRICULUM</span>
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                  Which subjects are you studying?
                </h2>
                <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginBottom: 24 }}>
                  Add your core subjects. Separate multiple subjects with commas.
                </p>

                <Input
                  label="Subjects (comma-separated)"
                  placeholder="e.g. Mathematics, Machine Learning, Operating Systems"
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  error={errors.subjects}
                  hint="Example: Data Structures, Computer Networks, Database Systems"
                  required
                />

                <Input
                  label="Priority Focus Subjects (Optional)"
                  placeholder="e.g. Machine Learning (needs extra revision)"
                  value={prioritySubjects}
                  onChange={(e) => setPrioritySubjects(e.target.value)}
                />
              </div>
            )}

            {/* Step 3 — Schedule */}
            {step === 3 && (
              <div>
                <div className="wizard-step-info">
                  <span className="wizard-step-badge">STEP 3 &bull; TIMELINE</span>
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                  When is your preparation period?
                </h2>
                <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginBottom: 24 }}>
                  Set your start date and target completion deadline.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Input
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    error={errors.startDate}
                    required
                  />

                  <Input
                    label="Target End Date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    error={errors.endDate}
                    required
                  />
                </div>

                <Select
                  label="Study Days Per Week"
                  value={daysPerWeek}
                  onChange={(e) => setDaysPerWeek(e.target.value)}
                >
                  <option value="7">7 days a week (Every day)</option>
                  <option value="6">6 days a week (1 rest day)</option>
                  <option value="5">5 days a week (Weekdays only)</option>
                  <option value="4">4 days a week</option>
                  <option value="weekends">Weekends intensive (Sat & Sun)</option>
                </Select>
              </div>
            )}

            {/* Step 4 — Preferences */}
            {step === 4 && (
              <div>
                <div className="wizard-step-info">
                  <span className="wizard-step-badge">STEP 4 &bull; PREFERENCES</span>
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                  How do you study best?
                </h2>
                <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginBottom: 24 }}>
                  Customize your daily capacity and peak focus hours.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Input
                    label="Available Hours / Day"
                    placeholder="e.g. 3 hours"
                    value={dailyHours}
                    onChange={(e) => setDailyHours(e.target.value)}
                    error={errors.dailyHours}
                    required
                  />

                  <Select
                    label="Preferred Study Window"
                    value={preferredStudyTime}
                    onChange={(e) => setPreferredStudyTime(e.target.value)}
                  >
                    <option value="morning">Morning (6 AM - 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                    <option value="evening">Evening (5 PM - 9 PM)</option>
                    <option value="night">Night (9 PM - 1 AM)</option>
                    <option value="flexible">Flexible / Any Time</option>
                  </Select>
                </div>

                <Input
                  label="Daily Target (Optional)"
                  placeholder="e.g. 2 chapters or 1 lecture deck"
                  value={dailyTarget}
                  onChange={(e) => setDailyTarget(e.target.value)}
                />

                <Textarea
                  label="Additional Notes (Optional)"
                  placeholder="Special constraints, exam format, or key requirements..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            )}

            {/* Step 5 — Review & Create */}
            {step === 5 && (
              <div>
                <div className="wizard-step-info">
                  <span className="wizard-step-badge">STEP 5 &bull; CONFIRMATION</span>
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                  Review your personalized roadmap
                </h2>
                <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginBottom: 20 }}>
                  Everything look good? Click below to launch your intelligent workspace.
                </p>

                <div
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "16px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    fontSize: "13px",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Goal:</span>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{studyGoal}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Target Exam:</span>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{targetExam}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Subjects:</span>
                    <span style={{ fontWeight: 600, color: "var(--accent-text)" }}>{subjects}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Timeline:</span>
                    <span style={{ color: "var(--text-primary)" }}>
                      {formatDateKey(startDate)} &rarr; {formatDateKey(endDate)}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Daily Commitment:</span>
                    <span style={{ color: "var(--text-primary)" }}>{dailyHours} ({preferredStudyTime})</span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Actions */}
            <div className="wizard-actions">
              {step > 1 ? (
                <Button type="button" variant="ghost" onClick={handleBack}>
                  &larr; Back
                </Button>
              ) : (
                <div />
              )}

              {step < TOTAL_STEPS ? (
                <Button type="button" variant="primary" onClick={handleNext}>
                  Next Step &rarr;
                </Button>
              ) : (
                <Button type="submit" variant="primary" size="lg">
                  Launch Study Workspace
                </Button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
