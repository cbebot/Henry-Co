/**
 * Client-side reader + subscriber for the `hc_session_state` cookie
 * set by the server-side refresh middleware on each request.
 *
 * SSR-safe: returns null when `document` / `window` are absent.
 *
 * The subscribe helper polls on focus + visibilitychange — not on a
 * setInterval — so the value is fresh whenever the user returns to
 * the tab. Cross-tab updates flow through the session broadcaster (or
 * the server side, which rewrites the cookie on each request), so
 * polling is unnecessary.
 */

import {
  HC_SESSION_STATE_COOKIE,
  SESSION_STATE_VALUES,
  type SessionState,
} from "../types";

export function readSessionStateCookie(): SessionState | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";");
  for (const entry of cookies) {
    const trimmed = entry.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const name = trimmed.slice(0, eq);
    if (name !== HC_SESSION_STATE_COOKIE) continue;
    let raw: string;
    try {
      raw = decodeURIComponent(trimmed.slice(eq + 1));
    } catch {
      raw = trimmed.slice(eq + 1);
    }
    return isSessionStateValue(raw) ? raw : null;
  }
  return null;
}

function isSessionStateValue(raw: string): raw is SessionState {
  return (SESSION_STATE_VALUES as ReadonlyArray<string>).includes(raw);
}

export type SessionStateListener = (state: SessionState | null) => void;

/**
 * Subscribe to changes in `hc_session_state`. The listener fires once
 * synchronously with the current value, then again whenever the value
 * changes (detected on focus + visibilitychange).
 *
 * Returns an unsubscribe function.
 */
export function subscribeSessionState(listener: SessionStateListener): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    listener(null);
    return () => {
      /* no-op */
    };
  }

  let last = readSessionStateCookie();
  listener(last);

  const tick = (): void => {
    const next = readSessionStateCookie();
    if (next !== last) {
      last = next;
      listener(next);
    }
  };

  const onVisibility = (): void => {
    if (document.visibilityState === "visible") tick();
  };

  window.addEventListener("focus", tick);
  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    window.removeEventListener("focus", tick);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
