# V3-FIRE-LEARN — Pre-launch adversarial security + smart-leak audit

- **Entity:** Henry Onyx Limited (codename `HenryCo` / `@henryco/*`; only valid domain **henryonyx.com**).
- **Division:** learn (`apps/learn` — online courses: enrollment, lessons, quizzes, completion certificates, the Learn‑to‑Earn → Jobs trust bridge).
- **Live DB audited:** Supabase project `rzkbgwuznmdxnnhmjazy` ("HENRY ONYX").
- **Date:** 2026-06-27
- **Method:** static map (3 parallel subagents: RLS/SECDEF catalog; content-gating/cert/grading authz; money + completion-forgery → jobs-bridge) → live read-only probing as the **real `anon` role** (`SET LOCAL ROLE anon`) + catalog reads (via the Supabase MCP this session), never `service_role`. `SELECT`/catalog only, zero mutation.
- **Calibration (owner directive):** public-by-design data (course catalog/marketing, public certificate *verification page*) is **not** flagged. CRITICAL/HIGH require a live probe or a concrete code path; unproven → SUSPECTED, resolved here. Dormant code (table not on prod) graded down; pre-launch code defects with no live data still listed as launch-blockers but annotated "pre-data."

---

## Executive summary

Learn's **access-control data layer is sound** (the candidate-CRITICAL was refuted by probe), and the bulk of the scary app-layer findings are **dormant** (their tables aren't on prod). The genuine weak point is the **Learn‑to‑Earn *trust/integrity* layer** — completion is forgeable and quiz answer keys are world-readable — plus a couple of `USING(true)` PII/content leaks.

- **F1 (was SUSPECTED CRITICAL) — REFUTED.** `learn_teacher_applications` (teacher PII + payout terms) looked RLS-less in the repo, but on prod it is **RLS-on + 0-policy** → anon read = **0**. No teacher-PII leak.
- **Every Pass‑21 table is absent from prod** (committed-not-applied): `learn_cohorts`, `learn_live_sessions`, `learn_instructor_payouts`, `learn_assignment_submissions`/`_grades`, `learn_lesson_notes`, `learn_lesson_playback`, `learn_discussions`. So the **unauth cohort-calendar leak, instructor-payout amount-forgery, cross-instructor grade-IDOR, and notes-IDOR are all DORMANT** (their routes would error today).
- **Money is sound:** learners can't self-confirm payment (staff-gated) and can't self-enroll-free on paid courses (`awaiting_payment` blocks `completeLesson`); the payout-request route's amount-forgery writes to a table that doesn't exist yet; no cross-instructor payout IDOR (row bound to `viewer.user.id`).

| # | Finding | Category | Severity |
|---|---------|----------|----------|
| **LRN-1** | Course **completion is client-asserted** (`completeLesson` trusts `secondsWatched`; the `learn_lesson_playback` heartbeat is never read — and doesn't exist on prod) → a learner mints a real, publicly-verifiable certificate without watching | Trust integrity | **HIGH** (pre-data) |
| **LRN-2** | **Quiz answer keys are world-readable** — `learn_quiz_questions` `USING(true)`; anon read = **30 questions with `correct_answer` populated** | Integrity / smart-leak | **MEDIUM** |
| **LRN-3** | **Reviewer emails leak** — `learn_reviews` public read exposes `normalized_email`; anon read = **6 emails** (incl. internal `@henryonyx.com`) | PII smart-leak | **MEDIUM** |
| **LRN-4** | Paid **lesson content readable by anon** — `learn_lessons`/`learn_lesson_resources` `USING(true)` (30 lessons; `video_url` null today → text-only, escalates when videos land) | Content / paywall | **MEDIUM** |
| **LRN-5** | Email-only staff seed `academy@henryonyx.com` (`user_id=NULL`, `is_active`) + `learn_is_staff()` email-OR match → role by email | AuthZ | **MEDIUM** (latent; valid domain) |
| **LRN-6** | **Dormant** (Pass‑21 tables absent): unauth `cohorts/[id]/calendar` (live-session `meeting_url`/`recording_url`); `instructor/payout-request` client-supplied amounts; `assignments/grade` cross-instructor; `notes` arbitrary-id IDOR | Cross-tenant / money | **MED (dormant)** |
| **LRN-7** | `bootstrap` unauthenticated (snapshot-read/seed DoS amplification); `cron` open when `CRON_SECRET` unset; no FORCE-RLS; `learn_is_staff` is INVOKER (RLS self-recursion / repo↔prod divergence) | Hardening | **LOW** |

---

## Findings

### LRN-1 — Forgeable course completion → unearned certificate (HIGH, pre-data)
- **Category:** Trust integrity (the core Learn‑to‑Earn promise). CVSS-ish: HIGH; pre-data (0 completions/certs today).
- **Asset:** `apps/learn/lib/learn/workflows.ts:634-791` (`completeLesson`), `:169-193` (`calculateProgress`), `:515-578` (`issueCertificateIfEligible`); server action `apps/learn/lib/learn/actions.ts:76-88`. Writes `learn_progress` + `learn_certificates`/`learn_certificate_verification` — **all present on prod**.
- **Pre-fix reproduction (source + live):** `completeLesson` writes `learn_progress.status='completed'` on request; `seconds_watched` is `Number(input.secondsWatched || lesson.durationMinutes*60)` — a **client value or a default, never verified**. `calculateProgress` counts only `status='completed'` and never compares watch time to duration. The dedicated playback heartbeat (`learn_lesson_playback`) is **never read** — and **does not exist on prod** (`pass21_tables_present.learn_lesson_playback=false`), so there is no server watch-signal at all. The only gate is sequential ordering (trivially satisfied). For a no-quiz course, pure self-completion mints a real certificate (gate is only `enrollment.status='completed'`). Live: `enrollments=10`, `enrollments_completed=0`, `certificates=0` → the defect hasn't manifested yet (pre-data), but it's reachable the moment learners complete courses.
- **Trust-bridge amplifier:** V3‑56 intends verified completion to hard-gate Jobs employer posts (`jobs_course_gates` exists on prod) and mint "Verified by Henry Onyx Learn" rows. That bridge write-path is **not built yet** (zero `source='learn_completion'` references in `apps/`), so not live — but it must not ship until completion is server-verified, or every forged completion clears employer gates.
- **Proposed fix (app-layer):** server-verify completion — require persisted watch progress (apply `learn_lesson_playback` and check cumulative `position_seconds` ≥ threshold of `duration`), ignore client `secondsWatched`; for non-video lessons use a server-rate-limited dwell/acknowledge. Gate the Jobs bridge on the verified signal, not certificate existence.

### LRN-2 — Quiz answer keys world-readable (MEDIUM)
- **Asset:** `learn_quiz_questions` policy `learn public quiz questions` = `USING (true)`; column `correct_answer text[]`. (Also `learn_quiz_answer_options.is_correct` by the same pattern.)
- **Pre-fix reproduction (live, anon):** `select count(*) from learn_quiz_questions where correct_answer is not null` as role `anon` → **30**. Anyone with the public anon key (it ships to browsers) reads every quiz's correct answers → trivially passes quiz-gated certification. This compounds LRN‑1 to undermine the certificate/Learn‑to‑Earn trust.
- **Proposed fix (held migration `01`):** restrict the `correct_answer`/`is_correct` exposure — replace the `USING(true)` read with a staff/enrolled-scoped policy, or strip `correct_answer` from the anon-readable surface and grade strictly server-side (the server already does — `submitQuizAttempt` compares server-side).

### LRN-3 — Reviewer email leak on public reviews (MEDIUM)
- **Asset:** `learn_reviews` policy `learn public reviews` = `USING (status='published' OR learn_is_staff())`; column `normalized_email` (+ `user_id`).
- **Pre-fix reproduction (live, anon):** `select count(*) from learn_reviews where normalized_email is not null` as `anon` → **6** (seed reviews contain real internal `@henryonyx.com` addresses). The public reviews *page* is by-design; the **email column** must not be world-readable.
- **Proposed fix (held migration `02`):** serve reviews to anon through a column-restricted view (name + rating + body, no email/user_id), or drop email from the table; keep the raw row staff-only.

### LRN-4 — Paid lesson content readable by anon (MEDIUM)
- **Asset:** `learn_lessons` + `learn_lesson_resources` policies = `USING(true)`; columns `video_url`, `body_markdown`, resource `url`. The `is_preview`/course `access_model='paid'` flags are ignored by RLS.
- **Pre-fix reproduction (live, anon):** anon reads **30 lessons**; `video_url` is **null on all** today (no assets seeded) → text `body_markdown` of paid lessons leaks now, and **video URLs will leak the moment they're populated** (and `video_url` is a permanent Cloudinary delivery URL, not a signed token). The app's own course page re-gates rendering, but the DB contract is unsafe for any other consumer.
- **Proposed fix:** gate non-preview lesson content by enrollment (RLS via an `EXISTS` on `learn_enrollments`, or strip `body_markdown`/`video_url` for locked lessons at the data layer) and serve video via short-lived signed URLs. (App-layer + policy; sketch in held `03`.)

### LRN-5 — Email-only staff seed + email-OR staff match (MEDIUM, latent)
- **Asset:** `learn_is_staff()` matches staff by `normalized_email`; live probe shows **1** active `learn_role_memberships` row with `user_id=NULL` + `normalized_email` (`academy@henryonyx.com`, role `academy_owner`). Whoever controls that mailbox gets full learn-staff. Lower risk than the marketplace `henrycogroup` case because the domain is **valid/company-controlled** (henryonyx.com), but it's the same `user_id=NULL` email-OR anti-pattern.
- **Proposed fix:** require `user_id` on staff rows; bind the seed to a real operator; don't confer privileged roles by email match.

### LRN-6 — Dormant app-layer defects (MEDIUM, tables absent on prod)
All real code defects, but their tables are **not applied to prod** (`pass21_tables_present` all false), so they're unreachable today. Fix **before** applying the Pass‑21 migrations:
- `cohorts/[id]/calendar/route.ts` — unauthenticated; would serve `learn_live_sessions.meeting_url`/`recording_url` via the admin client (RLS bypassed). (`learn_cohorts`/`learn_live_sessions` absent.)
- `instructor/payout-request/route.ts:58-60` — `gross_revenue`/`net_payout` taken from the request body; no earnings-derivation or balance cap. (`learn_instructor_payouts` absent.)
- `assignments/grade/route.ts` — any instructor can grade any course's submission (no course-ownership scope). (`learn_assignment_*` absent.)
- `notes/route.ts:50-67` — arbitrary client `id` upsert overwrites/steals another learner's note. (`learn_lesson_notes` absent.)
- **Fix:** a shared `assertInstructorOwnsCourse`/enrollment helper + auth on the calendar route + server-derived payout amounts; apply *with* the feature migrations.

### LRN-7 — Hardening (LOW)
- `bootstrap/route.ts` is unauthenticated and drives a full multi-table service-role snapshot read (+ seed trigger) — DoS amplification; aggregate-counts only, no data leak. Add auth/rate-limit.
- `cron/learn-automation/route.ts:5-9` authorizes when `CRON_SECRET` is unset (reminder-email only). Set the secret in prod / fail closed.
- No `FORCE ROW LEVEL SECURITY` on learn money/PII tables (`learn_payments`, `learn_enrollments`, `learn_certificates`, `learn_notifications`) (held `04`).
- `learn_is_staff()` is `SECURITY INVOKER` on prod and its policy on `learn_role_memberships` self-references → RLS recursion risk; `search_path` *is* pinned (`public, pg_catalog`). Reconcile the repo↔prod divergence and make the role-check helper intentionally `SECURITY DEFINER` with the pinned path.

---

## Closed / refuted (proven by live probe)

| Hypothesis | Verdict | Evidence |
|---|---|---|
| `learn_teacher_applications` anon-readable (teacher PII + payout terms) | **CLOSED (was SUSPECTED CRITICAL)** | prod = RLS-on + 0-policy; anon read = **0** |
| Anon reads paid **video** URLs | **NOT A LEAK today** | `anon_lessons_with_video = 0` (no videos seeded) — but LRN‑4 escalates when they land |
| `learn_certificate_verification` leaks email | **CLOSED** | anon read with email = **0** |
| Self-enroll-free on paid courses / client self-confirm payment | **PASS** | paid `self` enroll → `awaiting_payment`; `completeLesson` refuses non-active; confirm-payment is staff-gated |
| Cross-instructor payout-request IDOR | **REFUTED** | row hard-bound to `viewer.user.id` |
| Certificate forgery via the verify route / cert PII (email) | **PASS** | verify route needs a real cert row; exposes only name/course/score |
| Learn→Jobs trust bridge live-exploitable | **NOT LIVE** | bridge write-path unbuilt (0 `source='learn_completion'` refs) — gate on LRN‑1 fix before building |

**Bonus reconcile (cross-division):** the marketplace **F‑03 `henrycogroup.com` seeds are now remediated** — live count `is_active=0` (was 7); the 7 rows remain but inactive, so `getMarketplaceViewer` (which filters `is_active=true`) grants nothing. F‑03 takeover path **closed**.

---

## Proposed fixes index
- **Held migrations** `docs/v3/security/v3-fire-learn-proposed-migrations/`: `01_restrict_quiz_answer_keys.sql` (LRN‑2), `02_reviews_drop_email_from_public.sql` (LRN‑3), `03_gate_lesson_content_by_enrollment.sql` (LRN‑4, sketch), `04_force_rls_learn_money_pii.sql` (LRN‑7).
- **App-layer:** LRN‑1 server-verify completion (apply `learn_lesson_playback` + check watch threshold; gate the Jobs bridge on it); LRN‑6 ownership helpers + auth, applied *with* the Pass‑21 migrations; LRN‑7 bootstrap auth + cron secret.

---

**V3-FIRE-LEARN COMPLETE — 7 findings (0 critical / 1 high / 4 med / 2 low; several dormant), each with attached live or source evidence; 4 held migrations. The access-control data layer is SOUND — the teacher-applications CRITICAL was REFUTED by live probe (RLS-on + 0-policy, anon=0), and all Pass‑21 app-layer defects are DORMANT (tables not on prod). The real weakness is the Learn‑to‑Earn TRUST layer: completion is client-asserted (forgeable certificate, HIGH/pre-data — 0 completions today) and quiz answer keys + reviewer emails are world-readable via `USING(true)` (MEDIUM, live-confirmed: 30 answer keys, 6 emails). Money is sound; no severity inflation. Bonus: the standing marketplace `henrycogroup` god-mode seeds are now deactivated (F‑03 closed).**
