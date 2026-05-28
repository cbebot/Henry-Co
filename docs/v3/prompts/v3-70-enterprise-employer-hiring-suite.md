# V3-70 — Enterprise: Employer Hiring Suite

**Pass ID:** V3-70 | **Phase:** H | **Pillar:** P8
**Deps:** V3-57 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Employer Suite engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P8: "Employer hiring suite — ATS, interview scheduling, candidate scoring, team collaboration." Existing jobs employer console basic; this pass adds depth.

## Mandatory scope

1. **ATS features**:
   - Application stages: applied / screened / interview / offer / hired / rejected.
   - Bulk move between stages.
   - Application notes (shared across team).

2. **Interview scheduling**: integrates V3-54 interview room.

3. **Candidate scoring**:
   - Hiring manager rates per stage.
   - Aggregated team rating.
   - V3-71 deep predictive score (when available).

4. **Team collaboration**:
   - Multi-recruiter access (uses V3-57 business-members).
   - Threaded comments per application.
   - @mentions.

5. **Templates**: rejection emails, offer letters (via @henryco/branded-documents).

6. **Telemetry** — `henry.hiring.application.staged`, `henry.hiring.interview.scheduled`, `henry.hiring.offer.sent`, `henry.hiring.candidate.hired`.

## Out of scope
- Job board (existing).
- Interview room mechanics (V3-54).

## Dependencies
V3-57. Optionally V3-54 for interview UI.

## Inheritance
Existing jobs app; @henryco/branded-documents (jobs-application template).

## Trust / safety / compliance
- Candidate-data RLS.
- Right-to-be-forgotten support per V3-93.

## Mobile + desktop parity
Desktop-primary; mobile candidate-list view.

## i18n
Per locale.

## Validation gates
1. Standard CI.
2. **Stage transitions** smoke.
3. **Interview scheduling** + V3-54 integration.
4. **Multi-recruiter access** with role gates.
5. **Templates** render correctly.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] ATS stages.
- [ ] Interview scheduling.
- [ ] Candidate scoring.
- [ ] Team collaboration.
- [ ] Templates.
- [ ] 4 new telemetry events.
- [ ] Report written.
