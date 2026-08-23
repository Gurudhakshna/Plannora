import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import type { ThemePreference } from "../context/ThemeContext";
import { useAuth } from "../hooks/useAuth";
import { clearUserData } from "../utils/storage";
import Card, { CardHeader } from "../components/ui/Card";
import Button from "../components/ui/Button";
import PageHeader from "../components/shared/PageHeader";
import ConfirmDialog from "../components/shared/ConfirmDialog";

const THEME_OPTIONS: { value: ThemePreference; label: string; description: string }[] = [
  {
    value: "dark",
    label: "Dark Mode",
    description: "Deep charcoal palette optimized for focus and night study sessions",
  },
  {
    value: "light",
    label: "Light Mode",
    description: "High-contrast clean light theme for daytime reading",
  },
  {
    value: "system",
    label: "System Preference",
    description: "Automatically match your operating system theme",
  },
];

export default function SettingsPage() {
  const { preference, setTheme } = useTheme();
  const { user, logout } = useAuth();

  const [devMode, setDevMode] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    try {
      setDevMode(localStorage.getItem("plannora_dev_mode") === "true");
    } catch {
      setDevMode(false);
    }
  }, []);

  const handleToggleDevMode = () => {
    const nextVal = !devMode;
    setDevMode(nextVal);
    try {
      localStorage.setItem("plannora_dev_mode", nextVal ? "true" : "false");
    } catch {}
  };

  const handleClearAllData = () => {
    if (!user) return;
    clearUserData(user.uid);
    window.location.reload();
  };

  return (
    <div>
      <PageHeader
        title="Settings & Workspace Preferences"
        description="Configure theme appearances, developer diagnostics, and local storage data."
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 840 }}>
        {/* Appearance Settings */}
        <Card>
          <CardHeader title="Appearance" subtitle="Customize the interface look and feel" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            {THEME_OPTIONS.map((opt) => {
              const isSelected = preference === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  style={{
                    padding: "16px",
                    borderRadius: "var(--radius-lg)",
                    backgroundColor: isSelected ? "var(--accent-light)" : "var(--bg-elevated)",
                    border: isSelected ? "1px solid var(--accent)" : "1px solid var(--border-subtle)",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: isSelected ? "var(--accent-text)" : "var(--text-primary)" }}>
                      {opt.label}
                    </span>
                    {isSelected && (
                      <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--accent)" }} />
                    )}
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.4 }}>
                    {opt.description}
                  </p>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Developer Diagnostics Mode */}
        <Card>
          <CardHeader title="Developer & AI Diagnostics" subtitle="Pipeline inspection for technical debugging" />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div>
              <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", display: "block" }}>
                Developer Debug Mode
              </span>
              <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                Display the background Groq / AI extraction log panel at the bottom of the screen.
              </span>
            </div>
            <Button
              variant={devMode ? "primary" : "secondary"}
              size="sm"
              onClick={handleToggleDevMode}
            >
              {devMode ? "Enabled" : "Disabled"}
            </Button>
          </div>
        </Card>

        {/* Account Session */}
        <Card>
          <CardHeader title="Account Session" />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div>
              <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", display: "block" }}>
                {user?.displayName || "User"} ({user?.email || "user@plannora.dev"})
              </span>
              <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                Active session on this device.
              </span>
            </div>
            <Button variant="danger" size="sm" onClick={() => logout()}>
              Sign Out
            </Button>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card style={{ border: "1px solid var(--danger-border)" }}>
          <CardHeader title={<span style={{ color: "var(--danger-text)" }}>Danger Zone</span>} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", display: "block" }}>
                Clear All Local Study Data
              </span>
              <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                Permanently delete all cached tasks, study plans, and uploaded AI notes from this device.
              </span>
            </div>
            <Button variant="danger" size="sm" onClick={() => setShowClearConfirm(true)}>
              Clear Study Data
            </Button>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearAllData}
        title="Reset All Study Data?"
        message="This action will permanently delete all tasks, uploaded documents, AI study notes, and your configured study plan on this browser. This cannot be undone."
        confirmLabel="Reset All Data"
        variant="danger"
      />
    </div>
  );
}
