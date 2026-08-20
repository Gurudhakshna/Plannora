import type React from "react";
import type { Page } from "../types/task";
import { useAuth } from "../hooks/useAuth";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="2" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="11" y="2" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="2" y="12" width="7" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="11" y="9" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: "tasks",
    label: "My Tasks",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 7H13M7 10H13M7 13H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="3" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 1V4M14 1V4M2 8H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="7" cy="12" r="1" fill="currentColor"/>
        <circle cx="10" cy="12" r="1" fill="currentColor"/>
        <circle cx="13" cy="12" r="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: "progress",
    label: "Progress",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 17V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M7 17V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M11 17V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M15 17V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function Sidebar({ currentPage, onNavigate, collapsed, onToggle }: SidebarProps) {
  const { logout, user } = useAuth();

  async function handleLogout() {
    await logout();
  }

  return (
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
      <div className="sidebar-header">
        {!collapsed && (
          <div className="sidebar-brand" onClick={() => onNavigate("dashboard")}>
            <div className="brand-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L3 18H7L10 10L13 18H17L10 2Z" fill="white"/>
              </svg>
            </div>
            <span className="brand-text">Plannora</span>
          </div>
        )}
        {collapsed && (
          <div className="sidebar-brand-collapsed" onClick={() => onNavigate("dashboard")}>
            <div className="brand-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L3 18H7L10 10L13 18H17L10 2Z" fill="white"/>
              </svg>
            </div>
          </div>
        )}
        <button className="sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            {collapsed ? (
              <path d="M7 4L12 9L7 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            ) : (
              <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            )}
          </svg>
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-link ${currentPage === item.id ? "active" : ""}`}
            onClick={() => onNavigate(item.id)}
            aria-current={currentPage === item.id ? "page" : undefined}
            title={collapsed ? item.label : undefined}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            {!collapsed && <span className="sidebar-link-label">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        {user && !collapsed && (
          <div className="sidebar-user">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt=""
                className="sidebar-user-avatar"
                referrerPolicy="no-referrer"
              />
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
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M6 2H4C3.45 2 3 2.45 3 3V15C3 15.55 3.45 16 4 16H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M12 9L16 9M16 9L14 7M16 9L14 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 9H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
        {!collapsed && (
          <div className="sidebar-footer-text">
            <span className="sidebar-version">Plannora v1.0</span>
          </div>
        )}
      </div>
    </aside>
  );
}
