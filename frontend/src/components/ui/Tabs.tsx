import type { ReactNode } from "react";

export interface TabItem<T extends string = string> {
  id: T;
  label: ReactNode;
  badge?: ReactNode;
  icon?: ReactNode;
}

export interface TabsProps<T extends string = string> {
  items: TabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
}

export default function Tabs<T extends string = string>({
  items,
  activeTab,
  onChange,
  className = "",
}: TabsProps<T>) {
  return (
    <div
      className={`tabs-container ${className}`.trim()}
      style={{
        display: "inline-flex",
        backgroundColor: "var(--bg-inset)",
        padding: 3,
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-subtle)",
        gap: 2,
      }}
      role="tablist"
    >
      {items.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: "var(--radius-sm)",
              fontSize: "12.5px",
              fontWeight: isActive ? 600 : 500,
              color: isActive ? "var(--text-primary)" : "var(--text-muted)",
              backgroundColor: isActive ? "var(--bg-card)" : "transparent",
              boxShadow: isActive ? "var(--shadow-sm)" : "none",
              border: isActive ? "1px solid var(--border)" : "1px solid transparent",
              transition: "all var(--transition-fast)",
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && (
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 5px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: isActive ? "var(--accent-light)" : "var(--bg-hover)",
                  color: isActive ? "var(--accent-text)" : "var(--text-muted)",
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
