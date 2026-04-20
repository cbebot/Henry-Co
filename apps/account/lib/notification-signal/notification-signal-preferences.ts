const DEFAULT_QUIET_HOURS_START = "22:00";
const DEFAULT_QUIET_HOURS_END = "07:00";

export type NotificationSignalPreferences = {
  push_enabled: boolean;
  notification_care: boolean;
  notification_marketplace: boolean;
  notification_studio: boolean;
  notification_jobs: boolean;
  notification_learn: boolean;
  notification_property: boolean;
  notification_logistics: boolean;
  notification_wallet: boolean;
  notification_security: boolean;
  notification_referrals: boolean;
  in_app_toast_enabled: boolean;
  notification_sound_enabled: boolean;
  notification_vibration_enabled: boolean;
  high_priority_only: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
};

export const DEFAULT_NOTIFICATION_SIGNAL_PREFERENCES: NotificationSignalPreferences = {
  push_enabled: true,
  notification_care: true,
  notification_marketplace: true,
  notification_studio: true,
  notification_jobs: true,
  notification_learn: true,
  notification_property: true,
  notification_logistics: true,
  notification_wallet: true,
  notification_security: true,
  notification_referrals: true,
  in_app_toast_enabled: true,
  notification_sound_enabled: false,
  notification_vibration_enabled: false,
  high_priority_only: false,
  quiet_hours_enabled: false,
  quiet_hours_start: DEFAULT_QUIET_HOURS_START,
  quiet_hours_end: DEFAULT_QUIET_HOURS_END,
};

const SIGNAL_PREFERENCE_KEYS = new Set<keyof NotificationSignalPreferences>([
  "push_enabled",
  "notification_care",
  "notification_marketplace",
  "notification_studio",
  "notification_jobs",
  "notification_learn",
  "notification_property",
  "notification_logistics",
  "notification_wallet",
  "notification_security",
  "notification_referrals",
  "in_app_toast_enabled",
  "notification_sound_enabled",
  "notification_vibration_enabled",
  "high_priority_only",
  "quiet_hours_enabled",
  "quiet_hours_start",
  "quiet_hours_end",
]);

function asBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }

  return fallback;
}

function normalizeTimeValue(value: unknown, fallback: string) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return fallback;

  const match = raw.match(/^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
  if (!match) return fallback;

  return `${match[1]}:${match[2]}`;
}

export function normalizeNotificationSignalPreferences(
  value: Record<string, unknown> | null | undefined,
): NotificationSignalPreferences {
  return {
    push_enabled: asBoolean(value?.push_enabled, DEFAULT_NOTIFICATION_SIGNAL_PREFERENCES.push_enabled),
    notification_care: asBoolean(
      value?.notification_care,
      DEFAULT_NOTIFICATION_SIGNAL_PREFERENCES.notification_care,
    ),
    notification_marketplace: asBoolean(
      value?.notification_marketplace,
      DEFAULT_NOTIFICATION_SIGNAL_PREFERENCES.notification_marketplace,
    ),
    notification_studio: asBoolean(
      value?.notification_studio,
      DEFAULT_NOTIFICATION_SIGNAL_PREFERENCES.notification_studio,
    ),
    notification_jobs: asBoolean(
      value?.notification_jobs,
      DEFAULT_NOTIFICATION_SIGNAL_PREFERENCES.notification_jobs,
    ),
    notification_learn: asBoolean(
      value?.notification_learn,
      DEFAULT_NOTIFICATION_SIGNAL_PREFERENCES.notification_learn,
    ),
    notification_property: asBoolean(
      value?.notification_property,
      DEFAULT_NOTIFICATION_SIGNAL_PREFERENCES.notification_property,
    ),
    notification_logistics: asBoolean(
      value?.notification_logistics,
      DEFAULT_NOTIFICATION_SIGNAL_PREFERENCES.notification_logistics,
    ),
    notification_wallet: asBoolean(
      value?.notification_wallet,
      DEFAULT_NOTIFICATION_SIGNAL_PREFERENCES.notification_wallet,
    ),
    notification_security: asBoolean(
      value?.notification_security,
      DEFAULT_NOTIFICATION_SIGNAL_PREFERENCES.notification_security,
    ),
    notification_referrals: asBoolean(
      value?.notification_referrals,
      DEFAULT_NOTIFICATION_SIGNAL_PREFERENCES.notification_referrals,
    ),
    in_app_toast_enabled: asBoolean(
      value?.in_app_toast_enabled,
      DEFAULT_NOTIFICATION_SIGNAL_PREFERENCES.in_app_toast_enabled,
    ),
    notification_sound_enabled: asBoolean(
      value?.notification_sound_enabled,
      DEFAULT_NOTIFICATION_SIGNAL_PREFERENCES.notification_sound_enabled,
    ),
    notification_vibration_enabled: asBoolean(
      value?.notification_vibration_enabled,
      DEFAULT_NOTIFICATION_SIGNAL_PREFERENCES.notification_vibration_enabled,
    ),
    high_priority_only: asBoolean(
      value?.high_priority_only,
      DEFAULT_NOTIFICATION_SIGNAL_PREFERENCES.high_priority_only,
    ),
    quiet_hours_enabled: asBoolean(
      value?.quiet_hours_enabled,
      DEFAULT_NOTIFICATION_SIGNAL_PREFERENCES.quiet_hours_enabled,
    ),
    quiet_hours_start: normalizeTimeValue(
      value?.quiet_hours_start,
      DEFAULT_NOTIFICATION_SIGNAL_PREFERENCES.quiet_hours_start,
    ),
    quiet_hours_end: normalizeTimeValue(
      value?.quiet_hours_end,
      DEFAULT_NOTIFICATION_SIGNAL_PREFERENCES.quiet_hours_end,
    ),
  };
}

export function pickNotificationSignalPreferenceUpdates(
  value: Partial<Record<keyof NotificationSignalPreferences, unknown>>,
) {
  const normalized = normalizeNotificationSignalPreferences(value);
  const updates: Partial<NotificationSignalPreferences> = {};

  for (const key of SIGNAL_PREFERENCE_KEYS) {
    if (key in value) {
      (updates as Record<string, string | boolean>)[key] = normalized[key];
    }
  }

  return updates;
}

export function isNotificationDivisionEnabled(
  preferences: NotificationSignalPreferences,
  divisionKey: string | null | undefined,
) {
  const normalized = String(divisionKey || "").trim().toLowerCase();

  if (!normalized || normalized === "general" || normalized === "account") {
    return true;
  }

  if (normalized === "care") return preferences.notification_care;
  if (normalized === "marketplace") return preferences.notification_marketplace;
  if (normalized === "studio") return preferences.notification_studio;
  if (normalized === "jobs") return preferences.notification_jobs;
  if (normalized === "learn") return preferences.notification_learn;
  if (normalized === "property") return preferences.notification_property;
  if (normalized === "logistics") return preferences.notification_logistics;
  if (normalized === "wallet") return preferences.notification_wallet;
  if (normalized === "security") return preferences.notification_security;
  if (normalized === "referrals") return preferences.notification_referrals;

  return true;
}
