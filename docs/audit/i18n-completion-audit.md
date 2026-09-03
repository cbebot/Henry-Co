# HenryCo i18n FINAL COMPLETION — Phase 0 Audit

Generated: 2026-05-15
Conductor: Claude Code Opus 4.7 (1M context · max effort)
Branch at audit time: `fix/supabase-storage-auth-rls-initplan` (off main)

This document is the canonical input for the multi-agent completion pass. Every
sub-agent spawned in Waves A–C reads this document first. The audit is
intentionally exhaustive and prescriptive — the value of the conductor's solo
Phase 0 is producing a single, trusted state-of-the-world so the parallel waves
do not duplicate or contradict each other.

---

## TL;DR — what this audit found

The HenryCo ecosystem has a **mature, production-grade custom i18n foundation**
that already passed three major passes (18, 18B, 18C). Static UI copy is at
100% coverage on its 9 modules, runtime DeepL translation with a
Supabase-backed cache handles dynamic content, email and SEO are fully
localized, and RTL is wired end-to-end. The "completion" pass therefore is
**not** a from-zero localization project — it is closing the long-tail of:

1. **`surface-extra-labels.ts` gaps** — 1233 missing key entries across 7 locales
   (de, it, zh, hi, ig, yo, ha). The fr/es/pt/ar locales are complete.
2. **Hardcoded strings still in component code** — upper-bound ~10009 findings
   across 11 web apps + `packages/ui`. The true actionable count is materially
   smaller (the audit script has high false-positive rate from JSDoc and TS type
   fragments, and from aliased `t = translateSurfaceLabel` calls it cannot
   detect). Conservative estimate of true gaps: **2000–4000 strings**.
3. **Two web apps never audited** — `apps/hub` and `apps/staff` were not in the
   default targets of `i18n-audit-visible-strings.mjs`. Now scanned: 1390
   findings across 130 files.
4. **Two Expo apps fully out of scope** — `apps/super-app` and
   `apps/company-hub` have no per-app `auto-translate.ts` adapter and have
   never been swept. These are React Native / Expo, not Next.js.
5. **ICU plurals never used** — `Intl.PluralRules` and `Intl.ListFormat` have
   zero references across the repo. Any "1 item / N items" or "A, B, and C"
   strings are ad-hoc concatenation.
6. **NO i18n CI gate** — `ci.yml` runs lint/typecheck/test/build only. No
   script blocks new JSX literals, missing keys, unused keys, or
   regressed coverage. Without this gate, English will leak back in within
   a release cycle.

The pass is not "translate everything from scratch." It is **(a)** fill
extra-label gaps, **(b)** wrap remaining hardcoded strings, **(c)** add the CI
gate, **(d)** cover hub+staff parity with the eight already-adapted apps, and
**(e)** explicitly decide on the Expo app scope.

---

## 1. Stack identification

### 1.1 Library

**Custom in-house — `@henryco/i18n`** (workspace package at `packages/i18n`).
Not next-intl, next-i18next, lingui, paraglide, or react-intl.

Top-level package files:
- `packages/i18n/index.ts` — barrel
- `packages/i18n/src/index.ts` — barrel for core
- `packages/i18n/src/server.ts` — server-only entry (re-exports DeepL + runtime translator)
- `packages/i18n/src/react.tsx` — client provider + hooks
- `packages/i18n/currency.ts`, `countries.ts`, `timezone.ts`, `phone.ts` — top-level value modules

### 1.2 Locale file layout

Translations are kept as **TypeScript copy modules**, not JSON. Each module
exports a getter `get<Module>Copy(locale)` that internally deep-merges the EN
baseline with per-locale partials — so missing keys gracefully fall through to
English.

| Module | Source file | EN leaves | Lines |
|---|---|---:|---:|
| surface | `packages/i18n/src/surface-copy.ts` | 148 | 2307 |
| account | `packages/i18n/src/account-copy.ts` | 215 | 2750 |
| account (promoted) | `packages/i18n/src/account-copy-promoted.ts` | — | 782 |
| hubHome | `packages/i18n/src/hub-home-copy.ts` | 126 | 1741 |
| marketplace | `packages/i18n/src/marketplace-copy.ts` | 45 | 833 |
| jobs | `packages/i18n/src/jobs-copy.ts` | 50 | 898 |
| care | `packages/i18n/src/care-copy.ts` | 52 | 924 |
| auth | `packages/i18n/src/auth-copy.ts` | 29 | 551 |
| consent | `packages/i18n/src/consent-copy.ts` | 28 | 466 |
| state | `packages/i18n/src/state-copy.ts` | 18 | 408 |
| surface-extra-labels | `packages/i18n/src/surface-extra-labels.ts` | 916 (universe) | 8903 |
| surface-extra-labels-pass-18 | `packages/i18n/src/surface-extra-labels-pass-18.ts` | — | 1327 |
| dynamic-content | `packages/i18n/src/dynamic-content.ts` | — | 102 |
| translate-runtime | `packages/i18n/src/translate-runtime.ts` | — | 289 |
| deepl | `packages/i18n/src/deepl.ts` | — | 163 |

Total i18n source: ~23,173 lines.

### 1.3 Locale switcher + middleware + routing strategy

- **Cookie**: `henryco_locale` (`LOCALE_COOKIE` constant).
- **Resolution order** (`resolve-locale.ts:resolveLocaleOrder`):
  1. `henryco_locale` cookie
  2. Authenticated saved profile language (`customer_profiles.language`)
  3. `Accept-Language` header
  4. CDN country header → mapped via `localeFromCountry` (FR_COUNTRIES,
     AR_COUNTRIES, ES_COUNTRIES, PT_COUNTRIES, IT_COUNTRIES, DE_COUNTRIES,
     ZH_COUNTRIES, IN→hi)
  5. Default `en`
- **Routing strategy**: NOT sub-path (no `/es/…`). NOT domain-based. Locale is
  attached via cookie/profile/header on the **same URL**. `Vary: Accept-Language`
  is set automatically by Next.js. `<html lang="…" dir="…">` is emitted by each
  app's root layout based on the resolved locale.
- **Switcher**: `packages/ui/src/public-shell/locale-suggestion.tsx`,
  `packages/ui/src/public/ecosystem-preferences.tsx`,
  `apps/hub/app/(site)/preferences/PreferencesClient.tsx`. The selector
  exposes `getUserSelectableLocales(...)` which is
  `PUBLIC_SELECTOR_LOCALES` (7 locales: en, fr, es, pt, ar, de, it) plus any
  preserved scaffold locale the user already has.

### 1.4 Translation key naming convention

Two coexisting patterns:

**Pattern A — Hierarchical typed key** (used by every `get<Module>Copy` getter):
```ts
const copy = getSurfaceCopy(locale);
copy.publicAccount.signInTitle;
copy.accountForms.emailPlaceholder;
```
The key path is the dotted access path on the typed `SurfaceCopy` shape.
Hierarchy is by surface area (`publicAccount`, `accountForms`, `footer`,
`floatingSupport`, etc.).

**Pattern B — English-as-key, runtime-translated** (`translateSurfaceLabel`):
```ts
const t = translateSurfaceLabel; // or alias inside component
t("Billing & Payments");       // looks up extra-label dict first → DeepL cache fallback
```
The English source string IS the key. Adopted in Pass 18B for the long-tail of
single-use labels that would bloat the typed copy modules. Backed by:
- `surface-extra-labels.ts` (`EXTRA_SURFACE_LABELS_<LOCALE>` maps, key = EN string)
- `surface-extra-labels-pass-18.ts` (`PASS_18_EXTRA_<LOCALE>`)
- `translate-runtime.ts` → DeepL with Supabase cache as a final fallback

This dual approach is intentional and works well. Wave A1 sub-agents
**must preserve both patterns** — do not collapse Pattern B into Pattern A
unless the label has stable hierarchy.

### 1.5 ICU MessageFormat / plurals / interpolation

- **No `Intl.PluralRules`** anywhere (`grep` returned zero matches).
- **No `Intl.ListFormat`** anywhere.
- **Interpolation**: `formatSurfaceTemplate` and `formatAccountTemplate` are
  defined and handle simple `{token}` replacement, but they do not encode
  plural arms or gender.
- **Implication**: any plural-sensitive copy is currently shipped as either a
  fixed phrase (e.g. "items" — accepted slight grammar awkwardness for
  singular) or ad-hoc concatenation in the call site. Wave A2 must add ICU
  plural form support for new copy, and Wave B is responsible for picking the
  correct plural form per locale.

---

## 2. Supported locale registry

Defined in `packages/i18n/src/locales.ts`. Source-of-truth = **English (`en`)**.

| Locale | Tier | Public selector | Native script | RTL | DeepL supported |
|---|---|:---:|---|:---:|:---:|
| en | production-ready | ✓ | Latin | — | ✓ (EN-US) |
| fr | production-ready | ✓ | Latin | — | ✓ (FR) |
| es | native-ui-ready | ✓ | Latin | — | ✓ (ES) |
| pt | native-ui-ready | ✓ | Latin | — | ✓ (PT-BR) |
| ar | native-ui-ready | ✓ | Arabic | **✓** | ✓ (AR) |
| de | native-ui-ready | ✓ | Latin | — | ✓ (DE) |
| it | native-ui-ready | ✓ | Latin | — | ✓ (IT) |
| zh | scaffold | — | Han | — | ✓ (ZH) |
| hi | scaffold | — | Devanagari | — | ✗ (no DeepL) |
| ig | scaffold | — | Latin | — | ✗ (no DeepL) |
| yo | scaffold | — | Latin | — | ✗ (no DeepL) |
| ha | scaffold | — | Latin | — | ✗ (no DeepL) |

Notes:
- `PRIMARY_LOCALES = ["en", "fr"]` — broad UI coverage.
- `PUBLIC_SELECTOR_LOCALES = ["en", "fr", "es", "pt", "ar", "de", "it"]` — the
  user-facing dropdown.
- `INTERNAL_SCAFFOLD_LOCALES = ["zh", "hi", "ig", "yo", "ha"]` — persistable
  preference but not yet in the public selector.
- **Wave B scope**: This audit recommends focusing Wave B's translation
  agents on **the seven `PUBLIC_SELECTOR_LOCALES`** as production targets. The
  five scaffold locales should be brought to feature-parity with the others on
  static copy (already at 100%) and on extra-labels (gap exists), but their
  promotion into the public selector is a separate product decision the
  owner has not yet made (see `LOCALE_TIERS` for the staged-promotion ladder).

Intl locale tag mapping (`format-date.ts`, `format-number.ts`):
- en→en-NG (Nigerian English), fr→fr-FR, es→es-ES, ar→ar-EG, pt→pt-BR,
  de→de-DE, it→it-IT, zh→zh-CN, hi→hi-IN.
- ig/yo/ha all map to en-NG (Nigerian English number/date format) — Wave A2
  should review whether to keep this or wire ig-NG / yo-NG / ha-NG once
  ICU CLDR coverage is verified.

---

## 3. Hardcoded-string inventory

### 3.1 Existing audit infrastructure

Six audit scripts already exist (and have NOT been wired into CI):

| Script | Purpose | Output |
|---|---|---|
| `scripts/i18n-audit-locale-coverage.mjs` | Diff every `*-copy.ts` module against EN baseline | JSON + optional Markdown |
| `scripts/i18n-audit-visible-strings.mjs` | JSX text + attribute + object-literal sweep | JSON |
| `scripts/i18n-extra-labels-audit.mjs` | `surface-extra-labels.ts` gaps (have/missing/echo-EN per locale) | stdout |
| `scripts/i18n-extract-gaps.mjs` | Structured gap manifests (writes `docs/v3/i18n-gaps/`) | JSON files |
| `scripts/i18n-hardcoded-summary.mjs` | Wrapper that summarizes visible-strings by app | Markdown |
| `scripts/i18n-intentional-echos.mjs` | Allow-list of leaves that are intentionally identical to EN | exported constant |
| `scripts/i18n-prewarm-cache.mjs` | Pre-warm DeepL cache for known strings | DB writes |

Wave A2 must **wire these into a single `pnpm i18n:check` script** that fails
with a non-zero exit code when any of:
- a `*-copy.ts` module has actionable echo or missing key not in
  `INTENTIONAL_ECHOS`,
- `surface-extra-labels.ts` has any missing key in any locale,
- `i18n-audit-visible-strings.mjs` adds a new file with >0 findings (delta
  against a checked-in baseline).

### 3.2 Static copy modules — coverage report

Source: `pnpm exec tsx scripts/i18n-audit-locale-coverage.mjs`
(full output: `.codex-temp/i18n-completion/locale-coverage.md`).

**Total actionable gaps across all 9 modules × 11 non-EN locales: 0.**

Every leaf is either translated, missing-but-merge-falls-through (resolved
elsewhere), or in `INTENTIONAL_ECHOS` (brand names, division names, universal
acronyms, English-borrowed cognates). The `INTENTIONAL_ECHOS` allow-list is
documented in-script.

### 3.3 Surface extra-labels — coverage report

Source: `node scripts/i18n-extra-labels-audit.mjs`
(full output: `.codex-temp/i18n-completion/extra-labels.txt`).

Universe size: **916 keys**.

| Locale | Have | Missing | Echo-EN |
|---|---:|---:|---:|
| fr | 916 | 0 | 23 |
| es | 916 | 0 | 14 |
| pt | 916 | 0 | 19 |
| ar | 916 | 0 | 11 |
| **de** | **767** | **149** | 25 |
| **it** | **767** | **149** | 13 |
| **zh** | **729** | **187** | 19 |
| **hi** | **729** | **187** | 10 |
| **ig** | **729** | **187** | 16 |
| **yo** | **729** | **187** | 16 |
| **ha** | **729** | **187** | 19 |

**Total missing entries: 1233** (149+149+187+187+187+187+187).

Sample missing keys per locale (see `.codex-temp/i18n-completion/extra-labels.txt`):
- DE/IT missing wallet/withdrawal copy ("Account name", "Account number",
  "Amount (NGN)", "Amount exceeds your available balance after pending
  withdrawals.", "1. Create the request so HenryCo generates…", etc.)
- ZH/HI/IG/YO/HA additionally missing notification preferences copy
  ("Compact preview cards for new notifications…", "Enable sound", "High
  priority only", "Manage notification preferences", "Notification sound",
  "Play a subtle chime…", "Preview popups").

The gap shape is clear: two product passes added copy to fr/es/pt/ar but
deferred de/it/zh/hi/ig/yo/ha. Wave A1 does NOT need to extract these — they
are already structured as keys; Wave B locale agents translate them in place.

### 3.4 Hardcoded strings in component code — sweep

Sources:
- `node scripts/i18n-audit-visible-strings.mjs` (default targets) →
  `.codex-temp/i18n-completion/visible-strings.json` +
  `.codex-temp/i18n-completion/visible-strings-summary.md`
- `node scripts/i18n-audit-visible-strings.mjs apps/hub apps/staff` →
  `.codex-temp/i18n-completion/visible-strings-extra.json`

**Upper-bound totals (raw, before false-positive filtering):**

| App / package | Files with findings | Findings (upper bound) |
|---|---:|---:|
| apps/care | 123 | 1695 |
| apps/studio | 143 | 1688 |
| apps/account | 209 | 1311 |
| apps/marketplace | 92 | 1147 |
| apps/hub *(newly audited)* | 78 | ~1110 |
| apps/jobs | 75 | 783 |
| apps/property | 41 | 615 |
| apps/learn | 50 | 536 |
| apps/logistics | 45 | 533 |
| apps/staff *(newly audited)* | 52 | ~280 |
| packages/ui | 45 | 311 |
| **TOTAL** | **~953** | **~10,009** |

NOT included in either sweep (out of audit scope for this pass unless explicitly chosen):
- `apps/super-app` (Expo / React Native) — separate runtime, separate i18n approach needed.
- `apps/company-hub` (Expo / React Native) — same.
- `apps/apps/` (one nested `hub` directory; legacy, do not include).
- All non-UI packages (`@henryco/auth`, `@henryco/data`, `@henryco/payment-surface`, etc.) — most of these are infra and have minimal user-visible strings.
- `packages/email`, `packages/notifications`, `packages/notifications-ui` — already handled by Pass 18C via the runtime translator at send time.

#### 3.4.1 False-positive analysis

The script regex `JSX_TEXT_PATTERN = />([^<>{]*[A-Za-z][^<>{]*)</g` matches
**any** text between `>` and `<` characters, which produces many false
positives:

- **TypeScript types and code fragments** spilled into multi-line definitions,
  e.g. `"void; restoreFocus?: boolean; initialFocus?: RefObject"` (from
  `packages/ui/src/a11y/use-focus-trap.ts`).
- **JSDoc comments** with `>`/`<` characters, e.g. `": at favicon sizes,
  anti-aliasing on * webfont text varies wildly across renderers…"`.
- **Inline code fragments**, e.g. `"item.brandSlug === slug); return ("`,
  `"i.status !== \"resolved\")"`.
- **Single-character labels** that pass `[A-Za-z]+` but are not user-visible.

Empirical sampling of 4 files per app from `visible-strings-summary.md`
suggests ≈40–60% of findings are real, ≈40–60% are noise. Conservative real
estimate: **3000–5000 strings**. Wave A1 must filter aggressively as it
extracts, NOT bulk-wrap.

#### 3.4.2 Hot files (per app, top 5)

These files individually account for an outsized share of findings and should
be Wave A1's first targets:

```
apps/care:
   113  apps/care/lib/email/templates.ts                          ← uses runtime translator; many are EN sources fed to autoTranslate — VERIFY before changing
    63  apps/care/app/(staff)/owner/staff/page.tsx
    56  apps/care/lib/care-tracking.ts
    52  apps/care/app/(staff)/manager/operations/page.tsx
    49  apps/care/lib/staff-shell.ts

apps/studio:
   150  apps/studio/lib/studio/request-config.ts                  ← config-as-code, label strings live here
    52  apps/studio/app/project/[projectId]/page.tsx
    50  apps/studio/lib/studio/email/send.ts                      ← uses runtime translator
    46  apps/studio/components/studio/owner/request-config-editor.tsx
    42  apps/studio/app/(public)/page.tsx

apps/account:
    60  apps/account/lib/notification-localization.ts             ← misleadingly named; verify it's the dispatch table for translateSurfaceLabel
    57  apps/account/components/settings/notification-preferences/NotificationPreferencesForm.tsx
    29  apps/account/lib/jobs-module.ts
    28  apps/account/components/saved-items/SavedItemsClient.tsx
    27  apps/account/lib/lifecycle/collector.ts

apps/marketplace:
    89  apps/marketplace/components/marketplace/checkout-experience.tsx
    81  apps/marketplace/components/marketplace/staff-resource-page.tsx
    70  apps/marketplace/lib/marketplace/navigation.ts
    41  apps/marketplace/lib/marketplace/data.ts
    40  apps/marketplace/components/marketplace/search-experience.tsx

apps/hub:
    66  apps/hub/app/components/OwnerDashboardClient.tsx
    63  apps/hub/components/owner/InternalTeamCommsClient.tsx
    59  apps/hub/app/lib/workspace/data.ts
    55  apps/hub/lib/owner-navigation.ts
    54  apps/hub/app/components/workspace/WorkspaceScreen.tsx

apps/jobs:
    75  apps/jobs/app/jobs/[slug]/page.tsx
    56  apps/jobs/lib/jobs/data.ts
    40  apps/jobs/app/employer/jobs/new/page.tsx
    33  apps/jobs/scripts/verify-jobs-live.ts                     ← script, not runtime UI; SKIP
    32  apps/jobs/components/hiring/InterviewScheduler.tsx

apps/property:
    72  apps/property/components/property/submit/PropertySubmissionForm.tsx
    52  apps/property/app/(public)/property/[slug]/page.tsx
    49  apps/property/app/admin/listings/page.tsx
    47  apps/property/app/(public)/page.tsx
    43  apps/property/lib/property/submission.ts

apps/learn:
   108  apps/learn/lib/learn/seed.ts                              ← seed data; possibly intentionally English
    43  apps/learn/lib/learn/navigation.ts
    39  apps/learn/lib/email/learn-templates.ts
    30  apps/learn/app/learner/courses/[courseId]/page.tsx
    27  apps/learn/app/owner/courses/page.tsx

apps/logistics:
    56  apps/logistics/components/booking/BookRequestForm.tsx
    35  apps/logistics/lib/logistics/operator-navigation.ts
    33  apps/logistics/app/business/page.tsx
    32  apps/logistics/app/track/page.tsx
    29  apps/logistics/app/support/page.tsx

apps/staff:
    36  apps/staff/app/(workspace)/operations/newsletter/NewsletterDraftEditor.tsx
    15  apps/staff/lib/navigation.ts
    15  apps/staff/app/(workspace)/operations/newsletter/[id]/page.tsx
    12  apps/staff/components/kyc/KycReviewQueueClient.tsx
    11  apps/staff/app/(track-c)\modules/[slug]/page.tsx

packages/ui:
   122  packages/ui/src/support/SupportDock.tsx                   ← FloatingSupport/SupportDock — large single file
    16  packages/ui/src/public-shell/public-header.tsx
    15  packages/ui/src/search/CrossDivisionSearchExperience.tsx
    13  packages/ui/src/public/public-account-chip.tsx
    13  packages/ui/src/public-shell/henryco-hero-card.tsx
```

#### 3.4.3 Wave A1 extraction rules

To avoid the failure mode where extraction adds noise to the source-of-truth
copy modules, Wave A1 agents must apply this decision tree per finding:

1. Is the finding inside a comment, JSDoc, or TypeScript type definition? → **SKIP**.
2. Is the finding inside an aliased `t(...)` / `translateSurfaceLabel(...)` /
   `autoTranslate(...)` call? → **SKIP** (already i18n'd).
3. Is the finding inside a `*-copy.ts` module? → **SKIP** (source itself).
4. Is the finding inside a `scripts/`, `seed.ts`, `*-data.ts` mock fixture, or
   `verify-*.ts` test script? → **SKIP** (not user-visible at runtime).
5. Is the finding a proper noun, brand name, file path, URL, or single-letter
   label? → **SKIP**.
6. Is the finding a numeric-only or punctuation-only string? → **SKIP**.
7. Otherwise: **WRAP**. Choose the wrap shape:
   - If the surrounding component already imports a typed copy module
     (`copy.x.y` access), add the new leaf to that module's EN source AND
     replace the literal with the typed lookup.
   - Otherwise, wrap with `translateSurfaceLabel(label)` (server-side path) or
     `useHenryCoSurfaceCopy().labels[label]` (client-side path) — both reach
     the same extra-labels dictionary.

The goal of Wave A1 is **extraction**, not translation — every new EN label
goes into the EN source only; Wave B then translates per-locale.

---

## 4. Format-handling audit

| Concern | Status | Source / evidence |
|---|---|---|
| Date formatting | ✅ Intl-based | `packages/i18n/src/format-date.ts` — `formatDate`, `formatDateLong`, `formatTime`, `formatDateTime`, `formatRelativeTime` all use `Intl.DateTimeFormat` / `Intl.RelativeTimeFormat` |
| Number / percent / compact | ✅ Intl-based | `packages/i18n/src/format-number.ts` — `formatNumber`, `formatPercent`, `formatCompact` all use `Intl.NumberFormat` |
| Currency formatting | ✅ Centralised | `packages/i18n/currency.ts` exports `formatMoney`, `formatMoneyRange`; `@henryco/pricing` is the canonical money formatter (per memory `project_henryco_pricing.md`) |
| Country / timezone / phone | ✅ Centralised | `packages/i18n/countries.ts`, `timezone.ts`, `phone.ts` — all Intl-aware |
| `Intl.PluralRules` | ❌ Never used | `grep -r "Intl\.PluralRules"` → zero matches |
| `Intl.ListFormat` | ❌ Never used | `grep -r "Intl\.ListFormat"` → zero matches |
| Gender-aware copy | ❌ Not modelled | No gender forms in any `*-copy.ts`; `formatSurfaceTemplate` only handles `{token}` interpolation |
| RTL — `dir` attribute | ✅ Emitted | All 9 app `layout.tsx` files (account, care, hub, jobs, learn, logistics, marketplace, property, staff, studio) reference RTL helpers; Pass 18C confirmed `<html lang="…" dir="…">` rendering |
| RTL — logical CSS properties | ⚠️ Partial / unverified | `grep apps/**/*.tsx` for `margin-left|margin-right|padding-left|padding-right` returned 0 in `.tsx`. However, **Tailwind utility classes** (`ml-*`, `pr-*`, etc.) and **`globals.css`** were not greppable in the same pass. Wave A2 must check Tailwind classes — `ml-2`, `mr-4`, `pl-3`, `pr-2`, `left-*`, `right-*` are extremely common in physical form and must be flipped to logical (`ms-2`, `me-4`, `ps-3`, `pe-2`, `start-*`, `end-*`) for clean RTL |
| Hreflang / OpenGraph locale | ✅ Done in Pass 21 | `packages/i18n/src/seo-metadata.ts` + `packages/config/seo.ts:createDivisionMetadata(key, { locale })` — emits `alternates.languages` (full PUBLIC_SELECTOR_LOCALES + `x-default`), `openGraph.locale`, `openGraph.alternateLocale` |
| Email RTL | ✅ Done in Pass 18C | `packages/email/layout.ts:HenryCoEmailLayout` carries `locale`; `renderHenryCoEmail` emits `<html lang dir>` |

Wave A2 work items derived from this:
1. Adopt `Intl.PluralRules` for any new plural-sensitive copy and refactor the
   small number of existing ad-hoc plurals (the audit found none in copy
   modules but Wave A1 may surface some during extraction).
2. Adopt `Intl.ListFormat` anywhere "A, B, and C" sequences are assembled.
3. Add a lint rule banning Tailwind physical-direction utilities in app code
   when an RTL locale is reachable — e.g. via the
   `eslint-plugin-rtl-friendly-css` heuristic, or a custom rule that flags
   `ml-/mr-/pl-/pr-/left-/right-` in `className` literals.
4. Confirm `dir="rtl"` flips at runtime by Playwright visiting each app's
   public landing in `ar` and asserting `document.dir === "rtl"` AND a
   layout-overflow check.

---

## 5. Runtime translation infrastructure

### 5.1 DeepL + Supabase cache (Pass 18B)

`packages/i18n/src/translate-runtime.ts` provides:

```ts
translateText(text: string, locale: AppLocale, opts?: { cache?: TranslationCacheClient }): Promise<string>
translateTextMany(texts: string[], locale: AppLocale, opts?: { cache?: TranslationCacheClient }): Promise<string[]>
createSupabaseTranslationCache(client): TranslationCacheClient
```

Per-call behaviour:
1. Identity passthrough if `text` empty or `locale === sourceLocale`.
2. Cache lookup against Postgres (keyed by `(source_text, source_locale, target_locale)`).
3. On miss → DeepL request → cache write.
4. On DeepL unsupported locale (hi/ig/yo/ha) → source returned as fallback.

Per-app adapter `<app>/lib/i18n/auto-translate.ts` exists for:
account, care, hub, jobs, learn, logistics, marketplace, property, studio.

**Missing**: `apps/staff`, `apps/super-app`, `apps/company-hub` have no
adapter. Wave C2 adds one to `apps/staff` (consistent with the other web apps);
Expo apps are an explicit defer.

### 5.2 SurfaceCopy hybrid translator

`translateSurfaceLabel(label, locale)` (exported from `@henryco/i18n/server`):
1. Looks up label in `EXTRA_SURFACE_LABELS_<LOC>` and
   `PASS_18_EXTRA_<LOC>`.
2. Falls back to `translateText(...)` (DeepL + cache).
3. Returns the EN source if all fail.

This is the canonical wrap target for new Wave A1 extractions.

### 5.3 Translation cache prewarm

`scripts/i18n-prewarm-cache.mjs` exists for batch-warming the Postgres cache
for known strings. Not wired into deploy; optional.

---

## 6. Email / notification / SEO state

These passes were closed in Pass 18C. The conductor must NOT re-do them. They
appear here as confirmation of done-state and as a reference for what "good"
looks like for the rest of the pass.

| Surface | State | Source |
|---|---|---|
| Account emails (welcome, security, walletFunded) | ✅ manual translations for fr/es/pt/ar/de/it | `apps/account/lib/email/templates.ts` |
| Account emails (extended: paymentConfirmation, supportUpdate, subscriptionChange, weeklyDigest) | ✅ manual translations for 6 locales (PASS 18C addition) | same |
| Supabase auth-hook emails | ✅ runtime DeepL via `renderLocalizedAuthEmail` | `apps/account/app/api/auth/email-hook/route.ts` + `packages/email/auth-hook-templates.ts` |
| Care emails (17 templates) | ✅ runtime via `localizeCareEmailLayout` | `apps/care/lib/email/{templates,send}.ts` |
| Learn emails | ✅ runtime via `localizeLearnLayout` | `apps/learn/lib/email/learn-templates.ts` |
| Marketplace emails (35+ templates) | ✅ runtime via `localizeMarketplaceTemplateInput` | `apps/marketplace/lib/email/marketplace-templates.ts` |
| Property emails | ✅ runtime via `localizePropertyTemplateInput` | `apps/property/lib/property/email/templates.ts` |
| Studio emails | ✅ runtime via `localizeStudioLayout` | `apps/studio/lib/studio/email/send.ts` |
| Jobs notifications + emails | ✅ runtime via `renderLocalizedEmailTemplate` | `apps/jobs/lib/jobs/notifications.ts` |
| Care role notifications | ✅ runtime via `localizeRoleNotificationItems` | `apps/care/lib/notifications.ts` |
| Customer notification feed (legacy non-keyed rows) | ⚠️ deferred — opportunistic autoTranslate at read time is open | `apps/account/lib/notification-localization.ts` |
| Email RTL (`<html lang dir>`) | ✅ | `packages/email/layout.ts:HenryCoEmailLayout` |
| Subject preservation rule (`" • "` split) | ✅ | `packages/email/localize-layout.ts:localizeSubjectPrefix` |
| Hreflang + OpenGraph locale | ✅ | `packages/config/seo.ts:createDivisionMetadata({ locale })` |

Wave C1 / C2 do NOT re-localize email/notification surfaces. The single open
item the conductor should ticket but **defer** is: legacy non-keyed customer
notification rows in `customer_notifications` showing stored EN body — these
need opportunistic auto-translate at read time. Calling this out in the
closure doc is sufficient; it is a separate small project.

---

## 7. CI gate audit

### 7.1 What CI currently runs

`.github/workflows/ci.yml`:
- `pnpm run lint:all`
- `pnpm run typecheck:all`
- `pnpm run test:workspace`
- `pnpm run build:all`

Triggers: push/PR to `main` or `master`.

### 7.2 What CI does NOT enforce

- **No JSX literal ban**. Each app's `eslint.config.mjs` is the same minimal
  shape:
  ```js
  import nextVitals from "eslint-config-next/core-web-vitals";
  import nextTs from "eslint-config-next/typescript";
  export default defineConfig([...nextVitals, ...nextTs, globalIgnores([...])]);
  ```
  No custom rules. No `no-restricted-syntax` for JSX text. No
  `eslint-plugin-i18next` / `eslint-plugin-formatjs` / equivalent.

- **No coverage check**. `i18n-audit-locale-coverage.mjs` is never run in CI.
  A PR can ship a copy module with English fall-through and CI is silent.

- **No extra-labels check**. `i18n-extra-labels-audit.mjs` is never run in CI.
  A PR adding a new label to `EXTRA_SURFACE_LABELS_EN` (via Pattern B) but
  forgetting to update the other 11 locales merges silently.

- **No unused-key check**. A label removed from the call site stays in the
  dictionary forever.

- **No baseline-regression check**. The visible-strings audit total can grow
  without anyone noticing.

### 7.3 Required gate — Wave A2 plan

`scripts/i18n-check.mjs` (new — Wave A2 builds it) wraps the existing scripts
and exits non-zero when any of the following is true:

1. `i18n-audit-locale-coverage.mjs` reports a non-intentional echo or missing
   leaf in any module × locale.
2. `i18n-extra-labels-audit.mjs` reports >0 missing keys for any locale.
3. `i18n-audit-visible-strings.mjs` reports a delta against a checked-in
   baseline (`.codex-temp/i18n-completion/visible-strings.baseline.json` →
   promoted to `docs/closure/i18n-visible-strings.baseline.json`). The check
   is **decrease-or-equal-only** — a PR that increases the count by even one
   in any audited app fails.

`package.json` add:
```json
"scripts": {
  "i18n:check": "node scripts/i18n-check.mjs",
  "i18n:check:locale": "node scripts/i18n-audit-locale-coverage.mjs",
  "i18n:check:extra-labels": "node scripts/i18n-extra-labels-audit.mjs",
  "i18n:check:visible-strings": "node scripts/i18n-audit-visible-strings.mjs"
}
```

`.github/workflows/ci.yml` add the step right after typecheck:
```yaml
- name: i18n coverage gate
  run: pnpm run i18n:check
```

Plus a custom ESLint rule (Wave A2 builds it in `packages/eslint-i18n-rules/`)
that flags:
- `<JSXText>` literals containing letters and longer than 1 char.
- String literal props on `placeholder`, `title`, `aria-label`,
  `aria-description`, `alt`, `label`, `description`, `helperText`.
- Allow-listed call-sites: any literal inside `t(...)`,
  `translateSurfaceLabel(...)`, `autoTranslate(...)`,
  `useHenryCoSurfaceCopy()`, or `getXxxCopy(locale).…` access.

The rule starts in **warning** mode for the first PR after merge so the team
can absorb the noise, then graduates to **error** in the closure PR.

---

## 8. Wave plan — final shape adjusted to actual repo state

Where the original prompt was generic, this audit refines counts and scope.

### Wave A — Foundation pair (2 agents, parallel)

**A1 — Hardcoded-string extraction agent**
- Branch: `rebuild/i18n-extract`
- Worktree: yes
- Scope: applies the §3.4.3 decision tree across all 10 audited targets
  (apps/care, studio, account, marketplace, hub, jobs, property, learn,
  logistics, staff, packages/ui). Each extracted EN label is added to either
  the relevant `*-copy.ts` module (Pattern A) or `surface-extra-labels.ts`'s
  EN side (Pattern B). **Does NOT translate to other locales.**
- Deliverable: PR that reduces the visible-strings count by ≥60% of true
  actionable findings, plus an updated baseline JSON.
- Acceptance: `pnpm i18n:check:visible-strings` produces a count strictly
  less than the pre-PR baseline; `pnpm typecheck:all` passes; `pnpm build:all`
  passes; the EN source of every new label reads as a complete user-facing
  sentence (no fragments).

**A2 — Tooling + CI gate + format-handling fixes agent**
- Branch: `rebuild/i18n-tooling`
- Worktree: yes
- Scope:
  - Build `scripts/i18n-check.mjs` per §7.3.
  - Add `pnpm i18n:check` to root `package.json`.
  - Wire it into `.github/workflows/ci.yml`.
  - Check in the baseline JSON.
  - Build the custom ESLint rule `packages/eslint-i18n-rules/`, add to each
    app's `eslint.config.mjs`, ship in warning mode.
  - RTL audit: grep all `*.tsx` / `*.css` / Tailwind class strings for
    physical direction utilities and convert critical ones to logical. The
    scope is "any class on a component that renders in a route reachable in
    `ar` locale" — that is effectively the whole public+account+hub surface.
  - Format fixes: any ad-hoc plural concatenation that Wave A1 surfaces gets
    converted to `Intl.PluralRules`. Any "A, B, and C" gets converted to
    `Intl.ListFormat`.
- Deliverable: PR that adds the CI step, eslint rule, baseline file, and any
  format-conversion patches.
- Acceptance: `pnpm i18n:check` passes locally and in CI; the eslint rule
  flags a deliberate test fixture; RTL test in Playwright confirms `dir="rtl"`
  on `ar` for at least the hub landing.

**Gate between A and B**: Both A PRs merged. `pnpm i18n:check` passes for
source locale at HEAD; the baseline is in place; the CI step is mandatory.

### Wave B — Per-locale completion (6 agents in parallel, one sub-wave)

The audit indicates the right granularity is one agent per **non-EN
public-selector locale**, plus one combined agent for the five scaffold locales
(they share the same gap shape — 187 missing extra-labels each — and the
DeepL-unsupported four (ig, yo, ha, hi) need human-quality translation rather
than DeepL pass-through):

| Agent | Locale(s) | Scope |
|---|---|---|
| B1 | `fr` | Sweep new Wave-A1 extra-labels; ICU plural correctness for `fr` (Romance plural form); review for missing accents / typographic apostrophes (« ») where appropriate |
| B2 | `es` | New extra-labels; verify pluralization; verify `formatNumber` choices for `es-ES` vs `es-MX` audience (currently `es-ES` — confirm) |
| B3 | `pt` | New extra-labels; current `pt-BR` Intl tag confirmed; verify `pt-BR` plural rules |
| B4 | `ar` | New extra-labels; **Arabic plural has 6 forms** — refactor any plural-bearing copy to ICU; verify `dir="rtl"` end-to-end and submit a Playwright snapshot |
| B5 | `de` | Fill the 149 missing extra-labels; ICU plural for German; check for length overflow (German strings are typically 30% longer than English — visual regression risk) |
| B6 | `it` | Fill the 149 missing extra-labels; ICU plural for Italian; same length-overflow check |
| B7 | `zh` + `hi` + `ig` + `yo` + `ha` | Fill the 187 missing extra-labels per locale. For zh: DeepL provides ZH. For hi/ig/yo/ha: DeepL does NOT support → must be hand-translated. The agent should split into per-locale child agents if the scope grows too large; otherwise sequence them |

Each B agent runs in its own worktree on branch `rebuild/i18n-<code>`. PRs
target main. The conductor merges them after review.

Acceptance per locale: `pnpm i18n:check:extra-labels` reports 0 missing for
the locale; `pnpm i18n:check:locale` shows 0 actionable echoes for the locale
across all 9 modules; Playwright snapshot of 5 representative routes shows no
English leakage (intentional brand strings excluded).

### Wave C — Cross-cutting completion (2 agents, parallel)

**C1 — Staff app i18n adapter parity**
- Branch: `rebuild/i18n-staff-adapter`
- Worktree: yes
- Scope:
  - Add `apps/staff/lib/i18n/auto-translate.ts` mirroring the other eight web apps.
  - Update `apps/staff/app/layout.tsx` to emit `<html lang dir>` from resolved locale.
  - Apply Wave A1's extraction rules to staff's 280 findings.
  - Ensure staff is included in the visible-strings baseline.

**C2 — Closure of deferred items + Expo app decision**
- Branch: `rebuild/i18n-closure`
- Worktree: yes
- Scope:
  - Implement opportunistic auto-translate of legacy non-keyed
    `customer_notifications` rows at read time
    (`apps/account/lib/notification-localization.ts` enhancement).
  - Update `apps/super-app` and `apps/company-hub` to consume
    `PUBLIC_SELECTOR_LOCALES` and `LOCALE_LABELS` from `@henryco/i18n` (so the
    locale switcher in the Expo apps matches the web). Translation completion
    in those apps is **deferred** to a separate React-Native i18n project.
  - Write `docs/closure/i18n-completion-closure.md` per the master prompt's
    Wave D specification — this is conductor work, but C2 produces the draft
    so the conductor only has to verify and merge.

### Wave D — Closure (conductor solo)

Conductor responsibilities, in order:
1. Run `pnpm i18n:check` — must report 0 missing, 0 stale, 0 unused across
   every locale.
2. Run Playwright e2e per locale across 20 representative routes per the
   master prompt spec; record findings.
3. Run axe-core scan per locale; record violations.
4. Run length-overflow visual check (de/zh strings).
5. Promote `.codex-temp/i18n-completion/visible-strings.baseline.json` to
   `docs/closure/i18n-visible-strings.baseline.json` as the new floor.
6. Edit `docs/closure/i18n-completion-closure.md` (draft produced by C2):
   - locales shipped, % coverage each, key counts;
   - CI gate config + maintenance instructions;
   - residual risks (third-party widgets that don't respect locale, legacy
     non-keyed notification rows resolved by C2);
   - process for adding a new locale (this is critical — the team needs a
     repeatable recipe so adding `ja` or `sw` later is a 1-hour task).
7. Update memory with the new state (the existing
   `project_henryco_pricing.md` / pricing memory has its own canonical; this
   pass produces a new `project_henryco_i18n_completion.md`).

---

## 9. Anti-patterns — additional rules specific to HenryCo

Carry over the master prompt's anti-pattern list, plus:

- **Do not collapse `surface-extra-labels.ts` into typed copy modules**
  unless the labels have stable hierarchy. The dual Pattern A / Pattern B
  approach is intentional (Pass 18B closure).
- **Do not remove the EN fallback** in any `*-copy.ts` getter. `deepMerge`
  fall-through is the safety net; making it strict would crash production
  for any new key that hasn't yet been translated.
- **Do not translate intentional echoes**. The `INTENTIONAL_ECHOS` allow-list
  in `scripts/i18n-intentional-echos.mjs` is authoritative; agents must add
  to it when they find a new brand/cognate/acronym, not translate it away.
- **Do not break the runtime cache contract**. `TranslationCacheClient` is
  duck-typed in `translate-runtime.ts` so the i18n package stays
  Supabase-free; agents must not add a direct `@supabase/supabase-js` import
  to that package.
- **Do not change `LOCALE_MAP` Intl tags without product sign-off**. The
  current `en→en-NG` and `ig/yo/ha→en-NG` choices are deliberate (Nigerian
  English numeric formats for those locales).
- **Do not include `apps/super-app` or `apps/company-hub` in any web-app
  sweep.** Their React Native i18n approach is a separate project; bulk
  edits to those trees in this pass risk breaking the Expo bundlers.

---

## 10. Persistence

- This audit: `docs/audit/i18n-completion-audit.md` (this file).
- Wave artifacts already created:
  - `.codex-temp/i18n-completion/locale-coverage.md`
  - `.codex-temp/i18n-completion/locale-coverage.json`
  - `.codex-temp/i18n-completion/extra-labels.txt`
  - `.codex-temp/i18n-completion/visible-strings.json`
  - `.codex-temp/i18n-completion/visible-strings-summary.md`
  - `.codex-temp/i18n-completion/visible-strings-extra.json` (hub+staff)
  - `.codex-temp/i18n-completion/extract-gaps-summary.json`
  - `docs/v3/i18n-gaps/*.json` (regenerated by `i18n-extract-gaps.mjs`)
- Wave per-agent reports go to `.codex-temp/i18n-completion/<wave>-<agent>.md`.
- Closure: `docs/closure/i18n-completion-closure.md` (draft from C2, finalised by conductor).

---

## 11. Resolved decisions (owner, 2026-05-15)

All four open questions were answered by the owner. The decisions raise the
quality bar substantially and reshape Wave B's scope.

1. **Scaffold-locale public-selector promotion** — **RESOLVED: PROMOTE.**
   `zh`, `hi`, `ig`, `yo`, `ha` move into `PUBLIC_SELECTOR_LOCALES`. The
   selector becomes all 12 locales. `INTERNAL_SCAFFOLD_LOCALES` is emptied
   (or removed as a concept) — every locale is user-facing.

2. **DeepL-unsupported locales (`hi`, `ig`, `yo`, `ha`)** — **RESOLVED:
   FULL HAND TRANSLATION FROM SCRATCH.** No DeepL pass-through. No EN
   fallback. Every missing extra-label is translated to native quality;
   every existing translation in the typed copy modules is reviewed and
   improved to native quality (the "scaffold" tier is dissolved — these
   locales now meet the same bar as fr/de/it).

3. **`es-ES` vs `es-MX`** — **RESOLVED: best judgment.** Audit-level
   judgment: keep `es-ES` as the Intl format tag (current behaviour); copy
   prose can lean to a neutral pan-Hispanic register that reads naturally
   for both Iberian and Latin American audiences. Number/date format
   difference between es-ES and es-MX is minor enough to not warrant a
   change here.

4. **Plural refactor scope** — **RESOLVED: EVERYTHING.** Existing ad-hoc
   plural concatenations (anywhere in apps or packages) are refactored to
   `Intl.PluralRules` or copy-module plural arms. Wave A2 surfaces them as
   it walks the code; the refactor is part of A2's scope, not a deferred
   follow-up.

### What changes in the wave plan

- **Quality bar (all locales)**: no EN fallback visible to a user at any
  route in any locale. If a string appears, it must read as native copy.
  This applies to the typed copy modules, the extra-labels dictionary, and
  any runtime-translated string. The acceptance test is end-to-end visual:
  "click into 20 routes per locale, read with a native speaker (or
  high-quality translation reviewer), zero English leakage outside
  brand/proper-noun allow-list."

- **Wave B scope expansion**: every B-agent now has a dual mandate —
  (a) fill missing extra-label keys, and (b) review every existing
  per-locale translation in the typed copy modules for native quality. The
  intentional-echo allow-list stays, but agents may NOT add to it
  defensively (every echo must be defensible as a brand name, universal
  acronym, or near-universal cognate; "machine translation was awkward so
  we left EN" is not a valid reason).

- **`PUBLIC_SELECTOR_LOCALES` config change** (Wave A2 work item, additive
  to the existing scope): edit `packages/i18n/src/locales.ts` to make
  `PUBLIC_SELECTOR_LOCALES` include all 12 locales; remove (or empty) the
  `INTERNAL_SCAFFOLD_LOCALES` constant; collapse `LOCALE_TIERS` to a
  single production-ready tier — or, more conservative, treat tiering as
  internal-only metadata that no longer gates the selector. The selector
  UI must show all 12 languages with their native + English labels.

- **Wave B7 is split into per-locale agents** (no longer combined). The
  five scaffold locales each get their own dedicated agent because each
  now requires substantial native-quality work:
  - B7-zh: fill 187 extra-labels (DeepL allowed but native review
    mandatory); review existing 9-module translations for native quality.
  - B7-hi: fill 187 extra-labels (HAND TRANSLATION — Hindi); review +
    improve existing 9-module translations.
  - B7-ig: fill 187 extra-labels (HAND TRANSLATION — Igbo); review +
    improve existing 9-module translations.
  - B7-yo: fill 187 extra-labels (HAND TRANSLATION — Yorùbá); review +
    improve existing 9-module translations.
  - B7-ha: fill 187 extra-labels (HAND TRANSLATION — Hausa); review +
    improve existing 9-module translations.

- **Wave B headcount goes from 7 to 11 agents** (1 per non-EN
  public-selector locale): B1 fr, B2 es, B3 pt, B4 ar, B5 de, B6 it,
  B7-zh, B7-hi, B7-ig, B7-yo, B7-ha. Spawned in two sub-waves of ~equal
  size (6 + 5) for coordination sanity, in a single message per sub-wave.

- **Hand-translation quality protocol for hi/ig/yo/ha agents**: each
  agent's prompt must include an explicit instruction that DeepL is NOT
  to be used, that every translation must be produced as a native speaker
  would write it (idiomatic, register-appropriate to a premium consumer
  product, not literal), that proper-noun and brand allow-listing is the
  only acceptable form of EN echo, and that the agent must produce a
  per-locale style note in the PR body explaining the chosen register
  (e.g. "formal but warm", "uses pidgin where appropriate for Nigerian
  English-borrowed terms"). For Yorùbá in particular: diacritics MUST be
  correct (à/á/ā distinctions matter; tone marks change meaning); the
  agent must verify against authoritative sources, not guess.

The audit now proceeds to Wave A spawn. Wave A is independent of the
locale-quality decisions — A1 extracts, A2 builds tooling/CI/RTL/format
fixes. After Wave A merges, Wave B fires with the resolved scope above.

---

End of Phase 0 audit. Do not spawn Wave A until this document is merged to
main and the owner has acknowledged the open questions in §11. The conductor
proceeds to Wave A spawn in the same session after merge.
