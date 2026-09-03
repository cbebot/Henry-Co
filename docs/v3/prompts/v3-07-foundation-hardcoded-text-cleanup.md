# V3-07 — Foundation Lock: Hardcoded Text Cleanup

> **STATUS: SHIPPED — PR #134.** This pass is merged and certified on `main`. This document is the elevated canonical spec and closure record. The `## Mandatory scope` sections describe the i18n-gap closure, the `@henryco/config` domain helper, the hardcoded-text scanner, and the strict CI gate that LANDED. Two explicit follow-ups remain and are owned by sibling passes: **V3-07c** finishes the remaining ~156 `henrycogroup.com` literal replacements, and **V3-07b** closes operator-surface i18n GAPs. Do **not** re-implement the scanner or the helper — they exist; close residual GAPs against them.

**Pass ID:** V3-07  ·  **Phase:** B (Foundation Lock)  ·  **Pillar:** P12 (Global)
**Dependencies:** —  ·  **Effort:** M  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role
You are the V3 Foundation engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass closes the hardcoded-text sub-bar of the Foundation Lock: it drives the open `docs/v3/i18n-gaps/` work units to zero, retires hardcoded `henrycogroup.com` literals behind the `@henryco/config` domain helper, sweeps remaining JSX/toast/error/email string-literals into `@henryco/i18n` surface labels, and installs a strict CI gate so no new hardcoded user-facing text can ship. The line you must not cross: this is a *string-extraction and domain-helper* pass — you never add a new locale, never fork `@henryco/i18n`, and never touch `packages/search-ui/` (owner-reserved, quality reference only).

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/07-hardcoded-text-cleanup` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
The Phase-A baseline (`docs/v3/AUDIT-BASELINE.md` §3.7) recorded that the i18n A1 wave had extracted the bulk of hardcoded strings into surface labels, but left an open `docs/v3/i18n-gaps/` directory (`extra-label-gaps.json`, `extra-label-universe.json`, `module-gaps.json`, `summary.json`, `work-units.json`) and ~30 hardcoded `henrycogroup.com` literals in Care/Account code. Memory `project_henryco_i18n_architecture.md` is the architecture of record: custom `@henryco/i18n`, **Pattern A** typed copy keys + **Pattern B** `translateSurfaceLabel` runtime DeepL fallback, 12 locales, passes 18/18B/18C closed. Memory `feedback_dashboard_search_engine_no_touch.md` reserves `packages/search-ui/` — never modify it.

The gap this pass closed: a single ergonomic domain helper, a strict scanner with an allow-list, and a CI gate. The shipped artifacts are real and must be reused: `packages/config/domain.ts` exports `henryDomain(division, path)` / `henryWebRoot(path)` / `henrySubdomain(host, path)` / `henryDomainHost(division)` (thin, env-aware wrappers over `COMPANY` in `company.ts`, honouring `NEXT_PUBLIC_BASE_DOMAIN` and Expo `EXPO_PUBLIC_HENRYCO_ENV`); `scripts/v3/hardcoded-text-scan.mjs` is the scanner (exposed as `pnpm i18n:scan`); `docs/v3/i18n-gaps/exempt.json` is the allow-list consumed by the scanner; `docs/v3/i18n-gaps/hardcoded-scan-<datestamp>.json` snapshots are the baselines (latest `hardcoded-scan-2026-05-27.json`); and `pnpm i18n:check` / `i18n:check:strict` (`scripts/i18n-check.mjs`) is the wired CI gate.

> **Brand note (post-2026-06-02 identity unification):** `packages/config/domain.ts` still carries a stale `Henry & Co.` *code comment*. Code comments are internal, not user-facing — leave the working code alone, but any prompt-, doc-, or user-facing string this pass produces uses the unified brand: **Henry Onyx** (user-facing) / **Henry Onyx Limited** (legal). When the comment is next edited for another reason, correct it to "Henry Onyx"; do not churn the file solely for the comment.

## Mandatory scope

### S1 — Close every open `docs/v3/i18n-gaps/` work unit (SHIPPED)
Read the gap manifests — `extra-label-gaps.json` (labels referenced in code but undefined in any locale module), `module-gaps.json` (copy modules missing per-locale keys), `summary.json` (aggregate counts), `work-units.json` (discrete units), and `extra-label-universe.json` (the full referenced-label set). For every open unit: add the missing label to its surface module, wire any referencing code, and guarantee at minimum an `en-US` key (Pattern B runtime DeepL fills the other 11 locales). Do **not** add new locales — the platform is fixed at 12.

### S2 — Retire `henrycogroup.com` literals behind the domain helper (SHIPPED here; tail in V3-07c)
The `@henryco/config` domain helper (`packages/config/domain.ts`) is the canonical replacement surface:
- `henryDomain('care')` → `https://care.henrycogroup.com` (env-resolved); `henryDomain('care', '/book')` appends a path.
- `henryWebRoot()` → the bare base domain; `henryWebRoot('/terms')` appends.
- `henrySubdomain('hq')` → non-division hosts (`hq.`, `staff.`, `files.`, `status.`).
- `henryDomainHost('care')` → bare host for JSON-LD `url` fields.

This pass replaced the ~30 literals named in the baseline (Care/Account). The remaining ~156 literals across `apps/` + `packages/` (excl. `packages/search-ui/`) are a mechanical sweep owned by **V3-07c** (henrycogroup-domain-sweep) — it uses the same helper. The literal `henrycogroup.com` is forbidden in shipped code; V3-07c is what drives the count to zero.

### S3 — Hardcoded-string scanner (SHIPPED)
`scripts/v3/hardcoded-text-scan.mjs` walks `apps/` and `packages/` (excluding `node_modules`, `dist`, `.next`, and `packages/search-ui` per the owner reservation). It flags JSX text content (`<div>text</div>`), user-visible JSX attributes (`title`, `aria-label`, `placeholder`, `alt`), and toast/alert messages, classifying each:
- **OK** — already a surface-label reference (`<T label="surface:…"/>` or `t('…')`).
- **GAP** — hardcoded user-visible text.
- **EXEMPT** — dev-only label (`data-testid`, `key`, internal constant), per `docs/v3/i18n-gaps/exempt.json`.
- **AMBIGUOUS** — needs manual review.

Output snapshots land at `docs/v3/i18n-gaps/hardcoded-scan-<datestamp>.json`.

### S4 — Fix every GAP (SHIPPED)
For each GAP: add the label to the appropriate `@henryco/i18n` surface module, replace the hardcoded JSX with `<T label="surface:…"/>` (or `t()`), and verify the `en-US` key resolves. The brand strings in any extracted copy resolve from `@henryco/config` (Henry Onyx), never hardcoded.

### S5 — Toast / alert message audit (SHIPPED)
Every `toast.success(…)`, `toast.error(…)`, `alert(…)`, `<Alert>…</Alert>`: extracted to a surface label, made user-friendly (no raw API error strings leaked to users).

### S6 — Error-boundary copy (SHIPPED)
Every `error.tsx` and error-boundary fallback (the canonical `@henryco/observability` error surface): copy extracted to a surface label and given a concrete recovery action.

### S7 — Email + notification template copy (SHIPPED)
`@henryco/email` templates and `@henryco/notifications` payloads: subject/body extracted, localized per recipient's preferred locale, sender name + subject branded per division from `@henryco/config` (the `brand-emails.ts` registry) — **Henry Onyx <Division>**, legal entity **Henry Onyx Limited** where a legal name is required.

### S8 — Strict CI gate (SHIPPED)
`pnpm i18n:check:strict` (`scripts/i18n-check.mjs --strict`) runs the scan in strict mode and fails CI when new hardcoded JSX/attribute/toast text appears. `docs/v3/i18n-gaps/exempt.json` is the justified allow-list (brand idioms, dev-only labels, vendor-mandated text); `packages/search-ui/` is hard-excluded. The strict baseline is the dated `hardcoded-scan-*.json` snapshot (refreshed when the gate legitimately moves — e.g. commit `bf9d8c58` refreshed it to 2026-05-27).

### S9 — Telemetry (SHIPPED)
- `henry.i18n.label.missing_at_runtime` — `{ labelKey, locale, fallbackUsed }` (named per `henry.<domain>.<noun>.<verb>`).

Feeds the owner-workspace "Translation health" tile: daily missing-label count + DeepL fallback usage.

## Out of scope
- **New locales** — the platform is fixed at 12; this pass never adds one.
- **Locale-switcher UI** — already shipped (12-locale selector, commit `90cc65ea`).
- **Pattern B runtime DeepL engine** changes — not modified here.
- **`packages/search-ui/`** — owner-reserved; never touched.
- **The remaining ~156 `henrycogroup.com` literals** — **V3-07c** (mechanical sweep with the same helper).
- **~1,305 operator-surface i18n GAPs** (staff dashboards, admin workspaces, server messages, emails, PDFs, structured data, A11y) — **V3-07b** (operator-surface-i18n, owner-gated D17).

## Dependencies
- **Deps:** none (Phase B wave-1 parallel pass).
- **Blocks:** V3-11 (one-job-per-card) — cleaner copy makes the per-card audit higher-signal. V3-94 (closure integration test) — re-runs the i18n-check gate, including the V3-07b/V3-07c hardening output.

## Inheritance
- `@henryco/i18n` — extend (Pattern A typed copy + Pattern B runtime DeepL); never fork.
- `@henryco/config` — the domain helper (`domain.ts`) + brand registry (`company.ts`) + email-sender registry (`brand-emails.ts`).
- `scripts/i18n-check.mjs` (the wired CI gate, commit `738b03ec`) + `scripts/v3/hardcoded-text-scan.mjs` (the scanner) + `docs/v3/i18n-gaps/` (the gap directory + exempt list).

## Implementation requirements

### Files
- `packages/config/domain.ts` (the domain helper — shipped).
- `scripts/v3/hardcoded-text-scan.mjs` (the scanner — shipped).
- `docs/v3/i18n-gaps/hardcoded-scan-<datestamp>.json` (dated snapshots — outputs).
- `docs/v3/i18n-gaps/exempt.json` (justified allow-list — shipped).
- Surface-copy module updates in `@henryco/i18n` per S1 + S4.
- Per-app GAP fixes (excl. `packages/search-ui/`).
- CI extension wiring strict mode into `i18n:check`.
- **No migrations. No RLS changes. No env changes** (the helper is env-aware via existing `NEXT_PUBLIC_BASE_DOMAIN` / `EXPO_PUBLIC_HENRYCO_ENV`).

### Trust / safety / compliance
- Never localize dev-only labels (`data-testid`, internal keys) — they belong in `exempt.json`.
- Email subject lines respect the sender-identity policy and the **Henry Onyx Limited** legal entity where a legal name is required (CAC/Paystack compliance).
- ANTI-CLONE: localized public strings are public by definition — no protection concern.
- Payment-surface copy is style/label-only here: extracting a payment screen's button label to i18n must not alter any money state, status, or amount.

### Mobile + desktop parity
- The Expo super-app uses its own i18n stack; verify the same surface labels resolve there. Web mobile + desktop both verified for any layout shift introduced by longer translated strings.

### i18n
- This entire pass **is** the i18n cleanup. Namespaces follow `surface:<area>` (e.g. `surface:payments`, `surface:dashboard`, `surface:loading`, `surface:errors`, `surface:email`). Every extracted label has an `en-US` key; Pattern B fills the other 11 locales at runtime. Labels, status text, errors, toasts, email subject/body all translated — zero hardcoded user-facing strings remain (verified by the strict gate).

### Brand & design system
- Brand strings resolve from `@henryco/config`: **Henry Onyx** (user-facing), division = "Henry Onyx <Division>", legal = **Henry Onyx Limited**. The retired "Henry & Co." (and "Henry Holdings", "HenryCo Group", etc.) must not appear in any extracted user-facing string. Code identifiers (`@henryco/*`, env prefixes) stay "HenryCo" — unchanged. Any UI touched uses locked tokens; CLS ≈ 0 even when translated strings are longer.

## Validation gates
1. **CI** — typecheck + lint + test + build green; `pnpm i18n:check:strict` passing.
2. **Scan** — `pnpm i18n:scan` shows ZERO new GAPs vs the dated baseline; AMBIGUOUS entries resolved to OK/EXEMPT.
3. **Gap closure** — every open unit in `docs/v3/i18n-gaps/` (work-units / module-gaps / extra-label-gaps) closed.
4. **Domain literals** — the ~30 baseline `henrycogroup.com` literals retired via the helper (full-zero is V3-07c).
5. **Live walk** — sample 10 pages per app; confirm no untranslated runtime fallbacks for `en-US` and that Pattern B fires (non-zero, no surprises) for other locales.
6. **Translation-health tile** — owner-workspace tile shows expected DeepL usage from `henry.i18n.label.missing_at_runtime`.

## Deployment gate
- All gates green; the strict CI gate active; the dated scan snapshot committed as the new baseline. Behaviour-neutral copy pass → a short soak watching the translation-health tile for unexpected missing-label spikes before declaring closed.

## Final report contract
`.codex-temp/v3-07-hardcoded-text-cleanup/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion), plus before/after scan counts and the `i18n-gaps/` closure summary. Deferred items must name V3-07b and V3-07c explicitly.

## Self-verification
- [ ] S1 — every open `docs/v3/i18n-gaps/` work unit closed; no new locale added.
- [ ] S2 — the ~30 baseline `henrycogroup.com` literals retired via `@henryco/config` helpers; remaining ~156 handed to V3-07c.
- [ ] S3 — `pnpm i18n:scan` produces a dated machine snapshot; `exempt.json` justified.
- [ ] S4 — every GAP replaced with an `@henryco/i18n` surface label; `en-US` resolves.
- [ ] S5 — toast/alert messages extracted and user-friendly.
- [ ] S6 — error-boundary copy extracted with a recovery action.
- [ ] S7 — email/notification copy localized; sender branded per division (Henry Onyx); legal name Henry Onyx Limited where required.
- [ ] S8 — `pnpm i18n:check:strict` CI gate active and failing on new hardcoded text.
- [ ] S9 — `henry.i18n.label.missing_at_runtime` emitting; translation-health tile rendering.
- [ ] Brand: zero "Henry & Co." user-facing strings; code identifiers unchanged; `packages/search-ui/` untouched.
- [ ] Report written; V3-07b + V3-07c named as the explicit residual passes. Hand-off: Foundation-Lock close (V3-12).
