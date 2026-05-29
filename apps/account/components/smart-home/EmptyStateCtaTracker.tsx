"use client";

import { type ReactNode } from "react";

/**
 * EmptyStateCtaTracker — V3-08 (Empty Dashboard Truth).
 *
 * Thin client wrapper that fires `henry.dashboard.empty_state.cta_clicked`
 * when the customer clicks a CTA inside a first-run / empty dashboard
 * state. The signal lets the owner Module-Health tile and the funnel
 * analytics tell apart an empty dashboard that the customer ACTED on
 * (the teaching worked) from one they ignored (the empty-state copy or
 * CTA needs work).
 *
 * It wraps the existing server-rendered CTA cluster and listens via
 * event delegation, so it does NOT force the `SmartHomeEmpty` /
 * `ActionButton` tree to become client components — they stay server
 * components and the anchor navigation is untouched.
 *
 * Telemetry is best-effort and lazy-imported (mirrors the
 * `StructuredSkeleton` pattern in `@henryco/ui`): if observability is
 * absent the click is a silent no-op and navigation proceeds normally.
 */
async function emitCtaClicked(payload: Record<string, unknown>): Promise<void> {
  try {
    const mod = (await import(
      /* webpackIgnore: true */ "@henryco/observability"
    )) as
      | {
          emitEvent?: (params: {
            name: string;
            classification: string;
            outcome: string;
            payload?: Record<string, unknown>;
          }) => void;
        }
      | undefined;
    if (mod && typeof mod.emitEvent === "function") {
      mod.emitEvent({
        name: "henry.dashboard.empty_state.cta_clicked",
        classification: "user_action",
        outcome: "started",
        payload,
      });
    }
  } catch {
    // Observability not installed in this surface — silent fallback.
  }
}

export type EmptyStateCtaTrackerProps = {
  /** The dashboard surface the empty state belongs to (e.g. `smart-home`). */
  moduleId: string;
  children: ReactNode;
};

export function EmptyStateCtaTracker({
  moduleId,
  children,
}: EmptyStateCtaTrackerProps) {
  const handleClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    const target = event.target as HTMLElement | null;
    const anchor = target?.closest("a");
    if (!anchor) return;
    void emitCtaClicked({
      module_id: moduleId,
      cta_target: anchor.getAttribute("href") ?? "",
    });
  };

  return (
    <div onClick={handleClick} style={{ display: "contents" }}>
      {children}
    </div>
  );
}
