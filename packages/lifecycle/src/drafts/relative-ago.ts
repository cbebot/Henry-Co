/**
 * Format a wall-clock ms timestamp as a relative-ago string using
 * caller-supplied i18n templates. Pure function — no Intl, no Date
 * formatting (those would force a locale bundle into the package).
 *
 * Buckets:
 *   - < 60 min → "{n} min ago" (minimum 1 min — we never render
 *                "0 min ago" because it reads as broken)
 *   - 1 hr – 23 hr → "{n} hr ago"
 *   - 24 hr+ → "{n} day ago"
 *
 * The host typically pulls the templates from `getAuthSessionCopy
 * (locale).continueWhereYouLeftOff` so the runtime DeepL pass can
 * translate them once and reuse across all draft surfaces.
 */

export type RelativeAgoCopy = {
  /** Template containing `{n}`. Example: "{n} min ago". */
  agoMinutes: string;
  agoHours: string;
  agoDays: string;
};

export function formatRelativeAgo(
  savedAt: number,
  copy: RelativeAgoCopy,
  now: number = Date.now(),
): string {
  const diff = Math.max(0, now - savedAt);
  const minutes = Math.floor(diff / (60 * 1000));
  if (minutes < 60) {
    return fill(copy.agoMinutes, Math.max(1, minutes));
  }
  const hours = Math.floor(diff / (60 * 60 * 1000));
  if (hours < 24) {
    return fill(copy.agoHours, hours);
  }
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  return fill(copy.agoDays, days);
}

function fill(template: string, n: number): string {
  return template.replace("{n}", String(n));
}
