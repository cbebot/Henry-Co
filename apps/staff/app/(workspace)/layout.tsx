import type { ReactNode } from "react";

/**
 * (workspace) layout — V1 chrome killed by DASH-9.
 *
 * The V1 sidebar/mobile-nav composition was deleted in DASH-9 G9. This
 * layout is now a pass-through so the remaining DEEP-LINK routes (the
 * newsletter editor sub-routes — see staff-route-inventory.md §A) keep
 * rendering inside a minimal HTML shell. After the 30-day soak (G14)
 * the entire (workspace) route group is deleted and this file goes
 * with it.
 */
export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--hc-surface-elevated, #F8F7F3)",
        color: "var(--hc-ink, #0A0A0A)",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.5rem" }}>{children}</div>
    </div>
  );
}
