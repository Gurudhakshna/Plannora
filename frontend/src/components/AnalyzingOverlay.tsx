export default function AnalyzingOverlay() {
  return (
    <div className="modal-backdrop" style={{ zIndex: 1000 }}>
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          padding: "36px 48px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          boxShadow: "var(--shadow-modal)",
          maxWidth: 420,
          textAlign: "center",
        }}
      >
        <div style={{ position: "relative", width: 64, height: 64 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "3px solid var(--accent-light)",
              borderTopColor: "var(--accent)",
              animation: "spin 1s linear infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 8,
              borderRadius: "50%",
              background: "var(--accent-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-text)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
            Analyzing Study Material
          </h3>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>
            Extracting core concepts, generating prerequisite hierarchies, and tailoring your optimal study plan...
          </p>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--accent)", animation: "spin 1.5s ease-in-out infinite" }} />
          <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--accent)", animation: "spin 1.5s ease-in-out infinite 0.2s" }} />
          <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--accent)", animation: "spin 1.5s ease-in-out infinite 0.4s" }} />
        </div>
      </div>
    </div>
  );
}
