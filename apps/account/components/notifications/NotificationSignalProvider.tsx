"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signalAudio } from "@/lib/notification-signal/audio";
import { triggerHaptic } from "@/lib/notification-signal/vibration";
import {
  DEFAULT_SIGNAL_PREFERENCES,
  isQuietNow,
  loadSignalPreferences,
  shouldDeliverSignal,
  SIGNAL_PREF_CHANGE_EVENT,
  SIGNAL_PREF_STORAGE_KEY,
  type NotificationSignalPreferences,
} from "@/lib/notification-signal/preferences";
import NotificationToastViewport from "@/components/notifications/NotificationToastViewport";

const POLL_INTERVAL_MS = 60_000;
const POLL_INTERVAL_FOCUSED_MS = 35_000;
const TOAST_TTL_MS = 6500;
const TOAST_TTL_HIGH_MS = 9500;
const SEEN_BUFFER_LIMIT = 200;

export type SignalSource = {
  key: string;
  label: string;
  accent: string;
  logoUrl: string | null;
};

export type SignalNotification = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  priority: string | null;
  category: string | null;
  message_href: string;
  action_url: string;
  source: SignalSource;
};

type SignalApiResponse = {
  items: SignalNotification[];
  serverTime?: string;
  error?: string;
};

export type ToastEntry = {
  notification: SignalNotification;
  receivedAt: number;
  priority: "default" | "high";
};

function classifyPriority(notification: SignalNotification): "default" | "high" {
  const p = (notification.priority || "").toLowerCase();
  const c = (notification.category || "").toLowerCase();
  if (p === "high" || p === "critical" || c === "security") return "high";
  return "default";
}

export default function NotificationSignalProvider() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  // All cross-tick state lives in refs so the polling effect can stay mounted
  // for the full session without re-subscribing on every preference change.
  const baselineRef = useRef<string | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const seenOrderRef = useRef<string[]>([]);
  const inFlightRef = useRef(false);
  const initializedRef = useRef(false);
  const prefsRef = useRef<NotificationSignalPreferences>(DEFAULT_SIGNAL_PREFERENCES);

  // Hydrate preferences and subscribe to local + cross-tab changes.
  useEffect(() => {
    prefsRef.current = loadSignalPreferences();

    const handleCustom = (event: Event) => {
      const detail = (event as CustomEvent<NotificationSignalPreferences>).detail;
      if (detail) {
        prefsRef.current = detail;
      } else {
        prefsRef.current = loadSignalPreferences();
      }
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== SIGNAL_PREF_STORAGE_KEY) return;
      prefsRef.current = loadSignalPreferences();
    };

    window.addEventListener(SIGNAL_PREF_CHANGE_EVENT, handleCustom as EventListener);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(SIGNAL_PREF_CHANGE_EVENT, handleCustom as EventListener);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const rememberId = useCallback((id: string) => {
    if (seenIdsRef.current.has(id)) return;
    seenIdsRef.current.add(id);
    seenOrderRef.current.push(id);
    if (seenOrderRef.current.length > SEEN_BUFFER_LIMIT) {
      const drop = seenOrderRef.current.shift();
      if (drop) seenIdsRef.current.delete(drop);
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((entry) => entry.notification.id !== id));
  }, []);

  // Auto-dismiss timers — one per visible toast. Hover/focus pause is achieved
  // by the viewport calling `pinToast`, which resets receivedAt and re-runs
  // this effect.
  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((entry) => {
      const ttl = entry.priority === "high" ? TOAST_TTL_HIGH_MS : TOAST_TTL_MS;
      const elapsed = Date.now() - entry.receivedAt;
      const remaining = Math.max(800, ttl - elapsed);
      return window.setTimeout(() => dismissToast(entry.notification.id), remaining);
    });
    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [toasts, dismissToast]);

  const pinToast = useCallback((id: string) => {
    setToasts((current) =>
      current.map((entry) =>
        entry.notification.id === id ? { ...entry, receivedAt: Date.now() } : entry,
      ),
    );
  }, []);

  // Core polling loop. Establishes a baseline on first call (no signal) and
  // only signals notifications strictly newer than that baseline thereafter.
  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;

    const tick = async () => {
      if (cancelled || inFlightRef.current) return;
      if (typeof document !== "undefined" && document.hidden) return;

      inFlightRef.current = true;
      try {
        const params = new URLSearchParams({ limit: "5" });
        const baseline = baselineRef.current;
        if (baseline) params.set("since", baseline);

        const res = await fetch(`/api/notifications/signal?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!res.ok) return;
        const payload = (await res.json()) as SignalApiResponse;
        const items = Array.isArray(payload.items) ? payload.items : [];

        if (!initializedRef.current) {
          // First successful fetch — record everything as seen so we never
          // signal the existing unread backlog.
          for (const item of items) rememberId(item.id);
          baselineRef.current = payload.serverTime || new Date().toISOString();
          initializedRef.current = true;
          return;
        }

        baselineRef.current = payload.serverTime || baselineRef.current;
        if (items.length === 0) return;

        const prefs = prefsRef.current;
        const fresh = items
          .filter((item) => !seenIdsRef.current.has(item.id))
          .filter((item) => shouldDeliverSignal(prefs, item))
          .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));

        if (fresh.length === 0) {
          for (const item of items) rememberId(item.id);
          return;
        }

        const quiet = isQuietNow(prefs);
        const showToast = prefs.showToast;
        const playSound = prefs.sound && !quiet && signalAudio.isUnlocked();
        const useHaptics = prefs.vibration && !quiet;

        if (showToast) {
          setToasts((current) => {
            const merged = [...current];
            for (const notification of fresh) {
              if (merged.some((entry) => entry.notification.id === notification.id)) continue;
              merged.push({
                notification,
                receivedAt: Date.now(),
                priority: classifyPriority(notification),
              });
            }
            return merged;
          });
        }

        for (const item of fresh) rememberId(item.id);

        if (playSound) {
          const variant = fresh.some((n) => classifyPriority(n) === "high") ? "high" : "default";
          signalAudio.playChime(variant);
        }
        if (useHaptics) {
          const variant = fresh.some((n) => classifyPriority(n) === "high") ? "high" : "default";
          triggerHaptic(variant);
        }
      } catch {
        // Network errors are silent — we'll retry on the next tick.
      } finally {
        inFlightRef.current = false;
      }
    };

    const schedule = () => {
      if (cancelled) return;
      const interval =
        typeof document !== "undefined" && document.hasFocus()
          ? POLL_INTERVAL_FOCUSED_MS
          : POLL_INTERVAL_MS;
      timer = window.setTimeout(async () => {
        await tick();
        schedule();
      }, interval);
    };

    const onVisibilityChange = () => {
      if (typeof document === "undefined") return;
      if (!document.hidden) void tick();
    };

    void tick().then(() => schedule());

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onVisibilityChange);

    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onVisibilityChange);
    };
  }, [rememberId]);

  // Unlock the audio context on first user gesture. This is required by
  // browser autoplay policy — even when the user has the sound preference on,
  // we cannot make noise until they interact with the page.
  useEffect(() => {
    if (!signalAudio.isSupported()) return;
    let cancelled = false;
    const handler = () => {
      if (cancelled) return;
      void signalAudio.unlock();
    };
    const opts: AddEventListenerOptions = { passive: true };
    document.addEventListener("pointerdown", handler, opts);
    document.addEventListener("keydown", handler, opts);
    return () => {
      cancelled = true;
      document.removeEventListener("pointerdown", handler, opts);
      document.removeEventListener("keydown", handler, opts);
    };
  }, []);

  return (
    <NotificationToastViewport
      toasts={toasts}
      onDismiss={dismissToast}
      onPin={pinToast}
    />
  );
}
