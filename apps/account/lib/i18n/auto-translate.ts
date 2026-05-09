import "server-only";

import {
  translateText,
  translateTextMany,
  createSupabaseTranslationCache,
  type AppLocale,
  type TranslationCacheClient,
} from "@henryco/i18n/server";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * App-level auto-translation entry point.
 *
 * Returns the source text untouched if locale === source, no DEEPL_API_KEY,
 * or the locale is unsupported by DeepL (ig/yo/ha/hi). On a cache hit we
 * pay zero — Postgres lookup only. On a miss the helper calls DeepL and
 * caches the result.
 *
 * IMPORTANT: server-only. Wrap your strings in a server component, then pass
 * the resolved value as a prop to client components.
 */

let cacheRef: TranslationCacheClient | null | undefined;

function getCache(): TranslationCacheClient | null {
  if (cacheRef !== undefined) return cacheRef;
  try {
    cacheRef = createSupabaseTranslationCache(createAdminSupabase() as never);
  } catch {
    cacheRef = null;
  }
  return cacheRef;
}

export function autoTranslate(text: string, locale: AppLocale): Promise<string> {
  return translateText(text, locale, { cache: getCache() });
}

export function autoTranslateMany(
  texts: string[],
  locale: AppLocale,
): Promise<string[]> {
  return translateTextMany(texts, locale, { cache: getCache() });
}
