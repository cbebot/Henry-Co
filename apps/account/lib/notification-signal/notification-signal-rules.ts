import {
  isNotificationDivisionEnabled,
  type NotificationSignalPreferences,
} from "./notification-signal-preferences";
import type { SignalNotification } from "./notification-polling";

const HIGH_PRIORITY_VALUES = new Set(["high", "urgent", "critical"]);
const MARKETING_HINTS = ["deal", "marketing", "newsletter", "campaign", "promo", "tip"];
const SOUND_DIVISIONS = new Set(["care", "jobs", "logistics", "marketplace", "property", "wallet"]);
const SOUND_CATEGORIES = new Set(["support", "wallet", "security", "booking", "payment"]);
const SOUND_KEYWORDS = [
  "application",
  "booking",
  "delivery",
  "interview",
  "logistics",
  "payment",
  "reply",
  "support",
  "wallet",
];

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function getSearchableText(notification: SignalNotification) {
  return [
    notification.title,
    notification.body,
    notification.category,
    notification.division,
    notification.reference_type,
  ]
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .join(" ");
}

function hasUsefulPreview(notification: SignalNotification) {
  return Boolean(String(notification.title || "").trim() || String(notification.body || "").trim());
}

export function isSecurityNotification(notification: SignalNotification) {
  const category = normalizeText(notification.category);
  const division = normalizeText(notification.division);
  const searchText = getSearchableText(notification);

  return (
    category === "security" ||
    division === "security" ||
    searchText.includes("security") ||
    searchText.includes("login alert")
  );
}

export function isHighPriorityNotification(notification: SignalNotification) {
  return HIGH_PRIORITY_VALUES.has(normalizeText(notification.priority)) || isSecurityNotification(notification);
}

function isMarketingNotification(notification: SignalNotification) {
  const searchText = getSearchableText(notification);
  return MARKETING_HINTS.some((hint) => searchText.includes(hint));
}

export function isWithinQuietHours(preferences: NotificationSignalPreferences, now = new Date()) {
  if (!preferences.quiet_hours_enabled) return false;

  const [startHour, startMinute] = preferences.quiet_hours_start.split(":").map(Number);
  const [endHour, endMinute] = preferences.quiet_hours_end.split(":").map(Number);

  if (!Number.isFinite(startHour) || !Number.isFinite(startMinute)) return false;
  if (!Number.isFinite(endHour) || !Number.isFinite(endMinute)) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  if (startMinutes === endMinutes) return false;
  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

function passesPriorityGate(
  notification: SignalNotification,
  preferences: NotificationSignalPreferences,
) {
  if (!preferences.high_priority_only) return true;
  return isHighPriorityNotification(notification);
}

function passesDivisionGate(
  notification: SignalNotification,
  preferences: NotificationSignalPreferences,
) {
  const divisionKey = notification.division || notification.source.key;
  return isNotificationDivisionEnabled(preferences, divisionKey);
}

export function shouldShowNotificationPreview(
  notification: SignalNotification,
  preferences: NotificationSignalPreferences,
) {
  if (!preferences.push_enabled) return false;
  if (!passesDivisionGate(notification, preferences)) return false;
  if (!passesPriorityGate(notification, preferences)) return false;
  if (isMarketingNotification(notification)) return false;
  if (!hasUsefulPreview(notification)) return false;

  if (preferences.in_app_toast_enabled) return true;
  return isSecurityNotification(notification);
}

function isSoundWorthyNotification(notification: SignalNotification) {
  if (isHighPriorityNotification(notification)) return true;
  if (SOUND_DIVISIONS.has(normalizeText(notification.division))) return true;
  if (SOUND_CATEGORIES.has(normalizeText(notification.category))) return true;

  const searchText = getSearchableText(notification);
  return SOUND_KEYWORDS.some((keyword) => searchText.includes(keyword));
}

export function shouldPlayNotificationSound(
  notification: SignalNotification,
  preferences: NotificationSignalPreferences,
) {
  if (!preferences.push_enabled || !preferences.notification_sound_enabled) return false;
  if (!passesDivisionGate(notification, preferences)) return false;
  if (!passesPriorityGate(notification, preferences)) return false;
  if (isMarketingNotification(notification)) return false;
  if (isWithinQuietHours(preferences)) return false;

  return isSoundWorthyNotification(notification);
}

export function shouldTriggerNotificationVibration(
  notification: SignalNotification,
  preferences: NotificationSignalPreferences,
) {
  if (!preferences.push_enabled || !preferences.notification_vibration_enabled) return false;
  if (!passesDivisionGate(notification, preferences)) return false;
  if (!passesPriorityGate(notification, preferences)) return false;
  if (isMarketingNotification(notification)) return false;
  if (isWithinQuietHours(preferences)) return false;

  return isSoundWorthyNotification(notification);
}

export function getNotificationPriorityBadge(notification: SignalNotification) {
  if (isSecurityNotification(notification)) {
    return "SECURITY";
  }

  const priority = normalizeText(notification.priority);
  if (!HIGH_PRIORITY_VALUES.has(priority)) {
    return null;
  }

  return priority.toUpperCase();
}
