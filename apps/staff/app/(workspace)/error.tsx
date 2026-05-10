"use client";

import Link from "next/link";

/**
 * (workspace) error boundary — DASH-9 G9 minimal stub.
 *
 * Replaced V1 chrome-aware error UI. The remaining DEEP-LINK routes
 * (newsletter editor) inherit this minimal boundary.
 */
export default function WorkspaceError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ padding: "1.5rem", maxWidth: "640px", color: "var(--hc-text-primary)" }}>
      <h1 className="hc-h2" style={{ margin: 0 }}>Something went wrong.</h1>
      <p className="hc-body" style={{ marginTop: "0.5rem", color: "var(--hc-text-secondary)" }}>
        Try again, or return to the operator briefing.
      </p>
      <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
        <button
          type="button"
          onClick={reset}
          className="hc-body-sm"
          style={{
            padding: "0.5rem 0.875rem",
            borderRadius: "0.5rem",
            border: "1px solid var(--hc-border-default)",
            background: "transparent",
            color: "var(--hc-text-primary)",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
        <Link
          href="/modules/staff-overview"
          className="hc-body-sm"
          style={{
            padding: "0.5rem 0.875rem",
            borderRadius: "0.5rem",
            background: "var(--hc-accent)",
            color: "var(--hc-text-on-accent)",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Open overview
        </Link>
      </div>
    </div>
  );
}
