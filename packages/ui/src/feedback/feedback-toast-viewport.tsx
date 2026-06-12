"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useOptionalHenryCoLocale } from "@henryco/i18n/react";
import { planToastRelease } from "@henryco/notifications-ui/toast-pacing";
import { signalAudio } from "@henryco/notifications-ui/chime";

import {
  isActiveToastRenderer,
  registerToastRenderer,
  subscribeFeedbackToast,
  subscribeToastRendererChange,
  type FeedbackToast,
} from "./toast-bus";
import {
  FEEDBACK_TOAST_CSS,
  FEEDBACK_TOAST_EXIT_MS,
  FeedbackToastCard,
} from "./feedback-toast-card";

/**
 * FeedbackToastViewport — the app-wide home of action-feedback toasts.
 *
 * Mounted once per app root (PublicThemeGuard does it for the public apps;
 * apps/account mounts it directly). Provider-free by design: it needs no
 * realtime spine, no locale provider (falls back to EN labels), no context —
 * so every surface, including thin route groups like /payments/callback,
 * gets feedback for free.
 *
 * Regulation is the shipped #249/#265 standard: at most TWO toasts visible,
 * revealed ONE AT A TIME (650ms drip) via the shared planToastRelease, a
 * small queue behind them, two-phase exits.
 *
 * RENDERER ELECTION: richer hosts (the dashboard shell's notifications
 * viewport, which merges action toasts with realtime signals into one calm
 * strip) register at higher priority on the same bus. While one is mounted,
 * this viewport stands down completely — a toast never renders twice.
 * In-flight toasts finish their dwell here even if a richer host mounts
 * mid-display (rare, benign).
 *
 * Anchored bottom-right desktop / bottom mobile — the same corner as the
 * dashboard strip, so the feedback language never moves on the user.
 */

const VISIBLE_LIMIT = 2;
const MAX_QUEUE = 6;
const DRIP_GAP_MS = 650;

const STYLE_ID = "hc-feedback-toast-style";

type ActiveToast = {
  toast: FeedbackToast;
  receivedAt: number;
  leaving: boolean;
};

function useDripReleasedToasts(
  candidates: ActiveToast[],
  limit: number,
  gapMs: number,
): ActiveToast[] {
  const [releasedKeys, setReleasedKeys] = useState<string[]>([]);
  const [tick, setTick] = useState(0);
  const lastReleaseAtRef = useRef(0);

  const candidateSig = candidates.map((c) => c.toast.id).join("|");

  useEffect(() => {
    const plan = planToastRelease({
      candidateKeys: candidateSig ? candidateSig.split("|") : [],
      releasedKeys,
      lastReleaseAt: lastReleaseAtRef.current,
      now: Date.now(),
      limit,
      gapMs,
    });
    if (plan.action === "prune") {
      setReleasedKeys(plan.releasedKeys);
      return;
    }
    if (plan.action === "release") {
      lastReleaseAtRef.current = Date.now();
      setReleasedKeys((prev) => [...prev, plan.key]);
      return;
    }
    if (plan.action === "wait") {
      const timer = setTimeout(() => setTick((x) => x + 1), plan.waitMs);
      return () => clearTimeout(timer);
    }
    // idle — nothing to release
  }, [candidateSig, releasedKeys, limit, gapMs, tick]);

  const byKey = new Map(candidates.map((c) => [c.toast.id, c]));
  return releasedKeys
    .map((k) => byKey.get(k))
    .filter((entry): entry is ActiveToast => Boolean(entry))
    .sort((a, b) => b.receivedAt - a.receivedAt);
}

export type FeedbackToastViewportProps = {
  /**
   * Election priority on the shared bus. The default (0) is right for the
   * app-wide mount; richer merged viewports register higher and win.
   */
  priority?: number;
};

export function FeedbackToastViewport({ priority = 0 }: FeedbackToastViewportProps) {
  const locale = useOptionalHenryCoLocale() ?? "en";
  const t = useCallback(
    (key: string) => translateSurfaceLabel(locale, key),
    [locale],
  );

  // ── Election ─────────────────────────────────────────────────────────
  const registrationRef = useRef<{ id: number; release: () => void } | null>(null);
  const [registrationId, setRegistrationId] = useState<number | null>(null);
  useEffect(() => {
    const registration = registerToastRenderer(priority);
    registrationRef.current = registration;
    setRegistrationId(registration.id);
    return () => {
      registration.release();
      registrationRef.current = null;
    };
  }, [priority]);

  const isActive = useSyncExternalStore(
    subscribeToastRendererChange,
    () => (registrationId === null ? false : isActiveToastRenderer(registrationId)),
    () => false,
  );

  // ── Queue ────────────────────────────────────────────────────────────
  const [active, setActive] = useState<ActiveToast[]>([]);
  const exitTimers = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!isActive) return;
    return subscribeFeedbackToast((toast) => {
      setActive((current) => {
        const existing = current.findIndex((entry) => entry.toast.id === toast.id);
        if (existing !== -1) {
          // Re-emitting the same id replaces its content in place.
          const next = current.slice();
          next[existing] = { toast, receivedAt: Date.now(), leaving: false };
          return next;
        }
        return [...current, { toast, receivedAt: Date.now(), leaving: false }].slice(
          -MAX_QUEUE,
        );
      });
    });
  }, [isActive]);

  // Unlock the AudioContext on the first page gesture (Chrome/Safari autoplay
  // policy) so the first real action chime can sound. Once is enough.
  useEffect(() => {
    if (!isActive || typeof window === "undefined") return;
    if (!signalAudio.isSupported() || signalAudio.isUnlocked()) return;
    let done = false;
    const handler = () => {
      if (done) return;
      done = true;
      void signalAudio.unlock();
      cleanup();
    };
    const cleanup = () => {
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
    };
    window.addEventListener("pointerdown", handler, { once: true, passive: true });
    window.addEventListener("keydown", handler, { once: true });
    return cleanup;
  }, [isActive]);

  const remove = useCallback((id: string) => {
    setActive((current) => current.filter((entry) => entry.toast.id !== id));
    const timer = exitTimers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      exitTimers.current.delete(id);
    }
  }, []);

  // Two-phase dismissal: mark leaving (plays the exit animation), then remove
  // once the animation window has elapsed.
  const requestDismiss = useCallback(
    (id: string) => {
      if (exitTimers.current.has(id)) return; // already leaving
      setActive((current) =>
        current.map((entry) =>
          entry.toast.id === id ? { ...entry, leaving: true } : entry,
        ),
      );
      const timer = window.setTimeout(() => remove(id), FEEDBACK_TOAST_EXIT_MS);
      exitTimers.current.set(id, timer);
    },
    [remove],
  );

  // Clear any pending exit timers on unmount.
  useEffect(() => {
    const timers = exitTimers.current;
    return () => {
      for (const id of timers.values()) window.clearTimeout(id);
      timers.clear();
    };
  }, []);

  const visible = useDripReleasedToasts(active, VISIBLE_LIMIT, DRIP_GAP_MS);

  if (visible.length === 0) return null;

  return (
    <>
      <style id={STYLE_ID} dangerouslySetInnerHTML={{ __html: FEEDBACK_TOAST_CSS }} />
      <div
        role="region"
        aria-label={t("New activity")}
        style={{
          position: "fixed",
          zIndex: 120,
          right: "1rem",
          bottom: "1rem",
          left: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "0.5rem",
          pointerEvents: "none",
          paddingBottom: "max(env(safe-area-inset-bottom, 0px) + 0.5rem, 0.5rem)",
        }}
      >
        {visible.map((entry, index) => (
          <FeedbackToastCard
            key={entry.toast.id}
            toast={entry.toast}
            index={index}
            leaving={entry.leaving}
            onDismiss={() => requestDismiss(entry.toast.id)}
            t={t}
          />
        ))}
      </div>
    </>
  );
}
