import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
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
    const trimmedGoal = studyGoal.trim();
    const trimmedSubjects = subjects.trim();
    const trimmedExam = targetExam.trim();
    const trimmedHours = dailyHours.trim();

    if (!trimmedGoal) {
      newErrors.studyGoal = "Study goal is required";
    } else if (trimmedGoal.length < 3) {
      newErrors.studyGoal = "Study goal must be at least 3 characters long";
    }

    if (!trimmedSubjects) {
      newErrors.subjects = "At least one subject is required";
    } else if (trimmedSubjects.length < 2) {
      newErrors.subjects = "Please enter valid subject names (min 2 characters)";
    }

    if (!trimmedExam) {
      newErrors.targetExam = "Target exam/course is required";
    } else if (trimmedExam.length < 2) {
      newErrors.targetExam = "Target exam must be at least 2 characters long";
    }

    if (!startDate) newErrors.startDate = "Start date is required";
    if (!endDate) {
      newErrors.endDate = "End date is required";
    } else if (startDate && endDate && endDate < startDate) {
      newErrors.endDate = "End date must be after start date";
    }

    if (!trimmedHours) {
      newErrors.dailyHours = "Daily study hours is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !user) return;

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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="setup-page">
      <div className="setup-card">
        <div className="setup-header">
          <div className="login-brand">
            <span className="login-brand-text">PLANNORA</span>
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
              placeholder="e.g. Computer Science Finals"
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

          <div className="modal-actions" style={{ borderTop: "none" }}>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }}>
              Create Study Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
