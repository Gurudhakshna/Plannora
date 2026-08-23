import { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { getToday, formatDateKey } from "../../utils/storage";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import PageHeader from "../../components/shared/PageHeader";
import type { Task } from "../../types/task";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const { allTasks } = useApp();
  const today = getToday();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(today);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    allTasks.forEach((t) => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    return map;
  }, [allTasks]);

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

  const selectedTasks = tasksByDate[selectedDate] || [];

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
    <div>
      <PageHeader
        title="Calendar & Timeline"
        description="Visualize study milestones, exam deadlines, and daily scheduled commitments."
      />

      <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr", gap: 24 }}>
        {/* Calendar Grid Box */}
        <Card>
          {/* Header Controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
                {MONTH_NAMES[month]} {year}
              </h2>
              <Button variant="secondary" size="sm" onClick={goToToday}>
                Today
              </Button>
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              <Button variant="secondary" size="sm" onClick={prevMonth} aria-label="Previous month">
                &larr;
              </Button>
              <Button variant="secondary" size="sm" onClick={nextMonth} aria-label="Next month">
                &rarr;
              </Button>
            </div>
          </div>

          {/* Days of Week */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, textAlign: "center", marginBottom: 6 }}>
            {DAY_NAMES.map((d) => (
              <div key={d} style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)", padding: "6px 0", textTransform: "uppercase" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Day Cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {calendarDays.map((d) => {
              const dayTasks = tasksByDate[d.key] || [];
              const isToday = d.key === today;
              const isSelected = d.key === selectedDate;

              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setSelectedDate(d.key)}
                  style={{
                    minHeight: 64,
                    padding: "6px 8px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: isSelected ? "var(--accent-light)" : "var(--bg-elevated)",
                    border: isSelected ? "1px solid var(--accent)" : isToday ? "1px solid var(--border-hover)" : "1px solid var(--border-subtle)",
                    opacity: d.isCurrentMonth ? 1 : 0.35,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12.5px",
                      fontWeight: isToday ? 700 : 500,
                      color: isToday ? "var(--accent-text)" : isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                    }}
                  >
                    {d.day}
                  </span>

                  {dayTasks.length > 0 && (
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap", width: "100%" }}>
                      {dayTasks.slice(0, 3).map((t) => (
                        <span
                          key={t.id}
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: t.completed ? "var(--success)" : t.priority === "High" ? "var(--danger)" : "var(--accent)",
                          }}
                        />
                      ))}
                      {dayTasks.length > 3 && (
                        <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>+{dayTasks.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Selected Date Agenda Sidebar */}
        <Card>
          <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: 14 }}>
            {formatDateKey(selectedDate, { weekday: "long", month: "short", day: "numeric" })}
          </h3>

          {selectedTasks.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--text-muted)", padding: "16px 0", textAlign: "center" }}>
              No tasks scheduled for this date.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {selectedTasks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{t.title}</span>
                    <Badge variant={t.priority === "High" ? "danger" : t.priority === "Medium" ? "warning" : "success"}>
                      {t.priority}
                    </Badge>
                  </div>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: 4 }}>
                    {t.subject} {t.duration && `\u2022 ${t.duration}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
