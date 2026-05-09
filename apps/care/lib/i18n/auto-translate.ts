import "server-only";

import {
  translateText,
  translateTextMany,
  createSupabaseTranslationCache,
  type AppLocale,
  type TranslationCacheClient,
} from "@henryco/i18n/server";
import { createAdminSupabase } from "@/lib/supabase";

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
