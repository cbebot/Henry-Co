/**
 * PASS 18C — Email layout localizer primitives.
 *
 * Email templates have structured layouts with discrete UI strings (subject,
 * eyebrow, title, intro, section labels, list items, CTA labels, closing
 * lines) interleaved with dynamic data (URLs, tracking codes, customer
 * names, currency-formatted amounts) that MUST NOT be re-translated.
 *
 * This module provides:
 *   - `LocalizableTranslator` — the function shape each app's `autoTranslate`
 *     adapter satisfies (`(strings, locale) => Promise<string[]>`). Decoupled
 *     from any specific i18n package so this file stays dep-free.
 *   - `translateStrings(strings, translator, locale)` — bulk translator that
 *     short-circuits when locale === "en" (zero work), preserves order, and
 *     gracefully falls back to source on any error. Cache hits make this
 *     near-free per dispatch after warm-up.
 *
 * Per-app email modules use this together with a hand-rolled per-template
 * localizer that knows which fields are UI vs data — generic tree walking is
 * not safe because labels (translatable) and values (data) sit side-by-side
 * in the same `{ label, value }` records.
 */

export type LocalizableTranslator = (
  strings: string[],
  locale: string,
) => Promise<string[]>;

/**
 * Translate a list of English source strings into the target locale via the
 * provided translator. Returns the source strings unchanged when locale is
 * "en" or when the translator throws. Length of output always matches input.
 *
 * Empty / whitespace-only strings are returned untouched without a round-trip.
 */
export async function translateStrings(
  strings: ReadonlyArray<string | null | undefined>,
  translator: LocalizableTranslator,
  locale: string,
): Promise<string[]> {
  const safe = strings.map((s) => (typeof s === "string" ? s : ""));
  if (!locale || locale === "en") return [...safe];

  const indices: number[] = [];
  const inputs: string[] = [];
  for (let i = 0; i < safe.length; i += 1) {
    const trimmed = safe[i].trim();
    if (trimmed) {
      indices.push(i);
      inputs.push(safe[i]);
    }
  }

  if (!inputs.length) return [...safe];

  let translated: string[];
  try {
    translated = await translator(inputs, locale);
  } catch {
    return [...safe];
  }

  if (!Array.isArray(translated) || translated.length !== inputs.length) {
    return [...safe];
  }

  const out = [...safe];
  for (let k = 0; k < indices.length; k += 1) {
    const idx = indices[k];
    const value = translated[k];
    if (typeof value === "string" && value.trim()) {
      out[idx] = value;
    }
  }
  return out;
}

/**
 * Helper for the common pattern of "subject contains UI prefix + data
 * separator + raw data". Translates only the UI portion.
 *
 * Example: `localizeSubjectPrefix("Booking confirmed • ABC-123", " • ", t, "fr")`
 * returns "Réservation confirmée • ABC-123".
 *
 * If the separator is not present, the whole subject is treated as UI and
 * translated.
 */
export async function localizeSubjectPrefix(
  subject: string,
  separator: string,
  translator: LocalizableTranslator,
  locale: string,
): Promise<string> {
  if (!locale || locale === "en") return subject;
  if (!subject) return subject;

  const idx = subject.indexOf(separator);
  if (idx < 0) {
    const [translated] = await translateStrings([subject], translator, locale);
    return translated;
  }

  const prefix = subject.slice(0, idx);
  const rest = subject.slice(idx);
  const [translatedPrefix] = await translateStrings([prefix], translator, locale);
  return translatedPrefix + rest;
}
