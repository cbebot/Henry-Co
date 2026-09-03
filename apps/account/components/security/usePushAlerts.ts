"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Web Push subscription lifecycle for "this device".
 *
 * Copy-free by design — it returns state + error CODES, and the component
 * renders the translated copy. Degrades cleanly when the browser lacks push,
 * permission is denied, or push isn't configured server-side.
 */

export type PushAlertsError =
  | "permission_denied"
  | "unsupported"
  | "not_configured"
  | "failed"
  | null;

export type PushAlertsState = {
  ready: boolean;
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
  busy: boolean;
  error: PushAlertsError;
};

const SW_URL = "/push-sw.js";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

export function usePushAlerts() {
  const [state, setState] = useState<PushAlertsState>({
    ready: false,
    supported: false,
    permission: "unsupported",
    subscribed: false,
    busy: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    // All detection + the single state update run inside this async flow, so no
    // setState happens synchronously in the effect body (avoids cascading renders
    // and keeps the SSR/first-client render in the neutral `ready: false` state).
    (async () => {
      const supported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;
      let subscribed = false;
      let permission: NotificationPermission | "unsupported" = "unsupported";
      if (supported) {
        permission = Notification.permission;
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            const sub = await reg.pushManager.getSubscription();
            subscribed = Boolean(sub);
          }
        } catch {
          // ignore — treat as not subscribed
        }
      } else {
        await Promise.resolve();
      }
      if (!cancelled) {
        setState((s) => ({ ...s, ready: true, supported, permission, subscribed }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const subscribe = useCallback(async () => {
    setState((s) => ({ ...s, busy: true, error: null }));
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setState((s) => ({ ...s, busy: false, error: "unsupported" }));
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState((s) => ({ ...s, busy: false, permission, error: "permission_denied" }));
        return;
      }
      const reg = await navigator.serviceWorker.register(SW_URL);
      await navigator.serviceWorker.ready;

      const keyRes = await fetch("/api/push/public-key", { cache: "no-store" });
      const { key } = (await keyRes.json()) as { key: string | null };
      if (!key) {
        setState((s) => ({ ...s, busy: false, error: "not_configured" }));
        return;
      }

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        });
      }
      const json = sub.toJSON();
      const ok = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ channel: "web", endpoint: json.endpoint, keys: json.keys }),
      })
        .then((r) => r.ok)
        .catch(() => false);
      if (!ok) {
        setState((s) => ({ ...s, busy: false, error: "failed" }));
        return;
      }
      setState((s) => ({
        ...s,
        busy: false,
        subscribed: true,
        permission: "granted",
        error: null,
      }));
    } catch {
      setState((s) => ({ ...s, busy: false, error: "failed" }));
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setState((s) => ({ ...s, busy: true, error: null }));
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        const { endpoint } = sub;
        await sub.unsubscribe().catch(() => false);
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ endpoint }),
        }).catch(() => undefined);
      }
      setState((s) => ({ ...s, busy: false, subscribed: false }));
    } catch {
      setState((s) => ({ ...s, busy: false, error: "failed" }));
    }
  }, []);

  return { ...state, subscribe, unsubscribe };
}
