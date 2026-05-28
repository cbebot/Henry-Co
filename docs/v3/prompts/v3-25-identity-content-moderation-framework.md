# V3-25 — Identity: Content Moderation Framework

**Pass ID:** V3-25 | **Phase:** C | **Pillar:** P7
**Deps:** V3-12 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** Compliance

## Role
V3 Content Moderation engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P7: cross-division content moderation (marketplace listings, jobs posts, studio briefs, services profiles). Today: per-division ad-hoc moderation; intelligence-rollout-status notes triage exists for support.

## Mandatory scope

1. **`@henryco/moderation` package**:
   - Pre-publish moderation: scan submitted content before it goes live.
   - Post-publish moderation: flag reports + re-scan on report.
   - Decision: approve / hold-for-review / reject.

2. **`moderation_decisions` schema**:
   ```sql
   CREATE TABLE moderation_decisions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     content_type TEXT NOT NULL,
     content_id TEXT NOT NULL,
     content_snapshot JSONB NOT NULL,
     decision TEXT NOT NULL CHECK (decision IN ('approve','hold','reject')),
     reasons TEXT[] NOT NULL DEFAULT '{}',
     scanner TEXT NOT NULL, -- 'deterministic_rule' / 'ai_check' / 'manual'
     reviewer UUID, -- NULL for automated
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   ```

3. **Deterministic rules** (always run first):
   - Profanity / hate-speech filter (open-source lexicon).
   - Banned-product list (drugs, weapons, restricted goods per Nigerian + international law).
   - PII leak detector (phone numbers, addresses in public listings — flag for review).
   - Image hash check against known-bad list.

4. **AI-assisted moderation** (via V3-26 router; runs after deterministic):
   - Image classification: NSFW / violence / fraud-indicator.
   - Text classification: scam / spam / phishing.
   - Per-domain prompts (marketplace listing vs jobs post vs studio brief).

5. **Per-domain integration**:
   - Marketplace: every listing goes through moderation on create + edit.
   - Jobs: every job post moderated.
   - Studio briefs: client-provided briefs moderated for legal / IP issues.
   - Services profiles: provider bios moderated.

6. **Report-and-review flow**:
   - Users can report content via `apps/<app>/app/api/report/route.ts`.
   - Reports trigger re-moderation + staff review.
   - Staff queue at `apps/staff/app/(staff)/moderation/`.

7. **Telemetry** — `henry.moderation.scanned`, `henry.moderation.held`, `henry.moderation.rejected`, `henry.moderation.report_filed`, `henry.moderation.staff_override`.

## Out of scope
- Gaming-arena anti-cheat (V3-66 gated).
- Spam abuse defenses beyond moderation (V3-40).

## Dependencies
V3-12. Will optionally use V3-26 AI router.

## Inheritance
@henryco/intelligence event types; @henryco/observability.

## Trust / safety / compliance
- L6 acceptable-use policy published.
- ANTI-CLONE Principle 10 — the labeled moderation dataset is a moat.
- ANTI-CLONE Principle 12 — every decision audited.

## Mobile + desktop parity
Reports filable from mobile.

## i18n
Moderation messages localized.

## Validation gates
1. Standard CI.
2. **Deterministic rule tests** — 100+ cases.
3. **AI moderation accuracy** — sample-based precision/recall on labeled dataset.
4. **Report flow e2e** — user files report → staff sees → decision → notified.
5. **Per-domain integration smoke** — listing rejected via moderation never goes live.

## Deployment gate
- L6 published.
- 14-day soak; staff queue health monitored.

## Final report contract
Standard.

## Self-verification
- [ ] @henryco/moderation package.
- [ ] Schema + RLS.
- [ ] Deterministic rules + AI-assisted scan.
- [ ] Wired into 4 content domains.
- [ ] Report-and-review flow.
- [ ] Staff queue.
- [ ] 5 new telemetry events.
- [ ] L6 verified.
- [ ] Report written.
