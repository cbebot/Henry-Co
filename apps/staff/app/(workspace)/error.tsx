"use client";

/**
 * (workspace) error boundary — DASH-9 G9 minimal stub.
 *
 * Replaced V1 chrome-aware error UI. The remaining DEEP-LINK routes
 * (newsletter editor) inherit this minimal boundary.
 */
export default function WorkspaceError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ padding: "1.5rem", maxWidth: "640px" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Something went wrong.</h1>
      <p style={{ marginTop: "0.5rem", color: "rgba(10,10,10,0.65)" }}>
        Try again, or return to the operator briefing.
      </p>
      <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "0.5rem 0.875rem",
            borderRadius: "0.5rem",
            border: "1px solid rgba(10,10,10,0.12)",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
        <a
          href="/modules/staff-overview"
          style={{
            padding: "0.5rem 0.875rem",
            borderRadius: "0.5rem",
            background: "var(--hc-accent, #C9A227)",
            color: "#0A0A0A",
            textDecoration: "none",
          }}
        >
          Open overview
        </a>
      </div>
    </div>
  );
}
