import "server-only";

import {
  translateText,
  translateTextMany,
  createSupabaseTranslationCache,
  normalizeLocale,
  type TranslationCacheClient,
} from "@henryco/i18n/server";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * PASS 18C — adapters accept `string` locale (matches email/notification
 * sender call sites that pass through unvalidated locale strings) and
 * normalize internally to AppLocale before calling the runtime translator.
 * Returns source text unchanged on any unsupported locale.
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

export function autoTranslate(text: string, locale: string): Promise<string> {
  return translateText(text, normalizeLocale(locale), { cache: getCache() });
}

export function autoTranslateMany(
  texts: string[],
  locale: string,
): Promise<string[]> {
  return translateTextMany(texts, normalizeLocale(locale), { cache: getCache() });
}
