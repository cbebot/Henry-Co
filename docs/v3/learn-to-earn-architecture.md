# V3-56 — Learn-to-Earn architecture (the completion → verification → opt-in → invite map)

**Pass:** V3-56 (Phase G · Product Expansion) · **Status:** built, committed-NOT-applied (migrations owner-gated) · **Risk:** — (no money/identity/compliance gate; NDPR consent-bearing)

This pass bridges two divisions that were separate: **Henry Onyx Learn** (course completions) and **Henry Onyx Jobs** (the candidate trust graph). It writes a one-way, governed pipeline — a real course completion becomes a Jobs trust signal, employers can gate + discover on it, and learners control their own exposure through a consent ledger.

It builds the **bridge + employer tools**, not course authoring (existing Learn), not the interview room (V3-54), and not the full ATS suite (V3-70). It deliberately stays **off the money/pricing/delivery/checkout path** — "learn-to-earn" here means earning *employability/visibility*, never a cash payout (any cash incentive is a later D9 decision).

---

## The pipeline

```
learn_certificates issued (real, governed completion — status='issued')
        │  issueCertificateIfEligible()  [apps/learn/lib/learn/workflows.ts]
        │  system actor, service-role, idempotent
        ▼
syncLearnCompletionToJobs()  [apps/learn/lib/learn/learn-to-earn-bridge.ts]   ── S1
        │  writes ONE verified row:
        ▼
jobs_skill_verifications  (source='learn_completion', source_ref=certificate_id,
        │                  course_id, status='verified', verified_by_user_id=NULL)
        │
        ├─►  "Verified by Henry Onyx Learn" badge + employer filter   ── S2
        │        [LearnVerifiedBadge, candidate/recruiter surfaces]
        │
        ├─►  employer course gate (jobs_course_gates, by job_slug)    ── S3
        │        hard gate blocks apply (write.ts) · soft gate = preferred
        │        non-qualifying candidate sees "take this course to qualify" CTA
        │
        ▼
learn_candidate_optins  (consent ledger — learner opts IN per course)          ── S4
        │  active = revoked_at IS NULL AND visibility='employers'
        ▼
employer verified-candidate pool  (getEmployerVerifiedCandidatePool)           ── S5
        │  = active opt-in  ∩  verified completion  ∩  course the employer gates
        ▼
bulk-invite (jobs_candidate_invites, idempotent per (job,candidate))
        │  notifies candidate (@henryco/notifications), audited, consent re-checked
        ▼
henry.learn.employer.invited
```

Telemetry (S6, `@henryco/observability/events`): `henry.learn.badge.issued` (bridge), `henry.learn.candidate.listed` (active opt-in), `henry.learn.employer.invited` (bulk-invite). No PII in payloads — course id/slug, count, division only.

---

## The data-moat assertion (ANTI-CLONE Principle 10)

A **"Verified by Henry Onyx Learn"** badge means a *genuine, governed completion* — never a self-claim:

- The **only** writer of `source='learn_completion'` rows is `syncLearnCompletionToJobs`, called exclusively from the certificate-issuance path (`issueCertificateIfEligible`), which fires only when an enrollment reaches `status='completed'` and a real `learn_certificates` row is issued.
- The write runs as the **system actor** (`verified_by_user_id = NULL`) via the **service-role** client — no client/candidate write path exists.
- It is **idempotent**: a deterministic verification id + a partial unique index `jobs_skill_verifications(source, source_ref) WHERE source='learn_completion'` guarantee one verified row per certificate, even across re-syncs or concurrent issuance.
- It is **resilient**: the bridge never throws into issuance. The provenance columns ship committed-NOT-applied; until the owner applies the migration, the bridge degrades (`schema_pending`) and a learner still earns their certificate.

---

## The consent ledger (NDPR/GDPR)

`learn_candidate_optins` **is** the consent record. The rule, enforced in both the read path and the write path:

- **No completer is ever exposed to an employer without an active opt-in.** The employer pool (`getEmployerVerifiedCandidatePool`) intersects verified completions with *active* opt-ins (`revoked_at IS NULL AND visibility='employers'`) for courses the employer gates — a completion alone surfaces no one.
- **Opt-out is immediate and total.** The opt-out sets `revoked_at`; the partial index `WHERE revoked_at IS NULL AND visibility='employers'` drops the row from every pool at once.
- **Consent is re-checked at invite time.** `bulkInviteCandidates` re-reads active opt-ins before writing any invite, so an opt-out between pool render and invite is always honored — a withdrawn learner is never invited.
- **Opt-in requires a real completion.** The route rejects opt-in unless the learner has an issued `learn_certificates` row for that course.

Gate creation, opt-in/opt-out, and bulk-invite all require `requireSensitiveAction` (V3-02) and are audited via `@henryco/observability/audit-log` (bulk-invite uses `writeBulkAuditLog` with a shared correlation id).

---

## Schema realities (why the design departs from the original spec DDL)

Recon against live code (not the months-old spec) drove two adaptations:

1. **There is no `jobs_postings` table.** Job posts are `customer_activity` rows (`division='jobs'`, `activity_type='jobs_post'`); the slug + employer live in `metadata`. So `jobs_course_gates` and `jobs_candidate_invites` key on **`job_slug` (text)** + **`employer_slug` (text)**, matching how `jobs_employer_subscriptions` already keys off `employer_slug` — not a `job_id` FK to a table that doesn't exist.
2. **`jobs_skill_verifications.skill_id` is nullable and `evidence_type` already allows `'certificate'`.** A Learn completion writes `skill_id = NULL`, `skill_label = course title`, `evidence_type = 'certificate'`, and the new provenance columns — no new evidence type, no synthetic skill row.

### RLS posture

- `learn_candidate_optins`: learner reads/writes only their own (`learn_matches_identity`); staff full (`learn_is_staff`). **Employers do not read this table directly** — the Jobs app reads the employer-visible slice via its **service-role admin client**, scoped in the query (the same admin-read pattern jobs already uses for `jobs_skill_verifications`). Consent is enforced by the query predicate, not a DB view.
- `jobs_course_gates`: **public read** (so the "take this course" CTA renders for everyone), creator-only write, service-role full.
- `jobs_candidate_invites`: candidate + creator read own, creator insert, service-role full.
- `jobs_skill_verifications`: the owner-insert policy is **tightened** so a candidate can only self-insert a `pending`, non-Learn attestation (`status='pending' AND source IS DISTINCT FROM 'learn_completion'`). Verified + Learn-sourced rows are writable **only by the service role** (the bridge / staff verifier) — the "system-actor only" / data-moat invariant is now enforced at the DB boundary, not just by convention. A candidate cannot forge a Learn badge or bypass a hard gate via direct PostgREST.

---

## Migrations (committed-NOT-applied — owner-gated apply)

- `apps/jobs/supabase/migrations/20260620120000_v3_56_learn_to_earn_jobs.sql` — provenance columns + partial unique index on `jobs_skill_verifications`; `jobs_course_gates`; `jobs_candidate_invites`; RLS.
- `apps/learn/supabase/migrations/20260620120500_v3_56_learn_candidate_optins.sql` — `learn_candidate_optins` (consent ledger) + RLS + updated_at trigger.

Both are idempotent. Until applied, the bridge degrades gracefully and all new reads return empty — no live behavior changes (the badge/gate/pool surfaces render their honest empty states).

---

## Hand-off

- **V3-58 (Seller Academy):** shipped ahead of this pass with its own seller-tier engine; the verified-completion badge primitive here is the canonical "real completion" trust mark a future seller-certification can reuse.
- **V3-70 (Employer Hiring Suite):** consumes the verified-candidate pool (`getEmployerVerifiedCandidatePool`) and the invite ledger (`jobs_candidate_invites`) as the seed of an ATS-grade pipeline.

**Soak:** 14 days on the live bridge before V3-58/V3-70 build on it — confirming badges issue only on real completions, opt-out is honored immediately, and telemetry is clean.
