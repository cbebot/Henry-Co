# V3-68 — Partner & Enterprise: Partner Performance + Contracts

**Pass ID:** V3-68  ·  **Phase:** H (Partner & Enterprise)  ·  **Pillar:** P8 (Partner & Enterprise Ecosystem)
**Dependencies:** V3-67 (partner onboarding)  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role
You are the V3 Partner Performance engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass turns the bare `partners` row from V3-67 into a living relationship: a per-partner performance dashboard (completion rate, response time, rating, dispute rate, trend), versioned contract storage with audited re-acceptance on version change, partner-visible dispute history, and deterministic performance-based actions (warn → remediate → downgrade/suspend). The line you must not cross: you do NOT move money or compute payout amounts (V3-69), and you do NOT build per-vertical business suites (V3-70..V3-75). You measure the partner and govern the contract; you never pay them.

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/68-partner-performance-and-contracts` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
V3-67 created the canonical `partners` table + the audited `partner_contract_acceptances` snapshot (acceptance = version + sha256 + IP + UA). What it did **not** build: ongoing measurement or contract *versioning*. Today, the only partner-quality signal in the codebase is division-local and ad hoc — the marketplace vendor workspace surfaces dispute counts (`apps/marketplace/app/vendor/disputes/page.tsx`) and balance state (`apps/marketplace/app/vendor/payouts/page.tsx`), and `@henryco/trust` provides `applyVerificationTrustControls` (a tier-cap model on verification status) plus `rankSharedTrustTier`/`clampSharedTrustTier`. There is no cross-division partner performance model, no contract registry with re-acceptance, and no automated remediation ladder. This pass closes that gap: one performance computation, one contract registry, one remediation ladder — all keyed on the V3-67 `partners.id`, reusing the trust-tier primitives rather than inventing a parallel scoring system.

## Mandatory scope

### S1 — Per-partner performance model + dashboard
Add `supabase/migrations/<ts>_v3_68_partner_performance.sql` with `partner_performance_snapshots` (`partner_id`, `period` (date), `completed_count`, `completion_rate` NUMERIC, `avg_response_seconds` INT, `avg_rating` NUMERIC, `dispute_rate` NUMERIC, `tier` TEXT, `computed_at`). A nightly recompute (workflow handler, V3-43 outbox pattern if available, else cron) writes one snapshot per partner per period. Surface a dashboard at `apps/account/app/(account)/partner/performance/page.tsx`:
- Completed transactions, completion rate, average response time, average rating, dispute rate — each with a sparkline trend over the snapshot history.
- **Peer comparison is privacy-respecting:** show the partner their *rank band* against tier peers (e.g. "top quartile in your tier"), never another partner's exact numbers.
Reuse `rankSharedTrustTier` / `clampSharedTrustTier` from `@henryco/trust` for tier placement; `applyVerificationTrustControls` still caps tier by KYC status.

### S2 — Versioned contract storage + re-acceptance
Add `partner_contract_versions` (`id`, `version` TEXT, `effective_from` TIMESTAMPTZ, `body_sha256` TEXT, `body_ref` TEXT, `is_current` BOOL). The V3-67 `partner_contract_acceptances` snapshot already records which version a partner accepted. This pass adds:
- A registry of contract versions (staff-published, one `is_current`).
- A **re-acceptance flow**: when `is_current.version` differs from the partner's latest accepted version, gate sensitive partner actions behind a re-acceptance step that writes a fresh `partner_contract_acceptances` row (HMAC-signed snapshot + timestamp + IP + UA — same primitive as V3-67, ANTI-CLONE Principle 12). Never silently re-accept.

### S3 — Dispute history
- Partner-facing: a partner sees **only their own** disputes (RLS-confined), sourced from the existing per-division dispute records (marketplace `vendor/disputes`, future provider/studio disputes) joined on `partner_id`.
- Staff-facing: trust staff see aggregate dispute metrics across partners in `apps/staff/app/(staff)/partner-reviews/` (extend the V3-67 queue, do not fork it).

### S4 — Performance-based actions (remediation ladder)
Deterministic, threshold-driven, audited:
- Below-threshold once: warning notification + concrete remediation suggestions (copy via i18n).
- Persistent below-threshold (N consecutive snapshots): tier downgrade or `status='suspended'` on the `partners` row — written through the V3-67 `nextPartnerStatus` state machine, never ad hoc.
Thresholds live in a config table or `@henryco/config`, not magic numbers in handlers. Every action audit-logged.

### S5 — Telemetry
Emit via `@henryco/observability/events`:
`henry.partner.performance.computed`, `henry.partner.contract.version_changed`, `henry.partner.contract.reaccepted`, `henry.partner.performance.warning_issued`, `henry.partner.performance.downgraded`.

## Out of scope
- Payouts, bank capture, tax forms → **V3-69**.
- Per-vertical business suites → **V3-70..V3-75**.
- The `partners` table, onboarding wizard, and the original contract-acceptance primitive → **V3-67** (this pass extends, never rebuilds).
- Predictive quality/dispute-likelihood models → **V3-41** (this pass is deterministic measurement; predictive scores layer on later).

## Dependencies
Blocked by **V3-67**. Parallel-safe with V3-70..V3-75. Feeds the partner tier signal consumed by V3-69 (payout hold periods can key on tier) and V3-71/V3-72 (suite dashboards reuse the performance model).

## Inheritance
`@henryco/trust` (`rankSharedTrustTier`, `clampSharedTrustTier`, `applyVerificationTrustControls`), the V3-67 `partners` table + `nextPartnerStatus` state machine + `partner_contract_acceptances` primitive, `@henryco/branded-documents` (contract rendering), `@henryco/notifications`, `@henryco/observability` (events + audit-log), the V3-43 workflow engine (recompute scheduling, if landed).

## Implementation requirements
### Files
- `supabase/migrations/<ts>_v3_68_partner_performance.sql` — snapshots + contract versions + RLS.
- `apps/account/app/(account)/partner/performance/page.tsx` + trend components.
- `apps/account/app/api/partner/contract/reaccept/route.ts` — re-acceptance handler.
- `apps/account/lib/partners/performance.ts` — pure compute (completion rate, dispute rate, tier placement).
- Extend `apps/staff/app/(staff)/partner-reviews/` with aggregate dispute + performance views.
- Recompute handler (cron/outbox) writing `partner_performance_snapshots`.

### Trust / safety / compliance
Partner-data RLS: a partner reads only their own snapshots, disputes, and acceptances (ANTI-CLONE Principle 1 — server-side logic, no client trust). Peer comparison never leaks another partner's raw numbers — only rank bands. Re-acceptance is audited identically to first acceptance (ANTI-CLONE Principle 12). All status changes route through the V3-67 state machine + audit-log.

### Mobile + desktop parity
Performance dashboard is responsive (mobile-readable sparklines, tap-to-expand metrics). Contract review + re-acceptance is desktop-primary but fully functional on mobile — a partner blocked behind a stale contract must be able to re-accept on a phone. Expo super-app parity: same API, same server-action forms.

### i18n
Namespace `surface:partner-performance` for metric labels, trend captions, remediation copy, contract version notices, and warning bodies. All status/error/label strings through `@henryco/i18n`. No raw numbers presented without a translated label.

### Brand & design system
User-facing brand = **Henry Onyx** via `@henryco/config`; division labels "Henry Onyx <Division>". Account-app tokens (`--site-*` / `--accent`); Fraunces only on editorial surfaces. Zero hardcoded domains (`henryDomain()` / `getAccountUrl()`). Light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed.

## Validation gates
1. CI green: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
2. Performance dashboard renders for a sample partner with multi-period snapshot history (trend + rank band visible).
3. Compute unit suite: completion rate, dispute rate, tier placement deterministic across edge inputs (≈10 cases).
4. Contract re-acceptance flow: bumping `is_current` gates sensitive partner actions until re-accept; re-accept writes a fresh audited snapshot.
5. Performance-warning trigger fires on threshold breach; persistent breach downgrades/suspends via `nextPartnerStatus`.
6. RLS: partner cannot read another partner's snapshots/disputes; peer comparison exposes only rank bands.
7. i18n strict gate passes; `surface:partner-performance` registered.
8. UI: light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed.

## Deployment gate
All validation gates green; V3-67 merged and live; one full nightly recompute cycle observed in staging; 14-day soak before remediation-ladder downgrades are allowed to act on live partners (warnings may run sooner).

## Final report contract
`.codex-temp/v3-68-partner-performance-and-contracts/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion).

## Self-verification
- [ ] `partner_performance_snapshots` + nightly recompute produce per-period trend data (S1).
- [ ] Peer comparison shows rank bands only — never another partner's raw numbers (S1).
- [ ] `partner_contract_versions` registry + audited re-acceptance gate on version change (S2).
- [ ] Partner sees only their disputes; staff see aggregate (S3).
- [ ] Remediation ladder warns, then downgrades/suspends via `nextPartnerStatus`, all audit-logged (S4).
- [ ] 5 telemetry events emitted as `henry.partner.*` (S5).
- [ ] Reuses `@henryco/trust` tier helpers — no parallel scoring system; zero hardcoded domains/strings; Henry Onyx brand throughout.
- [ ] Report written.
