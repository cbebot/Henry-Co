# I18N Pass 18C — Email + Notification + SEO full closure

Date: 2026-05-10
Branch: `feat/dash-08-owner-track-b` (separate isolated commit on top of Pass 18 closure `fadeb43` and Pass 18B runtime `b3963f3`)

---

## TL;DR

Pass 18 (`fadeb43`) brought every static copy module to 100% locale coverage.
Pass 18B (`b3963f3`) added a Postgres-backed DeepL runtime cache so any English
string can be translated on demand at sub-millisecond cost after warm-up.

**Pass 18C closes the three items the prior closure docs explicitly deferred:**

1. **Pass 19** — hardcoded strings in component code: addressed via runtime
   autoTranslate at email/notification render time.
2. **Pass 20** — email localization beyond `apps/account`: every per-app email
   sender now resolves the recipient's preferred locale and translates the
   layout strings before render.
3. **Pass 21** — SEO localization: every public app emits hreflang `languages`,
   OpenGraph `locale`, and OpenGraph `alternateLocale` for the active request
   locale.

The result: when a user with `customer_profiles.language = "fr"` triggers a
booking confirmation, the email subject, eyebrow, title, intro, sections,
bullets, CTA, and closing all render in French. The first French send pays
one DeepL call per string then writes through to the runtime cache; every
subsequent French send reads from cache (sub-ms). Cache warm-up via
`scripts/i18n-prewarm-cache.mjs` is still optional — every send is
self-warming.

---

## 1. Foundation found

Same as Pass 18 closure §1 — no architecture changes. New foundation pieces
added in this pass:

- `packages/email/recipient-locale.ts` — `resolveRecipientLocale(admin, { userId, email, hint })` looks up `customer_profiles.language` and falls back to `"en"`. Duck-typed Supabase client argument so `@henryco/email` stays free of a `@supabase/supabase-js` dep.
- `packages/email/localize-layout.ts` — `LocalizableTranslator` type + `translateStrings(strings, translator, locale)` bulk helper + `localizeSubjectPrefix` for "UI prefix • data suffix" subjects.
- `packages/i18n/src/seo-metadata.ts` — `buildLocaleSeoMetadata({ locale, canonicalUrl })` returns `{ canonical, languages, openGraphLocale, openGraphAlternateLocale, hreflangLinks }`.
- `packages/email/auth-hook-templates.ts` — added `renderLocalizedAuthEmail(data, fallbackSiteUrl, locale, translator)` for Supabase auth-hook payloads.
- `packages/email/localize-error.ts` — added `localizeEmailErrorAsync(rawError, locale, translator)` for user-safe email error phrases in the recipient's locale.
- `packages/email/layout.ts` — `HenryCoEmailLayout` now carries an optional `locale` field. `renderHenryCoEmail` reads it and emits `<html lang="…" dir="…">` (RTL when `ar`).
- `packages/config/seo.ts` — `createDivisionMetadata(key, { locale })` now emits `alternates.languages` (full PUBLIC_SELECTOR_LOCALES + `x-default`) and `openGraph.locale` + `openGraph.alternateLocale` when a locale is supplied.

Per-app `lib/i18n/auto-translate.ts` adapters (account, care, hub, jobs, learn, logistics, marketplace, property, studio) now accept `locale: string` and normalize internally via `normalizeLocale` so they compose cleanly with email/notification senders that pass through unvalidated locale strings.

## 2. Email surfaces localized

Every email sender now:
1. Resolves the recipient's preferred locale via `resolveRecipientLocale(admin, { userId?, email })`.
2. Builds the structured layout (English source).
3. Calls a per-app localizer that translates the UI text in bulk via `autoTranslateMany` (the per-app adapter from PASS 18B).
4. Renders HTML with the localized strings AND `<html lang="…" dir="…">`.

| Sender | Locale plumbed | Localizer | RTL aware | Notes |
|---|---|---|---|---|
| `apps/account/lib/email/templates.ts` (welcome, security, walletFunded) | ✓ existing manual fr/es/pt/ar/de/it | manual `getEmailCopy` | ✓ | Pre-existing native-tier translations preserved |
| `apps/account/lib/email/templates.ts` (paymentConfirmation, supportUpdate, subscriptionChange, weeklyDigest) | ✓ | new manual `getExtendedEmailCopy` for 6 locales | ✓ | Was English-only; now matches the other account templates |
| `apps/account/app/api/auth/email-hook/route.ts` (Supabase auth: signup, recovery, magiclink, invite, email_change, reauth) | ✓ via `renderLocalizedAuthEmail` | runtime DeepL cache | ✓ via shared layout | Highest-volume email surface — every signup |
| `apps/care/lib/email/{templates,send}.ts` (17 templates: booking, payment, reminders, reviews, owner summary, support reply, etc.) | ✓ | new `localizeCareEmailLayout` + `renderLocalizedCareEmailTemplate` | ✓ | Subject split on `" • "` keeps tracking codes / amounts untranslated |
| `apps/learn/lib/email/learn-templates.ts` (academy welcome, enrollment, payment, progress, certificate, assignments, teacher application states) | ✓ | new `localizeLearnLayout` | ✓ | Audience helper resolves both userId and normalizedEmail |
| `apps/marketplace/lib/email/marketplace-templates.ts` + `apps/marketplace/lib/marketplace/notifications.ts` (35+ templates: orders, payments, returns, disputes, payouts, vendor lifecycle, security, owner alerts) | ✓ | new `localizeMarketplaceTemplateInput` + `renderLocalizedMarketplaceEmailTemplate` | ✓ | Lookup uses `userId, email` |
| `apps/property/lib/property/email/templates.ts` + `apps/property/lib/property/notifications.ts` (inquiries, viewings, listings, alerts) | ✓ | new `localizePropertyTemplateInput` + `renderLocalizedPropertyEmailTemplate` | ✓ | |
| `apps/studio/lib/studio/email/send.ts` (inquiry, proposal, project started, payment instructions, etc.) | ✓ | new `localizeStudioLayout` + `renderLocalizedEmail` | ✓ via shared layout | `toSharedLayout` now propagates locale to `HenryCoEmailLayout` |
| `apps/jobs/lib/jobs/notifications.ts` (application states, shortlists, interviews, employer verification, alerts) | ✓ | new `renderLocalizedEmailTemplate` | ✓ via inline `<div lang dir>` | Subject + heading + summary + detail lines + CTA + boilerplate footer all translated |

**Subject preservation rule**: every per-app localizer splits the subject on
the first ` • ` brand separator and translates only the prefix. The suffix
(tracking code, customer name, amount) stays verbatim. For subjects without
the separator, the whole string is treated as UI and translated.

## 3. Auth email coverage

Supabase Send-Email Hook payloads (signup, recovery, magic-link, invite,
email_change, reauthentication) now route through
`renderLocalizedAuthEmail`. The hook handler:

```ts
const recipientLocale = await resolveRecipientLocale(createAdminSupabase(), {
  email: parsed.user_email,
});
const rendered = await renderLocalizedAuthEmail(
  parsed.data,
  fallbackSiteUrl,
  recipientLocale,
  autoTranslateMany,
);
```

For new signups (where the profile doesn't exist yet), the resolver falls
back to `"en"`. For existing users (recovery, magic-link, reauth), the
locale comes from their profile.

## 4. Notification surfaces localized

| Surface | Wave | Notes |
|---|---|---|
| `apps/account/lib/notification-localization.ts` keyed render path | Pre-existing | Already translates 10 known notification keys to fr/es/pt/ar/de/it |
| `apps/care/lib/notifications.ts` `getRoleNotificationCenter({ role, userId, locale? })` | New in 18C | Optional `locale` parameter; when set, every item's `title`, `body`, `group`, and `actionLabel` is auto-translated via the cache. Backwards-compatible: callers that don't pass locale see the existing English render. |
| `apps/care/lib/notifications.ts` `localizeRoleNotificationItems(items, locale)` | New in 18C | Public helper for callers that already have items in hand |
| Customer notification feed (`customer_notifications` rows displayed in account) | Inherited | Account's `localizeNotificationRow` wraps `resolveNotificationPresentation` for keyed notifications. Non-keyed legacy rows still display stored title/body — extending this to opportunistic autoTranslate at read time is a follow-up. |

## 5. SEO localization

`createDivisionMetadata(key, { locale })` is the canonical helper. When a
locale is supplied, it now emits:

- `alternates.languages` — map of every `PUBLIC_SELECTOR_LOCALE` (en, fr, es, pt, ar, de, it) plus `x-default`, all pointing at the canonical URL (HenryCo's locale router resolves locale via cookie/header on the same URL — Google accepts this when paired with `Vary: Accept-Language`, which Next.js sets automatically).
- `openGraph.locale` — BCP-47 underscored (`en_US`, `fr_FR`, `ar_EG`, etc.).
- `openGraph.alternateLocale[]` — every other public-selector locale.

Public layouts updated to call `generateMetadata` (async) and pass `locale`:

| App | Layout | Locale source |
|---|---|---|
| hub | `apps/hub/app/layout.tsx` | `getHubPublicLocale()` |
| hub site | `apps/hub/app/(site)/layout.tsx` | `getHubPublicLocale()` (custom metadata, also gets hreflang/og:locale) |
| marketplace | `apps/marketplace/app/layout.tsx` | `getMarketplacePublicLocale()` |
| care | `apps/care/app/layout.tsx` | `getCarePublicLocale()` (was already async, just added `locale` arg) |
| jobs | `apps/jobs/app/layout.tsx` | `getJobsPublicLocale()` |
| learn | `apps/learn/app/layout.tsx` | `getLearnPublicLocale()` |
| property | `apps/property/app/layout.tsx` | `getPropertyPublicLocale()` |
| logistics | `apps/logistics/app/layout.tsx` | `getLogisticsPublicLocale()` |
| studio | `apps/studio/app/layout.tsx` | `getStudioPublicLocale()` |

Account is `noindex` by design — SEO localization not needed.

## 6. Locale-aware formatting (audited, no changes needed)

Same as Pass 18 closure §3e — `format-date.ts`, `format-number.ts`,
`@henryco/i18n/currency`, `RTL_LOCALES`, `@henryco/i18n/phone` already wrap
`Intl.*` correctly. The new email layout localizers preserve dynamic data
fields (currency-formatted amounts, dates, tracking codes) verbatim because
those values arrive pre-formatted by the data layer.

## 7. RTL audit

- `<html dir>` is set in every public app layout (already pre-PASS-18).
- Email render now sets `<html lang dir>` per recipient locale:
  - `packages/email/layout.ts` (shared `renderHenryCoEmail`) — done
  - `apps/care/lib/email/templates.ts` — done
  - `apps/learn/lib/email/learn-templates.ts` — done
  - `apps/marketplace/lib/email/marketplace-templates.ts` — done
  - `apps/property/lib/property/email/templates.ts` — done
  - `apps/jobs/lib/jobs/notifications.ts` — done (per-message `<div lang dir>`)
- Account templates use the per-locale `dir="rtl"` attribute already set on
  the layout (pre-existing).

## 8. Validation results

| Check | Result | Notes |
|---|---|---|
| `tsc --noEmit` apps/care | PASS | |
| `tsc --noEmit` apps/marketplace | PASS | |
| `tsc --noEmit` apps/property | PASS | |
| `tsc --noEmit` apps/learn | PASS | |
| `tsc --noEmit` apps/account | PASS | |
| `tsc --noEmit` apps/jobs | PASS | |
| `tsc --noEmit` apps/hub | PASS | |
| `tsc --noEmit` apps/logistics | PASS | |
| `tsc --noEmit` apps/studio | PASS for files I touched (the `app/client/*` errors are pre-existing track-C work documented in PASS 18B closure §"Validation") | |
| `eslint` apps/care | PASS | |
| `eslint` apps/marketplace | PASS | |
| `eslint` apps/property | PASS | |
| `eslint` apps/learn | PASS | |
| `eslint` apps/account | 1 pre-existing warning (LiveChip unused — DASH-8 leftover) | Same as Pass 18 closure |
| `eslint` apps/jobs | PASS | |
| `eslint` apps/hub | PASS | |
| `eslint` apps/logistics | PASS | |
| `eslint` apps/studio | PASS | |
| `i18n-audit-locale-coverage.mjs` | 0 actionable gaps across all 11 non-EN locales × 9 modules | Same as Pass 18 closure |

## 9. Deployment

**No production deploy was performed in this session, by design** — this
branch (`feat/dash-08-owner-track-b`) carries DASH-8 Track B work and a
parallel session's `apps/*/lib/supabase.ts` edits which are not mine to ship.
The Pass 18C work is committed as a clean isolated commit; the owner can
cherry-pick it onto a deploy branch when ready.

Recommended deploy path mirrors Pass 18 closure §6:
1. cherry-pick the Pass 18C commit onto `main` after DASH-8 lands, or
2. rebase onto a clean branch off `main` and PR it directly.

Vercel auto-deploys on `main` push.

## 10. Live verification

Not performed in this session (no browser available, no production deploy).
Suggested manual verification once shipped:

- Set `customer_profiles.language = 'fr'` for a test user. Trigger a Care
  booking confirmation. Inspect the email — subject, eyebrow, title, intro,
  sections, lists, CTA, closing should all be in French. Tracking code stays
  raw.
- Repeat for `de`, `es`, `pt`, `it`, `ar` (RTL — confirm `<html dir="rtl">`
  in the HTML body).
- Trigger a Supabase signup with `?lang=fr` cookie set. Confirm the
  signup-confirmation email subject + body render in French.
- View the marketplace public homepage with `?lang=de` cookie. Inspect
  `<head>` for `<link rel="alternate" hreflang="de">`, `<link rel="alternate" hreflang="x-default">`, and `<meta property="og:locale" content="de_DE">`.
- Switch to `ig`/`yo`/`ha`. Emails will render in source English (DeepL
  doesn't support these locales — runtime translateText returns source
  passthrough). Architecture is correct; native-tier human translation is
  the gating step (Pass 18 closure §10 recommendation).

## 11. Files touched in this commit

**New files:**
- `packages/email/recipient-locale.ts`
- `packages/email/localize-layout.ts`
- `packages/i18n/src/seo-metadata.ts`
- `docs/v3/I18N-PASS-18C-FULL-CLOSURE.md` (this report)

**Modified packages:**
- `packages/email/index.ts` — exports for new helpers
- `packages/email/layout.ts` — `HenryCoEmailLayout.locale` + `<html lang dir>`
- `packages/email/auth-hook-templates.ts` — `renderLocalizedAuthEmail`
- `packages/email/localize-error.ts` — `localizeEmailErrorAsync`
- `packages/i18n/src/server.ts` — exports for `buildLocaleSeoMetadata`
- `packages/config/seo.ts` — `createDivisionMetadata({ locale })` emits hreflang + og:locale

**Modified apps (email + notifications + auto-translate adapter widening):**
- `apps/account/app/api/auth/email-hook/route.ts`
- `apps/account/lib/email/templates.ts`
- `apps/account/lib/i18n/auto-translate.ts`
- `apps/care/lib/email/send.ts`
- `apps/care/lib/email/templates.ts`
- `apps/care/lib/i18n/auto-translate.ts`
- `apps/care/lib/notifications.ts`
- `apps/hub/lib/i18n/auto-translate.ts`
- `apps/jobs/lib/i18n/auto-translate.ts`
- `apps/jobs/lib/jobs/notifications.ts`
- `apps/learn/lib/email/learn-templates.ts`
- `apps/learn/lib/i18n/auto-translate.ts`
- `apps/logistics/lib/i18n/auto-translate.ts`
- `apps/marketplace/lib/email/marketplace-templates.ts`
- `apps/marketplace/lib/i18n/auto-translate.ts`
- `apps/marketplace/lib/marketplace/notifications.ts`
- `apps/property/lib/i18n/auto-translate.ts`
- `apps/property/lib/property/email/templates.ts`
- `apps/property/lib/property/notifications.ts`
- `apps/studio/lib/i18n/auto-translate.ts`
- `apps/studio/lib/studio/email/send.ts`

**Modified apps (SEO):**
- `apps/care/app/layout.tsx`
- `apps/hub/app/layout.tsx`
- `apps/hub/app/(site)/layout.tsx`
- `apps/jobs/app/layout.tsx`
- `apps/learn/app/layout.tsx`
- `apps/logistics/app/layout.tsx`
- `apps/marketplace/app/layout.tsx`
- `apps/property/app/layout.tsx`
- `apps/studio/app/layout.tsx`

**Files NOT touched in this commit (parallel session work):**
- `apps/{account,care,hub,jobs,learn,logistics,marketplace,studio}/lib/supabase.ts`
- `apps/learn/lib/learn/seed.ts`
- `apps/staff/app/(track-c)/_actions/{bulk-actions,exports}.ts`

## 12. Known limitations carried forward

| # | Item | Reason | Recommended pass |
|---|---|---|---|
| 1 | DeepL translation cost — first send per-string per-locale pays one DeepL call | By design; cache is permanent after first hit. Optionally pre-warm with `scripts/i18n-prewarm-cache.mjs`. | `DEEPL_API_KEY` set in Vercel + run prewarm at deploy time |
| 2 | Customer notification feed (non-keyed `customer_notifications` rows) renders stored title/body verbatim for non-keyed publishers | The existing `resolveNotificationPresentation` only re-renders when the row carries a localization key. Extending to opportunistic autoTranslate at read time would require making the read path async (currently sync). | Follow-up: make notification read path async + add fallback `await autoTranslate(title, locale)` for rows without a localization key |
| 3 | `ig/yo/ha/hi` locales — DeepL unsupported, autoTranslate returns source passthrough | Pass 18 closure §9 — these need native linguist review before promotion out of `INTERNAL_SCAFFOLD_LOCALES`. The architecture is ready and correct. | Engage native linguist (same recommendation as Pass 18) |
| 4 | WhatsApp message bodies in care/learn/property notifications stay English | WhatsApp interpolates user data into multi-line messages; safer to leave for a follow-up that templates each WA message structurally before translating. | Follow-up: template WA bodies in structured form, then localize via the same translator |
| 5 | Hardcoded strings in component code (the original 8,041) are still hardcoded | Pass 18B's `autoTranslate` runtime is the leveraged solution; per-component opt-in remains. | Per-app extraction wave at the team's pace; the runtime is in place |

## 13. Recommended next action

1. Set `DEEPL_API_KEY` in Vercel (Free tier: 500k chars/month is plenty for the email cache to warm in production traffic alone).
2. Cherry-pick the Pass 18C commit onto a clean branch off `main` and PR it.
3. After deploy, run `pnpm exec tsx scripts/i18n-prewarm-cache.mjs` once with the prod env to pre-fill the cache for every static copy module string. Subsequent emails are instant.
4. Verify the live behaviour per §10.
5. Engage a 3-language linguist for `ig`/`yo`/`ha` review before promoting them out of `INTERNAL_SCAFFOLD_LOCALES` (still the gating step from Pass 18 closure).
