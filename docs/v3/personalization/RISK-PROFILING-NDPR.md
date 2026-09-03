# V3-40 — Fraud-risk profiling: lawful basis, limits, and the AML control mapping

**Pass:** V3-40 (Phase E, Wave E.3) · **Status:** shipped flag-dark, shadow-first · **Binds to:** `docs/v3/personalization/PRIVACY-NDPR.md` §1/§3/§5/§6 and `packages/config/legal.ts`

## 1. Lawful basis (documented, not consent-gated)

Predictive fraud/risk scoring is **platform-invoked profiling with its own lawful
basis** — it is NOT part of the `personalizedExperience` consent surface and must
never be, because a fraudster must not be able to opt out of fraud scoring
(PRIVACY-NDPR §1, the V3-40/41/42 row):

| Basis | Statute | Binding registry entry |
|---|---|---|
| Legitimate interests | NDPA 2023 §25(1)(f) | `legal.ts` `NDPA_LAWFUL_BASES["legitimate-interests"]` — "Trust scoring, device-risk signals, abuse prevention, service security" |
| Legal obligation | NDPA 2023 §25(1)(c) | `legal.ts` `NDPA_LAWFUL_BASES["legal-obligation"]` — CBN AML/CFT regulations |

The `inferred` data category ("Trust score, risk flags … Fraud prevention") and the
`device`/`behavioural` categories in `legal.ts` `DATA_CATEGORIES` already declare
this processing class.

**Counter-balances (the §25(1)(f) balancing test, engineered not promised):**

1. **Staff-only visibility** — all four tables are RLS default-deny with a single
   `is_staff_in('security')` SELECT policy; the scored party can never read a
   prediction about themselves (proven at runtime by
   `apps/hub/supabase/tests/risk_rls_behaviour.sql`).
2. **No auto-punishment** — a prediction only ever FLAGS for human review. The
   system actor cannot hold/freeze/charge: enforced in types
   (`SystemEnforcementAction = "flag"`), at runtime (`assertEnforcementAllowed`),
   and by the database (`risk_enforcement_no_auto_punishment` CHECK).
3. **Shadow-mode governance** — every model version starts `shadow`; promotion is
   an owner action refused before 30 distinct scored days exist.
4. **Automated-decision objection route** — the staff-override path IS the
   mechanism the live privacy policy promises: any enforcement is reversible by
   `release`/`staff_override`, always with an actor and a reason on the record.

## 2. What the model may NOT infer

- **No sensitive-category inference.** Features are: the eight deterministic
  `RiskSignalType`s, watchtower threat involvement (kind/severity/evidence count),
  and numeric behavioral aggregates (velocity, recency, counts). No health,
  ethnicity, religion, political opinion, or any NDPA sensitive category is read,
  derived, or weighted — there is no code path from such data into `RiskFeatures`.
- **No PII in features or factors.** Feature values are ids, numbers, and severity
  words; `contributing_factors` (staff-readable) carry namespaced keys + points +
  counts only. Names/emails/free text never enter the scoring path.
- **No provider/model identity anywhere.** `model_versions.config` is screened by
  `assertClientSafe` before every scoring run; the advisory surface is
  server-only, non-billable, and its receipts are whitelist-redacted.

## 3. Retention & data-subject rights

- **Class: anonymize-retain** (PRIVACY-NDPR §6). Risk scores and enforcement rows
  are legal-obligation evidence (AML/dispute) — they do NOT cascade-delete with
  the account; V3-93 executes the per-class anonymization model. Declared in the
  migration header (`20260725120000_v3_40_risk_scores_and_models.sql`).
- **DSAR/export:** rows here are staff-only control data about an entity, not a
  user-readable export source; DSAR handling routes through the anonymize-retain
  class with staff review (migration header notes the posture).

## 4. AML control mapping (compliance appendix)

| Control | Where it lives | Evidence |
|---|---|---|
| Risk identification (customer + transaction) | Daily batch: watchtower fusion (accounts) + intent-velocity (transactions) + content signals (listings) + abuse patterns (support) | `apps/hub/lib/risk/readers.ts`, `batch.ts` |
| Risk measurement, versioned + reproducible | `scoreEntity` under owner-ratified `model_versions.config`; deterministic factor ordering | `packages/intelligence/src/risk/score.ts` + 28-test suite |
| Alerting for human disposition (no auto-action) | System flags into `risk_enforcement_log`; staff queue at `/modules/staff-risk` | CHECK constraint + `staff-risk` module |
| Disposition + four-eyes | One-tap staff hold/freeze/release/override, reason-required on release/override, owner-only model promotion | `enforcement-write.ts`, `lifecycle.ts` |
| Sensitive-action interdiction (post-disposition only) | `riskGate` on `requireSensitiveAction` — gates ONLY staff-applied holds under a LIVE model | `packages/auth/src/server/sensitive-action-guard.ts`, `apps/account/lib/risk/gate.ts` |
| Audit trail | Append-only enforcement log + `henry.risk.*` events + bulk audit rows per staff action | `risk_enforcement_log`, `docs/event-taxonomy.md` |
| Model governance | shadow ≥30d → owner-approved live → atomic-enough rollback that releases open enforcements | `lifecycle.ts` |
| Validation before reliance | Shadow validation report with **per-entity-type sample sizes** (several domains are pre-data — reported honestly, not padded) | `risk_batch_runs.counts` |

**Go-live gate (unchanged from the pass spec):** compliance/AML review + the
owner reviewing the ≥30-day shadow validation report — enforcement is armed by
the governed model-promotion path, never by a deploy.
