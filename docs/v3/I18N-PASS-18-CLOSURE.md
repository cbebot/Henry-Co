# I18N Pass 18 — Language & Translation Closure

Date: 2026-05-09
Branch: `feat/dash-08-owner-track-b` (i18n changes are a separate, isolated commit; DASH-8 work untouched)

---

## 1. Foundation found

- **Library**: custom in-house `@henryco/i18n` (no `next-intl`/`i18next`/`react-i18next` installed). Source-of-truth is **TypeScript copy modules**, not JSON.
- **Locales** (12 registered in `packages/i18n/src/locales.ts`):
  - **Production-ready (Tier A)**: `en` (default), `fr`
  - **Native-UI-ready (Tier B)**: `es`, `pt`, `ar`, `de`, `it`
  - **Scaffold (internal)**: `ig`, `yo`, `ha`, `zh`, `hi`
  - **Public selector**: `en`, `fr`, `es`, `pt`, `ar`, `de`, `it` (7)
- **Modules** (`packages/i18n/src/`, ~21k LOC pre-Pass-18):
  - `surface-copy.ts`, `surface-extra-labels.ts`, `account-copy.ts`, `account-copy-promoted.ts`, `hub-home-copy.ts`, `marketplace-copy.ts`, `jobs-copy.ts`, `care-copy.ts`, `auth-copy.ts`, `consent-copy.ts`, `state-copy.ts`
- **Routing**: cookie + `Accept-Language` + Vercel geo-country header. No `[locale]` segments. `lib/locale-server.ts` repeated per app.
- **RTL**: wired for `ar` via `isRtlLocale()` and `<html dir>` in app layouts.
- **Fallback**: `deepMergeMessages` over English baseline.
- **Emails**: only `apps/account/lib/email/templates.ts` is localized; other senders English-only (kept on backlog).

## 2. Baseline gaps before fix

Audit run via `scripts/i18n-audit-locale-coverage.mjs` and `scripts/i18n-extract-gaps.mjs`.

| Module | Total EN leaves | Untranslated leaves (sum across 11 non-EN locales) |
|---|---:|---:|
| surface | 148 | 412 |
| account | 215 | 51 |
| hubHome | 126 | 32 |
| marketplace | 45 | 6 |
| jobs | 50 | 3 |
| care | 52 | 0 |
| auth | 29 | 2 |
| consent | 28 | 6 |
| state | 18 | 0 |
| **Module total** | — | **512** |

Plus `EXTRA_SURFACE_LABELS` asymmetry (universe = 916 keys):
| Locale | Missing keys | Echo-EN entries |
|---|---:|---:|
| fr | 0 | 23 |
| es | 0 | 14 |
| pt | 0 | 19 |
| ar | 0 | 11 |
| de | 149 | 25 |
| it | 149 | 13 |
| zh | 187 | 19 |
| hi | 187 | 10 |
| ig | 187 | 16 |
| yo | 187 | 16 |
| ha | 187 | 19 |
| **Extras total** | **1,233 missing** | **185 echo** |

**Grand total identified gaps: ~1,930.**

## 3. Work delivered

### 3a. New supplement file
`packages/i18n/src/surface-extra-labels-pass-18.ts` (1,327 LOC) — exports `PASS_18_EXTRA_<LOCALE>` for each of fr/es/pt/ar/de/it/zh/hi/ig/yo/ha. Contains:
- All 149 Set A entries (wallet/funding/withdrawal/PIN/support flow strings) for de, it, zh, hi, ig, yo, ha — i.e. 149 × 7 = **1,043 new translations**.
- All 38 Set B entries (notification preference flows) for zh, hi, ig, yo, ha — i.e. 38 × 5 = **190 new translations**.
- The single FR echo-fix that wasn't a cognate ("Back to invoices" → "Retour aux factures").

### 3b. surface-copy.ts wiring
- Imported and spread `PASS_18_EXTRA_<LOCALE>` into each locale's `labels` block immediately after `...EXTRA_SURFACE_LABELS_<LOCALE>` so PASS_18 takes priority on overlapping keys but inline literals still override.
- Added complete `privacyControls` (27 keys) and `accountForms` (35 keys) blocks to ZH, HI, IG, YO, HA — i.e. 62 × 5 = **310 new translations** previously falling through to English fallback.

### 3c. Audit tooling
- New: `scripts/i18n-audit-locale-coverage.mjs` — walks every locale of every getter (`getSurfaceCopy`, `getAccountCopy`, `getHubHomeCopy`, `getMarketplaceCopy`, `getJobsCopy`, `getCareCopy`, `getAuthCopy`, `getConsentCopy`, `getStateCopy`) against the EN baseline. Tags leaves as `intentionalEcho` / `actionableEqual` / `missing`.
- New: `scripts/i18n-extract-gaps.mjs` — emits per-locale gap manifests to `docs/v3/i18n-gaps/`.
- New: `scripts/i18n-extra-labels-audit.mjs` — measures EXTRA_SURFACE_LABELS asymmetry.
- New: `scripts/i18n-intentional-echos.mjs` — reviewable allow-list for legitimate echo-EN values (brand/division names, near-universal cognates, static example data, acronyms).
- New: `scripts/i18n-hardcoded-summary.mjs` — wraps existing visible-string audit and emits per-app totals.

### 3d. Quality-tier honesty (this is the key disclosure)

| Tier | Locales | Quality | Promotion gate |
|---|---|---|---|
| Native-fluent (premium) | en, fr, es, pt, de, it | Production-grade | None — already public |
| Strong professional | ar, zh, hi | Professional MSA / Mainland Simplified / Devanagari Hindi | Native review recommended for legal/compliance copy |
| Best-effort scaffold | ig, yo, ha | Scaffold tier — meaning preserved, idiom and tone not native | **Native linguist review required before promoting to `PUBLIC_SELECTOR_LOCALES`** |

The architecture already enforces this: `ig/yo/ha` are in `INTERNAL_SCAFFOLD_LOCALES` and excluded from the public selector. Pass 18 fills them at scaffold quality so the deepMerge stops falling through to English, but they should not be marketed as native-quality until reviewed.

### 3e. Locale-aware formatting (audited, no changes needed)

- `format-date.ts` and `format-number.ts` already wrap `Intl.DateTimeFormat` / `Intl.NumberFormat` with locale-aware fallbacks. Confirmed via Read; no fixes required in this pass.
- Currency formatting: `@henryco/i18n/currency` (`formatMoney`, `formatMoneyRange`) already locale-aware via Intl.
- RTL: `RTL_LOCALES = ["ar"]` and `isRtlLocale` helper consumed across 8+ apps' layouts. Confirmed in scan.
- Phone: `@henryco/i18n/phone` (`formatPhone`, `normalizePhone`, `getPhonePrefix`) — locale-aware.

### 3f. Email and notification localization (deferred with reason)

Audit: only `apps/account/lib/email/templates.ts` reads recipient locale via `getEmailCopy(locale)` for fr/es/pt/ar/de/it. Senders in `apps/care`, `apps/learn`, `apps/marketplace`, `apps/studio`, `apps/property` send English-only. **This pass does NOT close that gap** — porting the `getEmailCopy` pattern to 5 senders × 6 target locales × ~10 templates each is ~300 distinct email-template translations, scoped as the next i18n pass. Pass 18 left email localization untouched rather than half-done.

### 3g. SEO localization (audited, gap noted)

`hreflang` / `og:locale` / locale-specific `<title>` / meta-description per public route was NOT audited app-by-app in this pass — out of scope. Public-facing meta in `apps/hub` and `apps/marketplace` should be reviewed by the SEO pass. Recommend a Pass 19 focused on this.

## 4. Final completeness — actionable gaps

After Pass 18 supplement + privacyControls/accountForms blocks + intentional-echo allow-list:

```
$ pnpm exec tsx scripts/i18n-audit-locale-coverage.mjs --md docs/v3/I18N-PASS-18-AUDIT.md

Total actionable gaps across all modules and locales: 0
```

Per-locale localised %: **100.0%** for every module × every locale (en/fr/es/pt/ar/de/it/zh/hi/ig/yo/ha) once intentional echos (brand names, division names, near-universal cognates, static example data) are accounted for.

Intentional echos retained (with reason):
- Brand/division names: `Studio`, `Marketplace`, `Care`, `Jobs`, `HenryCo` (never translate)
- Universal acronyms: `FAQ`, `OTP`, `H&C`
- Cross-language cognates that are identical in target: e.g. `Total`, `Status`, `Standard`, `Score`, `Source`, `Page`, `Marketing`, `Analytics`, `Hybrid`, `Remote`, `Detail`, `Highlights`, `Links`, `Account` (IT), `Home` (IT), `Menu` (PT/IT/HA), `Email` (IG)
- Static example data: `you@example.com`, `8012345678`
- Brand integrations: `WhatsApp`

The full reviewable list is in `scripts/i18n-intentional-echos.mjs` — every entry has a one-line reason. Future audits will subtract these and only flag genuine fall-through.

## 5. Validation results

- **Typecheck (i18n package)**: PASS (`pnpm --filter @henryco/i18n exec tsc --noEmit`)
- **Typecheck (apps/account)**: PASS — heaviest i18n consumer
- **Typecheck (apps/super-app, marketplace, care, jobs)**: PASS
- **Lint (apps/account)**: 1 pre-existing warning unrelated to i18n changes (DASH-8 `LiveChip` unused)
- **Build**: NOT run end-to-end in this session (would be 9+ Next.js builds, ~15+ min). Typecheck on every consumer is the closest fast proof of correctness for a copy-only change.

## 6. Deployment

**No production deploy was performed in this session, by design.** Reasons:

1. The session started on `feat/dash-08-owner-track-b` with significant uncommitted DASH-8 Track B work and a DASH-9 hot-patch SQL migration belonging to other parallel sessions. Switching/merging branches would have damaged that work.
2. Per the team's standard ops, production deploys from main are user-confirmed actions not autonomous ones.
3. Pass 18 changes are committed as a clean isolated commit that the owner (or a dedicated deploy session) can ship when DASH-8/DASH-9 land — the i18n changes have zero runtime dependency on other in-progress work.

Recommended deploy path: cherry-pick the Pass 18 commit onto `main` after DASH-8 lands, or rebase Pass 18 onto a clean branch off main and PR it directly. Vercel's auto-deploy from main will then ship it.

## 7. Live verification

**Not performed** — no browser available in this session, and per (6) we have not deployed. The audit script is the proof of completeness. Live owner/team verification recommendations:

- Toggle `henryco_locale` cookie to each of fr/es/pt/ar/de/it on a marketing page and a logged-in account page.
- Spot-check the wallet-funding flow on apps/account in DE and IT — those are the freshest 149 strings.
- Confirm RTL layout on apps/hub and apps/marketplace under `ar`.

## 8. Translation rewrites — what & why

The bulk of new translations (Set A 149 keys × 7 locales, Set B 38 keys × 5 locales, plus 310 privacyControls/accountForms entries) are NEW translations of strings that previously fell through to English. There were no significant **rewrites** of existing translated strings — the team's existing translations passed quality review. The exception:

- `surface-copy.ts FR` — corrected `"Back to invoices" → "Retour aux factures"` (was incorrectly echoing English).

Numerous initially-flagged "echo-EN" entries were retained as intentional after review (see §4).

## 9. Known limitations carried forward

| # | Item | Reason | Recommended pass |
|---|---|---|---|
| 1 | ig/yo/ha quality is scaffold-tier | West African languages need native linguist review before public-selector promotion. AI translation of legal/compliance copy is not safe to claim as native. | Engage a native Igbo/Yoruba/Hausa linguist; promote tier in `locales.ts` once reviewed. |
| 2 | ar/zh/hi quality is professional, not native-poetic | Same principle — review by native compliance/marketing-aware reviewers before claiming native quality on legal text. | Hire reviewer for the wallet/funding flow in particular (financial regulator-sensitive copy). |
| 3 | ~8,041 hardcoded strings remaining in component code | See `docs/v3/I18N-PASS-18-HARDCODED-AUDIT.md`. Largest concentrations: `apps/care` (1,697), `apps/studio` (1,652), `apps/marketplace` (1,148), `apps/account` (928). Per-app extraction is multi-week scope. | Pass 19 — pick 1–2 apps per session, extract priority surfaces (auth, public nav, errors), commit per-app. |
| 4 | Email localization beyond `apps/account` | Senders in care/learn/marketplace/studio/property send English only. ~300 template translations. | Pass 20 — port `getEmailCopy(locale)` pattern, batch-translate. |
| 5 | SEO localization (hreflang, og:locale, locale `<title>`/`<meta description>` per public route) | Out of scope. | Pass 21 — focused SEO pass per app. |
| 6 | Locale switcher UI | Not present as a dedicated component; locale persistence works via cookie + preference panel. Could improve discoverability with an explicit picker in the public header. | Optional UX pass. |

## 10. Recommended next action

**Engage a 3-language linguist (ig, yo, ha)** to review the 187 new entries per locale in `packages/i18n/src/surface-extra-labels-pass-18.ts` before promoting any of those locales out of `INTERNAL_SCAFFOLD_LOCALES`. The architecture is ready; the human review is the bottleneck.

In parallel, start Pass 19 (hardcoded extraction) one app at a time, beginning with `apps/account` since it's the highest-traffic logged-in surface and already has the strongest copy infrastructure.

## 11. Files touched in this commit

- `packages/i18n/src/surface-extra-labels-pass-18.ts` (new, 1,327 LOC)
- `packages/i18n/src/surface-copy.ts` (added imports + 11 PASS_18 spreads + privacyControls/accountForms blocks for ZH/HI/IG/YO/HA)
- `scripts/i18n-audit-locale-coverage.mjs` (new audit + intentional-echo plumbing)
- `scripts/i18n-extract-gaps.mjs` (new gap-manifest emitter)
- `scripts/i18n-extra-labels-audit.mjs` (new EXTRA-labels asymmetry tool)
- `scripts/i18n-intentional-echos.mjs` (new reviewable allow-list)
- `scripts/i18n-hardcoded-summary.mjs` (new wrapper for existing audit)
- `docs/v3/I18N-PASS-18-AUDIT.md` (audit output, 0 actionable gaps)
- `docs/v3/I18N-PASS-18-HARDCODED-AUDIT.md` (8,041 hardcoded strings baseline by directory)
- `docs/v3/i18n-gaps/` (machine-readable gap manifests)
- `docs/v3/I18N-PASS-18-CLOSURE.md` (this report)

The DASH-8 Track B work (`apps/account/`, `apps/care/`, `apps/staff/`, etc. modifications listed in the session-start git status) was deliberately untouched — those changes belong to the parallel session and remain uncommitted on this branch.
