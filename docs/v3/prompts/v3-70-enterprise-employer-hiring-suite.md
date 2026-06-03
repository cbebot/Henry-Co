# V3-70 — Partner & Enterprise: Employer Hiring Suite

**Pass ID:** V3-70  ·  **Phase:** H (Partner & Enterprise)  ·  **Pillar:** P8 (Business & Enterprise)
**Dependencies:** V3-57  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role
You are the V3 Employer Suite engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass turns the existing single-recruiter jobs employer console into an **ATS-grade hiring suite scoped to a `business`**: a configurable applicant pipeline with bulk stage moves, multi-recruiter collaboration (threaded comments + @mentions), structured candidate scoring with team aggregation, scheduled interviews on `@henryco/rooms`, and templated offer/rejection documents. The line you must not cross: candidate-supplied personal data (CV, contact, scores, internal notes) is **never** visible to the candidate, never visible to a recruiter outside the hiring business, and every read/write is RLS-gated by `business_members` — the hiring suite is a private operator surface, not a public one.

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/70-enterprise-employer-hiring-suite` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
The jobs app already ships a real, single-tenant employer console. The route tree `apps/jobs/app/employer/` has `hiring/[pipelineId]` (a kanban board), `hiring/[pipelineId]/[applicationId]`, `applicants/[id]`, `jobs/{new,[id]}`, `analytics`, `company`, and `settings`. The schema backing it is live: `public.jobs_hiring_pipelines`, `public.jobs_pipeline_stages` (per-pipeline configurable stages, `label jsonb` for i18n, `is_terminal`, `sort_order`), `public.jobs_applications`, `public.jobs_application_notes` (visibility `employer`/`recruiter`/`staff`, **never candidate-visible**), `public.jobs_interview_rooms`, and `public.jobs_offer_letters` (+ `jobs_offer_letter_events`, SignWell-backed via `SIGNWELL_API_KEY`, `typed_fallback` path). The default stage order lives in `apps/jobs/lib/jobs/content.ts`. Offer/application PDFs render through `@henryco/branded-documents` (`jobs-application.tsx` template; `formatKobo`/`statusToLabel` helpers; legal entity `Henry Onyx Limited` from `@henryco/config`).

What is missing — and what this pass delivers — is the **enterprise layer**: today's console is keyed by a recruiter identity and service-role writes, not by a multi-member `business`. There is no bulk stage move, no structured per-stage scoring with team aggregation, no threaded comment thread with @mentions, and no rejection-letter template (only offer letters exist). V3-57 introduced the `businesses` / `business_members` / `business_invitations` primitive plus the `resolveActingContext` acting-context layer on `@henryco/auth`. This pass re-grounds the employer console on that primitive (an employer becomes a `business` with `primary_partner_type = 'employer'`), and adds collaboration, scoring, bulk operations, and the rejection template on top of the pipeline that already exists. It does not rebuild the board or the offer-letter flow — it elevates them to team scale.

## Mandatory scope

### S1 — Re-scope the employer console to a `business`
The employer console becomes business-scoped. Add a nullable `business_id` foreign key to the pipeline owner so existing single-recruiter pipelines keep working while new ones bind to a V3-57 business. New migration `apps/jobs/supabase/migrations/<ts>_v3_70_hiring_business_scope.sql`:

```sql
-- Bind hiring pipelines to a V3-57 business (nullable for back-compat).
alter table public.jobs_hiring_pipelines
  add column if not exists business_id uuid
    references public.businesses(id) on delete set null;

create index if not exists jobs_hiring_pipelines_business_idx
  on public.jobs_hiring_pipelines (business_id)
  where business_id is not null;

-- A reusable predicate: is auth.uid() a member of the business that owns this pipeline?
create or replace function public.is_hiring_team_member(p_pipeline_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.jobs_hiring_pipelines p
    join public.business_members m on m.business_id = p.business_id
    where p.id = p_pipeline_id
      and m.user_id = auth.uid()
  );
$$;
```
RLS on every hiring table read by the console (`jobs_application_notes`, the new S3/S4 tables) uses `public.is_hiring_team_member(pipeline_id)` so a recruiter only ever sees applications inside their own business's pipelines. Writes route through the existing admin-client pattern **after** server-side `resolveActingContext` confirms a `{ kind: "business", businessId, role }` context whose `businessId` owns the pipeline. Acceptance: `pnpm test:rls` proves a member of business A cannot read business B's application notes, scores, or comments.

### S2 — ATS pipeline: stages + bulk move
Elevate the kanban board at `apps/jobs/app/employer/hiring/[pipelineId]/page.tsx`. Stages already exist in `jobs_pipeline_stages` (applied → screened → interview → offer → hired → rejected by default, `is_terminal` flags the closed states). Add:
- **Bulk stage move**: select N applications, move them to a target stage in one transaction via a `SECURITY DEFINER` RPC `move_applications_to_stage(p_application_ids uuid[], p_stage_id uuid, p_actor uuid)` that verifies every application belongs to the actor's business and writes one `jobs_application_stage_events` row per move (audit trail). Reject the whole batch if any application is outside the business (no partial moves).
- **Stage-change audit**: new table `public.jobs_application_stage_events (id, application_id, from_stage_id, to_stage_id, actor_user_id, occurred_at)` with `is_hiring_team_member` RLS. This is the source for the `henry.hiring.application.staged` event.
Acceptance: moving a mixed-business batch returns a typed error and mutates nothing; a same-business batch moves all rows and emits one telemetry event per move.

### S3 — Candidate scoring (structured + team-aggregated)
New table `public.jobs_application_scores`:

```sql
create table if not exists public.jobs_application_scores (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.jobs_applications(id) on delete cascade,
  stage_id        uuid references public.jobs_pipeline_stages(id) on delete set null,
  scorer_user_id  uuid not null references auth.users(id) on delete cascade,
  rubric_key      text not null,                 -- e.g. 'technical','communication','culture'
  score           int  not null check (score between 1 and 5),
  comment         text,
  created_at      timestamptz not null default timezone('utc', now()),
  updated_at      timestamptz not null default timezone('utc', now()),
  unique (application_id, stage_id, scorer_user_id, rubric_key)
);
```
The `unique` constraint makes a scorer's score per rubric/stage idempotent (re-score = update, not duplicate). A `jobs_application_score_summary` view aggregates the team's scores per application (mean per rubric + overall mean + scorer count) and powers the candidate-detail header. Reserve a nullable `predictive_score numeric` column on the summary read model for the future V3-41 predictive quality score — render it only when present, never block on it. Acceptance: two recruiters scoring the same candidate produce one aggregated mean; the candidate never sees any score (RLS + no candidate-facing route reads this table).

### S4 — Team collaboration: threaded comments + @mentions
Extend the internal-notes model into a thread. Reuse `jobs_application_notes` for the leaf storage but add `parent_note_id uuid references public.jobs_application_notes(id)` for threading and a `mentions uuid[]` column for @mentioned member ids. On comment create:
- Resolve mentions to `business_members` of the owning business only (a mention of a non-member is dropped server-side, never delivered).
- Notify each mentioned member through `@henryco/notifications` (in-app) — never email the candidate, never leak the comment body outside the business.
The composer reuses `@henryco/chat-composer` for the @mention affordance. Acceptance: @mentioning a non-member yields no notification and no stored mention; @mentioning a member produces exactly one in-app notification deep-linked to the application.

### S5 — Interview scheduling on `@henryco/rooms`
Wire scheduled interviews into the suite using the existing `jobs_interview_rooms` table and `@henryco/rooms`. From the candidate-detail view, a recruiter schedules an interview (date/time + attendees from `business_members` + optional candidate), which creates a room and surfaces the join link to both sides through their respective surfaces. Recording is opt-in and consent-gated (the room mechanics themselves are V3-54's concern — this pass only schedules and links). Acceptance: scheduling creates a `jobs_interview_rooms` row, emits `henry.hiring.interview.scheduled`, and the candidate sees only their own interview, never the internal notes/scores.

### S6 — Offer + rejection templates
Offer letters already exist (`jobs_offer_letters` + `jobs-application` document path). Add the missing **rejection-letter** path:
- New branded-document template `packages/branded-documents/src/templates/jobs-rejection-letter.tsx` (reuses `BrandedDocument`, `DocumentSection`, `LegalFooter`; legal entity `Henry Onyx Limited` from `@henryco/config`).
- A templated, i18n-keyed body with merge fields (candidate name, role title, business trading name) — the recruiter never types raw HTML; they pick a template + tone.
- Sending a rejection moves the application to the terminal `rejected` stage (S2) and emits `henry.hiring.offer.sent` only for offers; rejections emit `henry.hiring.application.staged` with the terminal stage.
Acceptance: a rejection letter renders in light/dark-agnostic PDF with the correct legal entity and a translated body; an offer sent emits `henry.hiring.offer.sent`; a candidate hired emits `henry.hiring.candidate.hired`.

### S7 — Telemetry
Add four event names to the intelligence registry (`packages/intelligence/src/index.ts`, validated by `henryEventNameSchema`, shape `henry.<domain>.<noun>.<verb>`), each carrying `{ businessId, pipelineId, applicationId }` and a business-actor block (never a personal actor for these operator events):
```
henry.hiring.application.staged     henry.hiring.interview.scheduled
henry.hiring.offer.sent             henry.hiring.candidate.hired
```

## Out of scope
- The public job board, job posting, and candidate apply flow (existing jobs app — not touched).
- Interview room **mechanics** (live video, recording storage, recruiter in-room notes) — V3-54 owns the room internals; this pass only schedules and links.
- The `businesses` / `business_members` primitive and acting-context layer — V3-57 owns it; this pass consumes it.
- Predictive candidate scoring model — V3-41 (this pass reserves the read-model column only).
- Right-to-be-forgotten / candidate data deletion workflow — V3-93 (DSAR). This pass keeps notes/scores candidate-invisible but does not implement deletion.
- Employer billing / subscription tiers — handled by `jobs_employer_subscriptions` + V3-75.

## Dependencies
**Depends on:** V3-57 (`businesses` / `business_members`, `resolveActingContext`). **Optionally consumes:** V3-54 (interview room mechanics) and V3-41 (predictive score) when present — both are render-when-available, never blocking. **Blocks:** nothing downstream hard-depends on this pass; it is a parallel-safe Phase H suite.

## Inheritance
- The shipped jobs ATS schema: `jobs_hiring_pipelines`, `jobs_pipeline_stages`, `jobs_applications`, `jobs_application_notes`, `jobs_interview_rooms`, `jobs_offer_letters` (+ events).
- V3-57: `businesses` / `business_members`, `resolveActingContext` / `setActingContext` on `@henryco/auth`.
- `@henryco/branded-documents` — `jobs-application` template + the `BrandedDocument`/`DocumentSection`/`LegalFooter` components for the new rejection template.
- `@henryco/rooms` — scheduled interview rooms.
- `@henryco/chat-composer` — @mention composer.
- `@henryco/notifications` — in-app mention notifications.
- `@henryco/observability/audit-log` — `writeAuditLog` on every stage move, score, and offer/rejection send.
- `@henryco/intelligence` — telemetry envelope + event-name registry.
- `@henryco/i18n` — all labels/status/errors and the document body copy.

## Implementation requirements

### Files
- `apps/jobs/supabase/migrations/<ts>_v3_70_hiring_business_scope.sql` (S1 `business_id` + `is_hiring_team_member`).
- `apps/jobs/supabase/migrations/<ts>_v3_70_hiring_collaboration.sql` (S2 stage-events + RPC, S3 scores + summary view, S4 threaded notes columns).
- `apps/jobs/app/employer/hiring/[pipelineId]/page.tsx` (bulk move), `.../[applicationId]/page.tsx` (scoring header + comment thread + schedule interview).
- `apps/jobs/app/api/employer/hiring/*` route handlers (stage move, score, comment, schedule, send-offer, send-rejection — all `resolveActingContext`-gated).
- `packages/branded-documents/src/templates/jobs-rejection-letter.tsx` (+ index export).
- `packages/i18n/src/jobs-copy.ts` extension (hiring-suite keys); `packages/intelligence/src/index.ts` (4 event names).

### Trust / safety / compliance
Default-deny RLS on every new table via `is_hiring_team_member`. Candidate data (CV, contact, notes, scores, comments) is never exposed to the candidate or to a non-member recruiter — verified by the RLS suite. Every mutating route resolves `resolveActingContext` and re-verifies the business owns the pipeline server-side (the acting-context cookie never widens authority). `writeAuditLog` on bulk stage moves, scores, offers, and rejections, recording `{ businessId, actorUserId, applicationId, action }`. Mentions are resolved against `business_members` server-side; a non-member mention is dropped, never delivered. No money mutation in this pass.

### Mobile + desktop parity
Operator-primary surface: desktop-first for the kanban board, scoring, and comment thread. The candidate-facing slices (interview invite, offer/rejection receipt) are mobile-first and verified on web mobile (safe-area, sticky nav, modal escape per V3-09). Super-app: recruiter operator views are deferred to the mobile-parity wave (V3-87) — state this explicitly in the report; do not silently skip.

### i18n
All copy through `@henryco/i18n`, namespace **`surface:jobs`** (extend `packages/i18n/src/jobs-copy.ts`) for the suite chrome; stage labels stay in `jobs_pipeline_stages.label jsonb`. Rubric labels, score copy, comment-thread chrome, interview-invite copy, and the rejection-letter body are Pattern A typed keys; Pattern B `translateSurfaceLabel` covers the 11 non-en locales. Zero hardcoded user-facing strings.

### Brand & design system
Henry Onyx brand correctness via `@henryco/config` (`COMPANY.group.name`, division `Henry Onyx Jobs`) — never the retired "Henry & Co.". The rejection-letter legal entity is `Henry Onyx Limited` from `company.ts` `legalName`. Any document link or join URL resolves through `henryDomain('jobs', ...)` / `getAccountUrl()` — never a literal `henrycogroup.com`. The console uses design-system tokens only (Fraunces display where editorial, locked `--site-*`/`--accent`); light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed (`pnpm a11y:contrast`).

## Validation gates
1. **CI** green: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` across `apps/jobs`, `packages/branded-documents`, `packages/i18n`, `packages/intelligence`.
2. **RLS suite** (`pnpm test:rls`, ~8 cases): member of business A blocked from B's notes/scores/comments/stage-events; candidate blocked from notes/scores/comments; bulk-move RPC rejects a cross-business batch atomically.
3. **Unit/integration** (~14 cases): bulk stage move (all-or-nothing); score idempotency (re-score updates, summary aggregates correctly); @mention resolution (member delivered, non-member dropped); interview scheduling creates a room + event; offer vs rejection telemetry routing.
4. **e2e** (Playwright): create employer business → invite recruiter → both score a candidate → comment + @mention → schedule interview → send offer (or rejection) → telemetry fires → candidate sees only their interview/offer, never notes/scores.
5. **Document render**: `jobs-rejection-letter.tsx` renders a PDF with `Henry Onyx Limited` legal entity + translated body.
6. **i18n gate**: hardcoded-text scanner clean; `surface:jobs` hiring keys present in all 12 locales.
7. **Real-browser UI**: kanban + candidate detail in light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` clean.

## Deployment gate
All validation gates green; the RLS suite green is mandatory (candidate-data isolation). The only required branch-protection check (`Lint, typecheck, test, build`) passing. Owner review of the kanban + candidate-detail design from screenshots before merge. Branch `v3/70-enterprise-employer-hiring-suite` off `origin/main` → PR → CI green → squash-merge; no force-push. 14-day soak on the bulk-move + scoring + mention-notification path before any downstream pass relies on it.

## Final report contract
`.codex-temp/v3-70-enterprise-employer-hiring-suite/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline — the 4 `henry.hiring.*` events firing · deferred items — interview-room mechanics → V3-54, predictive score → V3-41, candidate-data deletion → V3-93, native operator views → V3-87 · pass-closure assertion).

## Self-verification
- [ ] S1: hiring pipelines bound to a V3-57 `business`; `is_hiring_team_member` RLS proven by `pnpm test:rls`.
- [ ] S2: bulk stage move is all-or-nothing, audited per-move, and emits `henry.hiring.application.staged`.
- [ ] S3: structured candidate scoring idempotent per scorer/rubric/stage; team-aggregated summary view; predictive column reserved (render-when-present).
- [ ] S4: threaded comments + @mentions resolved against `business_members`; non-member mention dropped; member mention → one in-app notification.
- [ ] S5: interview scheduling creates a `jobs_interview_rooms` row on `@henryco/rooms`; candidate sees only their interview.
- [ ] S6: `jobs-rejection-letter.tsx` template renders with `Henry Onyx Limited`; offer/rejection telemetry routes correctly.
- [ ] S7: 4 `henry.hiring.*` events registered and firing with a business-actor block.
- [ ] Brand = Henry Onyx via `@henryco/config`; zero hardcoded domains; zero hardcoded strings; `surface:jobs` hiring keys in 12 locales.
- [ ] CI + RLS + e2e + i18n + real-browser light/dark/mobile/desktop/CLS≈0/contrast all green.
- [ ] `.codex-temp/v3-70-enterprise-employer-hiring-suite/report.md` written with all 9 sections.
