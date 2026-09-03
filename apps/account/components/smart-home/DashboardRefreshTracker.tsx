"use client";

import { useEffect, useRef } from "react";

/**
 * DashboardRefreshTracker — V3-08 (Empty Dashboard Truth).
 *
 * Emits `henry.dashboard.module.refreshed` whenever the customer
 * dashboard is re-rendered by `RouteLiveRefresh` (the 15s SPA refresh
 * tick + visibility-change refresh). The `freshness_seconds` payload is
 * the REAL elapsed wall-clock time since the previous render — never a
 * fabricated number — so the owner Module-Health tile and funnel
 * analytics see honest refresh cadence.
 *
 * The first mount is the initial render (already covered server-side by
 * `henry.dashboard.module.rendered` in `lib/smart-home/widgets.ts`), so
 * this component only emits on SUBSEQUENT renders. It detects a refresh
 * via a module-scoped `sessionStorage` timestamp: every render writes
 * `now`; if a prior timestamp exists, the delta is the freshness and we
 * emit.
 *
 * Telemetry is best-effort and lazy-imported (mirrors the
 * `StructuredSkeleton` pattern in `@henryco/ui`): if observability is
 * absent it is a silent no-op.
 */
async function emitRefreshed(payload: Record<string, unknown>): Promise<void> {
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
        name: "henry.dashboard.module.refreshed",
        classification: "system_state",
        outcome: "updated",
        payload,
      });
    }
  } catch {
    // Observability not installed in this surface — silent fallback.
  }
}

export type DashboardRefreshTrackerProps = {
  /** The dashboard surface being refreshed (e.g. `smart-home`). */
  moduleId: string;
};

export function DashboardRefreshTracker({
  moduleId,
}: DashboardRefreshTrackerProps) {
  // Guard against React 19 strict-mode double-invoke firing a spurious
  // 0s refresh: only the first effect run per mount participates.
  const firedThisMount = useRef(false);

  useEffect(() => {
    if (firedThisMount.current) return;
    firedThisMount.current = true;

    const key = `henry.dash.refresh.${moduleId}`;
    const nowMs = new Date().getTime();
    let prevMs: number | null = null;
    try {
      const raw = window.sessionStorage.getItem(key);
      prevMs = raw ? Number(raw) : null;
      window.sessionStorage.setItem(key, String(nowMs));
    } catch {
      // sessionStorage unavailable (private mode / SSR edge) — skip.
      return;
    }

    // First render of the session for this module is the initial render,
    // already covered by the server-side `module.rendered` event. Only a
    // subsequent render (a real RouteLiveRefresh tick) is a "refresh".
    if (prevMs !== null && Number.isFinite(prevMs) && nowMs > prevMs) {
      const freshnessSeconds = Math.round((nowMs - prevMs) / 1000);
      void emitRefreshed({
        module_id: moduleId,
        freshness_seconds: freshnessSeconds,
      });
    }
  }, [moduleId]);

  return null;
}
