import { useState, useEffect, useCallback } from "react";
import Button from "../../../components/ui/Button";
import Card, { CardHeader } from "../../../components/ui/Card";
import PageHeader from "../../../components/shared/PageHeader";

type PomodoroMode = "focus" | "shortBreak" | "longBreak";

const MODE_DURATIONS: Record<PomodoroMode, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export default function PomodoroPage() {
  const [mode, setMode] = useState<PomodoroMode>("focus");
  const [timeLeft, setTimeLeft] = useState(MODE_DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  const totalDuration = MODE_DURATIONS[mode];
  const progressPct = ((totalDuration - timeLeft) / totalDuration) * 100;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const switchMode = useCallback((newMode: PomodoroMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODE_DURATIONS[newMode]);
  }, []);

  useEffect(() => {
    let interval: number | undefined;

    if (isRunning && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      if (mode === "focus") {
        setCompletedSessions((prev) => prev + 1);
        switchMode("shortBreak");
      } else {
        switchMode("focus");
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode, switchMode]);

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(MODE_DURATIONS[mode]);
  };

  return (
    <div>
      <PageHeader
        title="Focus Pomodoro"
        description="Eliminate distractions and maintain cognitive velocity with structured interval training."
      />

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        {/* Main Timer Stage */}
        <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px" }}>
          {/* Mode Selector Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 36, backgroundColor: "var(--bg-elevated)", padding: 4, borderRadius: "var(--radius-lg)" }}>
            <Button
              variant={mode === "focus" ? "primary" : "ghost"}
              size="sm"
              onClick={() => switchMode("focus")}
            >
              Focus (25m)
            </Button>
            <Button
              variant={mode === "shortBreak" ? "primary" : "ghost"}
              size="sm"
              onClick={() => switchMode("shortBreak")}
            >
              Short Break (5m)
            </Button>
            <Button
              variant={mode === "longBreak" ? "primary" : "ghost"}
              size="sm"
              onClick={() => switchMode("longBreak")}
            >
              Long Break (15m)
            </Button>
          </div>

          {/* SVG Progress Circle & Digits */}
          <div className="pomodoro-ring-wrap">
            <svg width="260" height="260" viewBox="0 0 260 260">
              <circle cx="130" cy="130" r="110" fill="none" stroke="var(--bg-elevated)" strokeWidth="10" />
              <circle
                cx="130"
                cy="130"
                r="110"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 110}`}
                strokeDashoffset={`${2 * Math.PI * 110 * (1 - progressPct / 100)}`}
                transform="rotate(-90 130 130)"
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
              />
            </svg>
            <div className="pomodoro-time-display">
              <span className="pomodoro-digits">{timeFormatted}</span>
              <span className="pomodoro-mode-label">{mode === "focus" ? "Deep Focus" : "Rest Period"}</span>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: 14, marginTop: 36 }}>
            <Button
              variant={isRunning ? "secondary" : "primary"}
              size="lg"
              onClick={() => setIsRunning(!isRunning)}
              style={{ minWidth: 140 }}
            >
              {isRunning ? "Pause Session" : "Start Focus"}
            </Button>
            <Button variant="ghost" size="lg" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </Card>

        {/* Stats & History */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <CardHeader title="Today's Productivity" />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px" }}>
                <span style={{ color: "var(--text-muted)" }}>Completed Focus Blocks:</span>
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{completedSessions}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px" }}>
                <span style={{ color: "var(--text-muted)" }}>Total Focus Time:</span>
                <span style={{ fontWeight: 700, color: "var(--accent-text)" }}>
                  {completedSessions * 25} minutes
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="The Science of Spaced Focus" />
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Studying in 25-minute sprints with 5-minute pauses prevents cognitive fatigue and improves neural retention by over 40%.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
