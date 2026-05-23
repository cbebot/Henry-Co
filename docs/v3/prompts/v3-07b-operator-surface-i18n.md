# V3-07b — Operator-Surface i18n (HARDENING)

**Pass ID:** V3-07b
**Phase:** B — Hardening tail (NOT a Phase B blocker)
**Pillar:** P12 (Global)
**Dependencies:** V3-07 merged (helper + scanner + CI gate live), V3-12 Foundation Lock acceptance closed (Wave B.1 closure)
**Effort:** L (2–4 weeks; 3–4 agent sessions expected)
**Parallel-safe:** N within itself (sessions chain across modules) — but parallel-safe with every other V3 pass
**Owner gate:** D17 (operator-surface scope envelope + locale-completeness bar)
**Risk class:** None (surface-text only; no money/identity/compliance logic touched)

---

## Role

You are the V3 Foundation engineer for HenryCo. You execute exactly this one pass (or one chunk of it; **this is a 3-4 session wave**), then stop and report.

This pass closes the **OPERATOR-SURFACE i18n** bar — every staff dashboard, admin workspace, internal tool, server message, email, PDF, structured-data field, A11y aria-label, and any written text from any angle in the product MUST resolve from typed copy. After V3-07b ships, no new hardcoded user-visible OR operator-visible text can be merged without the CI gate catching it.

**Owner's verbatim bar (the standard this pass must meet):**

> "We need a full coverage, no hardcoded texts, all server messages, any written texts from any angles in the website. It MUST make it extremely perfect so that no more mistakes will ever be made again in translation, even in the future."

Take this literally. The deliverable is not "fewer GAPs". The deliverable is **ZERO** GAPs, **ZERO** ambiguities, and a CI gate strong enough that the bar can never regress.

---

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch (per session) | `v3/07b-operator-i18n-session-N` (e.g., `-session-1` for the first chunk) |
| Deploy | Vercel (10 web projects) |
| OS context | Windows + bash; pnpm 9.15.5; Node 24.x |

This pass is expected to span **3–4 sessions**. Each session picks up the next module-slice, leaves a clean residual handoff, and stops. See "Session N pickup" below.

---

## Audit summary (lifted from `docs/v3/i18n-gaps/summary.json` + V3-07's `hardcoded-scan-2026-05-22.json`)

V3-07 closed:
- User-facing surface gaps across care, account (partial), marketplace (partial), hubHome (partial)
- 40 of ~196 `henrycogroup.com` literals (the remaining 156 are scoped to V3-07c)
- Initial scanner + CI gate active

V3-07b operates on **what remains**. The aggregate counts as of the V3-07 closure scan:

| Module | Operator-surface GAP count (across 11 non-en locales) | Headline |
|---|---|---|
| `account` | 1,030 | Largest module by far — staff/admin workspace strings, owner workspace pages, settings, permissions UI |
| `jobs` | 673 | Employer-side surfaces (post-job flow, applicant tracking, billing dashboards, employer settings) |
| `hubHome` | 43 | Hub command + dashboard pages for staff |
| `surface` | 63 | Cross-app surface labels (shared button labels, status chips, A11y aria-labels) |
| `marketplace` | 6 | Owner-side marketplace pages (small remainder) |
| `care` | 22 | Provider-side care pages (small remainder; mostly server-emitted error text) |
| `auth` | 2 | One operator-facing auth error path (it locale missed) |
| `consent` | 6 | Consent-modal operator-side text |
| `state` | 0 | Already complete (verify) |

**Headline number: ~1,305 operator-surface GAPs to close.**

These counts exclude the runtime DeepL fallback noise — they are typed-copy gaps in Pattern A modules. Pattern B handles user-facing translation today but does NOT cover server-emitted text or operator-side text that never round-trips through `<T label="…" />`.

This pass also closes gaps in surfaces the scan did NOT detect because they live outside JSX:
- Server-emitted JSON error bodies (API route `NextResponse.json({ message: "…" })`)
- Email subject + body templates in `@henryco/email`
- PDF generators in `packages/branded-documents/`
- Structured-data builders in `packages/seo/` (JSON-LD literal strings)
- Push notification text + SMS text
- og:image SVG renderer text overlays
- Social share text generators
- Sentry breadcrumb labels (human-readable fields only)
- Audit log human-readable description columns

Per memory `project_henryco_i18n_architecture.md`: Custom `@henryco/i18n` + Pattern A typed copy + Pattern B `translateSurfaceLabel` runtime DeepL; passes 18/18B/18C closed; 12 locales (en/fr/es/pt/ar/de/it/zh/hi/ig/yo/ha) preserved.

Per memory `feedback_dashboard_search_engine_no_touch.md`: Owner reserves `packages/search-ui/` — quality reference only, never modify. Operator surfaces that wrap search-ui components get covered in the wrapping app; the search-ui package itself is untouched.

---

## Mandatory scope

### S1 — Catalogue every operator surface

Before writing a single line of label code, produce `docs/v3/i18n-gaps/operator-surface-catalogue.md`. This is the source-of-truth list of every page, route, modal, template, generator, and string-emitting code path in scope. Group by app and by sub-area:

**Per app/package, list every:**

- Staff dashboard page (e.g., `apps/account/app/(staff)/**`, `apps/henryco-hub/app/dashboard/**`)
- Admin workspace page (e.g., `apps/account/app/(admin)/**`, owner-only routes)
- Internal tooling route (cron handlers, ops surfaces, debug routes that have human-readable output)
- Hub command page (`apps/henryco-hub/app/(command)/**`)
- Hub dashboard page (`apps/henryco-hub/app/(dashboard)/**`)
- Marketplace owner page (`apps/marketplace/app/(owner)/**`)
- Jobs employer surface (`apps/jobs/app/(employer)/**`)
- Care provider surface (`apps/care/app/(provider)/**`)
- Property owner surface (`apps/property/app/(owner)/**`)
- Studio agency surface (`apps/studio/app/(agency)/**`)
- Logistics business surface (`apps/logistics/app/(business)/**`)
- Learn instructor surface (`apps/learn/app/(instructor)/**`)

**Per surface type, list every:**

- Page title + meta description + og:image alt text
- Error message (route-level error.tsx, error boundary fallback, NextResponse.json error bodies)
- Validation message (zod, joi, hand-rolled — both `safeParse().error` translations and inline validation feedback)
- Server-emitted API error body (every `NextResponse.json({ error: "…" }, { status: NNN })`)
- Email subject + body + CTA + sender-name (per `@henryco/email` template per division)
- Push notification text (title + body)
- SMS text (per `@henryco/sms` or equivalent template)
- Generated PDF content (per `packages/branded-documents/` template)
- Structured data text fields (JSON-LD `name`, `description`, `provider.name`)
- Social share text generator
- Email-from name
- Log line that surfaces to humans (Sentry breadcrumb messages, audit log description column)
- Confirmation modal text (title + body + confirm/cancel labels)
- Dropdown option label
- Form label + placeholder + help text + error text
- Table column header
- Empty-state CTA + headline + sub-headline
- Loading-skeleton text (when not handled by V3-05's StructuredSkeleton primitives)
- Filter chip label
- Segment chip label
- Breadcrumb segment
- A11y aria-label / aria-describedby content
- Screen-reader-only text (`<span className="sr-only">…</span>`)
- Tooltip content
- Status chip / badge label

**Output format:** The catalogue is a markdown checklist. Each entry has: app, file path, surface type, current state (hardcoded / partial-label / fully-labeled), and the label key it should resolve to.

This catalogue is the contract: anything not in it does not exist for V3-07b's purposes. Anything in it MUST close to ZERO GAPs by the time of the final session.

### S2 — Close all 1,305+ scanner-detected GAPs

For each GAP in `docs/v3/i18n-gaps/hardcoded-scan-2026-05-22.json` (V3-07's output) marked operator-surface:

1. Add the label to the appropriate Pattern A surface copy module (en-US source-of-truth).
2. Wire the call site to `<T label="…" />` or `t('…')` per the surrounding code's idiom.
3. Verify the en-US key resolves; verify Pattern B DeepL fallback fires for the other 11 locales at runtime.
4. If the GAP belongs to a copy module that doesn't exist yet, create it under `packages/i18n/src/locales/<locale>/<module>/` following the existing convention.

**Anti-pattern hard-stops:**
- Do NOT introduce English text into a non-en locale file as a placeholder. If you cannot translate, leave the key missing in that locale and let Pattern B DeepL fill it at runtime. The build-time linter (S8) prevents adding a `<T label="…" />` referencing a key not present in en-US, which is the only required source.
- Do NOT add labels with names that leak operator/staff-only intent into user-facing surfaces by accident. Operator-only labels go in operator-prefixed modules (e.g., `account.staff.*`, `hubHome.command.*`).

### S3 — Close all server-message paths

This is the largest single-effort sub-scope. The scanner (V3-07) detects JSX text — it does NOT detect server JSON bodies.

**Build a server-message resolver in `@henryco/i18n`:**

- New module `packages/i18n/src/server.ts` exporting `tServer(label: string, locale?: string, vars?: Record<string, unknown>): string`.
- Default locale resolution: read from request `Accept-Language` header in Next.js route handlers; fall back to `en-US`.
- Same key universe as client `t()`; reads the same Pattern A typed-copy modules.
- Pattern B DeepL fallback identical to client.

**Sweep every server-emitted user-facing field:**

For each occurrence in `apps/*/app/**/route.ts` and `apps/*/app/api/**/*.ts` (Next.js App Router server endpoints):
- `NextResponse.json({ error: "…", message: "…", title: "…", description: "…" })` — every string value that could surface in a user-visible toast/alert/error UI gets routed through `tServer()`.
- Validation chain (zod `safeParse().error.issues[].message`) — wrap each zod schema's `.error` message in `tServer()` or use zod's `errorMap` to centralize. Document the convention in `docs/v3/i18n-server-messages.md`.
- Hand-rolled validation throws — replace `throw new Error("Invalid X")` with `throw new Error(tServer('error.<surface>.invalidX', { ... }))`.
- Middleware error responses (`middleware.ts` per app) — every redirect with a query-string error message gets a label resolved server-side.
- Edge functions (`apps/*/middleware.ts` + Vercel edge route handlers) — same treatment.
- Server actions (`'use server'` functions that throw `redirect()` or return `{ error: '…' }`) — same treatment.

**Document the convention:** `docs/v3/i18n-server-messages.md` codifies: (a) when to use `tServer()` vs client `<T />`; (b) how locale is resolved server-side; (c) how to pass vars through; (d) the "if a server message is reused in client UI, prefer client `<T />`" rule; (e) which surfaces are allowed to emit untyped strings (NONE, by design — but document the rule).

### S4 — Email + notification template completeness

For each template in `packages/email/templates/**`:

- Confirm a typed copy module exists per division per template (e.g., `email.care.bookingConfirmation.*`, `email.marketplace.orderReceipt.*`).
- For each template, type the subject line + greeting + body paragraphs + CTA label + footer + sender-name.
- For locales beyond en-US, Pattern B DeepL fills at send-time using the same `tServer()` path. Do NOT pre-translate body paragraphs into JSON — DeepL handles it. The exception: subject lines and CTAs are short enough that pre-translating to all 12 locales is feasible and avoids DeepL latency at send-time; do this for those two surface types only.
- Sender names: enforce per-division per memory or per D7 — typed module `email.senders.*` with one entry per division (e.g., `email.senders.care: "HenryCo Care"`).
- Push notification (`@henryco/notifications` or equivalent): same treatment for title + body.
- SMS text: same treatment per template.

**Acceptance:** every email sent in any locale resolves either through Pattern A typed copy (en-US source + DeepL'd body) or through the operator-translated sub-set in S7. Never a label-name fallback in a delivered email.

### S5 — Generated content

For each:

- **PDF templates (`packages/branded-documents/**`):** invoice, receipt, contract, KYC letter. Every string literal — header, footer, line-item label, totals heading, disclaimer — passes through `tServer()`. PDFs render in the recipient's locale.
- **Structured-data builders (`packages/seo/**`):** JSON-LD output (`name`, `description`, `aggregateRating.bestRating` literal strings, `Organization.legalName`, `BreadcrumbList.itemListElement[].name`). Per-locale per-page; defaults to en-US.
- **Social share text generators:** `packages/share/` or wherever the share-image and share-text generators live — typed.
- **og:image SVG renderers:** the SVG text overlays for Open Graph dynamic images (`apps/*/app/opengraph-image.tsx` per Next.js convention) — read from typed copy modules; render the locale-resolved text into the SVG.

### S6 — Tighten the V3-07 scanner

The V3-07 scanner classified output into OK / GAP / EXEMPT / AMBIGUOUS. Some entries fell into AMBIGUOUS — strings that could be developer labels or user-facing copy.

For V3-07b, drive AMBIGUOUS to ZERO. Each rule that resolved ambiguous gets codified into the scanner so future scans never produce AMBIGUOUS for the same shape.

- Audit every AMBIGUOUS entry from V3-07's scan output.
- For each, classify it (OK or GAP) by reading the surrounding code.
- For each classification rule, add a regex/AST predicate to the scanner.
- Re-run the scanner — confirm zero AMBIGUOUS.
- Update `docs/v3/i18n-gaps/exempt.json` with any developer-label additions (one entry per rule, with a one-line justification).

The bar: strict-mode CI gate has no ambiguity. Every string is OK or GAP; if it's GAP, CI fails.

### S7 — Locale completeness — en-US source-of-truth

Pattern A's en-US module is the source-of-truth. Pattern B DeepL runtime fills the other 11 locales — but only if the en-US key exists. If en-US is missing, the fallback cascades to label-name (ugly: `surface.button.submit` rendered literally).

Audit `packages/i18n/src/locales/en/**`:
- Walk every label key referenced in any `<T label="…" />` or `t('…')` call across `apps/` + `packages/` (excluding `packages/search-ui/`).
- Confirm each key resolves to an en-US string. If not, ADD it.
- Output `docs/v3/i18n-gaps/en-us-completeness-report.md` with a checklist of every key + its en-US value.

**Locale completeness bar (per D17.b — recommended Option A):**
- en-US: 100% typed-copy coverage of every reachable label key. This is THE source-of-truth.
- The other 11 locales: Pattern B DeepL fills lazily at runtime. No build-time obligation to type them.
- Exception (per D17.b): if D17.c sub-decision identifies operator-compliance-sensitive labels (e.g., legal disclaimers in PDF generators), those get pre-translated by a human-reviewed DeepL pass and committed to typed copy. Maintain that list in `docs/v3/i18n-gaps/compliance-typed-locales.md`.

### S8 — Build-time linter

V3-07 wired `pnpm i18n:check` and a CI strict-mode gate. V3-07b extends it.

**Add `pnpm i18n:check:keys-exist`** as a new check:
- For every `<T label="…" />` and `t('…')` call detected by the scanner, verify the label exists in en-US Pattern A.
- If not, fail CI with a clear error: `Label '<key>' referenced at <file>:<line> not found in en-US Pattern A. Add it to packages/i18n/src/locales/en/<module>/<key>.ts.`
- Run as a CI job on every PR. Run as a local pre-commit hook (opt-in; see `package.json` scripts).

**Add `pnpm i18n:check:server-messages`**:
- Walk `apps/*/app/**/route.ts` + `apps/*/app/api/**/*.ts` + `apps/*/app/**/*action*.ts`.
- Detect `NextResponse.json({ error: "…" })`, `throw new Error("…")`, `redirect("?error=…")` patterns.
- If the value is a string literal (not a `tServer()` call), fail CI.
- Allow whitelist via `docs/v3/i18n-gaps/server-message-exempt.json` (e.g., debug-only routes, dev-only logging endpoints).

**Add `pnpm i18n:check:email-templates`**:
- Walk `packages/email/templates/**`.
- Detect string literals in subject / body / CTA positions (template-engine-aware).
- Fail CI if any literal is present and not in a typed copy module.

**CI integration:** Update `.github/workflows/i18n-check.yml` (created by V3-07) to add the three new checks. All four checks (V3-07's original + V3-07b's three) must pass for a PR to merge.

### S9 — Telemetry tightening

V3-07 added the `henry.i18n.missing_label_at_runtime` event with fields `label_key`, `locale`, `fallback_used`.

V3-07b extends:
- **Rate limit:** the runtime hook fires AT MOST ONCE per `(label_key, locale)` tuple per session per user. Otherwise a long-lived dashboard floods the event lake.
- **First-100 unique-keys-per-day buffer** in the owner's translation-health tile. The owner sees the top 100 keys that fell to fallback in the last 24h, deduped + counted, sorted by frequency. The tail beyond 100 aggregates into a single "and N more" row.
- **Surface-context field:** add `surface_context` (operator | user) so the tile can split the count into "user-facing fallbacks" (Pattern B working as designed) and "operator-facing fallbacks" (a regression — these should be ZERO after V3-07b).
- **Alarm:** if `surface_context = "operator"` AND `fallback_used = true` AND the count exceeds 5 in a 24h window for any single `label_key`, fire a Slack/email alert to the on-call. This catches the regression case where a new operator-surface PR ships without a label.

Update the translation-health tile UI: split into two tiles — "User-side fallback usage (expected; Pattern B is working)" + "Operator-side fallback usage (alarm: regression)".

---

## Session N pickup

This pass is expected to take 3–4 sessions. Each session is bounded by:
- Context window (don't bite more than a single agent can chew without compaction)
- Coherent module boundary (don't half-finish `account`; close it or hand it off cleanly)
- ~80–100 closed GAPs per session OR one module-slice closed end-to-end, whichever is smaller

**Recommended session split:**

- **Session 1 (S1 + S2 partial for largest module):**
  - Author `docs/v3/i18n-gaps/operator-surface-catalogue.md` (S1 in full).
  - Close `account` module GAPs (1,030 entries). Likely needs to chunk across session 1 + session 2; commit at clean boundaries (e.g., one staff sub-route per commit).
  - Hand-off note in `.codex-temp/v3-07b-operator-surface-i18n/session-1-residual.md` listing what's left of `account` for session 2.

- **Session 2 (S2 continued for account + jobs):**
  - Finish `account` GAPs.
  - Close `jobs` module GAPs (673 entries).
  - Hand-off note for session 3.

- **Session 3 (S2 small modules + S3 + S4):**
  - Close `hubHome`, `surface`, `marketplace`, `care`, `auth`, `consent` GAPs (~145 entries).
  - Build server-message resolver in `@henryco/i18n` (S3 module work).
  - Sweep server-emitted error bodies across apps (S3 sweep work).
  - Email + notification template typing (S4).
  - Hand-off note for session 4.

- **Session 4 (S5 + S6 + S7 + S8 + S9):**
  - PDF + structured-data + og:image + share-text typing (S5).
  - Scanner ambiguity audit + classification (S6).
  - en-US completeness audit + report (S7).
  - Three new CI linters + workflow update (S8).
  - Telemetry tightening + tile split (S9).
  - Final report.

**Each session reports residual work in this format** (file: `.codex-temp/v3-07b-operator-surface-i18n/session-N-residual.md`):

```
# Session N residual

## What closed this session
- <module>: X of Y GAPs closed
- <scope>: <S-number> complete / partial / not-started

## What remains
- <module>: Z GAPs remaining
- <scope>: <S-number> blocking on …

## Next session pickup
- Start by reading: <file paths>
- Branch from: `v3/07b-operator-i18n-session-(N)` HEAD
- Estimated effort to close residual: <hours>
```

**Why session-aware:** the owner runs parallel sessions on this tree; a session that quota-cuts mid-`account` should hand off enough state that the next session resumes without re-reading the entire scope.

---

## Out of scope

- **New locale additions.** 12 locales preserved (en/fr/es/pt/ar/de/it/zh/hi/ig/yo/ha). If the owner wants a 13th locale, that's V3-84 or later.
- **Pattern B DeepL engine changes.** The runtime DeepL resolver is fine as-is; V3-07b extends its consumers but does not touch the engine.
- **`packages/search-ui/` modifications.** Owner-reserved per memory. Any operator surface that consumes search-ui props/components: cover the consumer (the wrapping app) — never modify search-ui itself.
- **Customer-facing surface coverage that V3-07 already closed.** Do NOT re-do V3-07's work. Read V3-07's scan + commit log; treat closed entries as closed.
- **Pricing/contract/legal text wholesale rewrites.** If a typed-copy entry would change the legal meaning of a clause, escalate to the owner; do NOT auto-translate or auto-rephrase compliance-sensitive copy.

---

## Dependencies

**Must be on `main` before V3-07b starts:**
- V3-07 — provides the helper (`packages/config/domain.ts`), the scanner (`scripts/v3/hardcoded-text-scan.mjs`), the baseline `docs/v3/i18n-gaps/hardcoded-scan-2026-05-22.json`, the exempt list, and the CI gate (`.github/workflows/i18n-check.yml`).
- V3-12 — Foundation Lock acceptance. V3-07b is hardening on top of the locked foundation; don't disturb the lock.

**Blocks:**
- V3-94 (V3 integration test) — re-runs the CI gate from V3-07 + V3-07b. If V3-07b regresses, V3-94 fails.

**Does NOT block:**
- Phase C start (V3-13+). V3-07b is hardening; Pattern B handles user-facing translation today.

---

## Inheritance

- `@henryco/i18n` — extend (do not fork). New `server.ts` module. Existing `<T />` + `t()` API preserved.
- `packages/config/domain.ts` — extend if any new domain references emerge from S5 (PDF templates referencing henrycogroup.com URLs). Otherwise no change.
- `docs/v3/i18n-gaps/` — close + update. New files: `operator-surface-catalogue.md`, `operator-surface-closure.md`, `en-us-completeness-report.md`, `compliance-typed-locales.md`, `server-message-exempt.json`.
- Existing `pnpm i18n:check` + `pnpm i18n:check:strict` from V3-07 — extend. Three new checks added (S8).
- `.github/workflows/i18n-check.yml` from V3-07 — extend with three new check jobs.
- Translation-health tile from V3-07 (S9) — split into user-side + operator-side.

---

## Implementation requirements

### New files

- `packages/i18n/src/server.ts` — `tServer()` resolver with request-header-aware locale detection (S3).
- `scripts/v3/i18n-check-keys-exist.mjs` — build-time linter checking every label reference resolves in en-US (S8).
- `scripts/v3/i18n-check-server-messages.mjs` — server-message literal detector (S8).
- `scripts/v3/i18n-check-email-templates.mjs` — email template literal detector (S8).
- `docs/v3/i18n-gaps/operator-surface-catalogue.md` — S1 output.
- `docs/v3/i18n-gaps/operator-surface-closure.md` — per-session closure summary.
- `docs/v3/i18n-gaps/en-us-completeness-report.md` — S7 output.
- `docs/v3/i18n-gaps/compliance-typed-locales.md` — S7 sub-bar (per D17.b/c).
- `docs/v3/i18n-gaps/server-message-exempt.json` — S8 whitelist.
- `docs/v3/i18n-server-messages.md` — convention document for `tServer()` usage (S3).
- Per-app surface copy module additions across `packages/i18n/src/locales/en/<module>/**` (S2, S4, S5).

### Modified files

- `.github/workflows/i18n-check.yml` — add three new check jobs.
- `packages/i18n/package.json` — export `server` entry.
- `scripts/v3/hardcoded-text-scan.mjs` — tighten AMBIGUOUS classification rules (S6).
- Per-app server endpoints across `apps/*/app/api/**` + `apps/*/app/**/route.ts` + middleware files (S3).
- Email + notification + PDF templates across `packages/email/templates/**`, `packages/branded-documents/**`, `packages/seo/**`, `packages/share/**` (S4, S5).
- Translation-health tile component (S9).

---

## Trust / safety / compliance

- **Compliance-sensitive copy (PDF legal disclaimers, KYC letters, contract templates):** Owner must approve the en-US source for these surfaces. Do NOT auto-translate compliance text into other locales without human review. Maintain the human-reviewed sub-set in `docs/v3/i18n-gaps/compliance-typed-locales.md` per D17.c.
- **Server-emitted error bodies:** Audit for PII leakage. Error messages must never include user IDs, email addresses, raw SQL fragments, or internal service URLs in any locale. If V3-07 missed any of these, fix them in V3-07b's S3 sweep.
- **Email subject lines:** Respect the sender-identity policy per D7 (per-division for transactional). Confirm subject lines don't accidentally reveal account states a user shouldn't see in a notification preview.
- **A11y aria-labels:** Translated aria-labels must read naturally for screen readers in each locale. Pattern B DeepL is OK for non-compliance aria-labels; compliance-flagged a11y text (e.g., warnings on a payment confirmation page) gets human-reviewed translation.
- **ANTI-CLONE:** Localized strings are public anyway — no protection concern for translation text itself. Do NOT embed company-proprietary scoring/ranking explanations in operator UI labels; keep those server-side and gated to authenticated operators only.

---

## Mobile + desktop parity

- Mobile Expo apps (`apps/super-app/`, `apps/company-hub/`) use their own i18n stack but must resolve the same labels. Verify after each session: a label added to `packages/i18n/src/locales/en/<module>/` resolves identically on web + mobile.
- Operator surfaces are predominantly web; mobile operator presence is limited. Document any mobile operator surface in the S1 catalogue.

---

## i18n

- This entire pass IS the i18n hardening pass. Pattern A typed copy is the source-of-truth for the en-US locale; Pattern B DeepL fills the other 11 at runtime. Per memory `project_henryco_i18n_architecture.md`.
- Do NOT introduce new locales. 12 are preserved.
- Do NOT modify the runtime DeepL engine; only extend its consumer surface (server-side `tServer()`).
- Do NOT bypass `<T />` / `t()` / `tServer()` for any user-or-operator-facing string. If you discover a string that can't be routed through one of these APIs, document why and propose a fix in the session residual note.

---

## Validation gates

1. **Scanner output:** `pnpm i18n:check:strict` on the V3-07b branch returns ZERO GAPs (any classification including AMBIGUOUS — V3-07b drives AMBIGUOUS to zero per S6).
2. **Key-existence linter:** `pnpm i18n:check:keys-exist` passes. Every `<T />` / `t()` / `tServer()` reference resolves in en-US Pattern A.
3. **Server-message linter:** `pnpm i18n:check:server-messages` passes. No raw string literals in server-emitted error bodies.
4. **Email-template linter:** `pnpm i18n:check:email-templates` passes. All email subject + body + CTA strings typed.
5. **CI strict-mode** (`.github/workflows/i18n-check.yml`) passes on every PR commit.
6. **Manual walk:** sample 20 operator pages across apps (staff dashboards in account/hubHome/marketplace/jobs/care/property/studio/logistics/learn; admin workspaces in account; owner-only routes). Confirm every visible string resolves to en-US Pattern A and that switching the browser locale fires Pattern B DeepL for the same string.
7. **Owner-workspace translation-health tile:** for a 72h window after deployment, operator-side fallback usage is ZERO `(surface_context = "operator", fallback_used = true)` events. User-side fallback usage is non-zero (Pattern B is working as designed for user surfaces).
8. **Email roundtrip:** Send one of every email template to a test address in each of 12 locales. Verify subject + body + CTA + sender-name render in the recipient's locale with no label-name fallback.
9. **PDF roundtrip:** Generate one of every PDF template (invoice, receipt, contract, KYC letter) in each of 12 locales. Verify content renders in the recipient's locale.
10. **Structured data:** Validate JSON-LD output on 5 representative pages via Google's Rich Results Test in each of 3 spot-check locales (en, fr, ar). No raw label keys appearing.

---

## Deployment gate

- All 10 validation gates pass.
- 72h soak with operator-side fallback events = 0.
- Owner sign-off on the operator-surface coverage report (D17 ratified before start; sign-off on closure here).
- Final session residual is empty (no remaining GAPs in catalogued surfaces).

---

## Final report contract

`.codex-temp/v3-07b-operator-surface-i18n/report.md` — standard 9-section V3 report format, plus:

1. **Before/after counts** per module + per surface type.
2. **Per-module closure summary** — what closed, what was deferred (and why).
3. **Locale-completeness matrix** — for each of 12 locales: % of label keys covered by Pattern A typed copy vs % filled by Pattern B DeepL. en-US should be 100% Pattern A. Other 11 should be 100% covered (Pattern A + Pattern B). Compliance sub-set should be 100% Pattern A in flagged locales.
4. **Server-message sweep summary** — files audited, literals replaced, exempt entries documented.
5. **Email/PDF/structured-data closure** — templates typed, locale roundtrip results.
6. **Scanner tightening report** — AMBIGUOUS entries audited, classification rules added.
7. **Telemetry validation** — 72h soak data.
8. **Per-session residual notes** — links to `session-N-residual.md` files.
9. **Owner-decision dependencies (D17) ratification trail** — link to DECISIONS-REQUIRED.md entry with the owner answer + any pivot notes.

---

## Self-verification

- [ ] S1: `docs/v3/i18n-gaps/operator-surface-catalogue.md` exists with every operator surface enumerated by app, sub-area, file path, surface type, current state.
- [ ] S2: All 1,305+ scanner-detected operator-surface GAPs closed in Pattern A en-US. Scanner re-run shows ZERO operator GAPs.
- [ ] S3: `tServer()` shipped in `@henryco/i18n`. Every server endpoint with user-facing JSON body uses it. Convention documented in `docs/v3/i18n-server-messages.md`.
- [ ] S4: Every email/notification/SMS template subject + body + CTA + sender-name typed.
- [ ] S5: PDF templates + structured-data builders + og:image renderers + share-text generators all typed.
- [ ] S6: Scanner AMBIGUOUS count = 0. Every rule that resolved an AMBIGUOUS is codified.
- [ ] S7: en-US Pattern A coverage = 100% of reachable label keys. `en-us-completeness-report.md` published.
- [ ] S8: Three new CI linters live (`keys-exist`, `server-messages`, `email-templates`). Workflow updated.
- [ ] S9: Telemetry rate-limited; tile split into user-side + operator-side; alarm on operator-side regression.
- [ ] 10 validation gates pass.
- [ ] 72h soak: operator-side fallback events = 0.
- [ ] Owner sign-off on coverage report (D17 closed).
- [ ] Per-session residual notes empty.
- [ ] Report written: `.codex-temp/v3-07b-operator-surface-i18n/report.md`.
- [ ] `packages/search-ui/` untouched (owner reservation honored).
- [ ] No new locales introduced (12 preserved).

---

## The bar (repeated for emphasis)

The owner's verbatim ask:

> "It MUST make it extremely perfect so that no more mistakes will ever be made again in translation, even in the future."

That bar is met when:
1. Every operator-visible string in the product resolves through Pattern A or Pattern B.
2. CI gates prevent any new hardcoded string from merging.
3. The runtime telemetry alarm catches any operator-side fallback (which should be zero).
4. The en-US Pattern A source-of-truth is provably complete — a build-time linter says so.

Anything short of that is residual work. Document it, sign off the parts that ARE perfect, and hand off the rest to the next session.

No weak language. No "mostly done". The bar is ZERO mistakes ever.
