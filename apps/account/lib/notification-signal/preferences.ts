/**
 * Local-only preferences for the in-app notification signal (toast / sound /
 * vibration / quiet hours). These are intentionally browser-local because they
 * describe *device* behavior, not delivery channels — channel routing lives in
 * `customer_preferences` and is handled by `notification-routing.ts`.
 *
 * Storage is namespaced and versioned so a future schema change does not
 * silently rehydrate stale fields.
 */

export const SIGNAL_PREF_STORAGE_KEY = "henryco.account.signal.v1";

/**
 * Custom event dispatched on `window` after a preference change so any other
 * mounted consumer (the signal provider, secondary settings instances) can
 * react without a page reload. Same-tab fan-out only — cross-tab updates are
 * picked up via the native `storage` event.
 */
export const SIGNAL_PREF_CHANGE_EVENT = "henryco:signal-pref-change";

export type NotificationSignalPreferences = {
  showToast: boolean;
  sound: boolean;
  vibration: boolean;
  highPriorityOnly: boolean;
  quietHoursEnabled: boolean;
  /** 24-hour HH:mm — e.g. "22:00" */
  quietHoursStart: string;
  /** 24-hour HH:mm — e.g. "07:00" */
  quietHoursEnd: string;
};

export const DEFAULT_SIGNAL_PREFERENCES: NotificationSignalPreferences = {
  showToast: true,
  sound: false,
  vibration: false,
  highPriorityOnly: false,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
};

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

function sanitizeTime(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  return HHMM.test(value) ? value : fallback;
}

function sanitizeBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function sanitizeSignalPreferences(
  input: Partial<NotificationSignalPreferences> | null | undefined,
): NotificationSignalPreferences {
  const source = input ?? {};
  return {
    showToast: sanitizeBool(source.showToast, DEFAULT_SIGNAL_PREFERENCES.showToast),
    sound: sanitizeBool(source.sound, DEFAULT_SIGNAL_PREFERENCES.sound),
    vibration: sanitizeBool(source.vibration, DEFAULT_SIGNAL_PREFERENCES.vibration),
    highPriorityOnly: sanitizeBool(
      source.highPriorityOnly,
      DEFAULT_SIGNAL_PREFERENCES.highPriorityOnly,
    ),
    quietHoursEnabled: sanitizeBool(
      source.quietHoursEnabled,
      DEFAULT_SIGNAL_PREFERENCES.quietHoursEnabled,
    ),
    quietHoursStart: sanitizeTime(
      source.quietHoursStart,
      DEFAULT_SIGNAL_PREFERENCES.quietHoursStart,
    ),
    quietHoursEnd: sanitizeTime(
      source.quietHoursEnd,
      DEFAULT_SIGNAL_PREFERENCES.quietHoursEnd,
    ),
  };
}

export function loadSignalPreferences(): NotificationSignalPreferences {
  if (typeof window === "undefined") return DEFAULT_SIGNAL_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(SIGNAL_PREF_STORAGE_KEY);
    if (!raw) return DEFAULT_SIGNAL_PREFERENCES;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return DEFAULT_SIGNAL_PREFERENCES;
    return sanitizeSignalPreferences(parsed as Partial<NotificationSignalPreferences>);
  } catch {
    return DEFAULT_SIGNAL_PREFERENCES;
  }
}

/**
 * Cached snapshot for useSyncExternalStore. The hook requires referential
 * stability across renders until the store actually changes, otherwise it
 * loops. We invalidate on save and on subscribe-callback notifications so
 * the next read returns fresh data.
 */
let cachedSnapshot: NotificationSignalPreferences | null = null;

function invalidateSnapshot(): void {
  cachedSnapshot = null;
}

export function getSignalPreferencesSnapshot(): NotificationSignalPreferences {
  if (cachedSnapshot === null) {
    cachedSnapshot = loadSignalPreferences();
  }
  return cachedSnapshot;
}

export function getSignalPreferencesServerSnapshot(): NotificationSignalPreferences {
  return DEFAULT_SIGNAL_PREFERENCES;
}

export function subscribeSignalPreferences(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    invalidateSnapshot();
    callback();
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === SIGNAL_PREF_STORAGE_KEY) handler();
  };
  window.addEventListener(SIGNAL_PREF_CHANGE_EVENT, handler);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(SIGNAL_PREF_CHANGE_EVENT, handler);
    window.removeEventListener("storage", onStorage);
  };
}

export function saveSignalPreferences(prefs: NotificationSignalPreferences): void {
  if (typeof window === "undefined") return;
  const sanitized = sanitizeSignalPreferences(prefs);
  try {
    window.localStorage.setItem(SIGNAL_PREF_STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // localStorage may be unavailable (private mode quota, etc.) — silent no-op.
  }
  invalidateSnapshot();
  try {
    window.dispatchEvent(
      new CustomEvent<NotificationSignalPreferences>(SIGNAL_PREF_CHANGE_EVENT, {
        detail: sanitized,
      }),
    );
  } catch {
    // CustomEvent should always be available in our supported browsers; ignore.
  }
}

function minutesFromHHMM(value: string): number | null {
  const match = HHMM.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Quiet hours wrap around midnight when end is earlier than start
 * (e.g. 22:00 → 07:00). We compare the *current local minute-of-day* against
 * that range so users stay in sync with their own clock, not UTC.
 */
export function isQuietNow(
  prefs: Pick<NotificationSignalPreferences, "quietHoursEnabled" | "quietHoursStart" | "quietHoursEnd">,
  now: Date = new Date(),
): boolean {
  if (!prefs.quietHoursEnabled) return false;

  const start = minutesFromHHMM(prefs.quietHoursStart);
  const end = minutesFromHHMM(prefs.quietHoursEnd);
  if (start === null || end === null || start === end) return false;

  const current = now.getHours() * 60 + now.getMinutes();

  if (start < end) {
    return current >= start && current < end;
  }
  return current >= start || current < end;
}

/**
 * High-priority filter: when enabled, only `priority === "high" | "critical"`
 * (or `is_security`-flagged) signals reach the user. Others still sit in the
 * notification feed — they just don't pop a toast or sound.
 */
export function shouldDeliverSignal(
  prefs: NotificationSignalPreferences,
  notification: { priority?: string | null; category?: string | null },
): boolean {
  if (!prefs.highPriorityOnly) return true;
  const priority = String(notification.priority || "").toLowerCase();
  const category = String(notification.category || "").toLowerCase();
  return priority === "high" || priority === "critical" || category === "security";
}
