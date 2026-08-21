import { useState, useMemo } from "react";
import type { Task } from "../types/task";
import { getToday, formatDateKey } from "../utils/storage";

interface CalendarProps {
  tasks: Task[];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function Calendar({ tasks }: CalendarProps) {
  const today = getToday();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(today);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    return map;
  }, [tasks]);

  const calendarDays = useMemo(() => {
    const days: { day: number; key: string; isCurrentMonth: boolean }[] = [];
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      days.push({ day: d, key: dateKey(year, month - 1, d), isCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, key: dateKey(year, month, d), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ day: d, key: dateKey(year, month + 1, d), isCurrentMonth: false });
    }
    return days;
  }, [year, month, firstDay, daysInMonth]);

  const selectedTasks = selectedDate ? tasksByDate[selectedDate] || [] : [];

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function goToToday() {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(getToday());
  }

  return (
    <div className="calendar-page">
      <div className="calendar-container">
        <div className="calendar-header">
          <button className="calendar-nav-btn" onClick={prevMonth} aria-label="Previous month">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M12 5L7 10L12 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h2 className="calendar-month-title">{MONTH_NAMES[month]} {year}</h2>
          <div className="calendar-header-actions">
            <button className="btn btn-secondary btn-sm" onClick={goToToday}>Today</button>
            <button className="calendar-nav-btn" onClick={nextMonth} aria-label="Next month">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M8 5L13 10L8 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="calendar-grid" role="grid" aria-label={`${MONTH_NAMES[month]} ${year} calendar`}>
          {DAY_NAMES.map((d) => (
            <div key={d} className="calendar-day-name" role="columnheader">{d}</div>
          ))}
          {calendarDays.map((d) => {
            const dayTasks = tasksByDate[d.key] || [];
            const openCount = dayTasks.filter((t) => !t.completed).length;
            const isToday = d.key === today;
            const isSelected = d.key === selectedDate;
            const label = formatDateKey(d.key, { weekday: "long", month: "long", day: "numeric" });
            return (
              <button
                key={d.key}
                type="button"
                role="gridcell"
                className={`calendar-day ${d.isCurrentMonth ? "" : "other-month"} ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
                onClick={() => setSelectedDate(d.key)}
                aria-pressed={isSelected}
                aria-label={`${label}${dayTasks.length > 0 ? `, ${openCount} open task${openCount !== 1 ? "s" : ""}` : ", no tasks"}`}
                aria-current={isToday ? "date" : undefined}
              >
                <span className="day-number">{d.day}</span>
                {dayTasks.length > 0 && (
                  <span className="day-dots" aria-hidden="true">
                    {dayTasks.slice(0, 3).map((t) => (
                      <span
                        key={t.id}
                        className={`day-dot ${t.completed ? "dot-done" : ""} dot-${t.priority.toLowerCase()}`}
                      />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="chart-legend calendar-legend" aria-hidden="true">
          <span className="legend-item"><span className="legend-dot dot-high" />High priority</span>
          <span className="legend-item"><span className="legend-dot dot-medium" />Medium</span>
          <span className="legend-item"><span className="legend-dot dot-low" />Low</span>
          <span className="legend-item"><span className="legend-dot legend-done" />Completed</span>
        </div>
      </div>

      <aside className="calendar-sidebar" aria-label="Tasks for the selected date">
        <h3 className="sidebar-date">{selectedDate ? formatDateKey(selectedDate, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "Select a date"}</h3>
        {selectedTasks.length === 0 ? (
          <div className="dash-empty-inline">
            <p>No tasks on this date</p>
          </div>
        ) : (
          <ul className="sidebar-task-list">
            {selectedTasks.map((t) => (
              <li key={t.id} className={`sidebar-task-item ${t.completed ? "done" : ""}`}>
                <div className="sidebar-task-info">
                  <span className="sidebar-task-title">{t.title}</span>
                  <span className="sidebar-task-subject">
                    {t.subject}
                    {t.duration && ` \u00b7 ${t.duration}`}
                    {t.source === "ai" && " \u00b7 AI"}
                  </span>
                </div>
                <span className={`sidebar-task-priority priority-${t.priority.toLowerCase()}`}>
                  {t.priority}
                </span>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
