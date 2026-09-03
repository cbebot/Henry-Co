# V3-FIRE-JOBS — proposed fix migrations (HELD)

Read-only audit of `apps/jobs` against live prod (`rzkbgwuznmdxnnhmjazy`). Placed **outside**
any apply pipeline and **not** run. **Do not apply until the architect re-verifies and the owner approves.**

The **bulk of the jobs fixes are app-layer** (no migration) — see `../V3-FIRE-JOBS-2026-06-27.md`. The single
highest-priority item is **JOB-1**: restore authentication + employer-ownership on
`apps/jobs/app/api/hiring/interviews/route.ts` (currently unauthenticated). Then a shared
`assertEmployerOwnsConversation/Application(viewer, id)` helper for JOB-2/3 (and JOB-4/5 before their
feature migrations apply), signed Cloudinary delivery (JOB-6), and cover-note/subject masking (JOB-7).

These migrations cover only JOB-8 (DB hardening):
- `01_force_rls_jobs_money_pii.sql`
- `02_jobs_messages_participant_rls.sql` — adds the participant-scoped SELECT policy the WS‑5 realtime
  feature needs to be **functional** without being a leak. **Do NOT instead add a permissive
  `USING(true)`/role-broad policy** to "make realtime work" — that would open the exact
  cross-tenant DM-streaming leak the live probe refuted (the tables are safe today only because they
  have zero policies = deny-all).
