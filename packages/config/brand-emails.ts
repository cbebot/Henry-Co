/**
 * BRAND_EMAILS — single, typed source of truth for every email address shown
 * to a HenryCo customer on any surface (public pages, dashboards, footers,
 * email templates, transactional notifications, PDFs, legal docs, error
 * pages). PASS 23 introduced this file; visible email literals living
 * outside it are a regression and the validation grep enforces the rule.
 *
 * Division split is by local-part on `henryonyx.com` (no per-division
 * subdomain). The companion document is `/docs/brand/email-map.md`.
 *
 * `COMPANY.divisions[*].supportEmail` in `company.ts` reads from this map,
 * so existing call sites that go through `getDivisionConfig(key).supportEmail`
 * continue to work without churn.
 */

export const BRAND_EMAIL_DOMAIN = "henryonyx.com";

const at = (local: string) => `${local}@${BRAND_EMAIL_DOMAIN}` as const;

export const BRAND_EMAILS = {
  // Group / cross-cutting
  hello: at("hello"),
  support: at("support"),
  accounts: at("accounts"),
  finance: at("finance"),
  billing: at("billing"),
  privacy: at("privacy"),
  legal: at("legal"),
  dpo: at("dpo"),
  security: at("security"),
  abuse: at("abuse"),
  automation: at("automation"),
  noreply: at("noreply"),
  newsletter: at("editorial"),

  // Per-division support inboxes (mirrored into COMPANY.divisions)
  care: at("care"),
  building: at("building"),
  hotel: at("hotel"),
  marketplace: at("marketplace"),
  property: at("property"),
  logistics: at("logistics"),
  studio: at("studio"),
  jobs: at("jobs"),
  learn: at("learn"),
  gaming: at("gaming"),
} as const;

export type BrandEmailKey = keyof typeof BRAND_EMAILS;

/**
 * Hint values for `<input placeholder="...">` fields. They are *not* real
 * inboxes — they suggest the format an owner/staff/learner should type.
 * Centralizing them keeps the validation grep clean and lets future renames
 * happen in one place.
 */
export const BRAND_EMAIL_PLACEHOLDERS = {
  user: at("you"),
  staff: at("staff"),
  lead: at("lead"),
  learner: at("learner"),
} as const;

export type BrandEmailPlaceholderKey = keyof typeof BRAND_EMAIL_PLACEHOLDERS;
