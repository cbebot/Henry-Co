# V3-07 — Foundation: Hardcoded Text Cleanup

**Pass ID:** V3-07
**Phase:** B (FOUNDATION LOCK)
**Pillar:** P12 (Global)
**Dependencies:** Phase A audit
**Effort:** M (1–2 weeks)
**Parallel-safe:** YES
**Owner gate:** None
**Risk class:** None

---

## Role

You are the V3 Foundation engineer for HenryCo. You execute exactly this one pass, then stop and report.

This pass closes the **hardcoded text cleanup** sub-bar. The i18n A1 wave caught many; this pass closes the remaining gaps, retires the ~30 hardcoded `henrycogroup.com` literals, and reaches the bar where no further hardcoded user-visible text exists in app or package code.

---

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/07-hardcoded-text-cleanup` |
| Deploy | Vercel (10 web projects) |
| OS context | Windows + bash; pnpm 9.15.5; Node 24.x |

---

## Audit summary (lifted from AUDIT-BASELINE.md §3.7 + memory)

> ### 3.7 Hardcoded text
> - **Solid (after V3 PASS 21):** massive i18n A1 wave extracted hardcoded strings to surface labels
> - **Gap:** i18n-gaps/ directory contains unfinished work — extra-label-gaps.json, module-gaps.json, summary.json, work-units.json
> - **Gap (V3-BACKLOG Q1):** hardcoded `henrycogroup.com` literals (~30 in care/account)

From memory `project_henryco_i18n_architecture.md`: Custom @henryco/i18n + Pattern A typed copy + Pattern B `translateSurfaceLabel` runtime DeepL; passes 18/18B/18C closed; remaining gaps before any new "translate everything" pass.

From memory `feedback_dashboard_search_engine_no_touch.md`: Owner reserves `packages/search-ui/` — quality reference only, never modify. Respect this — do NOT touch search-ui code in this pass.

---

## Mandatory scope

### S1 — Close `docs/v3/i18n-gaps/` work units

Read the existing gap manifests:
- `docs/v3/i18n-gaps/extra-label-gaps.json` — labels referenced in code but not defined in any locale module
- `docs/v3/i18n-gaps/module-gaps.json` — copy modules missing per-locale keys
- `docs/v3/i18n-gaps/summary.json` — aggregate counts
- `docs/v3/i18n-gaps/work-units.json` — discrete work units the executor consumed

For every open work unit:
- Add the missing label to its surface module.
- Wire any code referencing the label.
- Ensure all 12 locales have at minimum an en-US key (runtime DeepL fills the rest per Pattern B).

Do NOT introduce new locales (i18n is 12-locale per recent commit; foundation only).

### S2 — Retire `henrycogroup.com` hardcoded literals

Per V3-BACKLOG Q1: ~30 literal `henrycogroup.com` strings in care/account code.

Implementation:
- New helper `@henryco/config/domain.ts` (extend if exists):
  - `henryDomain(division: HenryDivision)` → returns `https://<division>.henrycogroup.com` per env
  - `henryWebRoot()` → returns `https://henrycogroup.com` per env
- Grep for `'henrycogroup.com'` and `"henrycogroup.com"` across `apps/` + `packages/`.
- Replace each literal with `henryDomain(division)` or `henryWebRoot()` call.
- Verify env-aware behavior: `EXPO_PUBLIC_HENRYCO_ENV=staging` should return staging domains where applicable.

### S3 — Scan for remaining string-literals

Build `scripts/v3/hardcoded-text-scan.mjs`:
- Walks `apps/` and `packages/` (excluding `node_modules`, `dist`, `.next`, `packages/search-ui` per owner's reservation).
- Finds JSX text content (`<div>text</div>`), JSX attribute strings on user-visible props (`title`, `aria-label`, `placeholder`, `alt`), and Toast/Alert messages.
- Classifies:
  - **OK** — string is already a surface-label reference (`<T label="surface:..." />` or `t('...')`)
  - **GAP** — string is hardcoded user-visible text
  - **EXEMPT** — string is a developer label (e.g., `data-testid`, `key`, internal constants)
  - **AMBIGUOUS** — could be either; needs manual review

Output `docs/v3/i18n-gaps/hardcoded-scan-<datestamp>.json`.

### S4 — Fix all GAP entries

For each GAP from S3:
- Add label to the appropriate surface copy module.
- Replace the hardcoded JSX with a `<T label="..." />` or equivalent.
- Verify the en-US key resolves correctly.

### S5 — Toast / Alert message audit

Every `toast.success(...)`, `toast.error(...)`, `alert(...)`, `<Alert>...</Alert>` message:
- Audit for hardcoded text.
- Replace with surface label.
- Ensure error messages are user-friendly (not raw API errors).

### S6 — Error boundary copy

Every `error.tsx` and error boundary fallback:
- Audit for hardcoded copy.
- Replace with surface label.
- Ensure copy is helpful (provides a recovery action).

### S7 — Email + notification template copy

`@henryco/email` templates and `@henryco/notifications` notification payloads:
- Audit for hardcoded subject/body.
- Localize per recipient's preferred locale.
- Ensure email-from name + subject use the appropriate sender per division.

### S8 — CI gate

Extend the existing `pnpm i18n:check` script to also run S3's scan in strict mode:
- Fails CI if new hardcoded JSX text is introduced.
- Allows whitelisting exceptions in `docs/v3/i18n-gaps/exempt.json`.

### S9 — Telemetry

Event:
- `henry.i18n.missing_label_at_runtime` (label_key, locale, fallback_used)

Owner-workspace tile: "Translation health" — daily missing-label count + DeepL fallback usage.

---

## Out of scope

- New locale additions (12 locales preserved).
- Locale switcher UI changes (recent commit `90cc65ea` shipped the 12-locale selector).
- Pattern B runtime DeepL translation engine changes.
- `packages/search-ui/` modifications (owner reservation per memory).

---

## Dependencies

- Phase A audit complete.

Blocks:
- V3-11 (one-job-per-card) — cleaner copy makes the per-card audit higher signal.
- V3-94 (V3 integration test) — re-runs the i18n-check gate.

---

## Inheritance

- `@henryco/i18n` — extend; do not fork.
- `@henryco/config` — extend with domain helper.
- Existing CI i18n-check job (recent commit `738b03ec` wired pnpm i18n:check to GitHub Actions).
- `docs/v3/i18n-gaps/` directory — close + update.

---

## Implementation requirements

### Files

- `scripts/v3/hardcoded-text-scan.mjs` (new)
- `packages/config/src/domain.ts` (new helper)
- `docs/v3/i18n-gaps/hardcoded-scan-<datestamp>.json` (new — output)
- `docs/v3/i18n-gaps/exempt.json` (new — explicit exceptions)
- Updates to surface copy modules in `@henryco/i18n` per S1 + S4
- Per-app fixes for each GAP entry
- CI extension to fail on new hardcoded text

---

## Trust / safety / compliance

- Don't accidentally localize developer-only labels (data-testid, internal keys).
- Email subject lines respect sender-identity policy.
- ANTI-CLONE: localized strings are public anyway — no protection concern here.

## Mobile + desktop parity

- Mobile apps (Expo) use their own i18n stack — verify the same labels resolve.

## i18n

- This entire pass IS the i18n cleanup. Pattern A + Pattern B per memory.

---

## Validation gates

1. Standard CI + `pnpm i18n:check` extended scan.
2. Scan output shows ZERO new GAPs.
3. Live walk samples 10 pages per app + confirms no untranslated runtime fallbacks.
4. Owner-workspace translation-health tile shows expected DeepL usage (not zero — Pattern B is active — but no surprises).

## Deployment gate

- All gates pass.
- 48-hour soak.

## Final report contract

`.codex-temp/v3-07-hardcoded-text-cleanup/report.md` with the standard 9 sections + before/after scan counts + i18n-gaps closure summary.

---

## Self-verification

- [ ] All open work units in `docs/v3/i18n-gaps/` closed.
- [ ] ~30 hardcoded henrycogroup.com literals retired.
- [ ] Scan returns ZERO new GAPs.
- [ ] CI gate active.
- [ ] Toast / alert / error / email copy audited.
- [ ] Owner-workspace translation-health tile rendering.
- [ ] Report written. Hand-off: foundation-lock close.
