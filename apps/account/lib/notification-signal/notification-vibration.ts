const NOTIFICATION_VIBRATION_PATTERN = [35];

export function isNotificationVibrationSupported() {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function triggerNotificationVibration() {
  if (!isNotificationVibrationSupported() || prefersReducedMotion()) {
    return false;
  }

  try {
    return navigator.vibrate(NOTIFICATION_VIBRATION_PATTERN);
  } catch {
    return false;
  }
}
