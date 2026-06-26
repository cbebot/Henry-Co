import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * Copy for the Learn course VideoPlayer.
 *
 * The component receives most of its user-visible copy through already-localized
 * `labels` / `title` props (i18n integration handled by the caller). The one
 * literal it renders on its own is the playback-rate option label (e.g. "1×"),
 * formatted here so locales can control spacing/ordering of the multiplier mark.
 */
export type LearnPlayerCopy = {
  player: {
    /** Playback-rate <option> label, e.g. "1.5×". `rate` is the numeric speed. */
    rateLabel: (rate: number) => string;
  };
};

const EN: LearnPlayerCopy = {
  player: {
    rateLabel: (rate: number) => `${rate}×`,
  },
};

const FR: DeepPartial<LearnPlayerCopy> = {
  player: {
    rateLabel: (rate: number) => `${rate} ×`,
  },
};

const ES: DeepPartial<LearnPlayerCopy> = {
  player: {
    rateLabel: (rate: number) => `${rate}×`,
  },
};

const PT: DeepPartial<LearnPlayerCopy> = {
  player: {
    rateLabel: (rate: number) => `${rate}×`,
  },
};

const AR: DeepPartial<LearnPlayerCopy> = {
  player: {
    rateLabel: (rate: number) => `${rate}×`,
  },
};

const DE: DeepPartial<LearnPlayerCopy> = {
  player: {
    rateLabel: (rate: number) => `${rate}×`,
  },
};

const IT: DeepPartial<LearnPlayerCopy> = {
  player: {
    rateLabel: (rate: number) => `${rate}×`,
  },
};

const ZH: DeepPartial<LearnPlayerCopy> = {
  player: {
    rateLabel: (rate: number) => `${rate}×`,
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<LearnPlayerCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
};
// ig, yo, ha, hi are intentionally OMITTED -> fall back to EN (human-translation only).

export function getLearnPlayerCopy(locale: AppLocale): LearnPlayerCopy {
  const o = LOCALE_MAP[locale];
  if (o) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      o as unknown as Record<string, unknown>,
    ) as unknown as LearnPlayerCopy;
  }
  return EN;
}
