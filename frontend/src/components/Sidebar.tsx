import { useEffect } from "react";
import type React from "react";
import type { Page } from "../types/task";
import { useAuth } from "../hooks/useAuth";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const workspaceNavItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="2" width="6" height="7" rx="1" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="10" y="2" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="2" y="11" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="10" y="8" width="6" height="8" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    ),
  },
  {
    id: "plan",
    label: "Study Plan",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 3.5C3 2.67 3.67 2 4.5 2H13.5C14.33 2 15 2.67 15 3.5V16L9 12.5L3 16V3.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        <path d="M6 6H12M6 8.5H10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "materials",
    label: "Materials",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3.5 2H10.5L14.5 6V16H3.5V2Z" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M10.5 2V6H14.5" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M6.5 9.5H11.5M6.5 12H9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2.5" y="2" width="13" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M6 6.5H12M6 9H12M6 11.5H9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="3" width="14" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M5.5 1.5V3.5M12.5 1.5V3.5M2 7.5H16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="6" cy="11" r="0.75" fill="currentColor"/>
        <circle cx="9" cy="11" r="0.75" fill="currentColor"/>
        <circle cx="12" cy="11" r="0.75" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: "progress",
    label: "Progress",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 15V11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <path d="M7 15V8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <path d="M11 15V4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <path d="M15 15V2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const accountNavItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  {
    id: "profile",
    label: "Profile",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M3 15.5C3.8 12.8 6.1 11 9 11C11.9 11 14.2 12.8 15 15.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M9 1.8V3.6M9 14.4V16.2M1.8 9H3.6M14.4 9H16.2M3.9 3.9L5.2 5.2M12.8 12.8L14.1 14.1M14.1 3.9L12.8 5.2M5.2 12.8L3.9 14.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function Sidebar({ currentPage, onNavigate, collapsed, onToggle, mobileOpen, onCloseMobile }: SidebarProps) {
  const { logout, user } = useAuth();

  useEffect(() => {
    if (!mobileOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseMobile();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  function handleNavigate(page: Page) {
    onNavigate(page);
    onCloseMobile();
  }

  async function handleLogout() {
    onCloseMobile();
    await logout();
  }

  return (
    <>
      {mobileOpen && <div className="mobile-nav-backdrop" onClick={onCloseMobile} aria-hidden="true" />}
      <aside
        className={`sidebar ${collapsed ? "sidebar-collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
        aria-label="Main navigation"
      >
        <div className="sidebar-header">
          {!collapsed && (
            <button type="button" className="sidebar-brand-box" onClick={() => handleNavigate("dashboard")}>
              <span className="brand-text">PLANNORA</span>
              <span className="brand-subtext">Study Workspace</span>
            </button>
          )}
          {collapsed && (
            <button type="button" className="sidebar-brand-collapsed" onClick={() => handleNavigate("dashboard")} aria-label="Go to dashboard" title="Plannora Dashboard">
              <div className="brand-icon-collapsed">P</div>
            </button>
          )}
          <button className="sidebar-toggle" onClick={onToggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              {collapsed ? (
                <path d="M6 3.5L10.5 8L6 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              ) : (
                <path d="M10 3.5L5.5 8L10 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              )}
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-nav-label">Workspace</span>
          {workspaceNavItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar-link ${currentPage === item.id ? "active" : ""}`}
              onClick={() => handleNavigate(item.id)}
              aria-current={currentPage === item.id ? "page" : undefined}
              title={collapsed ? item.label : undefined}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span className="sidebar-link-label">{item.label}</span>
            </button>
          ))}

          <div className="sidebar-nav-divider" role="presentation" />

          <span className="sidebar-nav-label">Account</span>
          {accountNavItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar-link ${currentPage === item.id ? "active" : ""}`}
              onClick={() => handleNavigate(item.id)}
              aria-current={currentPage === item.id ? "page" : undefined}
              title={collapsed ? item.label : undefined}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span className="sidebar-link-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user && !collapsed && (
            <div className="sidebar-user">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  className="sidebar-user-avatar"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="sidebar-user-avatar sidebar-user-avatar-fallback" aria-hidden="true">
                  {(user.displayName || user.email?.[0] || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">
                  {user.displayName || user.email?.split("@")[0] || "User"}
                </span>
                <button className="sidebar-logout-btn" onClick={handleLogout}>
                  Sign out
                </button>
              </div>
            </div>
          )}
          {user && collapsed && (
            <button
              className="sidebar-logout-btn-collapsed"
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M5 2H3.5C3.1 2 2.8 2.3 2.8 2.8V13.2C2.8 13.7 3.1 14 3.5 14H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M10.5 8H14.5M14.5 8L12.5 6M14.5 8L12.5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
