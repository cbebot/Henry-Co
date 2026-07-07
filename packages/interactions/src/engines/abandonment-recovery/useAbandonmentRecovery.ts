"use client";

/**
 * Abandonment Recovery Engine — `useAbandonmentRecovery` (doctrine Engine 4).
 *
 * Watches a high-intent flow for a 20s pause or page exit, saves the draft
 * through the injected adapter (local immediately; server if identified),
 * and emits `recovery_triggered` when the tested gates allow. The actual
 * cross-session message is sent server-side (V3-48 campaigns) — this hook
 * only records the consented signal. Call `markResumed()` when a visitor
 * returns via a resume link to emit `recovery_resumed`.
 */

import { useCallback, useEffect, useRef } from "react";
import { useInteractionTelemetry } from "../../context";
import {
  shouldTriggerExitRecovery,
  shouldTriggerRecovery,
} from "./recovery.logic";

export interface RecoveryAdapter {
  /** Persist the draft locally (synchronous, cheap). */
  saveDraftLocal(draft: unknown): void;
  /** Persist the draft server-side for identified users (best-effort). */
  saveDraftServer?(draft: unknown): Promise<void>;
  /** Wall-clock ms of the last recovery for this flow, or null. */
  getLastRecoveryAt(): number | null;
  /** Record that a recovery signal fired now. */
  recordRecovery(at: number): void;
}

export interface UseAbandonmentRecoveryOptions {
  flowId: string;
  consented: boolean;
  highIntent: boolean;
  adapter: RecoveryAdapter;
  /** Returns the current draft; called at save time. */
  getDraft: () => unknown;
}

export interface AbandonmentRecoveryHandle {
  /** Reset the idle timer — call on any user input in the flow. */
  touch(): void;
  /** Call when the user arrives via a resume link (emits recovery_resumed). */
  markResumed(timeToResumeS: number): void;
}

export function useAbandonmentRecovery({
  flowId,
  consented,
  highIntent,
  adapter,
  getDraft,
}: UseAbandonmentRecoveryOptions): AbandonmentRecoveryHandle {
  const telemetry = useInteractionTelemetry();
  const lastInputRef = useRef<number>(Date.now());
  const firedRef = useRef(false);

  const persistDraft = useCallback(() => {
    const draft = getDraft();
    adapter.saveDraftLocal(draft);
    void adapter.saveDraftServer?.(draft);
  }, [adapter, getDraft]);

  const touch = useCallback(() => {
    lastInputRef.current = Date.now();
    firedRef.current = false;
  }, []);

  // Idle watcher: check every 5s whether the tested gates open.
  useEffect(() => {
    const interval = setInterval(() => {
      if (firedRef.current) return;
      const now = Date.now();
      const idleMs = now - lastInputRef.current;
      const verdict = shouldTriggerRecovery(
        idleMs,
        consented,
        highIntent,
        adapter.getLastRecoveryAt(),
        now,
      );
      if (!verdict) return;
      firedRef.current = true;
      persistDraft();
      adapter.recordRecovery(now);
      telemetry.emit({
        name: "recovery_triggered",
        props: { flow_id: flowId, trigger: verdict.trigger, consented },
      });
    }, 5_000);
    return () => clearInterval(interval);
  }, [flowId, consented, highIntent, adapter, persistDraft, telemetry]);

  // Exit watcher: save the draft on unload; emit if the gates allow.
  useEffect(() => {
    const onHide = () => {
      persistDraft();
      const now = Date.now();
      const verdict = shouldTriggerExitRecovery(
        true,
        consented,
        highIntent,
        adapter.getLastRecoveryAt(),
        now,
      );
      if (verdict && !firedRef.current) {
        firedRef.current = true;
        adapter.recordRecovery(now);
        telemetry.emit({
          name: "recovery_triggered",
          props: { flow_id: flowId, trigger: verdict.trigger, consented },
        });
      }
    };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [flowId, consented, highIntent, adapter, persistDraft, telemetry]);

  const markResumed = useCallback(
    (timeToResumeS: number) => {
      telemetry.emit({
        name: "recovery_resumed",
        props: { flow_id: flowId, time_to_resume_s: timeToResumeS },
      });
    },
    [flowId, telemetry],
  );

  return { touch, markResumed };
}
