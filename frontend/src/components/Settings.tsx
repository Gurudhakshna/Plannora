import { useState } from "react";
import type { ReactNode } from "react";
import { useTheme } from "../context/ThemeContext";
import type { ThemePreference } from "../context/ThemeContext";
import { useAuth } from "../hooks/useAuth";
import { clearUserData } from "../utils/storage";

const THEME_OPTIONS: { value: ThemePreference; label: string; description: string; icon: ReactNode }[] = [
  {
    value: "light",
    label: "Light",
    description: "Bright interface for well-lit spaces",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 1V3M9 15V17M1 9H3M15 9H17M3.5 3.5L4.9 4.9M13.1 13.1L14.5 14.5M14.5 3.5L13.1 4.9M4.9 13.1L3.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    description: "Low-glare theme for night sessions",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M15.5 11.2A7 7 0 0 1 6.8 2.5a7 7 0 1 0 8.7 8.7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: "system",
    label: "System",
    description: "Match your device appearance",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="1.5" y="3" width="15" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 16H12M9 13V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function Settings() {
  const { preference, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [confirmClear, setConfirmClear] = useState(false);

  function handleClearData() {
    if (!user) return;
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearUserData(user.uid);
    window.location.reload();
  }

  const userDisplayName = user?.displayName || "User";
  const userEmail = user?.email || "user@plannora.dev";

  return (
    <div className="settings-page">
      <section className="dash-section" aria-labelledby="settings-appearance-title">
        <div className="dash-section-header">
          <h3 className="dash-section-title" id="settings-appearance-title">Appearance</h3>
        </div>
        <fieldset className="theme-options">
          <legend className="visually-hidden">Choose theme</legend>
          {THEME_OPTIONS.map((option) => {
            const isSelected = preference === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`theme-option ${isSelected ? "active" : ""}`}
                onClick={() => setTheme(option.value)}
              >
                <span className="theme-option-icon">{option.icon}</span>
                <span className="theme-option-text">
                  <span className="theme-option-label">{option.label}</span>
                  <span className="theme-option-description">{option.description}</span>
                </span>
                <span className={`theme-option-check ${isSelected ? "checked" : ""}`} aria-hidden="true">
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </fieldset>
        <p className="settings-hint">Your theme choice is saved on this device and applied instantly.</p>
      </section>

      <section className="dash-section" aria-labelledby="settings-account-title">
        <div className="dash-section-header">
          <h3 className="dash-section-title" id="settings-account-title">Account</h3>
        </div>
        <div className="settings-account-row">
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span className="settings-account-name">{userDisplayName}</span>
            <span className="settings-account-email">{userEmail}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </section>

      <section className="dash-section" aria-labelledby="settings-data-title">
        <div className="dash-section-header">
          <h3 className="dash-section-title" id="settings-data-title">Study Data</h3>
        </div>
        <p className="settings-hint">
          Tasks, materials, AI notes and your study plan are stored locally in this browser.
          Clearing them cannot be undone.
        </p>
        <div className="settings-danger-row">
          <button
            className={`btn ${confirmClear ? "btn-danger" : "btn-secondary"} btn-sm`}
            onClick={handleClearData}
            onBlur={() => setConfirmClear(false)}
          >
            {confirmClear ? "Click again to confirm" : "Clear all study data"}
          </button>
        </div>
      </section>
    </div>
  );
}
