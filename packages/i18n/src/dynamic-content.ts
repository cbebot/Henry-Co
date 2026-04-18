import type { AppLocale } from "./locales";
import { deepLTranslate, isDeepLSupported } from "./deepl";

export type LocaleTextMap = Partial<Record<AppLocale, string>>;

type LocaleOverrideMap = Record<string, unknown>;

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseLocaleTextMap(value: unknown): LocaleTextMap | null {
  if (!value) return null;

  const raw =
    typeof value === "string"
      ? (() => {
          try {
            return JSON.parse(value) as unknown;
          } catch {
            return null;
          }
        })()
      : value;

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const map = raw as Record<string, unknown>;
  const localizedEntries = Object.entries(map).filter(([, entry]) => typeof entry === "string" && entry.trim());
  if (localizedEntries.length === 0) return null;

  return Object.fromEntries(localizedEntries.map(([locale, entry]) => [locale, String(entry).trim()])) as LocaleTextMap;
}

function readLocaleOverride(
  overrides: LocaleOverrideMap | null,
  field: string,
  locale: AppLocale,
): string | null {
  if (!overrides) return null;

  const byField = parseLocaleTextMap(overrides[field]);
  if (byField?.[locale]) return byField[locale] ?? null;

  const byLocale = overrides[locale];
  if (byLocale && typeof byLocale === "object" && !Array.isArray(byLocale)) {
    const localizedField = asText((byLocale as Record<string, unknown>)[field]);
    if (localizedField) return localizedField;
  }

  return null;
}

export async function resolveLocalizedDynamicField(input: {
  field: string;
  locale: AppLocale;
  record: Record<string, unknown> | null | undefined;
  fallback: string;
  sourceLocale?: AppLocale;
  machineTranslate?: boolean;
}): Promise<string> {
  const {
    field,
    locale,
    record,
    fallback,
    sourceLocale = "en",
    machineTranslate = false,
  } = input;

  if (!record) return fallback;

  const i18nValue = parseLocaleTextMap(record[`${field}_i18n`])?.[locale];
  if (i18nValue) return i18nValue;

  const localeOverride = readLocaleOverride(
    record.locale_overrides && typeof record.locale_overrides === "object" && !Array.isArray(record.locale_overrides)
      ? (record.locale_overrides as LocaleOverrideMap)
      : null,
    field,
    locale,
  );
  if (localeOverride) return localeOverride;

  const sourceValue = asText(record[field]);
  if (!sourceValue) return fallback;

  if (locale === sourceLocale) {
    return sourceValue;
  }

  if (machineTranslate && isDeepLSupported(locale)) {
    const result = await deepLTranslate(sourceValue, locale, sourceLocale);
    if (result.translatedText.trim() && result.translated) {
      return result.translatedText.trim();
    }
  }

  return fallback || sourceValue;
}
