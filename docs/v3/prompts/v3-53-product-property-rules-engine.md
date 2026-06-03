# V3-53 — Product Expansion: Property Rules Engine

**Pass ID:** V3-53  ·  **Phase:** G (Product Expansion)  ·  **Pillar:** P1 (Service Breadth), P7 (Trust & Identity)
**Dependencies:** V3-12  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** Compliance

---

## Role
You are the V3 Property engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass turns property listing governance from a half-wired data scaffold into a real, enforced publication gate: a deterministic rules engine that decides — on every submit, edit, and report — whether a listing is valid, must be inspected, or must be held, with every decision recorded and auto-acting. The line you must not cross: this is a **deterministic, data-driven, human-overridable** governance engine — never an opaque auto-reject machine, and never a payments or KYC pass. Inspection *booking* (slots, calendar) belongs to V3-51; marketing-copy moderation belongs to V3-25.

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/53-product-property-rules-engine` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
Property already carries a substantial governance substrate built under the earlier "V3 PASS 21" design cycle — but it is **half-wired and not enforced as a real publication gate**:

- **Schema that exists.** `apps/property/supabase/migrations/20260515122500_property_inspection_rules.sql` ships `public.property_inspection_rules` (data-driven rule catalog: `rule_key`, `criteria jsonb`, `require_inspection`, `block_publication`, `priority`, `is_active`) and `public.property_inspection_rule_evaluations` (append-only decision audit), both with `is_property_staff()` RLS, plus six seeded rules (intent=`inspection_request`, `managed_property`, `verified_property`, `land`, `min_risk_score≥76`, high-value sale ≥50M NGN). `property_policy_events` already records `policy_evaluated` / `status_transition` / `inspection_created` / `override_applied` / `risk_flag_added`.
- **Types that exist.** `apps/property/lib/property/types.ts` defines the 17-state `PropertyListingStatus` (`draft`→`submitted`→`awaiting_documents`→`awaiting_eligibility`→`inspection_requested`→`inspection_scheduled`→`under_review`→`requires_correction`→`verified`→`published`→`changes_requested`→`approved`→`rejected`→`blocked`→`escalated`→`archived`), the 6-state `PropertyListingInspectionStatus` (`requested`/`scheduled`/`completed`/`waived`/`failed`/`cancelled`), `PropertyListingIntent`, `PropertyListingServiceType`, `PropertyPolicyEvent`, and `PropertyListingInspection`.
- **Logic that exists.** `apps/property/lib/property/governance.ts` has `resolveListingStatusFromInspectionStatus()` (inspection→listing-status mapping per `docs/property-inspection-eligibility-rules.md`) and `getPropertyListingStatusSummary()`. `apps/property/lib/property/policy.ts` holds risk scoring. The submit path is `apps/property/components/property/submit/PropertySubmissionForm.tsx` → `apps/property/app/api/property/route.ts`. Staff surfaces: `apps/property/app/admin/listings/page.tsx`, `apps/property/app/moderation/page.tsx`.

**The gap this pass closes.** Today the rules table is editable data, but nothing *runs the catalog end-to-end as a gate*: there is no single evaluator that (a) checks listing **validity** rules (min images, address verified, banned terms, owner consent) alongside the inspection rules, (b) auto-applies `block_publication` and auto-suspends violating live listings until corrected, (c) writes one evaluation row + one `policy_evaluated` event per submit/edit/report, (d) surfaces a specific, fix-pathed reason to the owner, and (e) exposes a `Schedule inspection` CTA only when the listing is genuinely eligible. The seed SQL `description` columns still contain the retired "Henry & Co." brand string — those must be corrected to **Henry Onyx** sourced from config, never re-hardcoded. This pass makes governance an *enforced, auditable, brand-correct* gate.

## Mandatory scope

### S1 — Validity rule catalog (extend the existing engine, do not fork it)
Add a sibling data-driven catalog for **listing validity** (distinct from inspection eligibility) so operators tune it without a deploy. New migration `apps/property/supabase/migrations/<TS>_property_listing_validity_rules.sql`:

```sql
create table if not exists public.property_listing_validity_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  name text not null,
  description text not null default '',
  -- criteria jsonb supports: { "min_images"?: int, "require_address_verified"?: bool,
  --   "require_owner_consent"?: bool, "min_price"?: bigint, "max_price"?: bigint,
  --   "banned_terms"?: string[], "require_floor_plan_for"?: serviceType[] }
  criteria jsonb not null default '{}'::jsonb,
  outcome text not null default 'hold' check (outcome in ('pass', 'hold', 'reject')),
  reason_code text not null,
  priority integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_property_validity_rules_active
  on public.property_listing_validity_rules (priority desc) where is_active;
alter table public.property_listing_validity_rules enable row level security;
create policy "staff manage validity rules" on public.property_listing_validity_rules
  for all using (public.is_property_staff()) with check (public.is_property_staff());
create trigger trg_property_validity_rules_updated_at
  before update on public.property_listing_validity_rules
  for each row execute function public.set_updated_at();
```
Seed the documented baseline rules (min 4 images, address verified, owner consent recorded, banned-terms list, floor-plan required for `sale`/`commercial`) idempotently on `rule_key`. **Acceptance:** migration is idempotent (re-run = no error), RLS denies non-staff writes, seeds present.

### S2 — Unified evaluator + reason codes
Build one pure evaluator `apps/property/lib/property/rules-engine.ts` that the API calls on submit/edit/report. It loads active rules from both catalogs, matches each `criteria` clause against the submission (every present clause must match), and returns a typed result:

```ts
export type RuleOutcome = "pass" | "hold" | "reject";
export interface RuleHit {
  ruleKey: string;
  catalog: "validity" | "inspection";
  outcome: RuleOutcome;       // validity rules
  requireInspection?: boolean; // inspection rules
  blockPublication?: boolean;  // inspection rules
  reasonCode: string;          // i18n key, never raw copy
  fixPath?: string;            // deep link to the exact correction step
}
export interface RuleEvaluation {
  decision: RuleOutcome;            // worst-of validity outcomes
  requiresInspection: boolean;
  blocksPublication: boolean;
  hits: RuleHit[];
  resolvedStatus: PropertyListingStatus; // via resolveListingStatusFromInspectionStatus + decision
}
export function evaluateListing(input: ListingEvaluationInput, rules: LoadedRules): RuleEvaluation;
```
Decision precedence: any `reject` validity hit → `reject`; else any `hold` or any `block_publication` → `hold`; else if `requireInspection` → route to inspection states; else `pass`. **Acceptance:** evaluator is pure (no DB/IO), exhaustive unit tests cover each precedence branch and each seeded rule.

### S3 — Engine wiring on submit / edit / report
In `apps/property/app/api/property/route.ts` (and the edit + report routes), after persisting the listing draft:
1. Call `evaluateListing`, write exactly **one** `property_inspection_rule_evaluations` row (for inspection hits) and **one** new `property_listing_validity_evaluations` row (for validity hits) per run.
2. Transition `property_listings.status` to `evaluation.resolvedStatus` via the existing `resolveListingStatusFromInspectionStatus` mapping — never set a public status (`approved`/`published`) directly from a failing evaluation.
3. Write one `property_policy_events` row (`event_type='policy_evaluated'`, `from_status`/`to_status`, `reason`, `metadata={ruleHits}`).
4. On report: trigger a re-evaluation with `actor_role='system'` and force `escalated` if a `block_publication` rule now matches a live listing.

**Acceptance:** submit of a non-compliant listing never reaches `published`; the evaluation + policy-event rows exist; re-edit re-runs and can clear the hold.

### S4 — Governance flag automation (auto-suspend + notify)
A server action `suspendOnRuleBreach()` that, for any **already-public** listing failing a `block_publication` rule on re-evaluation, transitions it out of `published` into `blocked` (or `requires_correction`), records the policy event, and emits a notification through the existing `property_notifications` pipeline (`template_key='listing_auto_suspended'`) carrying the specific `reasonCode` + `fixPath`. A nightly `apps/property/app/api/cron/listing-governance-sweep/route.ts` re-evaluates all `published` listings against current active rules. **Acceptance:** flipping a seeded rule to `block_publication=true` and running the sweep moves a matching live listing to `blocked` and produces one notification row; the owner sees a specific reason, not a generic error.

### S5 — Inspection-eligibility CTA + brand correction
- Surface a `Schedule inspection` CTA in the owner listing detail **only** when `evaluation.requiresInspection && status in (inspection_requested, inspection_scheduled)` and no stronger hold remains — the CTA deep-links to V3-51's booking surface (do not build booking here; link to the route V3-51 owns, gated behind a feature flag if V3-51 has not shipped).
- **Brand correction:** the inspection-rules seed `description` columns currently read "Henry & Co." Correct every governance-surfaced brand string to **Henry Onyx**, sourced from `@henryco/config` (`COMPANY.divisions.property.name === "Henry Onyx Property"`), and update the seed SQL descriptions in a follow-up migration (data-only `update ... set description = ...`) so the catalog text no longer carries the retired name. **Acceptance:** `rg "Henry & Co\." apps/property` returns zero hits in governance-surfaced text after this pass.

### S6 — Staff override with audit
A staff-only server action `overrideRuleEvaluation()` (gated `is_property_staff()`) that records an explicit `override_applied` policy event with `actor_user_id`, `actor_role='staff'`, the overridden rule keys, a mandatory free-text reason, and the forced target status. Waiving an inspection is an override, never a silent state change (per `docs/property-inspection-eligibility-rules.md`). **Acceptance:** override writes the audit row; no override is possible without a reason; non-staff calls are rejected by RLS + the `requireSensitiveAction` guard.

### S7 — Telemetry
Emit via `@henryco/observability`: `henry.property.listing.rule_evaluated`, `henry.property.listing.held`, `henry.property.listing.rejected`, `henry.property.listing.auto_suspended`, `henry.property.inspection.eligible`, `henry.property.listing.override_applied`. Each event carries `{ listingId, decision, ruleKeys, actorRole }` (no PII). **Acceptance:** events fire on the exact transitions named.

## Out of scope
- Inspection slot picker / calendar / field-ops scheduling — **V3-51** (smart booking). This pass only emits the eligibility CTA + status.
- Listing marketing-copy / image moderation (LLM-assisted) — **V3-25** (content moderation framework).
- KYC of the owner/agent identity — **V3-24** (identity KYC). This pass consumes the *result* (`awaiting_eligibility`) but does not perform verification.
- Verified-provider scoring — **V3-50**.

## Dependencies
Depends on **V3-12** (Foundation Lock certified). **Blocks downstream:** V3-63 (local discovery relies on validity-gated published listings) and the V3-94 closure regression consume this engine's enforced gate. Soft-coupled to V3-51 (inspection booking) via the eligibility CTA contract.

## Inheritance
Builds on: the existing `apps/property` app (`lib/property/policy.ts`, `governance.ts`, `types.ts`, the `property_inspection_rules` + `property_policy_events` + `property_notifications` tables); `@henryco/observability` (audit-log + telemetry); `@henryco/config` (brand truth); `@henryco/i18n` (reason-code copy); the V3-02 `requireSensitiveAction` guard for staff overrides.

## Implementation requirements
### Files
- New: `apps/property/supabase/migrations/<TS>_property_listing_validity_rules.sql`, `<TS>_property_validity_evaluations.sql`, `<TS>_property_inspection_rules_brand_fix.sql` (data-only description correction).
- New: `apps/property/lib/property/rules-engine.ts`, `apps/property/lib/property/__tests__/rules-engine.test.ts`.
- New: `apps/property/app/api/cron/listing-governance-sweep/route.ts`, server actions in `apps/property/lib/property/governance-actions.ts` (`suspendOnRuleBreach`, `overrideRuleEvaluation`).
- Changed: `apps/property/app/api/property/route.ts` (+ edit/report routes), `apps/property/app/moderation/page.tsx` and `apps/property/app/admin/listings/page.tsx` (override UI + reason surface), owner listing detail (CTA).

### Trust / safety / compliance
RLS on both rule catalogs and both evaluation tables (`is_property_staff()` for management, append-only for evaluations). Staff override routes gated by `requireSensitiveAction` (V3-02) + audit-logged via `@henryco/observability/audit-log`. The cron route authenticates via the standard cron secret. Every state change recorded in `property_policy_events` — the audit trail is the compliance artifact (this is the `C` risk class). No raw owner PII in telemetry. Honors `docs/property-inspection-eligibility-rules.md` as the published rule of record.

### Mobile + desktop parity
Owner submission + correction flow and the `Schedule inspection` CTA are responsive (web mobile + desktop). Staff moderation/override surfaces are desktop-first but must not break on tablet. Expo super-app parity is out of scope for this pass (owner-facing only; deep-link compatible).

### i18n
All reason codes, status summaries, auto-suspend notification copy, and the CTA label flow through `@henryco/i18n` under namespace `surface:property-governance`. `reason_code` values in the rule catalogs are i18n keys, never raw user copy — the engine returns keys, the surface resolves them. 12 locales; status/error/notification copy translated. Add new keys to `exempt.json` only for non-translatable tokens (rule_key identifiers).

### Brand & design system
All governance-surfaced brand strings = **Henry Onyx Property** via `@henryco/config` (`COMPANY.divisions.property.name`), never hardcoded; the retired "Henry & Co." string is removed from the seed descriptions. Owner-facing surfaces use the locked property `--site-*`/`--accent` tokens + Fraunces for any editorial heading; light + dark, CLS ≈ 0, contrast not regressed. Zero hardcoded domains — the inspection CTA deep link goes through `henryDomain('property')` / `henryWebRoot()`.

## Validation gates
1. **CI green:** `pnpm typecheck && pnpm lint && pnpm test && pnpm build` for `apps/property`.
2. **Rule-engine unit tests** (≈20–30 cases): every precedence branch, every seeded validity + inspection rule, criteria-clause matching (all-present-must-match), brand-string absence assertion.
3. **RLS verification:** non-staff cannot read/write rule catalogs; evaluations are append-only; override rejected without `is_property_staff()`.
4. **Auto-suspend smoke:** seed a `block_publication` rule, run the governance sweep, assert a live listing moves to `blocked` + one notification row + one policy event.
5. **Inspection-eligibility correctness:** the six seeded inspection rules each fire on the documented trigger and only then; CTA appears only when genuinely eligible.
6. **i18n gate:** `pnpm i18n:scan` passes; no new hardcoded user-facing strings.
7. **Brand sweep:** `rg "Henry & Co\." apps/property/lib apps/property/supabase` → zero governance hits.

## Deployment gate
All gates green; PR on `v3/53-product-property-rules-engine` off `origin/main` → CI green → squash-merge. Because this enforces a live publication gate, run a **14-day soak** on the governance sweep against production listings (dry-run/log-only the auto-suspend for the first 48h, then enable enforcement) with telemetry watched for false-positive suspensions. Owner review of the validity-rule seed before enforcement flips on.

## Final report contract
`.codex-temp/v3-53-product-property-rules-engine/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion).

## Self-verification
- [ ] S1: validity-rule catalog migration is idempotent, RLS-protected, seeded with the documented baseline.
- [ ] S2: pure `evaluateListing` evaluator with typed `RuleEvaluation` + reason codes; precedence exhaustively tested.
- [ ] S3: submit/edit/report wire the evaluator; non-compliant listings never reach `published`; one evaluation + one policy event per run.
- [ ] S4: auto-suspend + nightly sweep moves a breaching live listing to `blocked` and notifies the owner with a specific fix path.
- [ ] S5: `Schedule inspection` CTA appears only when genuinely eligible; all "Henry & Co." governance strings corrected to Henry Onyx via config.
- [ ] S6: staff override records an explicit audited decision; no silent waivers; `requireSensitiveAction` gate enforced.
- [ ] S7: all six telemetry events emit on their exact transitions with no PII.
- [ ] Cross-cutting: zero hardcoded domains/strings; i18n namespace `surface:property-governance`; tokens-only UI; report written.
