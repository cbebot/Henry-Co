# V3-40 — Predictive: Fraud & Risk

**Pass ID:** V3-40  ·  **Phase:** E (Personalization & Predictive)  ·  **Pillar:** P6 (Predictive Intelligence), P7 (Trust & Safety)
**Dependencies:** V3-26 (ai-provider-router)  ·  **Effort:** XL  ·  **Parallel-safe:** Y
**Owner gate:** none (D3 — AI provider — already recorded for V3-26; confirm, don't re-litigate)  ·  **Risk class:** Identity, Compliance

---

## Role
You are the V3 fraud & risk engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass graduates risk from the eight deterministic rule signals in `@henryco/intelligence` to a versioned, daily-scored, learned-and-rules-hybrid risk score for accounts, listings, transactions, and support tickets — with tiered enforcement, a mandatory shadow-mode period, a staff review queue, and full model lifecycle governance. The line you must not cross: **no automated enforcement decision is irreversible without a staff override path; every score and every enforcement action is audited; shadow mode runs before a single live freeze; and money invariants are never weakened by a risk action.**

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/40-predictive-fraud-and-risk` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
The deterministic floor exists. `packages/intelligence/src/index.ts` defines the eight rules-based `RiskSignalType`s — `failed_sensitive_action_burst`, `listing_spam_pattern`, `wallet_velocity_anomaly`, `verification_mismatch`, `support_abuse_pattern`, `booking_brute_force`, `moderation_repeat_failure`, `upload_pattern_suspicious` — plus `RiskSeverity` and the `RiskSignal` shape. `packages/trust` (`detect.ts`, `moderation.ts`, `verification.ts`) supplies content-detection primitives (`detectOffPlatformContact`, `detectSuspiciousContent`, `calculateTrustScore`) and a `TrustSignals` model. V3-26 ships the vendor-agnostic AI provider router (governed, cost-metered, never names the provider in any surface). The staff app routes under `apps/staff/app/(workspace)/` (`kyc`, `finance`, `support`, `moderation` modules in `packages/dashboard-modules-staff/src`), but there is **no `risk` workspace** and **no persisted, queryable risk score** — risk is computed ad hoc, per surface, with no history, no model versioning, and no enforcement state machine.

This pass closes that gap: a `risk_scores` history table, a `model_versions` registry, a scoring service that fuses the eight deterministic signals with behavioral/event-stream features (V3-90 features layered when available), a four-tier enforcement state machine, a mandatory shadow-mode validation window, and a staff review queue at `apps/staff/app/(workspace)/risk/`. It scopes OUT quality/workload prediction (V3-41) and gaming anti-cheat (V3-66, gated).

## Mandatory scope

### S1 — Risk score + model registry schema (`apps/hub/supabase/migrations/`)
New migration. Three tables.
```sql
create table public.model_versions (
  id uuid primary key default gen_random_uuid(),
  model_kind text not null,                       -- 'fraud_risk'
  version text not null,                          -- semver-ish, monotonic
  status text not null default 'shadow'           -- 'shadow' | 'live' | 'rolled_back' | 'retired'
    check (status in ('shadow','live','rolled_back','retired')),
  config jsonb not null,                          -- feature weights / thresholds / provider model id (NEVER a vendor name in any user surface)
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (model_kind, version)
);

create table public.risk_scores (
  entity_type text not null check (entity_type in ('account','listing','transaction','support_ticket')),
  entity_id text not null,
  risk_score integer not null check (risk_score between 0 and 100),
  tier text not null check (tier in ('pass','monitor','review','freeze')),
  contributing_factors jsonb not null,            -- [{ signal, weight, value }] — explainable, deterministic ordering
  model_version text not null references_model_version,  -- FK by (model_kind,version); enforce in migration
  shadow boolean not null default true,           -- true while model is in shadow mode
  scored_at timestamptz not null default now(),
  primary key (entity_type, entity_id, scored_at)
);
create index risk_scores_latest on public.risk_scores (entity_type, entity_id, scored_at desc);

create table public.risk_enforcement_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  action text not null check (action in ('flag','hold','freeze','release','staff_override')),
  tier_at_action text not null,
  model_version text not null,
  actor text not null,                            -- 'system' | staff user id
  reason text,
  created_at timestamptz not null default now()
);
```
RLS: all three tables are **staff/service-role only** (`is_staff()` read where role-appropriate; writes service-role/automation only). No `anon`/`authenticated` end-user access whatsoever — risk data is never exposed to the scored party. Provide explicit `create policy` + `enable row level security` for each. `contributing_factors` ordering must be deterministic (stable sort by weight) so staff explanations are reproducible.

### S2 — Scoring service (`packages/intelligence/src/risk/`)
New `packages/intelligence/src/risk/score.ts`, exported from the package index.
```ts
export type RiskEntityType = "account" | "listing" | "transaction" | "support_ticket";
export type RiskTier = "pass" | "monitor" | "review" | "freeze";
export interface RiskScoreResult {
  entityType: RiskEntityType;
  entityId: string;
  riskScore: number;                 // 0–100
  tier: RiskTier;
  contributingFactors: { signal: string; weight: number; value: number | string }[];
  modelVersion: string;
  shadow: boolean;
}
export function scoreEntity(
  input: { entityType: RiskEntityType; entityId: string; features: RiskFeatures; model: ModelConfig }
): RiskScoreResult;
```
Feature fusion: deterministic `RiskSignal`s (the existing eight) + behavioral aggregates (velocity, recency, graph degree where cheap) + V3-90 event-stream features when the data lake exists (guard behind a feature flag; degrade to deterministic-only otherwise). Any LLM-assisted feature uses the **V3-26 provider router** (cost-metered, governed) and is advisory — it can raise a score but a freeze tier never rests on an LLM call alone. Tier mapping is config-driven from `model_versions.config`: `0–30 pass · 30–60 monitor · 60–85 review · 85–100 freeze`. Pure given features+model (testable); side-effect-free — persistence is S4.

### S3 — Tiered enforcement state machine
Enforcement is applied ONLY when the scoring model is `status = 'live'` (never in shadow). Effects:
- **pass (0–30):** no action.
- **monitor (30–60):** flag for monitoring; entity surfaced in staff queue; no user-visible effect.
- **review (60–85):** sensitive actions (wallet withdraw, payout, high-value purchase, KYC-gated actions) require staff approval before completing; user sees a neutral "additional review" state via i18n copy — never the word "fraud", never the score.
- **freeze (85–100):** sensitive/destructive actions blocked pending staff override; non-sensitive browsing unaffected; user sees a neutral "account on hold — contact support" state.
Every transition writes `risk_enforcement_log` and emits telemetry. **Money invariants hold unconditionally:** a held/frozen transaction never silently completes, never double-charges, never bypasses idempotency; the enforcement gate sits in front of the payment-surface, never inside it. A `staff_override` always exists and always logs actor + reason.

### S4 — Daily batch scorer + persistence (cron)
A scheduled job (`@henryco/workspace`/cron handler, observable, idempotent per `(entity, day)`) scores each active account, listing, open transaction, and open support ticket daily, writing one `risk_scores` row per entity per run with the active model version. Re-scoring is idempotent (same day + same model + same features → identical row, deduped). Use the unified workflow/outbox pattern; the dedicated workflow engine is V3-43 — until then, use the existing cron + idempotency-key convention. Emit `henry.risk.scored` per batch with counts per tier.

### S5 — Shadow mode → live (governed)
Every new `model_versions` row starts `status = 'shadow'`. During shadow: scores compute and persist (`shadow = true`), enforcement is a **no-op**. A validation report (precision, recall, false-positive rate against labeled known-fraud cases + a holdout) is generated. Owner approves go-live; the model row flips to `live`, `approved_by`/`approved_at` set; enforcement activates. Minimum shadow window: **30 days** of daily scores before any go-live request. A roll-back flips `live → rolled_back` and reverts enforcement to the prior `live` model atomically; an open enforcement under the rolled-back model is released and re-evaluated.

### S6 — Staff risk review queue (`apps/staff/app/(workspace)/risk/`)
New workspace surface, consistent with the existing `(workspace)` modules (reuse `packages/dashboard-modules-staff/src/shared` queue shell, SLA, filters). Lists `review`/`freeze` entities with: score, tier, top contributing factors (from `contributing_factors`, human-readable), entity deep-link, and actions (approve / override-release / escalate). Every staff action writes `risk_enforcement_log` and audit log. RLS-gated to trust/risk staff role. Copy via i18n operator namespace.

### S7 — Telemetry + audit
Register in `HenryEventNames` and emit: `henry.risk.scored`, `henry.risk.enforcement_held`, `henry.risk.enforcement_frozen`, `henry.risk.staff_override`, `henry.risk.model_promoted`, `henry.risk.model_rolled_back`. Every enforcement and every model lifecycle transition also writes `@henryco/observability/audit-log`. Properties never include raw PII — entity ids and tiers only.

## Out of scope
- Service-quality / staff-workload / dispute-likelihood prediction — **V3-41**.
- The advanced staff intelligence dashboards (trend/anomaly/recommendation/drill-down) that consume these scores — **V3-42**.
- Gaming anti-cheat / fair-play scoring — **V3-66** (legally gated, D2).
- KYC vendor verification itself — **V3-24** (this pass consumes verification *state*, doesn't perform KYC).

## Dependencies
Depends on **V3-26** (AI provider router for any LLM-assisted feature). BLOCKS **V3-42** (advanced staff dashboards consume `risk_scores`) and informs **V3-50** (verified-provider scoring reads risk tier). D3 (AI provider) is already recorded in `docs/v3/DECISIONS-REQUIRED.md` — confirm the recorded answer before wiring the router; do not re-litigate.

## Inheritance
- `packages/intelligence` — `RiskSignalType` (the eight signals), `RiskSignal`, `RiskSeverity`, analytics envelope, `HenryEventNames`.
- `packages/trust` — `detect.ts` / `moderation.ts` / `verification.ts` content signals; `calculateTrustScore`.
- **V3-26** AI provider router — for governed, cost-metered LLM-assisted features only.
- `packages/dashboard-modules-staff` + `packages/dashboard-shell` — queue shell, SLA, filters, role-gate for the staff surface.
- `@henryco/observability/audit-log` — mandatory on every enforcement/model action.
- `@henryco/payment-surface` — enforcement gates sit **in front of** it; payment behavior is never modified.

## Implementation requirements
### Files
- `apps/hub/supabase/migrations/<ts>_risk_scores_and_models.sql` (new — three tables + RLS)
- `packages/intelligence/src/risk/score.ts`, `tiers.ts`, `features.ts` (new) + index exports
- `packages/intelligence/src/risk/__tests__/*.test.ts` (new)
- Cron handler for the daily batch scorer (existing cron convention)
- `apps/staff/app/(workspace)/risk/` (new route + page + server)
- Enforcement gate middleware in front of sensitive/payment routes (composes with V3-02 `requireSensitiveAction`)
- i18n operator copy + neutral end-user "additional review"/"on hold" copy

### Trust / safety / compliance
- Compliance posture: this is the platform AML/fraud-risk control surface. Document how the model and enforcement satisfy the AML program requirements (the L15 control reference in `docs/`); compliance review required before go-live.
- Every automated decision is reversible via `staff_override`; every score + action is audited; no irreversible automated freeze.
- Shadow mode (≥30 days) is mandatory before live enforcement; owner approval gates go-live.
- Money invariants absolute: enforcement gates in front of payment-surface, never inside; no bypass of idempotency, HMAC, ledger truth, or webhook reconciliation.
- Risk data never exposed to the scored party (RLS staff/service-role only); user-facing states are neutral i18n copy that never reveals the score or the word "fraud".
- ANTI-CLONE Principles 1 (server-side), 10 (data moat — the scored history is proprietary), 12 (governance).

### Mobile + desktop parity
Scoring + enforcement are server-side. The staff risk queue is desktop-first with a mobile-summary view (consistent with sibling `(workspace)` modules). End-user enforcement states render correctly on web mobile + desktop.

### i18n
Operator namespace `surface:staff_risk` for the queue; user-facing neutral states under `surface:account_status`. All labels/tiers/factor-descriptions/errors translated via `@henryco/i18n`; never a hardcoded operator or user string. 12 locales for user-facing copy; operator surface follows the V3-07b operator-i18n posture.

### Brand & design system
Staff surface uses `packages/dashboard-shell` tokens; user-facing neutral states use `--site-*`/`--accent`. Any brand string via `@henryco/config`; zero `henrycogroup.com` literals; cross-links via `henryDomain()`. Light + dark + mobile + desktop, CLS ≈ 0, contrast green for every rendered surface.

## Validation gates
1. **Standard CI** — typecheck, lint, test, build green.
2. **Scoring unit suite** (~25 cases) — tier boundaries (29/30, 59/60, 84/85, 100); deterministic factor ordering; LLM-feature degradation when V3-90 absent; freeze never rests on LLM alone.
3. **Shadow-mode validation** — a ≥30-day shadow run produces a precision/recall/false-positive report against labeled fraud cases + holdout; documented in the report.
4. **Tier enforcement test** — `review` gates a sensitive action behind staff approval; `freeze` blocks it; non-sensitive browsing unaffected; every transition logs to `risk_enforcement_log`.
5. **Money-invariant test** — a held/frozen transaction never completes, double-charges, or bypasses idempotency; enforcement is in front of the payment-surface.
6. **Staff override path** — override releases enforcement, logs actor+reason, audited.
7. **Model lifecycle** — shadow→live promotion sets approval fields; roll-back atomically reverts enforcement to the prior live model and releases open enforcements.
8. **RLS verification** — no `anon`/`authenticated` access to any of the three tables; staff/service-role only; prove with SQL.

## Deployment gate
All gates green; compliance/AML control review complete; **owner approves go-live only after reviewing the ≥30-day shadow-mode validation report.** Enforcement ships disabled (shadow) and is flipped to live by the governed model-promotion path, not by the deploy. PR squash-merged to `main` via CI; no branch-protection bypass.

## Final report contract
`.codex-temp/v3-40-predictive-fraud-and-risk/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion) — plus the shadow-mode validation report and the compliance/AML control mapping as named appendices.

## Self-verification
- [ ] `model_versions` + `risk_scores` + `risk_enforcement_log` migrated; RLS staff/service-role only; SQL-proven.
- [ ] `scoreEntity` fuses the eight deterministic signals + behavioral features; config-driven tiers; freeze never LLM-only.
- [ ] Four-tier enforcement state machine; every transition logged; money invariants intact (gate in front of payment-surface).
- [ ] Daily idempotent batch scorer persisting one row per entity per run.
- [ ] Shadow mode (≥30 days) mandatory; owner-gated go-live; atomic roll-back releasing open enforcements.
- [ ] Staff risk queue at `apps/staff/app/(workspace)/risk/` with explainable factors + override.
- [ ] Six telemetry events registered + emitted; audit-log on every enforcement/model action.
- [ ] User-facing states neutral, i18n-sourced, never reveal score/"fraud"; zero hardcoded domains/strings.
- [ ] Compliance/AML control mapping + shadow validation report written.
- [ ] Report written.
