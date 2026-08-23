import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import Button from "../components/ui/Button";

interface HeaderProps {
  onOpenMobileNav: () => void;
}

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Overview of your study workload" },
  "/study-plan": { title: "Study Plan", subtitle: "Structured learning roadmap" },
  "/materials": { title: "Study Materials", subtitle: "Uploaded documents & AI extracted notes" },
  "/tasks": { title: "Tasks", subtitle: "Daily task schedule & milestones" },
  "/calendar": { title: "Calendar", subtitle: "Deadline timeline & scheduled sessions" },
  "/progress": { title: "Progress & Analytics", subtitle: "Mastery metrics & weekly retention" },
  "/profile": { title: "Profile", subtitle: "Account overview & study goals" },
  "/settings": { title: "Settings", subtitle: "Theme & workspace preferences" },
  "/ai/concept-map": { title: "Concept Map", subtitle: "AI knowledge graph & topic dependencies" },
  "/ai/flashcards": { title: "Revision Flashcards", subtitle: "Spaced repetition & quick recall" },
  "/ai/quiz": { title: "AI Quiz Generator", subtitle: "Adaptive knowledge assessment" },
  "/ai/pomodoro": { title: "Focus Pomodoro", subtitle: "Deep work timer & focus analytics" },
  "/ai/weak-topics": { title: "Weak Topics", subtitle: "Diagnostic detection & targeted revision" },
};

export default function Header({ onOpenMobileNav }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const { handleUpload, setTaskModalOpen, setEditingTask } = useApp();

  const currentMeta = PAGE_TITLES[location.pathname] || { title: "Workspace" };

  const handleToggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const handleNewTask = () => {
    setEditingTask(null);
    setTaskModalOpen(true);
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={onOpenMobileNav}
          aria-label="Open mobile navigation"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div>
          <h1 className="header-page-title">{currentMeta.title}</h1>
        </div>
      </div>

      <div className="header-right">
        {/* Contextual Action Buttons */}
        {(location.pathname === "/dashboard" || location.pathname === "/materials") && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleUpload("file")}
            leftIcon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            }
          >
            Upload Material
          </Button>
        )}

        {(location.pathname === "/dashboard" || location.pathname === "/tasks") && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleNewTask}
            leftIcon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            }
          >
            New Task
          </Button>
        )}

        {location.pathname === "/study-plan" && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/setup-study-plan")}
            leftIcon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            }
          >
            Edit Study Plan
          </Button>
        )}

        {/* Theme Toggle Button */}
        <button
          type="button"
          className="btn-icon"
          onClick={handleToggleTheme}
          aria-label={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          {resolvedTheme === "dark" ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
