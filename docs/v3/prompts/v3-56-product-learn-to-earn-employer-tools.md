# V3-56 — Product Expansion: Learn-to-Earn + Employer Tools

**Pass ID:** V3-56  ·  **Phase:** G (Product Expansion)  ·  **Pillar:** P1 (Product Expansion)
**Dependencies:** V3-12 (Foundation Lock acceptance — CERTIFIED, PR #168)  ·  **Effort:** L  ·  **Parallel-safe:** Y (with other Phase G passes after V3-12)
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 Learn-to-Earn engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass bridges two divisions that are separate today — Henry Onyx Learn and Henry Onyx Jobs — into one verified-skill pipeline: a course-completion → verified-badge issuance that becomes a job-board trust signal, employer-side course-gating on job posts, an opt-in candidate pipeline that surfaces verified completers to relevant employers, and an employer bulk-invite flow. The line it must not cross: the **verified-completion data moat is real** (ANTI-CLONE Principle 10 — a badge means a genuine, governed completion, never a self-asserted claim), candidate listing is **strictly opt-in and privacy-respecting** (NDPR/GDPR — no completer is exposed to an employer without explicit consent), and this pass builds the **bridge and the employer tools**, not course authoring (existing Learn) or the full ATS-grade hiring suite (V3-70).

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/56-product-learn-to-earn-employer-tools` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

Both halves of the bridge already exist as governed systems. **Learn:** `apps/learn/supabase/migrations/20260402233000_learn_init.sql` ships `learn_courses`, `learn_enrollments`, `learn_progress` (`status`, completion tracking), `learn_certificates` (`certificate_no` unique, `verification_code` unique, `issued_at`, `score`, `status`), and `learn_certificate_verification` (the public verification ledger). The branded certificate already renders via `packages/branded-documents/src/templates/learn-certificate.tsx`. **Jobs:** the jobs app reads `jobs_applications`, `jobs_categories`, `jobs_skills`, `jobs_role_titles`, and — critically — `jobs_skill_verifications` (PASS-21 "verified candidate profile": `candidate_user_id`, `skill_id`, `skill_label`, `status in ('pending','verified','rejected','expired')`, `verified_by_user_id`, `verified_at`) plus `jobs_experience_verifications` and `jobs_employer_subscriptions`. The shared `@henryco/trust` package defines the verification vocabulary (`SharedVerificationStatus`, `getVerificationGateCopy`). The gap: **the two divisions don't talk.** A learner can complete a course and earn a certificate, but that completion is invisible to Jobs — it is not a `jobs_skill_verifications` row, there is no "verified by Henry Onyx Learn" filter on the job board, employers can't gate a post to course completers, and there is no opt-in pipeline surfacing completers to employers. This pass writes the bridge: a verified course-completion issues a governed Jobs verification, exposes it as a job-board signal, lets employers gate + discover on it, and gives candidates an opt-in to be listed — never auto-exposed.

## Mandatory scope

### S1 — Verified course-completion → Jobs skill verification

When a `learn_certificates` row is issued (status `issued`, a real governed completion), a server-side bridge writes a corresponding **verified** `jobs_skill_verifications` row for that user, tagged as Learn-sourced:

```sql
-- Extend the existing jobs_skill_verifications ledger with a provenance link.
alter table public.jobs_skill_verifications
  add column if not exists source        text,                -- 'learn_completion' | 'manual' | 'reference'
  add column if not exists source_ref     uuid,               -- learn_certificates.id when source='learn_completion'
  add column if not exists course_id      uuid;               -- learn_courses.id, for the gate + filter

create unique index if not exists jobs_skill_verifications_learn_source_idx
  on public.jobs_skill_verifications(source, source_ref)
  where source = 'learn_completion';
```

The bridge runs server-side (a Learn → Jobs event handler, **not** a client call) and is **idempotent** on `(source='learn_completion', source_ref=certificate_id)` — re-issuing or re-syncing never double-creates. The verification's `status` is `verified`, `verified_by_user_id` is the platform (system) actor, `verified_at` is the certificate `issued_at`, `skill_label`/`course_id` come from the course. **The badge means a real completion** — the bridge fires only on a genuine `learn_certificates` issuance, never on enrollment or self-claim (ANTI-CLONE Principle 10). RLS on the new columns inherits the existing `jobs_skill_verifications` policies; the cross-division write uses the service-role/system path, audited via `@henryco/observability/audit-log`.

### S2 — "Verified by Henry Onyx Learn" job-board signal + filter

On the Jobs candidate profile and in the candidate search, surface a **"Verified by Henry Onyx Learn"** badge for any `jobs_skill_verifications` row with `source='learn_completion'`, status `verified`. Add a server-side filter so an employer can narrow the candidate pool to "verified by Henry Onyx Learn" for a given course/skill. Badge + filter copy come from `@henryco/i18n` (reuse `getVerificationGateCopy` from `@henryco/trust` where it fits); the division label "Henry Onyx Learn" reads from `@henryco/config` (`getDivisionConfig('learn').name`), never hardcoded. The badge links to the public `learn_certificate_verification` ledger entry so the claim is auditable (no PII beyond what the public verification page already exposes).

### S3 — Employer course-gating on job posts

Employers can gate a job post to candidates who completed a specific course:

```sql
create table if not exists public.jobs_course_gates (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null,                       -- FK-by-convention to the jobs posting
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  course_id     uuid not null,                       -- learn_courses.id
  required      boolean not null default true,       -- true = hard gate, false = preferred
  created_at    timestamptz not null default timezone('utc', now()),
  updated_at    timestamptz not null default timezone('utc', now()),
  unique (job_id, course_id)
);
```

A gated post shows non-qualifying candidates a **"Take this course to qualify"** CTA that deep-links into the Learn course via `henryDomain('learn', '/courses/<slug>')` (zero hardcoded domains). A hard gate (`required=true`) blocks application until the verified completion exists; a soft gate (`required=false`) marks the candidate "preferred". RLS: only the owning employer writes a gate (`employer_user_id = auth.uid()` and they own the job); the gate is publicly readable so the CTA renders. Gate creation requires `requireSensitiveAction` (V3-02) and is audited.

### S4 — Opt-in learn-to-earn candidate pipeline

A verified completer can **opt in** to be listed in the candidate pool for employers gating/hiring on that course — strictly consent-first:

```sql
create table if not exists public.learn_candidate_optins (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  course_id     uuid not null,                       -- learn_courses.id
  opted_in_at   timestamptz not null default timezone('utc', now()),
  revoked_at    timestamptz,                         -- opt-out honored immediately
  visibility    text not null default 'employers'    -- 'employers' | 'private'
                 check (visibility in ('employers','private')),
  unique (user_id, course_id)
);
```

A completer with an active opt-in (no `revoked_at`, `visibility='employers'`) appears in the relevant employer's candidate pool for that course. **No completer is ever exposed without an active opt-in** (NDPR/GDPR consent ledger — the opt-in row *is* the consent record). Opt-out is immediate (sets `revoked_at`) and removes them from every employer pool. The opt-in/opt-out toggle lives in the Learn account surface and requires `requireSensitiveAction`; both transitions are audited. RLS: the user reads/writes only their own opt-ins; employers read (via a scoped view) only `visibility='employers'`, non-revoked rows for courses they gate/hire on; staff read all.

### S5 — Employer side: verified-candidate pool + bulk-invite

Employer surfaces (under `apps/jobs/app/` employer workspace) to:
- **View course-verified candidates** — the pool of opted-in, "verified by Henry Onyx Learn" completers for the employer's gated/relevant jobs, with the verification badge and (opt-in-scoped) profile.
- **Bulk-invite** selected candidates to a job. Bulk invite writes invitation rows (one per candidate, idempotent per `(job_id, candidate_user_id)`), notifies each candidate via the existing `@henryco/notifications` channel (in-app + email per the notification fan-out), and respects rate limits + the candidate's notification preferences. Bulk invite requires `requireSensitiveAction` and is audited; it never bypasses a candidate's opt-out.

### S6 — Telemetry

Three new events in the `HenryEventName` union (`packages/observability/src/events.ts` — an unmapped event is a compile error), emitted server-side:

```
henry.learn.badge.issued        (a learn_completion jobs_skill_verifications row written)
henry.learn.candidate.listed     (an employer-visible opt-in became active)
henry.learn.employer.invited      (a bulk-invite sent to a verified candidate)
```

No PII in payloads — course id, course/skill slug, count, division only.

## Out of scope

- Course authoring, lesson/quiz building, the player — existing Learn (this pass consumes `learn_courses` / `learn_certificates`, it does not change authoring).
- The full ATS-grade employer hiring suite (applicant tracking, scoring, team collaboration) — **V3-70** (this pass ships the verified-candidate pool + bulk-invite, not the suite).
- The interview room (scheduled video) — **V3-54** (this pass hands a candidate into the existing applicant flow; it does not build interviews).
- Seller academy / seller certification — **V3-58** (blocked by this pass; it reuses the badge primitive).
- KYC identity verification of candidates — **V3-24** (course completion is a *skill* verification, distinct from identity KYC).
- Payouts / earning money for completion — out of scope here; "learn-to-earn" in this pass means earning *employability/visibility*, not a cash payout (any cash incentive is a later monetization decision under D9).

## Dependencies

- **Requires:** V3-12 (Foundation Lock acceptance — CERTIFIED).
- **Blocks:** V3-58 (seller academy reuses the verified-completion badge + opt-in pipeline), and feeds V3-70 (employer hiring suite consumes the verified-candidate pool).

## Inheritance

- Learn — `learn_courses`, `learn_enrollments`, `learn_progress`, `learn_certificates`, `learn_certificate_verification`; `packages/branded-documents/src/templates/learn-certificate.tsx`.
- Jobs — `jobs_skill_verifications` (the existing verified-candidate ledger this pass extends), `jobs_applications`, `jobs_categories`, `jobs_skills`, `jobs_employer_subscriptions`.
- `@henryco/trust` — `SharedVerificationStatus`, `getVerificationGateCopy` (verification vocabulary; reuse, do not reinvent).
- `@henryco/notifications` — the bulk-invite fan-out (in-app + email), respecting preferences + rate limits.
- `requireSensitiveAction` / `fetchWithSensitiveAction` (V3-02) on gate creation, opt-in/opt-out, bulk invite.
- `@henryco/config` (`henryDomain('learn'/'jobs')`, `getDivisionConfig`), `@henryco/i18n`, `@henryco/observability` (telemetry + audit log).

## Implementation requirements

### Files

The `jobs_skill_verifications` provenance-column migration + the Learn→Jobs bridge handler (S1); the badge + filter on the Jobs candidate surfaces (S2); the `jobs_course_gates` migration + the "take this course" CTA + gated-post logic (S3); the `learn_candidate_optins` consent migration + the Learn opt-in toggle (S4); the employer verified-candidate pool + bulk-invite under `apps/jobs/app/` (S5); the three events in `packages/observability/src/events.ts` (S6); `docs/v3/learn-to-earn-architecture.md` (the completion→verification→opt-in→invite map V3-58/70 read).

### Trust / safety / compliance

ANTI-CLONE Principle 10 — a "verified by Henry Onyx Learn" badge is a **real, governed completion** (it fires only on a `learn_certificates` issuance, idempotently, via the system actor), never a self-claim. The candidate pipeline is **opt-in / consent-first** (NDPR/GDPR): the `learn_candidate_optins` row is the consent ledger; no completer is exposed without an active opt-in; opt-out is immediate and total. Gate creation, opt-in/opt-out, and bulk invite require `requireSensitiveAction` (V3-02) and are audited via `@henryco/observability/audit-log`. The cross-division bridge write uses the service-role/system path (no client write), and exposes no employer-private or candidate-private data across the RLS boundary. Bulk invite honors notification preferences + rate limits and never re-invites past an opt-out.

### Mobile + desktop parity

The candidate opt-in toggle, the "take this course to qualify" CTA, the employer pool, and bulk-invite are responsive (safe-area aware per V3-09). The Expo super-app surfaces the badge + opt-in toggle + employer pool through the shared data layer — no app-specific fork; bulk-invite reuses the same server endpoints. Notifications fan out to native push via the existing `@henryco/notifications` path.

### i18n

All copy through `@henryco/i18n`. New typed-copy namespace **`surface:learn-to-earn`** for the badge label ("Verified by Henry Onyx Learn"), the "Take this course to qualify" CTA, opt-in/opt-out consent copy, employer pool + bulk-invite labels, gate (required/preferred) copy, and empty states. Course/skill names render through `resolveLocalizedDynamicField` (Pattern B, 12 locales). Reuse `getVerificationGateCopy` from `@henryco/trust` where the verification-state wording already exists. Zero hardcoded user-facing strings; the hardcoded-text CI gate stays green.

### Brand & design system

Division labels are **"Henry Onyx Learn"** and **"Henry Onyx Jobs"**, platform brand **"Henry Onyx"** — all read from `@henryco/config` (`getDivisionConfig('learn'/'jobs').name`, `COMPANY.group.name`), never hardcoded; "Henry & Co." must not appear. The badge + CTA use Fraunces display where editorial + locked `--site-*`/`--accent` tokens (Learn/Jobs accents from `company.ts`); light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed. The cross-division "take this course" link resolves through `henryDomain('learn', …)` — no `henrycogroup.com` literal anywhere in the diff. The certificate continues to render via the branded `learn-certificate.tsx` template (legal entity "Henry Onyx Limited" where the document shows a legal name).

## Validation gates

1. Standard CI: typecheck, lint, test, build (`Lint, typecheck, test, build`).
2. **Course → badge** smoke: issuing a `learn_certificates` row writes exactly one verified `jobs_skill_verifications` row (`source='learn_completion'`), idempotent on re-sync; firing on enrollment (no certificate) writes **nothing**.
3. **Job-board signal + filter**: the "Verified by Henry Onyx Learn" badge renders on the candidate profile; the employer filter narrows the pool to verified completers for the course.
4. **Employer gated job**: a hard gate blocks non-qualifying applications and shows the "take this course" CTA (deep-linked via `henryDomain`); a soft gate marks "preferred".
5. **Opt-in consent**: a completer with no opt-in is invisible to employers; opting in lists them; opting out removes them from every pool immediately.
6. **Bulk-invite**: invites selected candidates idempotently, notifies via `@henryco/notifications`, never re-invites past an opt-out, requires `requireSensitiveAction`, is audited.
7. **RLS verified**: candidate reads only own opt-ins; employer reads only opted-in, employer-visible rows for their courses; the bridge write is system-actor only; staff read all.
8. **i18n + brand gates green**; `surface:learn-to-earn` namespace; no hardcoded user-facing string; no `henrycogroup.com` literal.

## Deployment gate

All gates green; the only required check (`Lint, typecheck, test, build`) passing; branch `v3/56-product-learn-to-earn-employer-tools` off `origin/main` → PR → squash-merge (no force-push, no branch-protection bypass). Owner reviews `docs/v3/learn-to-earn-architecture.md` and the opt-in consent posture. **14-day soak** on the live bridge (badge issuance + opt-in pipeline + bulk-invite) confirming badges issue only on real completions, opt-out is honored immediately, and clean telemetry before V3-58 (seller academy) and V3-70 (employer hiring suite) build on it.

## Final report contract

`.codex-temp/v3-56-product-learn-to-earn-employer-tools/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion) + the completion→verification→opt-in→invite map and the consent-ledger assertion.

## Self-verification

- [ ] Course completion writes a verified, Learn-sourced `jobs_skill_verifications` row idempotently; fires only on real `learn_certificates` issuance (never enrollment/self-claim); cross-division write is system-actor + audited.
- [ ] "Verified by Henry Onyx Learn" badge + employer filter on the Jobs candidate surfaces; badge links to the public verification ledger.
- [ ] Employer course-gating (`jobs_course_gates`) with hard/soft gates + "take this course to qualify" CTA via `henryDomain`; gate creation gated + audited.
- [ ] Opt-in candidate pipeline (`learn_candidate_optins`) is consent-first; no exposure without active opt-in; opt-out immediate + total; NDPR/GDPR consent ledger.
- [ ] Employer verified-candidate pool + bulk-invite; notifies via `@henryco/notifications`; honors opt-out + preferences; gated + audited.
- [ ] Three `henry.learn.*` events in the `HenryEventName` union, emitted server-side, no PII.
- [ ] `surface:learn-to-earn` i18n namespace (reuses `@henryco/trust` gate copy); brand from `@henryco/config` ("Henry Onyx Learn"/"Henry Onyx Jobs"/"Henry Onyx"); no "Henry & Co."; no hardcoded domain.
- [ ] Report written. Hand-off: V3-58 (seller academy), V3-70 (employer hiring suite).
