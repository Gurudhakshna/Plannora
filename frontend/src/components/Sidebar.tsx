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
    id: "materials",
    label: "My Materials",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 2H11L14 5V18H4V2Z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M11 2V5H14" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 9H13M7 12H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "plan",
    label: "Study Plan",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 4C3 2.9 3.9 2 5 2H15C16.1 2 17 2.9 17 4V18L10 14L3 18V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M7 7H13M7 10H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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

const secondaryNavItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  {
    id: "profile",
    label: "Profile",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="6.5" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3.5 17C4.3 13.9 6.9 12 10 12C13.1 12 15.7 13.9 16.5 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 2L10.9 4.1L13.1 3.4L14.2 5.4L16.4 5.8L16.3 8.1L18 9.6L16.7 11.4L17.4 13.6L15.5 14.8L15.3 17.1L13 17.4L11.7 19.2L9.6 18.4L7.7 19.6L6.1 18.1L3.8 18.5L3.2 16.3L1.2 15.3L1.7 13L0.4 11.2L1.9 9.6L1.5 7.3L3.6 6.4L4.2 4.2L6.5 4.2L7.9 2.4L10 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" transform="translate(0.5 -0.5) scale(0.95)"/>
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
            <button type="button" className="sidebar-brand" onClick={() => handleNavigate("dashboard")}>
              <span className="brand-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2L3 18H7L10 10L13 18H17L10 2Z" fill="white"/>
                </svg>
              </span>
              <span className="brand-text">Plannora</span>
            </button>
          )}
          {collapsed && (
            <button type="button" className="sidebar-brand-collapsed" onClick={() => handleNavigate("dashboard")} aria-label="Go to dashboard">
              <span className="brand-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2L3 18H7L10 10L13 18H17L10 2Z" fill="white"/>
                </svg>
              </span>
            </button>
          )}
          <button className="sidebar-toggle" onClick={onToggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
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
              type="button"
              className={`sidebar-link ${currentPage === item.id ? "active" : ""}`}
              onClick={() => handleNavigate(item.id)}
              aria-current={currentPage === item.id ? "page" : undefined}
              title={collapsed ? item.label : undefined}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-link-label">{item.label}</span>}
            </button>
          ))}
          <div className="sidebar-nav-divider" role="presentation" />
          {secondaryNavItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar-link ${currentPage === item.id ? "active" : ""}`}
              onClick={() => handleNavigate(item.id)}
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
    </>
  );
}
