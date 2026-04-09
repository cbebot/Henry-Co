// ---------------------------------------------------------------------------
// @henryco/i18n  --  Timezone & date/time formatting utilities
// Uses Intl.DateTimeFormat internally. Zero external dependencies.
// ---------------------------------------------------------------------------

export const DEFAULT_TIMEZONE = 'Africa/Lagos';

/**
 * Normalise the incoming date value into a Date object.
 */
function toDate(date: string | Date): Date {
  return typeof date === 'string' ? new Date(date) : date;
}

/**
 * Format a date+time for display using the given IANA timezone and BCP 47 locale.
 *
 * @param date     - ISO-8601 string or Date object.
 * @param timezone - IANA timezone, e.g. "Africa/Lagos". Defaults to DEFAULT_TIMEZONE.
 * @param locale   - BCP 47 locale tag, e.g. "en-NG". Defaults to "en-NG".
 * @returns        Localised date-time string, e.g. "9 Apr 2026, 14:30"
 */
export function formatDateTime(
  date: string | Date,
  timezone: string = DEFAULT_TIMEZONE,
  locale: string = 'en-NG',
): string {
  const d = toDate(date);
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(d);
}

/**
 * Format only the date portion.
 *
 * @returns e.g. "9 Apr 2026"
 */
export function formatDate(
  date: string | Date,
  timezone: string = DEFAULT_TIMEZONE,
  locale: string = 'en-NG',
): string {
  const d = toDate(date);
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  return formatter.format(d);
}

/**
 * Format only the time portion.
 *
 * @returns e.g. "14:30"
 */
export function formatTime(
  date: string | Date,
  timezone: string = DEFAULT_TIMEZONE,
  locale: string = 'en-NG',
): string {
  const d = toDate(date);
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(d);
}

/**
 * Compute the UTC offset string for a given IANA timezone at the current moment.
 *
 * @param timezone - IANA timezone identifier, e.g. "Africa/Lagos".
 * @returns        UTC offset string, e.g. "+01:00", "-05:00".
 */
export function getTimezoneOffset(timezone: string): string {
  const now = new Date();

  // Intl can tell us the offset by formatting with timeZoneName: 'longOffset'.
  // The result looks like "GMT+01:00" or "GMT-05:00" (or "GMT" for UTC).
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'longOffset',
  }).formatToParts(now);

  const tzPart = parts.find((p) => p.type === 'timeZoneName');
  const raw = tzPart?.value ?? 'GMT';

  // Strip the "GMT" prefix.  "GMT" alone means +00:00.
  const offset = raw.replace('GMT', '');
  return offset || '+00:00';
}
