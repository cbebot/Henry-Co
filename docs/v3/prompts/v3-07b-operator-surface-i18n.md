# V3-07b — Foundation hardening: Operator-Surface i18n Completeness

**Pass ID:** V3-07b  ·  **Phase:** B — Foundation Lock (hardening tail; NOT a Phase B blocker)  ·  **Pillar:** P12 (Global)
**Dependencies:** V3-07 (shipped, PR #134 — scanner + CI gate live), V3-12 (Foundation Lock acceptance CERTIFIED, PR #168)  ·  **Effort:** L (3–4 agent sessions)  ·  **Parallel-safe:** N within itself (sessions chain); Y vs every other V3 pass
**Owner gate:** D17 (operator-surface scope envelope + locale-completeness bar — **read the live answer before starting**)  ·  **Risk class:** —

---

## Role

You are the V3 Foundation engineer for Henry Onyx. You execute exactly this one pass — or one session-chunk of it (**this is a 3–4 session wave**) — then stop and report.

This pass closes the **operator-surface i18n bar**: every staff dashboard, admin/owner workspace, internal tool, server-emitted message, email, PDF, structured-data field, push/SMS text, and A11y label must resolve from typed copy through `@henryco/i18n` — never a raw literal, never a label-name fallback an operator can see. After V3-07b ships, the CI gate prevents any new hardcoded operator-visible string from merging, and a runtime alarm catches any operator-side DeepL fallback as a regression.

**Owner's verbatim bar (D17, recorded at V3-07 closure):**

> "We need a full coverage, no hardcoded texts, all server messages, any written texts from any angles in the website. It MUST make it extremely perfect so that no more mistakes will ever be made again in translation, even in the future."

Take it literally. The deliverable is not "fewer gaps" — it is **ZERO** operator-visible literals, **ZERO** scanner ambiguity, and a CI gate strong enough that the bar can never regress. The line you must not cross: do not touch `packages/search-ui/` (owner-reserved), do not introduce a 13th locale, do not alter the runtime DeepL engine, and do not auto-rephrase compliance-sensitive legal copy.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/07b-operator-i18n-session-N` (e.g. `-session-1`) |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

The i18n system is custom `@henryco/i18n` with **Pattern A** typed copy + **Pattern B** runtime DeepL fallback (per memory `project_henryco_i18n_architecture.md`; passes 18/18B/18C closed; 12 locales: en/fr/es/pt/ar/de/it/zh/hi/ig/yo/ha). The real architecture as it exists on `main` today — internalize this, because the original draft of this prompt referenced a `src/locales/en/<module>/` layout that **does not exist**:

- **Copy modules are flat per-surface files:** `packages/i18n/src/<surface>-copy.ts` (e.g. `account-copy.ts`, `jobs-copy.ts`, `hub-owner-copy.ts`, `hub-workspace-copy.ts`, `logistics-staff-owner-copy.ts`, `logistics-staff-dispatcher-copy.ts`, `consent-copy.ts`, `auth-copy.ts`, `surface-copy.ts`, `surface-extra-labels.ts`, `state-copy.ts`, `error-fallback-copy.ts`). Each exports a typed interface + `get<Surface>Copy(locale: AppLocale)`. The **en source-of-truth is the EN constant inside that same file** (e.g. `ACCOUNT_COPY_EN`); other-locale constants exist where hand-authored, and missing keys DeepL-fill at runtime.
- **Server entry already exists:** `packages/i18n/src/server.ts` re-exports the copy getters + the runtime translator. Reach DeepL only via `@henryco/i18n/server` (it imports `DEEPL_API_KEY`; must stay server-only).
- **Pattern B runtime translator already exists:** `packages/i18n/src/translate-runtime.ts` exposes `translateText(text, locale, { cache })` — identity-passthrough for source locale, Postgres-cached DeepL (`createSupabaseTranslationCache`), graceful source-text fallback for unsupported locales (ig, yo, ha, hi). `surface-copy.ts` exposes `translateSurfaceLabel`. **Do not fork or alter this engine — extend its consumers only.**
- **Scanner + CI gate already exist:** `scripts/v3/hardcoded-text-scan.mjs` (the AST/regex scanner) and `scripts/i18n-check.mjs` (the `pnpm i18n:check` / `pnpm i18n:check:strict` runner). The CI gate runs strict mode. Baselines live in `docs/v3/i18n-gaps/`: latest scan is `hardcoded-scan-2026-05-27.json` (the live baseline; `-22`/`-23` are prior snapshots), plus `summary.json`, `module-gaps.json`, `work-units.json`, `exempt.json`.

**Gap baseline** (`docs/v3/i18n-gaps/summary.json`, per-module per-locale counts): `account` dominates (e.g. de 143, it 127, zh 117, hi 116, ig 119, yo 118, ha 118; fr 63), `jobs` next (de 76, it 77, zh 68, yo/ha 69; fr 54), then `hubHome`, `surface`, `marketplace`, `care`, `auth`, `consent`. Aggregate across the 11 non-en locales is on the order of **~1,300 operator-surface gaps**. **Important nuance the original draft missed:** a large share of `module-gaps.json` entries are classified `"echo"` (the string is intentionally identical in that locale — "WhatsApp", "Studio", "Marketing", "FAQ"). Echoes are NOT failures; do not "translate" them. The bar is: every *operator-visible string resolves through Pattern A en source + Pattern B at runtime with no label-name leak* — not "every echo gets a different word."

**Surfaces the JSX scanner does not see (and this pass must also close):**
- Server-emitted JSON bodies — `NextResponse.json({ error, message, title, description })` in `apps/*/app/**/route.ts` and `apps/*/app/api/**`.
- Email subject + body + CTA + sender-name in `packages/email/templates/**`.
- PDF content in `packages/branded-documents/**` (invoice, receipt, contract, KYC letter).
- Structured-data literals in `packages/seo/**` (JSON-LD `name`/`description`/`legalName`/breadcrumb names).
- Push/SMS text; `apps/*/app/opengraph-image.tsx` SVG overlays; social-share text; Sentry breadcrumb human-readable fields; audit-log human-readable description columns.

Owner reservation: `packages/search-ui/` is quality-reference-only — never modified (memory `feedback_dashboard_search_engine_no_touch.md`). Operator surfaces that *wrap* search-ui get covered in the wrapping app; the package itself is untouched.

**The gap this pass closes:** Pattern B already keeps user-facing surfaces translated at runtime; what remains unprotected is operator-side text, server-emitted strings, and machine-generated documents that never round-trip through `<T />`. V3-07b makes those bulletproof and gates them so they can never regress.

## Mandatory scope

> **Owner-gate first.** Before writing any code, open `docs/v3/DECISIONS-REQUIRED.md` and read **D17**. The recommendation is D17.a Option A (full operator scope) + D17.b Option A (en source-of-truth in Pattern A; Pattern B DeepL fills the other 11 lazily; build-time linter rejects any `<T />` referencing a key absent from en). If the owner answer slot is still blank, **do not re-litigate** — proceed on the recommended envelope, state that assumption explicitly in your session report, and flag any compliance-sub-set (D17.c) you encounter for owner review rather than auto-translating it.

### S1 — Catalogue every operator surface

Before any label code, produce `docs/v3/i18n-gaps/operator-surface-catalogue.md` — the source-of-truth list of every operator page, route, modal, template, generator, and string-emitting code path in scope. **Anything not in the catalogue does not exist for V3-07b; anything in it must close to ZERO gaps.**

Enumerate per app/package, by sub-area:
- Staff dashboards / owner workspaces — `apps/hub/app/**` (owner + workspace + command surfaces), `apps/account/app/**` staff/admin routes, `apps/logistics/app/**` staff dispatcher/owner surfaces, plus employer/provider/instructor/agency operator surfaces across jobs/care/property/studio/learn/marketplace.
- Per surface type: page title + meta + og:image alt; error.tsx + error-boundary fallback; `NextResponse.json` error bodies; zod/hand-rolled validation messages; middleware redirect error strings; server-action `{ error }` returns; email subject/body/CTA/sender; push/SMS text; PDF content; JSON-LD fields; share text; confirm-modal text; dropdown/option labels; form label/placeholder/help/error; table headers; empty-state CTA/headline; filter/segment chip labels; breadcrumbs; aria-label / aria-describedby; `sr-only` text; tooltips; status/badge labels; human-readable log lines (Sentry breadcrumbs, audit description columns).

Each catalogue entry records: app · file path · surface type · current state (hardcoded / partial / fully-labeled) · the copy module + key it should resolve to (e.g. `account-copy.ts → staff.payouts.title`).

### S2 — Close every scanner-detected operator gap

Drive the operator gaps in `docs/v3/i18n-gaps/hardcoded-scan-2026-05-27.json` (current baseline) and `module-gaps.json` to zero. **Operate against the real flat-file structure:**

1. Add the en source string to the appropriate `packages/i18n/src/<surface>-copy.ts` EN constant (the source-of-truth), under an operator-prefixed key (`account.staff.*`, `hubHome.command.*`, `logistics.owner.*`) so operator-only intent never leaks into a user-facing key.
2. Wire the call site to `<T label="…" />` or `t('…')` / `getXxxCopy(locale).…` per the surrounding idiom.
3. Verify the en key resolves; verify Pattern B (`translateText` / `translateSurfaceLabel`) fills the other 11 locales at runtime.
4. If a surface has no copy module yet, create a new flat `packages/i18n/src/<surface>-copy.ts` following the existing convention (typed interface + EN constant + `get<Surface>Copy(locale)`), and re-export its getter from `packages/i18n/src/index.ts` and `packages/i18n/src/server.ts`.

**Anti-pattern hard-stops:**
- Do NOT paste English into a non-en locale constant as a placeholder. Leave the key to Pattern B at runtime. The en constant is the only required source.
- Do NOT mark genuine `"echo"` strings as gaps to "fix" — an intentional same-in-locale token (brand names, "WhatsApp") stays an echo.
- Do NOT leak operator-only labels into user-facing namespaces.

### S3 — Close every server-message path

The scanner sees JSX, not server JSON bodies. This is the largest single sub-scope.

- **Confirm/extend the server resolver.** `@henryco/i18n/server` already exists. If a `tServer(label, locale?, vars?)` convenience does not already wrap `translateText` for route handlers, add it in `packages/i18n/src/server.ts` (or a sibling `server-messages.ts` re-exported from `server.ts`): resolve locale from the request `Accept-Language` header, fall back to `en`, read the same copy modules as the client, and fall through to Pattern B DeepL. Reuse the existing cache client — do not construct a new DeepL path.
- **Sweep server-emitted user-facing fields** across `apps/*/app/**/route.ts`, `apps/*/app/api/**/*.ts`, `apps/*/middleware.ts`, and `'use server'` actions: every `NextResponse.json({ error/message/title/description })` string, every zod `safeParse` message (centralize via a zod `errorMap` where practical), every `throw new Error("…")` and `redirect("?error=…")` that can surface to a human resolves through `tServer()`.
- **Document the convention** in `docs/v3/i18n-server-messages.md`: when `tServer()` vs client `<T />`; server-side locale resolution; var interpolation; the "reused in client UI → prefer client `<T />`" rule; and the rule that NO surface may emit an untyped human-visible string.

### S4 — Email + notification template completeness

For each template in `packages/email/templates/**`: type the subject + greeting + body + CTA + footer + sender-name into a per-division copy module (`email.care.bookingConfirmation.*`, `email.marketplace.orderReceipt.*`). Subject lines + CTAs are short — pre-translate those two surface types to all 12 locales (DeepL with the en source committed) to avoid send-time latency; body paragraphs DeepL-fill at send via the server resolver. Sender names come from a typed `email.senders.*` map (one per division) and respect the D7 sender-identity policy; brand text in senders is **Henry Onyx <Division>**, sourced from `@henryco/config` (`COMPANY.divisions[…].name`), never hardcoded. Push (`@henryco/notifications` / `notifications-ui`) and SMS get identical title/body treatment. Acceptance: every delivered message in every locale resolves with no label-name fallback.

### S5 — Generated content

- **PDF (`packages/branded-documents/**`):** every header/footer/line-item/totals/disclaimer string resolves via `tServer()`; PDFs render in the recipient's locale. Legal entity on receipts/invoices = **"Henry Onyx Limited"** sourced from `@henryco/config` (`COMPANY.group.legalName`), never literal.
- **Structured data (`packages/seo/**`):** JSON-LD `name`/`description`/`Organization.legalName`/breadcrumb names resolve per-locale (default en). `legalName` = Henry Onyx Limited from config.
- **og:image (`apps/*/app/opengraph-image.tsx`):** SVG text overlays read from typed copy, rendered in the locale-resolved string.
- **Social-share text generators:** typed.

### S6 — Drive scanner AMBIGUOUS to zero

Audit every AMBIGUOUS classification in the V3-07 scan output. Classify each (OK or GAP) by reading the surrounding code; codify each resolution rule as a regex/AST predicate in `scripts/v3/hardcoded-text-scan.mjs` so the same shape never returns AMBIGUOUS again. Add genuine developer-label exemptions to `docs/v3/i18n-gaps/exempt.json` (one entry + one-line justification each). Re-run `pnpm i18n:check:strict` — confirm zero AMBIGUOUS; every string is OK or GAP.

### S7 — en source-of-truth completeness

en Pattern A is the source-of-truth; Pattern B fills the rest only if the en key exists (else it cascades to the ugly literal label name). Walk every `<T label="…" />` / `t('…')` / `getXxxCopy().…` / `tServer('…')` reference across `apps/` + `packages/` (excluding `packages/search-ui/`); confirm each resolves to an en string in its `<surface>-copy.ts` EN constant; ADD any missing one. Publish `docs/v3/i18n-gaps/en-us-completeness-report.md` (checklist of every key + en value). Per D17.b Option A, the other 11 locales DeepL-fill lazily — no build-time obligation — **except** any compliance-flagged sub-set from D17.c (e.g. PDF legal disclaimers), which gets a human-reviewed translation committed to typed copy and tracked in `docs/v3/i18n-gaps/compliance-typed-locales.md`.

### S8 — Build-time linters + CI

Extend the existing `pnpm i18n:check` family (V3-07's `scripts/i18n-check.mjs`) with three new checks:
- `scripts/v3/i18n-check-keys-exist.mjs` (`pnpm i18n:check:keys-exist`) — every label reference resolves in an en copy module, else CI fails with `Label '<key>' at <file>:<line> not found in en Pattern A; add it to packages/i18n/src/<module>-copy.ts.`
- `scripts/v3/i18n-check-server-messages.mjs` (`pnpm i18n:check:server-messages`) — flags string literals in `NextResponse.json({ error })` / `throw new Error("…")` / `redirect("?error=…")` across route handlers + actions + middleware; whitelist via `docs/v3/i18n-gaps/server-message-exempt.json` (debug-only routes).
- `scripts/v3/i18n-check-email-templates.mjs` (`pnpm i18n:check:email-templates`) — flags untyped literals in `packages/email/templates/**` subject/body/CTA positions.

Wire all three into the existing i18n CI workflow so every PR runs the original strict gate + the three new checks. Add the scripts to `package.json`.

### S9 — Telemetry tightening

V3-07 emits `henry.i18n.missing_label_at_runtime` (`label_key`, `locale`, `fallback_used`). Extend, keeping the `henry.<domain>.<noun>.<verb>` convention:
- Rate-limit the runtime hook to at most once per `(label_key, locale)` per user-session.
- Add `surface_context` (`operator` | `user`) so the owner translation-health tile splits "user-side fallback (expected; Pattern B working)" from "operator-side fallback (regression; must be zero)".
- Buffer the top-100 unique fallback keys / 24h, deduped + counted, with an "and N more" tail row.
- Alarm: when `surface_context = operator` AND `fallback_used = true` AND a single `label_key` exceeds 5 in 24h, fire the on-call alert (the new-operator-PR-without-a-label regression case).

## Session N pickup

This is a 3–4 session wave, bounded by context window and coherent module boundary (don't half-finish `account`). Each session closes a slice and leaves `.codex-temp/v3-07b-operator-surface-i18n/session-N-residual.md` (what closed · what remains · next-session pickup: files to read first + branch HEAD + estimated remaining effort), because the owner runs parallel sessions on this tree and a quota-cut mid-`account` must resume cleanly.

- **Session 1:** S1 catalogue in full + begin `account` gaps (commit per staff sub-route).
- **Session 2:** finish `account` + close `jobs`.
- **Session 3:** small modules (`hubHome`/`surface`/`marketplace`/`care`/`auth`/`consent`) + S3 server-message resolver & sweep + S4 email/notification typing.
- **Session 4:** S5 generated content + S6 scanner ambiguity + S7 en completeness + S8 linters/CI + S9 telemetry + final report.

## Out of scope

- New locales (12 preserved) — a 13th is V3-84+.
- The Pattern B DeepL engine itself (`translate-runtime.ts` / `deepl.ts`) — extend consumers only.
- `packages/search-ui/` — owner-reserved; cover wrapping apps, never the package.
- Customer-facing surfaces V3-07 already closed — read its scan + commit log; treat closed entries as closed.
- Wholesale rewrites of legal/contract/pricing copy — escalate to owner; never auto-rephrase compliance text (V3-25 owns moderation; V3-21 owns tax copy).

## Dependencies

**Requires on `main`:** V3-07 (PR #134 — scanner `scripts/v3/hardcoded-text-scan.mjs`, runner `scripts/i18n-check.mjs`, baselines in `docs/v3/i18n-gaps/`, CI gate) and V3-12 (Foundation Lock CERTIFIED, PR #168 — don't disturb the lock). **Owner gate:** D17 (read live answer). **Blocks:** V3-94 re-runs this gate — a regression fails closure. **Does NOT block** Phase C start (Pattern B handles user surfaces today).

## Inheritance

- `@henryco/i18n` — extend, never fork. Flat `<surface>-copy.ts` modules; `server.ts` server entry; `translate-runtime.ts` / `surface-copy.ts` (`translateText` / `translateSurfaceLabel`) Pattern B; `index.ts` barrel.
- `scripts/v3/hardcoded-text-scan.mjs` + `scripts/i18n-check.mjs` — extend (tighten + three new checks).
- `docs/v3/i18n-gaps/` — close + update; new files per S1/S3/S7/S8.
- `@henryco/config` — `COMPANY` brand/legal/division names + domain helpers for any brand/URL text.
- `@henryco/observability` — telemetry + audit log for S9.

## Implementation requirements

### Files
- **New:** `docs/v3/i18n-gaps/{operator-surface-catalogue.md, operator-surface-closure.md, en-us-completeness-report.md, compliance-typed-locales.md, server-message-exempt.json}`; `docs/v3/i18n-server-messages.md`; `scripts/v3/{i18n-check-keys-exist.mjs, i18n-check-server-messages.mjs, i18n-check-email-templates.mjs}`; new `packages/i18n/src/<surface>-copy.ts` modules where a surface lacks one.
- **Modified:** `packages/i18n/src/server.ts` (+ optional `server-messages.ts`) for `tServer()`; `packages/i18n/src/index.ts` (barrel for new modules); existing `<surface>-copy.ts` EN constants (S2/S4/S5); `scripts/v3/hardcoded-text-scan.mjs` (S6); `package.json` (new scripts); the i18n CI workflow (S8); server endpoints/middleware/actions across `apps/*` (S3); `packages/email/templates/**`, `packages/branded-documents/**`, `packages/seo/**`, share + og:image generators (S4/S5); the translation-health tile (S9).

### Trust / safety / compliance
- Compliance-sensitive copy (PDF disclaimers, KYC letters, contracts): owner approves the en source; no auto-translation without human review (D17.c → `compliance-typed-locales.md`).
- Server error bodies: audit for PII — no user IDs, emails, raw SQL, or internal URLs in any locale; fix any V3-07 missed.
- Email subjects must not leak account states in notification previews.
- Translated aria-labels must read naturally per locale; compliance-flagged a11y text gets human-reviewed translation.
- Audit-log + Sentry human-readable fields resolve through `tServer()` but remain gated to authenticated operators; never embed proprietary scoring/ranking logic in operator labels.

### Mobile + desktop parity
Expo apps (`apps/super-app`, `apps/company-hub`) must resolve the same keys: after each session verify a key added to `<surface>-copy.ts` resolves identically on web + mobile. Operator presence on mobile is limited — document any mobile operator surface in the S1 catalogue.

### i18n
This pass IS the operator i18n hardening. Pattern A en is source-of-truth; Pattern B DeepL fills the other 11 at runtime. Concrete namespaces touched: operator copy modules — `account-copy` (`account.staff.*`/`account.admin.*`), `hub-owner-copy` / `hub-workspace-copy` (`hubHome.command.*`/`hubHome.owner.*`), `jobs-copy` (employer), `logistics-staff-*-copy`, `care`/`property`/`studio`/`learn` operator slices, `surface-copy` / `surface-extra-labels`, `consent-copy`, plus new `email.*` and server-message keys. Labels, status chips, and errors are all translated. No new locales; DeepL engine untouched.

### Brand & design system
All brand text is **Henry Onyx** (legal **Henry Onyx Limited**, divisions **Henry Onyx <Division>**) sourced from `@henryco/config` (`COMPANY.*`), never hardcoded — "Henry & Co." must never appear. Code shorthand `HenryCo`/`@henryco/*` is unchanged. Any operator UI rendered or styled by this pass uses locked tokens (`--site-*`/`--accent`, Fraunces for editorial) — but this pass is copy-routing, not restyle: don't churn structure or visual design; light+dark, mobile+desktop, CLS≈0, contrast not regressed for any tile touched (S9). Zero hardcoded domains — route any URL text through `henryDomain()`/`henryWebRoot()`.

## Validation gates

1. `pnpm i18n:check:strict` on the branch returns ZERO operator GAPs and ZERO AMBIGUOUS (S6).
2. `pnpm i18n:check:keys-exist` passes — every reference resolves in en Pattern A.
3. `pnpm i18n:check:server-messages` passes — no raw literals in server-emitted bodies.
4. `pnpm i18n:check:email-templates` passes — all email subject/body/CTA typed.
5. CI strict-mode gate + the three new checks green on every PR commit; plus repo `pnpm typecheck` + `pnpm lint` + `pnpm build`.
6. Manual walk: sample 20 operator pages across apps; every visible string resolves to en Pattern A, and switching browser locale fires Pattern B for the same string with no label-name leak.
7. Translation-health tile: 72h post-deploy window shows ZERO operator-side fallback events (`surface_context=operator, fallback_used=true`); user-side fallbacks non-zero (expected).
8. Email roundtrip: one of every template to a test address in each of 12 locales — subject/body/CTA/sender render localized, no label-name fallback.
9. PDF roundtrip: one of every PDF template (invoice/receipt/contract/KYC letter) in each of 12 locales renders localized; legal entity reads "Henry Onyx Limited".
10. Structured data: JSON-LD on 5 representative pages validates via Google Rich Results in en/fr/ar — no raw label keys.

## Deployment gate

All 10 gates green; CI green; 72h soak with operator-side fallback = 0; owner sign-off on the operator-surface coverage report (D17 ratified before start, closure signed here); final session residual empty (no remaining gaps in catalogued surfaces). Ship per V3 discipline: branch off `origin/main` → PR → squash-merge; no force-push, no branch-protection bypass.

## Final report contract

`.codex-temp/v3-07b-operator-surface-i18n/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion), plus: before/after counts per module + surface type; per-module closure summary; a 12-locale completeness matrix (en 100% Pattern A; other 11 covered Pattern A+B; compliance sub-set 100% Pattern A in flagged locales); server-message sweep summary; email/PDF/structured-data closure; scanner-tightening report; 72h telemetry soak; links to each `session-N-residual.md`; and the D17 ratification trail (link to the DECISIONS-REQUIRED.md answer + any assumption noted if the slot was blank).

## Self-verification

- [ ] D17 read in `docs/v3/DECISIONS-REQUIRED.md`; envelope confirmed (or recommended-envelope assumption stated in report).
- [ ] S1: `operator-surface-catalogue.md` enumerates every operator surface by app, sub-area, file path, surface type, current state, target key.
- [ ] S2: every scanner-detected operator gap closed in the real `packages/i18n/src/<surface>-copy.ts` EN constants; echoes left as echoes; re-scan shows zero operator GAPs.
- [ ] S3: `tServer()` available via `@henryco/i18n/server`; every server endpoint/middleware/action with a human-visible body uses it; convention in `docs/v3/i18n-server-messages.md`.
- [ ] S4: every email/notification/SMS subject + body + CTA + sender-name typed; senders sourced from `@henryco/config`.
- [ ] S5: PDF + structured-data + og:image + share-text typed; legal entity = "Henry Onyx Limited" from config.
- [ ] S6: scanner AMBIGUOUS = 0; each resolution rule codified into `hardcoded-text-scan.mjs`.
- [ ] S7: en Pattern A covers 100% of reachable keys; `en-us-completeness-report.md` published; compliance sub-set tracked.
- [ ] S8: three new CI linters live and wired into the i18n workflow + `package.json`.
- [ ] S9: telemetry rate-limited; tile split user/operator; operator-side regression alarm live; events named `henry.i18n.*`.
- [ ] 10 validation gates pass; 72h soak operator-side fallback = 0.
- [ ] `packages/search-ui/` untouched; no new locale; DeepL engine unchanged.
- [ ] Per-session residual notes empty at close; report written at `.codex-temp/v3-07b-operator-surface-i18n/report.md`.
