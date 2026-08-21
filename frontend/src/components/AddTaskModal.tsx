import { useEffect, useRef, useState } from "react";
import type { Task, Priority } from "../types/task";
import { getToday } from "../utils/storage";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, "id" | "createdAt" | "completed" | "userId">) => void;
  editingTask: Task | null;
}

function TaskForm({ editingTask, onSave, onClose }: {
  editingTask: Task | null;
  onSave: (task: Omit<Task, "id" | "createdAt" | "completed" | "userId">) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(editingTask?.title ?? "");
  const [subject, setSubject] = useState(editingTask?.subject ?? "");
  const [date, setDate] = useState(editingTask?.date ?? getToday());
  const [priority, setPriority] = useState<Priority>(editingTask?.priority ?? "Medium");
  const [duration, setDuration] = useState(editingTask?.duration ?? "");
  const [description, setDescription] = useState(editingTask?.description ?? "");
  const [notes, setNotes] = useState(editingTask?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!subject.trim()) newErrors.subject = "Subject is required";
    if (!date) newErrors.date = "Date is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      title: title.trim(),
      subject: subject.trim(),
      date,
      priority,
      duration: duration.trim(),
      description: description.trim(),
      notes: notes.trim(),
    });
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="modal-form">
      <div className="form-group">
        <label htmlFor="task-title">Task Title *</label>
        <input
          ref={titleRef}
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Review chapter 5 notes"
          className={errors.title ? "input-error" : ""}
        />
        {errors.title && <span className="error-text">{errors.title}</span>}
      </div>
      <div className="form-group">
        <label htmlFor="task-subject">Subject *</label>
        <input
          id="task-subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Mathematics"
          className={errors.subject ? "input-error" : ""}
        />
        {errors.subject && <span className="error-text">{errors.subject}</span>}
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="task-date">Deadline *</label>
          <input
            id="task-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={errors.date ? "input-error" : ""}
          />
          {errors.date && <span className="error-text">{errors.date}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="task-priority">Priority</label>
          <select
            id="task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="task-duration">Estimated Duration</label>
          <input
            id="task-duration"
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g. 2 hours"
          />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="task-description">Description</label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the task..."
          rows={2}
        />
      </div>
      <div className="form-group">
        <label htmlFor="task-notes">Notes</label>
        <textarea
          id="task-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes or references..."
          rows={2}
        />
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary">
          {editingTask ? "Save Changes" : "Add Task"}
        </button>
      </div>
    </form>
  );
}

export default function AddTaskModal({ isOpen, onClose, onSave, editingTask }: AddTaskModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={editingTask ? "Edit Task" : "Add Task"}>
        <div className="modal-header">
          <h2 className="modal-title">{editingTask ? "Edit Task" : "New Study Task"}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <TaskForm key={editingTask?.id ?? "new"} editingTask={editingTask} onSave={onSave} onClose={onClose} />
      </div>
    </div>
  );
}
