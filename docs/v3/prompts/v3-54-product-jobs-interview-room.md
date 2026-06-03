# V3-54 — Product Expansion: Jobs Interview Room

**Pass ID:** V3-54  ·  **Phase:** G (Product Expansion)  ·  **Pillar:** P1 (Service Breadth)
**Dependencies:** V3-12  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** Identity (recording consent + participant identity)

---

## Role
You are the V3 Jobs engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass lands the candidate↔employer **scheduled interview room** on the canonical, provider-abstracted `@henryco/rooms` engine — a real video room with chat, recruiter scorecards, and consent-gated recording — and reconciles the legacy app-local interview table into that single engine. The line you must not cross: do **not** build a third video stack or a second consent model. The room engine, the consent ledger, and the scorecard primitive already exist in `@henryco/rooms` — your job is to *consume* them for Jobs, not reinvent them. Full ATS depth belongs to V3-70.

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/54-product-jobs-interview-room` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
There are **two interview-room substrates in the tree today**, and this pass exists to land on the right one and reconcile the other:

- **Canonical engine — `@henryco/rooms` (use this).** `packages/rooms/src` ships a provider-abstracted real-time room engine: `types.ts` defines `RoomKind` including `"jobs_interview"`, `RoomProvider` (`daily` primary, `jitsi` no-account fallback), `RoomStatus` (`scheduled → live → ended | cancelled`), and `ParticipantRole` (`host`/`candidate`/`interviewer`/`observer`/…). `server/actions.ts` exposes typed Next.js server actions gated on `requireUnifiedViewer()` from `@henryco/auth/server`, each wrapped in typed `RoomError`, observability-logged, and emitting taxonomy events — including `createRoom`, `joinRoom`, `startRecording`/`stopRecording` (gated on a per-participant consent ledger), `submitScorecard`, and post-attachment. `components/` ships `RoomShell`, `RoomChat`, `ScreenSharePane`, `PresencePane`, `RecordingConsent` (granted_at/withdrew_at consent), and `ScorecardSidebar` (JSON-driven dimensions; the **recruiter-notes primitive**). The canonical persistence is `rooms_sessions` (schema mirrored in `apps/hub/supabase/migrations/<TS>_rooms_*.sql`); for Jobs the `metadata` jsonb is documented as `{ jobId, applicationId, scorecardId }`.
- **Legacy app-local table — `jobs_interview_rooms` (reconcile away).** `apps/jobs/supabase/migrations/20260515121000_jobs_interview_rooms.sql` (earlier "V3 PASS 21" cycle) created `public.jobs_interview_rooms` + `public.jobs_interview_room_events` (Daily.co-specific, `provider default 'daily.co'`, `employer_notes`, `candidate_feedback`, `recording_enabled`). It references `jobs_applications` + `jobs_interviews`. This is a Daily-only single-provider precursor that predates the canonical engine.
- **Surfaces that exist.** `apps/jobs/app/candidate/interviews/page.tsx`, `apps/jobs/app/recruiter/` (candidates/pipeline/jobs), `apps/jobs/app/employer/hiring/[pipelineId]`, and the account-app mirror `apps/account/app/(account)/jobs/interviews/[sessionId]/page.tsx` already exist as shells.

**The gap this pass closes.** The room engine, consent ledger, scorecard, and chat all exist — but the Jobs interview experience is not actually wired onto them end-to-end: scheduling does not create a `rooms_sessions` row of kind `jobs_interview`, the candidate/recruiter surfaces do not mount `RoomShell`, the scorecard is not persisted per `application_id`, reschedule/cancel/no-show transitions are not driven through the room state machine, and the legacy `jobs_interview_rooms` table is an unreconciled parallel truth. This pass makes the canonical engine the single source of interview-room truth for Jobs and retires the legacy table to a thin compatibility view.

## Mandatory scope

### S1 — Schedule → canonical room creation
On interview scheduling (from `apps/jobs/app/recruiter` / `apps/jobs/app/employer/hiring/[pipelineId]`), call `createRoom` from `@henryco/rooms/server/actions` with `kind: "jobs_interview"`, `scheduledAt`, `ownerUserId` = scheduling recruiter, and `metadata: { jobId, applicationId, scorecardId }`. Persist the link from `jobs_interviews.id` → `rooms_sessions.id`. Provider selection is delegated to the `@henryco/rooms` provider-selector (Daily primary, Jitsi fallback) — never hardcode `daily.co`. **Acceptance:** scheduling produces exactly one `rooms_sessions` row of kind `jobs_interview` with correct metadata; the recruiter and candidate both see the scheduled room.

### S2 — Room surface (mount the existing primitives)
Wire `apps/jobs/app/candidate/interviews/[sessionId]` and the recruiter join surface to mount `<RoomShell>` with `<RoomChat>`, `<ScreenSharePane>`, `<PresencePane>`, `<RecordingConsent>`, and `<ScorecardSidebar>` (recruiter/interviewer roles only). Join is via `joinRoom` (gated `requireUnifiedViewer` + kind-vs-role authorization already enforced in the engine). The account-app mirror at `apps/account/app/(account)/jobs/interviews/[sessionId]/page.tsx` consumes the same engine. **Acceptance:** candidate and recruiter can join the same session; roles render the correct panes (candidate sees no scorecard); join is denied to non-participants.

### S3 — Recruiter scorecard persisted per application
Use the existing `ScorecardSidebar` + `submitScorecard` action. Drive Jobs dimensions (default scaffold `{ technical, communication, culture, recommendation }`, overridable per pipeline) and persist the result keyed to `application_id` via the `metadata.scorecardId` link so it is retrievable from the application/pipeline view after the interview. **Acceptance:** a submitted scorecard is retrievable from the application detail; multiple interviewers can each submit; scores roll up to the pipeline view.

### S4 — Consent-gated recording
Use the existing `RecordingConsent` component + the engine's consent gate: `startRecording` succeeds only when **every** participant has a `granted_at` row with no `withdrew_at`. Surface the consent prompt to both parties at join; recording controls appear to the host only after both consents are granted. Recordings are stored encrypted (engine/provider-side) and retained per the privacy policy; expose the recording link only to authorized roles via signed URL. **Acceptance:** recording cannot start without two-sided consent; a withdrawn consent blocks/stops recording; the recording is access-controlled.

### S5 — Lifecycle: reschedule, cancel, no-show
Drive interview lifecycle through the room state machine: reschedule updates `scheduledAt` (and re-notifies both parties), cancel transitions `scheduled → cancelled`, and a no-show is recorded when the scheduled window passes with one party absent (derived from `joinedAt`/presence). Each transition notifies via the existing jobs notification pipeline and writes the audit event. **Acceptance:** reschedule/cancel/no-show each transition the session correctly, notify both parties, and are auditable.

### S6 — Candidate↔employer chat outside the room
Wire persistent candidate↔employer messaging (outside the live interview) onto the existing `@henryco/chat-composer` primitive within the Jobs conversation surfaces (`apps/jobs/app/candidate/conversations`). The in-room chat (`RoomChat`) is ephemeral to the session; this is the durable thread tied to the application. **Acceptance:** messages persist against `application_id`, both parties see history, RLS scopes reads to the application's candidate + the employer members.

### S7 — Reconcile the legacy table + telemetry
Add a migration that converts `public.jobs_interview_rooms` into a thin compatibility layer (a view or a one-time backfill into `rooms_sessions`, whichever preserves existing rows) so there is one truth; keep the legacy table readable for any historical references but stop writing to it. Document the reconciliation in the report. Emit via `@henryco/observability`: `henry.interview.scheduled`, `henry.interview.started`, `henry.interview.completed`, `henry.interview.recorded`, `henry.interview.no_show` (carrying `{ sessionId, applicationId, jobId, provider }`, no PII). **Acceptance:** no new writes to `jobs_interview_rooms`; all five events fire on their transitions; the reconciliation is reversible-documented.

## Out of scope
- Full applicant-tracking depth (stages, pipeline automation, candidate scoring rollups beyond the scorecard) — **V3-70** (enterprise employer hiring suite).
- AI-assisted auto-scheduling or AI brief/notes drafting — **V3-32** (studio/brief assist patterns) and the AI layer; this pass is deterministic scheduling only.
- The `@henryco/rooms` engine itself (provider drivers, consent ledger schema, scorecard schema) — already shipped; do not modify it beyond passing Jobs-specific props/config.
- Care/Studio/Property uses of `@henryco/rooms` — other consumers own their own wiring.

## Dependencies
Depends on **V3-12** (Foundation Lock certified) and consumes the shipped `@henryco/rooms` engine. **Blocks downstream:** V3-70 (employer hiring suite builds ATS depth on top of this room + scorecard). Soft-coupled to V3-87 (mobile super-app parity) which consumes the same engine for native rooms.

## Inheritance
Builds on: `@henryco/rooms` (engine, `RoomShell`/`RoomChat`/`RecordingConsent`/`ScorecardSidebar`/`ScreenSharePane`/`PresencePane`, server actions, provider-selector, `rooms_sessions`); `@henryco/chat-composer` (durable application thread); `@henryco/auth/server` (`requireUnifiedViewer`); `@henryco/observability` (telemetry + audit); the existing Jobs schema (`jobs_applications`, `jobs_interviews`, employer/recruiter surfaces); V3-02 `requireSensitiveAction` for recording-control routes.

## Implementation requirements
### Files
- New: `apps/jobs/supabase/migrations/<TS>_jobs_interview_room_link.sql` (link `jobs_interviews.id` ↔ `rooms_sessions.id`), `<TS>_jobs_interview_rooms_reconcile.sql` (legacy table → compatibility view / backfill).
- Changed: `apps/jobs/app/candidate/interviews/[sessionId]/page.tsx` (+ `apps/jobs/app/candidate/interviews/page.tsx`), recruiter/employer scheduling + join surfaces, `apps/jobs/app/candidate/conversations`, `apps/account/app/(account)/jobs/interviews/[sessionId]/page.tsx`.
- New: scheduling/lifecycle server actions in `apps/jobs/app/actions.ts` (or `apps/jobs/lib/interviews/actions.ts`) that call `@henryco/rooms/server/actions`.
- Webhook: `apps/jobs/app/api/webhooks/<provider>/route.ts` if Jobs needs room-event capture not already handled by the engine (HMAC-verified).

### Trust / safety / compliance
Recording requires explicit two-sided consent (engine-enforced) — never default-on. Recording controls + reschedule/cancel routes gated by `requireSensitiveAction` (V3-02) and audit-logged. RLS: candidates read only their own application's room; employer members read rooms for pipelines under their membership; service-role for staff. Recordings retained per privacy policy with signed-URL access only. Participant identity comes from `requireUnifiedViewer` — no anonymous joins to a `jobs_interview` room. This is the `Identity` risk class: the consent ledger is the compliance artifact.

### Mobile + desktop parity
Web mobile + desktop responsive room surface (the engine's primitives are responsive). Native room via the Expo super-app consumes the same `@henryco/rooms` engine (or documented web fallback) per V3-87 — wire the room surface so it is parity-ready; do not block on native delivery in this pass.

### i18n
All interview-room labels, status, consent copy, scorecard dimension labels, and notification copy flow through `@henryco/i18n` under namespace `surface:jobs-interview`. 12 locales; status/errors/consent prompts translated. Scorecard dimension *keys* are identifiers (exempt); their displayed labels are translated.

### Brand & design system
All user-facing brand strings = **Henry Onyx Jobs** via `@henryco/config` (`COMPANY.divisions.jobs.name`), never hardcoded. Room + chat surfaces use the locked jobs `--site-*`/`--accent` tokens; light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed. Zero hardcoded domains — join links and notifications use `henryDomain('jobs')` / `getAccountUrl()`.

## Validation gates
1. **CI green:** `pnpm typecheck && pnpm lint && pnpm test && pnpm build` for `apps/jobs` (+ `apps/account` mirror).
2. **Room creation + join smoke:** scheduling creates one `jobs_interview` `rooms_sessions` row; candidate + recruiter both join; roles render correct panes; non-participant join denied.
3. **Recording consent flow:** recording blocked without two-sided consent; withdrawn consent stops it; recording link is signed-URL access-controlled.
4. **Lifecycle:** reschedule/cancel/no-show transition correctly, notify both parties, write audit rows.
5. **Scorecard:** submitted scorecard retrievable per `application_id`; multi-interviewer rollup correct.
6. **Reconciliation:** no new writes to `jobs_interview_rooms`; legacy rows still readable.
7. **RLS verification:** candidate/employer/service-role read scopes enforced.
8. **i18n gate:** `pnpm i18n:scan` passes; namespace `surface:jobs-interview` complete.

## Deployment gate
All gates green; PR on `v3/54-product-jobs-interview-room` off `origin/main` → CI green → squash-merge. Run a **14-day soak with at least one internal-team end-to-end interview** (schedule → join → consent-gated record → scorecard → complete) before opening to external traffic. Confirm provider failover (Daily → Jitsi) works under the engine's selector. Owner review not required (no D-gate), but the recording/consent path must pass a manual two-party walkthrough.

## Final report contract
`.codex-temp/v3-54-product-jobs-interview-room/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion), explicitly documenting the legacy `jobs_interview_rooms` reconciliation.

## Self-verification
- [ ] S1: scheduling creates one canonical `jobs_interview` `rooms_sessions` row with `{ jobId, applicationId, scorecardId }`; provider chosen by the engine selector, never hardcoded.
- [ ] S2: candidate + recruiter surfaces mount `RoomShell` + the existing panes; role-correct rendering; non-participant join denied.
- [ ] S3: recruiter scorecard persists per `application_id` and rolls up to the pipeline view.
- [ ] S4: recording is two-sided-consent-gated, withdrawal-respecting, signed-URL access-controlled.
- [ ] S5: reschedule/cancel/no-show drive the room state machine, notify both parties, and are audited.
- [ ] S6: durable candidate↔employer chat on `@henryco/chat-composer`, RLS-scoped to the application.
- [ ] S7: legacy `jobs_interview_rooms` reconciled to a single truth; all five telemetry events fire; report documents the migration.
- [ ] Cross-cutting: zero hardcoded domains/strings; i18n namespace `surface:jobs-interview`; tokens-only UI; `requireSensitiveAction` on recording/lifecycle; report written.
