import { getAbsoluteDivisionUrl, type DivisionKey } from "@henryco/config";

export type HreflangOptions = {
  key: DivisionKey;
  path?: string;
  locales?: string[];
  xDefault?: string;
};

export type HreflangAlternates = {
  canonical: string;
  languages: Record<string, string>;
};

export function buildHreflangAlternates(opts: HreflangOptions): HreflangAlternates {
  const path = opts.path ?? "/";
  const canonical = getAbsoluteDivisionUrl(opts.key, path);
  const locales = opts.locales ?? [];
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = canonical;
  }
  if (locales.length && opts.xDefault) {
    languages["x-default"] = canonical;
  }
  return { canonical, languages };
}
