/**
 * Pass 18 — runtime auto-translation helper.
 *
 * `translateText(text, locale, { cache })` performs:
 *   1. Identity passthrough if `text` is empty or `locale === sourceLocale`.
 *   2. Cache lookup via the provided TranslationCacheClient (Postgres-backed,
 *      keyed by (source_text, source_locale, target_locale)).
 *   3. On cache miss: DeepL request + cache write. The cached value is
 *      returned on subsequent calls so we pay DeepL exactly once per string.
 *   4. On DeepL failure / unsupported locale (ig, yo, ha, hi): the source
 *      text is returned as a graceful fallback.
 *
 * IMPORTANT: this module imports `./deepl` which reads DEEPL_API_KEY. Do NOT
 * import it in client components — it must be reached via
 * `@henryco/i18n/server` so the bundler keeps it server-only.
 *
 * The cache client is dependency-injected (not constructed inside the i18n
 * package) so this package does not need a direct dependency on
 * `@supabase/supabase-js`. Each consuming app passes its own
 * `createAdminSupabase()` instance via `createSupabaseTranslationCache`.
 */

import type { AppLocale } from "./locales";
import { deepLTranslate, deepLTranslateMany, isDeepLSupported } from "./deepl";

// ---------------------------------------------------------------------------
// Cache client interface
// ---------------------------------------------------------------------------

export type TranslationKind = "deepl" | "manual" | "fallback";

export type TranslationCacheClient = {
  /** Returns the cached translated_text, or null if not cached. */
  get(
    sourceText: string,
    sourceLocale: AppLocale,
    targetLocale: AppLocale,
  ): Promise<string | null>;

  /** Bulk variant — returns one entry per input (null if cache miss). */
  getMany(
    sourceTexts: string[],
    sourceLocale: AppLocale,
    targetLocale: AppLocale,
  ): Promise<Array<string | null>>;

  /** Upsert a translation into the cache. */
  put(
    sourceText: string,
    sourceLocale: AppLocale,
    targetLocale: AppLocale,
    translatedText: string,
    kind: TranslationKind,
  ): Promise<void>;

  /** Bulk upsert; rows are independent and individual failures should not
   *  throw — implementations may best-effort retry per-row. */
  putMany(
    rows: Array<{
      sourceText: string;
      sourceLocale: AppLocale;
      targetLocale: AppLocale;
      translatedText: string;
      kind: TranslationKind;
    }>,
  ): Promise<void>;
};

// ---------------------------------------------------------------------------
// Supabase adapter (duck-typed — accepts any client with `.from(...).select()`,
// `.upsert()`, etc., so the i18n package doesn't depend on @supabase/supabase-js)
// ---------------------------------------------------------------------------

type DuckSupabase = {
  from(table: string): {
    select(cols: string): {
      eq(col: string, val: string): {
        eq(col: string, val: string): {
          eq(col: string, val: string): {
            maybeSingle(): Promise<{ data: { translated_text: string } | null; error: unknown }>;
          };
        };
      };
      in(col: string, vals: string[]): {
        eq(col: string, val: string): {
          eq(col: string, val: string): Promise<{
            data: Array<{ source_text: string; translated_text: string }> | null;
            error: unknown;
          }>;
        };
      };
    };
    upsert(
      rows: Array<Record<string, unknown>>,
      opts: { onConflict: string },
    ): Promise<{ error: unknown }>;
  };
};

const TABLE = "i18n_translation_cache";

/**
 * Wrap a service-role Supabase client into a TranslationCacheClient.
 * The client must have read+write access to public.i18n_translation_cache —
 * use `createAdminSupabase()` (service-role key), NOT the anon client.
 */
export function createSupabaseTranslationCache(supabaseAdmin: DuckSupabase): TranslationCacheClient {
  return {
    async get(sourceText, sourceLocale, targetLocale) {
      const { data, error } = await supabaseAdmin
        .from(TABLE)
        .select("translated_text")
        .eq("source_text", sourceText)
        .eq("source_locale", sourceLocale)
        .eq("target_locale", targetLocale)
        .maybeSingle();
      if (error || !data) return null;
      return data.translated_text;
    },
    async getMany(sourceTexts, sourceLocale, targetLocale) {
      if (!sourceTexts.length) return [];
      const { data, error } = await supabaseAdmin
        .from(TABLE)
        .select("source_text, translated_text")
        .in("source_text", sourceTexts)
        .eq("source_locale", sourceLocale)
        .eq("target_locale", targetLocale);
      if (error || !data) return sourceTexts.map(() => null);
      const map = new Map<string, string>();
      for (const row of data) map.set(row.source_text, row.translated_text);
      return sourceTexts.map((t) => map.get(t) ?? null);
    },
    async put(sourceText, sourceLocale, targetLocale, translatedText, kind) {
      await supabaseAdmin.from(TABLE).upsert(
        [
          {
            source_text: sourceText,
            source_locale: sourceLocale,
            target_locale: targetLocale,
            translated_text: translatedText,
            source: kind,
          },
        ],
        { onConflict: "source_text,source_locale,target_locale" },
      );
    },
    async putMany(rows) {
      if (!rows.length) return;
      await supabaseAdmin.from(TABLE).upsert(
        rows.map((r) => ({
          source_text: r.sourceText,
          source_locale: r.sourceLocale,
          target_locale: r.targetLocale,
          translated_text: r.translatedText,
          source: r.kind,
        })),
        { onConflict: "source_text,source_locale,target_locale" },
      );
    },
  };
}

// ---------------------------------------------------------------------------
// Public translation helpers
// ---------------------------------------------------------------------------

export type TranslateOptions = {
  sourceLocale?: AppLocale;
  cache?: TranslationCacheClient | null;
};

/**
 * Translate one English (or other source-locale) string into the target
 * locale. Cached after first DeepL hit. Falls back to source text on any
 * failure path; never throws.
 */
export async function translateText(
  text: string,
  targetLocale: AppLocale,
  opts: TranslateOptions = {},
): Promise<string> {
  const sourceLocale = opts.sourceLocale ?? "en";
  const cache = opts.cache ?? null;

  if (!text || !text.trim()) return text;
  if (targetLocale === sourceLocale) return text;

  // Step 1: cache lookup
  if (cache) {
    try {
      const cached = await cache.get(text, sourceLocale, targetLocale);
      if (cached) return cached;
    } catch {
      // best-effort: cache failures must not break the request path
    }
  }

  // Step 2: DeepL (skips internally if locale unsupported or DEEPL_API_KEY absent)
  if (!isDeepLSupported(targetLocale)) {
    return text; // ig/yo/ha/hi → source passthrough
  }

  const result = await deepLTranslate(text, targetLocale, sourceLocale);
  if (!result.translated) return text;

  // Step 3: cache write (best-effort, never blocks the response)
  if (cache) {
    try {
      await cache.put(text, sourceLocale, targetLocale, result.translatedText, "deepl");
    } catch {
      // ignore — caching is opportunistic
    }
  }

  return result.translatedText;
}

/**
 * Bulk translate many strings into the same target locale.
 * Issues a single batched DeepL call for the cache misses.
 */
export async function translateTextMany(
  texts: string[],
  targetLocale: AppLocale,
  opts: TranslateOptions = {},
): Promise<string[]> {
  const sourceLocale = opts.sourceLocale ?? "en";
  const cache = opts.cache ?? null;

  if (!texts.length) return [];
  if (targetLocale === sourceLocale) return [...texts];

  // Cache lookup (in bulk)
  let cached: Array<string | null> = texts.map(() => null);
  if (cache) {
    try {
      cached = await cache.getMany(texts, sourceLocale, targetLocale);
    } catch {
      // ignore
    }
  }

  if (!isDeepLSupported(targetLocale)) {
    return texts.map((t, i) => cached[i] ?? t);
  }

  // Identify the misses
  const missIndices: number[] = [];
  const missTexts: string[] = [];
  for (let i = 0; i < texts.length; i += 1) {
    if (cached[i] == null && texts[i] && texts[i].trim()) {
      missIndices.push(i);
      missTexts.push(texts[i]);
    }
  }

  if (!missTexts.length) {
    return texts.map((t, i) => cached[i] ?? t);
  }

  const results = await deepLTranslateMany(missTexts, targetLocale, sourceLocale);
  const out = texts.map((t, i) => cached[i] ?? t);
  const newRows: Parameters<TranslationCacheClient["putMany"]>[0] = [];

  for (let k = 0; k < missIndices.length; k += 1) {
    const idx = missIndices[k];
    const r = results[k];
    if (r.translated && r.translatedText) {
      out[idx] = r.translatedText;
      newRows.push({
        sourceText: missTexts[k],
        sourceLocale,
        targetLocale,
        translatedText: r.translatedText,
        kind: "deepl",
      });
    }
  }

  if (cache && newRows.length) {
    try {
      await cache.putMany(newRows);
    } catch {
      // ignore
    }
  }

  return out;
}
