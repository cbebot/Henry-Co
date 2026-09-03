# HenryCo Owner CMS — Engineering Spec & Build Prompt (v2, definitive)

**Status:** APPROVED FOR AUTONOMOUS EXECUTION (owner authorized: build straight through, no approval pauses; ultracode).
**Date:** 2026-06-01 · supersedes v1 (`2026-06-01-owner-cms-spec.md`).
**Grounding:** a 4-track read-only audit + a 7-agent multi-lens design study (`wf_8595ceb6-04d`) that found real defects v1 missed.
**Mandate:** the best owner-only CMS ever built for HenryCo — from scratch, **real live data, no fakes**, "most standard, not easiest." Standalone deployment on a fresh URL under HenryCo Studio.

---

## 1. Vision

A from-scratch, **owner-only** CMS (`apps/cms`, its own Vercel project under HenryCo Studio, standalone Supabase magic-link/OTP login because `*.vercel.app` cannot inherit `.henrycogroup.com` owner cookies) that becomes the **single audited writer** of every editable company surface the public sites read. It replaces today's **two divergent writers** to `company_pages` (the *unaudited* server action `saveCompanyPageAction` AND the audited route) with **one canonical model** (`CompanyPageRecord`) projected through **one compatibility writer** governed by a checked-in **Canonical Field Map**. It supersedes the raw-JSON-textarea editor with a **typed block editor**, a true **draft→published state machine** (none exists today), a **real-render side-by-side preview**, **version history + one-click rollback** on the audit substrate, and **brand-voice-guarded English-canonical authoring** that fans out to all locales via `@henryco/i18n`. It **version-controls the out-of-band CMS DDL for the first time**, then progressively absorbs the hardcoded legal/identity config and ~10k lines of hardcoded division copy into safe, audited, DB-first/code-fallback editable models — so the website finally tells **one governed truth, edited by one principal, with full provenance**.

## 2. Pillars

1. **SINGLE AUDITED WRITER** — every `company_*` mutation flows `requireOwner → withOwnerMutationContext → canonical projection → service-role write → writeOwnerAudit`, enforced by a **CI chokepoint probe**. The two-writer drift is retired in Phase 1, mechanically, not aspirationally.
2. **CANONICAL MODEL + COMPATIBILITY PROJECTION** — one `CompanyPageRecord`, one checked-in **Canonical Field Map** that is the single source for both the writer's alias projection and a **golden-snapshot contract test**, so the writer loses no alias either historical writer populated.
3. **DRAFT/PUBLISHED STATE MACHINE WITH PROVENANCE** — explicit draft vs published vs has-unpublished-changes; version history + rollback replayed from existing `old_values/new_values` audit snapshots; every publish an immutable restorable revision.
4. **REAL-RENDER PREVIEW + REALTIME TRUTH** — preview through the *actual* public `CompanyPageClient` render path (incl. credibility filters); **drafts served only via an owner-authenticated read, never the anon realtime channel**.
5. **PROGRESSIVE CONFIG-TO-DB ABSORPTION** — hardcoded legal identity & division copy promoted field-by-field, DB-first/code-fallback; `[OWNER-TO-CONFIRM]` preserved as a visible first-class status, never silently invented.
6. **REUSE, NOT REINVENT** — `@henryco/ui` tokens/forms/PublicToast, `@henryco/brand` HenryCoLogo, the Cloudinary signed-upload route pattern, `@henryco/observability` audit/telemetry, `@henryco/i18n` English-canonical pipeline, `requireOwner`/`owner_profiles` — the CMS adds a canonical layer over proven infrastructure.

## 3. Architecture & non-negotiable corrections (from the design study)

- **App:** `apps/cms` (Next.js 16, React 19, Tailwind v4), own Vercel project under HenryCo Studio (`team_0PUdVTapDfmw8tpwht4TvRUG`). Same Supabase project as the hub (real data).
- **Auth:** standalone magic-link/OTP gated by `owner_profiles` (`is_active && role ∈ {owner,admin}`), reusing the exact `requireOwner` gate logic. Host-scoped cookies are automatic (`getSharedCookieDomain` returns `undefined` off `.henrycogroup.com`). OTP-send **pre-checks `owner_profiles` before dispatch** + rate-limited by email AND IP (`checkAncillaryRate`, fail-closed) + security-event logging.
- **Audit actor_id fix (must):** `add_audit_log_v2` currently records `actor_id = NULL` under the service-role call. Thread `requireOwner().user.id` explicitly so every CMS mutation proves *who*.
- **Single-writer enforcement (must):** retire/redirect `saveCompanyPageAction`'s direct unaudited upsert; ship a CI probe (ts-morph/ripgrep) that fails the build if any file outside the canonical writer module calls `.from('<company_* table>').upsert|insert|update` OR a CMS mutation handler lacks `requireOwner + withOwnerMutationContext + writeOwnerAudit`.
- **Canonical Field Map (must):** checked-in alias inventory — `slug+page_key`; `primary_cta_*+cta_primary_*+hero_primary_*`; `secondary_cta_*+cta_secondary_*+hero_secondary_*`; `intro+hero_body+intro_body`; `title+hero_title`; `hero_badge+hero_kicker`; `sections+body`; `stats+content.stats`; `hero_image_url+cover_image_url` — driving BOTH the writer projection AND a golden contract test (`normalizeCompanyPage(row) === normalizeCompanyPage(writer(normalizeCompanyPage(row)))` for every real live row, byte-identical across both historical writers' outputs).
- **Draft isolation (must):** drafts live in a **separate owner-RLS-gated table** (`company_page_drafts`), NEVER a column on the anon-readable `company_pages` row (the anon realtime channel `select('*')` would leak unpublished/embargoed content). Preview authenticates as owner; never reuses the anon channel.
- **i18n column model (must, Phase-1 prerequisite):** `company_pages` has no `*_i18n`/`locale_overrides` columns today; the realtime client path serves English only. Add per-field `*_i18n` (or one `locale_overrides` JSONB), and route `getCompanyPage` + `CompanyPageClient` through `resolveLocalizedDynamicField` **before** any translation-coverage chip is meaningful. Pick ONE i18n mechanism (per-field `*_i18n` columns — what company pages can use today), not the `source_text`-keyed cache.
- **Reauth-cookie domain fork (hard dependency of Phase-2 step-up):** `cookieDomainForRequest` hardcodes `.henrycogroup.com` in prod → on the foreign apex the step-up cookie is unreadable and reauth 401-loops. Parameterize it to a per-host resolver (or take `cms.henrycogroup.com`) **before** Phase-2 legal editing.
- **Realtime contract preservation:** keep `company_pages` in `supabase_realtime` with `REPLICA IDENTITY FULL`; the slug filter + `select('*')` must keep returning every column the normalizer needs. A **Realtime Exit Test** gates Phase 1.

## 4. Phase plan (each ships through CI → PR → squash-merge → Vercel autodeploy)

### Phase 0 — Secured magnificent shell (live on the fresh URL)
- `apps/cms` scaffold; standalone magic-link/OTP login gated by `owner_profiles`; ported `requireOwner`; `ownerAuthDeniedResponse`; `createAdminSupabase`; host-scoped cookies.
- OTP-send endpoint with `owner_profiles` pre-check + Upstash rate-limit (email+IP) + `cms_owner_sign_in`/`cms_otp_send` security events.
- `@henryco/ui` `ThemeProvider` + `PublicDesignTokens` + `HenryCoLogo` chrome (gold-on-navy owner tokens, light/dark); `instrumentation.ts` (Sentry); `HenryCoAnalytics`; `/api/health` (Cloudinary + DeepL in `extraRequiredEnv`); secure headers (HSTS, `X-Frame-Options`, nosniff, Referrer-Policy, Permissions-Policy); login `noindex/nofollow` + `normalizeTrustedRedirect` on `next=`.
- **Exit:** owner logs in at the fresh URL → empty, beautiful, secured shell; non-owner OTP lands on no-access.

### Phase 1 — Hub-content control, done right
- **Single-writer enforcement** + CI chokepoint probe.
- **Canonical Field Map** + golden-projection contract test seeded from real live rows.
- **Typed block editor** (Hero/Stats/Section blocks over the audited fields) with autosave→draft buffer, dirty tracking, `beforeunload` guard, Cmd-S; draft/published/has-unpublished-changes badges.
- **`company_page_drafts`** (owner-RLS-gated) + **real-render preview** via owner-authenticated read.
- **Version history + rollback** (`company_page_revisions` snapshot + block-level diffs from the audit substrate); every rollback audited, visible live via realtime without redeploy.
- Editors for `company_settings`, `company_site_settings`, `company_divisions`, `company_people`, `hub_homepage_content`, `company_faqs`.
- **Inline media** via the owner-gated Cloudinary signed-upload route.
- **Version-control the CMS DDL** (`apps/cms/supabase/migrations/` baseline reflecting live shape from `supabase db diff`/`pg_dump`, additive + `IF NOT EXISTS`; enable RLS — anon `SELECT` where `is_published=true`, owner-predicate write backstop; keep realtime contract).
- **i18n column model** wired through `resolveLocalizedDynamicField` + per-field translation-status rail.
- **Truth/consistency checker (read-only):** diff `company_divisions` (DB) vs `COMPANY.divisions` (`@henryco/config`) per `DivisionKey` (accent/tagline/description/subdomain, flagging mismatches that break `getDivisionUrl`).
- **Voice Guard (adapted)** on hero/section/CTA copy: a new `site_copy` applies-to class filtering out email-only block rules; blocks fabricated-trust/AI-filler before publish.
- **Drop/deprecate ledger:** drop orphan `company_homepages`; freeze/migrate legacy `company_homepage_faqs` → `company_faqs`.
- **Optimistic concurrency** (`version` token; 409-with-current-row) — owner runs many parallel sessions on one tree.
- **Realtime Exit Test** as a blocking gate.
- **Exit:** the CMS does everything `/owner/brand` does today, standalone and far better, with the integrity holes closed.

### Phase 2 — Legal & company config → DB
- `legal_registry` (Zod-validated against the config-derived schema; config as typed fallback/seed) + child tables for the arrays; `legal_document_versions`; a guided **`[OWNER-TO-CONFIRM]` resolution wizard** (RC/registered office/TIN/NDPC/DPO) with format validators + statute context.
- **Legal change governance:** mandatory reason + **step-up reauth** (requires the reauth-cookie fork first); **per-field** placeholder gating with an audited "publish with known-pending facts" override (never a global block — that would regress today's honest placeholder rendering); `LEGAL.policy.version`-bump material-change flow (confirm the email dependency).

### Phase 3 — Division marketing copy
- `division_pages` (`division_slug, page_slug`) reusing the `company_pages` JSONB section shape; per-division **codemod-seed from `public-copy.ts` → DB-first/constant-fallback → delete the constant**. **Marketplace (~7.3k lines, inline JSX, bespoke layouts) scoped LAST** with an explicit layout-coverage audit.
- Route the `company_people` staff-invite write (`upsertCompanyPerson`) through the same canonicalizer (today it writes `page_key:'about'`, no audit, drifting FKs).
- **Reference picker + backlinks** for the FK-by-convention links, with referential-integrity warnings + dry-run.

### Phase 4 — Consolidation & polish
- Reusable `cms_media` library (Cloudinary derivatives, sha256 dedupe, `alt_text_i18n`); scheduling/embargo **for non-legal surfaces only**, never on an anon-readable row, via an audited owner-gated route (not raw `pg_cron` outside the audited path); three-way-merge UI; optional `content_documents` consolidation **only if** the realtime contract is re-platformed first.

## 5. Data-model additions (version-controlled in `apps/cms/supabase/migrations/`)
- Baseline `CREATE TABLE IF NOT EXISTS` reflecting live shape of the CMS tables (from `supabase db diff`/`pg_dump`, cross-checked vs read shapes) — **the baseline MUST come from the live DB, not the TS shapes** (the read shapes may not list every physical column).
- `company_pages` additive: `status CHECK ∈ (draft,in_review,published,archived) DEFAULT draft`, `published_at`, `published_by`, `version bigint DEFAULT 1`, `deleted_at/deleted_by`, per-field `*_i18n` (or one `locale_overrides` JSONB). **`is_published` becomes a GENERATED column from `status`** so the anon filter and status can never disagree.
- `company_page_drafts` (owner-RLS-gated), `company_page_revisions` (append-only, restorable, block-diffable).
- `legal_registry` + child tables + `legal_document_versions`; `division_pages`; `cms_media` (Phase 4).
- RLS on all CMS tables: anon `SELECT USING (is_published=true)`; owner-predicate write policy wrapped per the initplan convention; service-role bypasses RLS so owner writes are unaffected.
- **Audit actor_id fix** in `add_audit_log_v2`.

### Sequencing constraints (hard-won from the critique)
- **Generated-column firewall (page_key/cta_* as GENERATED) rejects writes**, so both in-repo writers throw the moment it lands → canonical columns + writer change ship in **ONE PR**; convert aliases to generated only after grepping all apps prove them write-only, with a one-release plain-backfilled window.
- **RLS enablement** on tables that have none can blank the public pages if a policy is mis-scoped → test every public reader (`getHubHomepageContent`, `getPublishedDivisions`, `getPublishedFaqs`, About realtime) on a Supabase **preview branch** before prod.
- Decide ONE i18n mechanism before any coverage/staleness feature.

## 6. Security requirements
Standalone OTP gated by `owner_profiles` (necessary, never sufficient); every mutation `requireOwner → withOwnerMutationContext → sanitize → service-role write → writeOwnerAudit` (CI-probe-enforced); RLS defense-in-depth; drafts/embargo never on the anon channel; audit `actor_id` closed; step-up reauth on legal/publish/delete (requires the cookie-domain fork); secret isolation (`SUPABASE_SERVICE_ROLE_KEY`, `CLOUDINARY_API_SECRET`, `DEEPL_API_KEY` server-only via `server-only` import guard; envs set for **all** Vercel environments to avoid the known preview-env 500 gap); Cloudinary signed params scoped to folder+short-TTL; login `noindex` + trusted-redirect; sanitize-on-write + escape-on-render.

## 7. UX principles
What-I-edit-is-what-ships (preview = real public render incl. credibility filters); typed blocks over audited fields, never raw JSON; draft-by-default, publish-as-an-explicit-act; keyboard-first (Cmd-K across the 4 pages / 10 divisions / people, slash-menu, stable-id reorder); provenance in one panel (who/from-what/when/why/restore); a **Surface Map** coverage view per `DivisionKey` (DB-editable vs still-hardcoded, % bar) to make the Phase-3 rollout legible; honest status over silent invention (`[OWNER-TO-CONFIRM]` markers; translation chips distinguish cached(deepl)/cached(manual)/English-fallback, never alarm on DeepL-unsupported ig/yo/ha); WCAG 2.2 AA via `@henryco/ui` + reduced-motion.

## 8. Unbeatable differentiators
Schema-drift-as-a-feature (Canonical Field Map + drift-health indicator — no off-the-shelf CMS can model drift it never saw); single audited writer enforced by CI; the **truth/consistency checker** reconciling DB vs config divisions; real-render preview + realtime rollback **without a redeploy** (incumbents gate behind builds/webhooks); audit-log-as-event-store provenance (git-for-content + PITR on infra already in the repo); `[OWNER-TO-CONFIRM]` resolution as a legally-aware wizard; brand-voice-guarded English-canonical authoring fanning out to all locales.

## 9. Explicitly deferred / cut (critique "overreach")
`content_documents`-as-views (incompatible with the realtime contract — Phase 4+ or never); passkey/WebAuthn (HMAC reauth + OTP suffices for a single principal); scheduled/embargo for **legal** pages on the anon table (most dangerous, least value); IndexedDB offline draft queue; three-way merge UI (Phase 4; ship version-token 409 in Phase 1); Lighthouse-CI budget gate on internal editor routes; single-pane Sentry+audit correlation explorer (after `actor_id` is closed); treating marketplace copy as a clean codemod (layout-fidelity gap — scope last).

## 10. Open risks
Live-schema reflection must come from the DB, not TS shapes; generated-column atomic-PR sequencing; RLS-enablement can blank public pages (test on preview branch); `status` vs `is_published` must be one generated truth; two-i18n-mechanism conflation; reauth-cookie domain hardcode blocks step-up on the apex; legal config→DB could publish an incorrect statutory fact (Zod-validate, fall back to config + log anomaly, keep placeholder visible, per-field gate); marketplace layout fidelity; parallel-session lost-updates (optimistic 409 in Phase 1); `content_documents` views incompatible with realtime.
