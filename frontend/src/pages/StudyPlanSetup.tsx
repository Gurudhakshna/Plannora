import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { saveStudyPlan, getToday } from "../utils/storage";

export default function StudyPlanSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [studyGoal, setStudyGoal] = useState("");
  const [subjects, setSubjects] = useState("");
  const [targetExam, setTargetExam] = useState("");
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState("");
  const [dailyHours, setDailyHours] = useState("");
  const [preferredStudyTime, setPreferredStudyTime] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState("");
  const [prioritySubjects, setPrioritySubjects] = useState("");
  const [dailyTarget, setDailyTarget] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!studyGoal.trim()) newErrors.studyGoal = "Study goal is required";
    if (!subjects.trim()) newErrors.subjects = "At least one subject is required";
    if (!targetExam.trim()) newErrors.targetExam = "Target exam/course is required";
    if (!startDate) newErrors.startDate = "Start date is required";
    if (!endDate) newErrors.endDate = "End date is required";
    if (!dailyHours.trim()) newErrors.dailyHours = "Daily study hours is required";
    if (startDate && endDate && endDate < startDate) {
      newErrors.endDate = "End date must be after start date";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !user) return;

    saveStudyPlan({
      studyGoal: studyGoal.trim(),
      subjects: subjects
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
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

  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  return (
    <div className="setup-page">
      <div className="setup-card">
        <div className="setup-header">
          <div className="login-brand">
            <div className="brand-icon login-brand-icon">
              <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L3 18H7L10 10L13 18H17L10 2Z" fill="white" />
              </svg>
            </div>
            <span className="login-brand-text">Plannora</span>
          </div>
          <h1 className="setup-title">Create Your Study Plan</h1>
          <p className="setup-subtitle">
            Tell us about your goals so we can help you plan effectively.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="form-group">
            <label htmlFor="study-goal">Study Goal *</label>
            <input
              id="study-goal"
              type="text"
              value={studyGoal}
              onChange={(e) => setStudyGoal(e.target.value)}
              placeholder="e.g. Prepare for final exams"
              className={errors.studyGoal ? "input-error" : ""}
            />
            {errors.studyGoal && <span className="error-text">{errors.studyGoal}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="subjects">Subjects *</label>
            <input
              id="subjects"
              type="text"
              value={subjects}
              onChange={(e) => setSubjects(e.target.value)}
              placeholder="e.g. Mathematics, Physics, Chemistry"
              className={errors.subjects ? "input-error" : ""}
            />
            {errors.subjects && <span className="error-text">{errors.subjects}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="target-exam">Target Exam / Course *</label>
            <input
              id="target-exam"
              type="text"
              value={targetExam}
              onChange={(e) => setTargetExam(e.target.value)}
              placeholder="e.g. JEE Main 2026"
              className={errors.targetExam ? "input-error" : ""}
            />
            {errors.targetExam && <span className="error-text">{errors.targetExam}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start-date">Start Date *</label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={errors.startDate ? "input-error" : ""}
              />
              {errors.startDate && <span className="error-text">{errors.startDate}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="end-date">End Date *</label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={errors.endDate ? "input-error" : ""}
              />
              {errors.endDate && <span className="error-text">{errors.endDate}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="daily-hours">Available Study Hours Per Day *</label>
            <input
              id="daily-hours"
              type="text"
              value={dailyHours}
              onChange={(e) => setDailyHours(e.target.value)}
              placeholder="e.g. 4 hours"
              className={errors.dailyHours ? "input-error" : ""}
            />
            {errors.dailyHours && <span className="error-text">{errors.dailyHours}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="study-time">Preferred Study Time</label>
            <select
              id="study-time"
              value={preferredStudyTime}
              onChange={(e) => setPreferredStudyTime(e.target.value)}
            >
              <option value="">Select preferred time</option>
              <option value="morning">Morning (6 AM - 12 PM)</option>
              <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
              <option value="evening">Evening (5 PM - 9 PM)</option>
              <option value="night">Night (9 PM - 12 AM)</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="days-per-week">Days Available Per Week</label>
              <select
                id="days-per-week"
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(e.target.value)}
              >
                <option value="">Select days</option>
                <option value="5">5 days</option>
                <option value="6">6 days</option>
                <option value="7">7 days</option>
                <option value="weekdays">Weekdays only</option>
                <option value="weekends">Weekends only</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="daily-target">Daily Study Target</label>
              <input
                id="daily-target"
                type="text"
                value={dailyTarget}
                onChange={(e) => setDailyTarget(e.target.value)}
                placeholder="e.g. 3 chapters"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="priority-subjects">Priority Subjects</label>
            <input
              id="priority-subjects"
              type="text"
              value={prioritySubjects}
              onChange={(e) => setPrioritySubjects(e.target.value)}
              placeholder="e.g. Mathematics, Physics"
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Additional Notes</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information about your study plan..."
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary btn-lg setup-submit">
              Create Study Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
