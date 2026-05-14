/**
 * Local mirror of `packages/config/brand-emails.ts` for the React Native /
 * Expo bundle. Metro is not yet configured to resolve the monorepo workspace
 * `@henryco/config` package, so this file re-states the same canonical
 * addresses one level down. The source of truth remains
 * `packages/config/brand-emails.ts`; if that file changes, mirror the change
 * here and ship the mobile build.
 *
 * The file is deliberately listed as the company-hub allow-listed surface in
 * the PASS 23 grep rule — every other email literal in the mobile app must
 * read from `BRAND_EMAILS` here rather than carry a separate string.
 */
export const BRAND_EMAIL_DOMAIN = "henrycogroup.com";

const at = (local: string) => `${local}@${BRAND_EMAIL_DOMAIN}` as const;

export const BRAND_EMAILS = {
  hello: at("hello"),
  support: at("support"),
  accounts: at("accounts"),
  finance: at("finance"),
  privacy: at("privacy"),
  security: at("security"),
  abuse: at("abuse"),
  noreply: at("noreply"),
  care: at("care"),
  building: at("building"),
  hotel: at("hotel"),
  marketplace: at("marketplace"),
  property: at("property"),
  logistics: at("logistics"),
  studio: at("studio"),
  jobs: at("jobs"),
  learn: at("learn"),
} as const;

export type BrandEmailKey = keyof typeof BRAND_EMAILS;
