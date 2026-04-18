/**
 * Server-side DeepL translation utility.
 *
 * - Never import this module in client components — it accesses DEEPL_API_KEY.
 * - Requires `"server-only"` to be installed in consumers; call sites should
 *   import from `@henryco/i18n/server` which enforces the boundary.
 * - Gated on DEEPL_API_KEY env var: if absent, all functions return the source
 *   text unchanged so callers can gracefully fall back to English.
 *
 * DeepL language codes used by the HenryCo ecosystem:
 *   en → EN-US  fr → FR  es → ES  pt → PT-BR  ar → AR  de → DE  it → IT  zh → ZH  hi — not supported by DeepL Free/Pro v2
 */

import type { AppLocale } from "./locales";

const DEEPL_API_URL = "https://api-free.deepl.com/v2/translate";

/** Maps AppLocale to the DeepL target-language code. */
const DEEPL_LOCALE_MAP: Partial<Record<AppLocale, string>> = {
  en: "EN-US",
  fr: "FR",
  es: "ES",
  pt: "PT-BR",
  ar: "AR",
  de: "DE",
  it: "IT",
  zh: "ZH",
  // ig, yo, ha, hi: not supported by DeepL — callers should skip or use EN fallback
};

export type DeepLTranslateResult = {
  translatedText: string;
  /** `true` if the API was actually called; `false` if env key is absent or locale unsupported. */
  translated: boolean;
};

/**
 * Translate a single text string into the target locale using DeepL.
 * Returns the source text unchanged when:
 *   - `DEEPL_API_KEY` is not set
 *   - The target locale is not in DEEPL_LOCALE_MAP
 *   - The API call fails (logs warning, does not throw)
 */
export async function deepLTranslate(
  text: string,
  targetLocale: AppLocale,
  sourceLocale: AppLocale = "en",
): Promise<DeepLTranslateResult> {
  const apiKey = process.env.DEEPL_API_KEY?.trim();
  if (!apiKey) {
    return { translatedText: text, translated: false };
  }

  const targetLang = DEEPL_LOCALE_MAP[targetLocale];
  if (!targetLang) {
    return { translatedText: text, translated: false };
  }

  const sourceLang = DEEPL_LOCALE_MAP[sourceLocale];

  try {
    const response = await fetch(DEEPL_API_URL, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: [text],
        target_lang: targetLang,
        ...(sourceLang ? { source_lang: sourceLang.split("-")[0] } : {}),
        tag_handling: "html",
        preserve_formatting: true,
      }),
    });

    if (!response.ok) {
      console.warn(`[i18n/deepl] API error ${response.status} for locale "${targetLocale}"`);
      return { translatedText: text, translated: false };
    }

    const json = (await response.json()) as {
      translations?: Array<{ text: string }>;
    };

    const translated = json.translations?.[0]?.text;
    if (!translated) {
      return { translatedText: text, translated: false };
    }

    return { translatedText: translated, translated: true };
  } catch (err) {
    console.warn("[i18n/deepl] fetch error:", err);
    return { translatedText: text, translated: false };
  }
}

/**
 * Translate multiple text strings in a single DeepL request.
 * Returns source texts unchanged for any failures.
 */
export async function deepLTranslateMany(
  texts: string[],
  targetLocale: AppLocale,
  sourceLocale: AppLocale = "en",
): Promise<DeepLTranslateResult[]> {
  if (texts.length === 0) return [];

  const apiKey = process.env.DEEPL_API_KEY?.trim();
  if (!apiKey) {
    return texts.map((t) => ({ translatedText: t, translated: false }));
  }

  const targetLang = DEEPL_LOCALE_MAP[targetLocale];
  if (!targetLang) {
    return texts.map((t) => ({ translatedText: t, translated: false }));
  }

  const sourceLang = DEEPL_LOCALE_MAP[sourceLocale];

  try {
    const response = await fetch(DEEPL_API_URL, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: texts,
        target_lang: targetLang,
        ...(sourceLang ? { source_lang: sourceLang.split("-")[0] } : {}),
        tag_handling: "html",
        preserve_formatting: true,
      }),
    });

    if (!response.ok) {
      console.warn(`[i18n/deepl] API error ${response.status} for locale "${targetLocale}"`);
      return texts.map((t) => ({ translatedText: t, translated: false }));
    }

    const json = (await response.json()) as {
      translations?: Array<{ text: string }>;
    };

    if (!json.translations || json.translations.length !== texts.length) {
      return texts.map((t) => ({ translatedText: t, translated: false }));
    }

    return json.translations.map((item, i) => ({
      translatedText: item.text || texts[i],
      translated: Boolean(item.text),
    }));
  } catch (err) {
    console.warn("[i18n/deepl] fetch error:", err);
    return texts.map((t) => ({ translatedText: t, translated: false }));
  }
}

/** Returns true if the locale is supported by DeepL. */
export function isDeepLSupported(locale: AppLocale): boolean {
  return Boolean(DEEPL_LOCALE_MAP[locale]);
}
