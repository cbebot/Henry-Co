# V3-56 — Product: Learn-to-Earn + Employer Tools

**Pass ID:** V3-56 | **Phase:** G | **Pillar:** P1
**Deps:** V3-12 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Learn-to-Earn engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision: "Learn-to-earn + employer tools." Existing Learn app + Jobs board separated; this pass bridges them.

## Mandatory scope

1. **Verified course-completion badge**:
   - On course completion: badge + cert (existing learn-certificate template).
   - Badge becomes job-board signal: filter "verified by HenryCo Learn".

2. **Employer course-gating**:
   - Employers post jobs gated to specific course completers.
   - Candidates see "Take this course to qualify" CTA.

3. **Learn-to-earn pipeline**:
   - Completed learners auto-listed on relevant employer's candidate pool.
   - Privacy-respecting opt-in.

4. **Employer side**:
   - View course-verified candidates.
   - Bulk-invite for jobs.

5. **Telemetry** — `henry.learn.badge_issued`, `henry.learn.candidate.listed`, `henry.learn.employer.invited`.

## Out of scope
- Course authoring (existing Learn).
- Full employer hiring suite (V3-70).

## Dependencies
V3-12. Blocks V3-58.

## Inheritance
Existing Learn + Jobs; @henryco/branded-documents/learn-certificate.

## Trust / safety / compliance
- Candidate opt-in.
- ANTI-CLONE Principle 10 (verified-completion data moat).

## Mobile + desktop parity
Responsive.

## i18n
Per locale.

## Validation gates
1. Standard CI.
2. **Course-to-badge** smoke.
3. **Employer gated job** + candidate filter.
4. **Bulk-invite** flow.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Badge system.
- [ ] Employer gating.
- [ ] Pipeline candidate listing.
- [ ] Bulk invite.
- [ ] 3 new telemetry events.
- [ ] Report written.
