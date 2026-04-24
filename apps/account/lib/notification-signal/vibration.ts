/**
 * Tasteful haptic helper. Wraps `navigator.vibrate` with safety:
 *   - Always a no-op on platforms without the API (iOS Safari, desktop).
 *   - Patterns are short — a single 22ms pulse for normal, double-tap for high.
 *   - Never loops, never throws.
 */

const NORMAL_PATTERN: readonly number[] = [22];
const HIGH_PATTERN: readonly number[] = [20, 28, 20];

function navigatorWithVibrate(): (Navigator & { vibrate: (pattern: number | number[]) => boolean }) | null {
  if (typeof navigator === "undefined") return null;
  const candidate = navigator as Navigator & {
    vibrate?: (pattern: number | number[]) => boolean;
  };
  return typeof candidate.vibrate === "function"
    ? (candidate as Navigator & { vibrate: (pattern: number | number[]) => boolean })
    : null;
}

export function isVibrationSupported(): boolean {
  return navigatorWithVibrate() !== null;
}

export function triggerHaptic(variant: "default" | "high" = "default"): boolean {
  const nav = navigatorWithVibrate();
  if (!nav) return false;
  const pattern = variant === "high" ? [...HIGH_PATTERN] : [...NORMAL_PATTERN];
  try {
    return Boolean(nav.vibrate(pattern));
  } catch {
    return false;
  }
}
