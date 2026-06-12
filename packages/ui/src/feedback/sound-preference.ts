"use client";

/**
 * "Interface sounds" — the user's switch for the Onyx action chime.
 *
 * A DEVICE preference, deliberately browser-local (the same discipline as
 * apps/account's "On-device alerts" signal preferences): sound is a property
 * of the device you're sitting at, not of the account. Default ON — the
 * chime is quiet, rate-limited, and only ever follows the user's own
 * completed action; anyone who disagrees flips it off once in Account
 * settings and this device stays silent.
 *
 * Storage follows the HenryCo-prefixed discipline (packages/auth
 * known-storage.ts): `henryco:` namespace, versioned key. Changes propagate
 * instantly — a CustomEvent fans out same-tab consumers, the native
 * `storage` event covers other tabs. A profile-level mirror (cross-device)
 * is deferred until FL2 opens customer_preferences migrations; see the
 * V3-FEEDBACK-01 report.
 *
 * NOTE: distinct from `notification_sound_enabled` (the opt-in chime for
 * ARRIVING notifications, default OFF — PR #243's standard stands). This
 * preference governs only sounds the interface makes in direct response to
 * the user's own actions.
 */

import { useSyncExternalStore } from "react";

export const INTERFACE_SOUNDS_STORAGE_KEY = "henryco:interface-sounds.v1";
export const INTERFACE_SOUNDS_CHANGE_EVENT = "henryco:interface-sounds-change";

export const INTERFACE_SOUNDS_DEFAULT = true;

export function loadInterfaceSoundsEnabled(): boolean {
  if (typeof window === "undefined") return INTERFACE_SOUNDS_DEFAULT;
  try {
    const raw = window.localStorage.getItem(INTERFACE_SOUNDS_STORAGE_KEY);
    if (raw === null) return INTERFACE_SOUNDS_DEFAULT;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && "enabled" in parsed) {
      const enabled = (parsed as { enabled?: unknown }).enabled;
      return typeof enabled === "boolean" ? enabled : INTERFACE_SOUNDS_DEFAULT;
    }
    return INTERFACE_SOUNDS_DEFAULT;
  } catch {
    return INTERFACE_SOUNDS_DEFAULT;
  }
}

export function setInterfaceSoundsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      INTERFACE_SOUNDS_STORAGE_KEY,
      JSON.stringify({ enabled }),
    );
  } catch {
    // localStorage may be unavailable (private mode, quota) — silent no-op;
    // the in-memory default still applies for this page.
  }
  try {
    window.dispatchEvent(new CustomEvent(INTERFACE_SOUNDS_CHANGE_EVENT));
  } catch {
    /* ignore */
  }
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === INTERFACE_SOUNDS_STORAGE_KEY) callback();
  };
  window.addEventListener(INTERFACE_SOUNDS_CHANGE_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(INTERFACE_SOUNDS_CHANGE_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Live view of the preference for settings UIs. The chime path itself reads
 * `loadInterfaceSoundsEnabled()` at play time (always-current, no React
 * needed), so flipping the switch takes effect on the very next action.
 */
export function useInterfaceSoundsEnabled(): boolean {
  return useSyncExternalStore(
    subscribe,
    loadInterfaceSoundsEnabled,
    () => INTERFACE_SOUNDS_DEFAULT,
  );
}
