# V3-40 — Predictive: Fraud & Risk

**Pass ID:** V3-40 | **Phase:** E | **Pillar:** P6, P7
**Deps:** V3-26 | **Effort:** XL | **Parallel:** YES | **Owner gate:** none | **Risk:** Identity, Compliance

## Role
V3 Fraud engineer. Execute, then stop.

## Project
Standard.

## Audit summary
Existing 8 rules-based risk signals in @henryco/intelligence. V3 vision: "Fraud/risk prediction." Move beyond rules to learned scoring.

## Mandatory scope

1. **Risk scoring service**:
   - Daily batch score for each user, listing, transaction, support ticket.
   - Inputs: deterministic rules signals + behavioral patterns + V3-90 event-stream features (once shipped).
   - Output: risk_score (0-100) + top contributing factors.

2. **`risk_scores` schema**:
   ```sql
   CREATE TABLE risk_scores (
     entity_type TEXT NOT NULL,
     entity_id TEXT NOT NULL,
     risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
     contributing_factors JSONB NOT NULL,
     model_version TEXT NOT NULL,
     scored_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     PRIMARY KEY (entity_type, entity_id, scored_at)
   );
   ```

3. **Risk-tiered enforcement**:
   - 0-30: pass; no action.
   - 30-60: flag for monitoring.
   - 60-85: hold for review (sensitive actions require staff approval).
   - 85+: freeze (no actions until staff override).

4. **Shadow-mode then live**:
   - First 30 days: shadow mode — compute scores, don't enforce.
   - Validate against known fraud cases.
   - Owner approves go-live; then enforce.

5. **Model lifecycle**:
   - Models versioned in `model_versions` table.
   - Owner approves model upgrade.
   - Roll-back path.

6. **Staff review queue** at `apps/staff/app/(staff)/risk/`.

7. **Telemetry** — `henry.risk.scored`, `henry.risk.enforcement_held`, `henry.risk.enforcement_frozen`, `henry.risk.staff_override`.

## Out of scope
- Quality + workload prediction (V3-41).
- Anti-cheat for gaming (V3-66 gated).

## Dependencies
V3-26. Blocks V3-42, V3-50.

## Inheritance
@henryco/intelligence risk signal taxonomy; observability event sink.

## Trust / safety / compliance
- L15 AML program supports model approach.
- Model decisions audited.
- Staff override capability.
- ANTI-CLONE Principles 1, 10 (data moat), 12.

## Mobile + desktop parity
Server-side.

## i18n
N/A.

## Validation gates
1. Standard CI.
2. **Shadow-mode 30-day validation** — accuracy + false-positive rate measured.
3. **Tier enforcement test**.
4. **Staff override path**.
5. **Model version roll-back test**.

## Deployment gate
- L15 reviewed.
- Owner approves go-live after shadow-mode review.

## Final report contract
Standard.

## Self-verification
- [ ] Schema + scoring service.
- [ ] Tiered enforcement.
- [ ] Shadow-mode validation.
- [ ] Staff queue.
- [ ] 4 new telemetry events.
- [ ] L15 verified.
- [ ] Report written.
