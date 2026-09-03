# V3-FIRE-LEARN — proposed fix migrations (HELD)

Read-only audit of `apps/learn` against live prod (`rzkbgwuznmdxnnhmjazy`). Placed **outside**
any apply pipeline and **not** run. **Do not apply until the architect re-verifies and the owner approves.**

The most important fix is **app-layer (no migration): LRN-1** — server-verify course completion
(`apps/learn/lib/learn/workflows.ts:completeLesson`) so a learner cannot mint a certificate without
watching; and gate the Learn→Jobs trust bridge on that verified signal before it is built.

These migrations cover the live DB-layer smart-leaks + hardening:
- `01_restrict_quiz_answer_keys.sql` (LRN-2 — quiz `correct_answer`/`is_correct` are anon-readable via `USING(true)`)
- `02_reviews_drop_email_from_public.sql` (LRN-3 — public reviews leak `normalized_email`)
- `03_gate_lesson_content_by_enrollment.sql` (LRN-4 — sketch; paid lesson content is anon-readable)
- `04_force_rls_learn_money_pii.sql` (LRN-7)

LRN-6 (dormant: cohort-calendar, payout-amounts, grade-IDOR, notes-IDOR) is app-layer and must be
fixed **with** the Pass-21 feature migrations, which are not yet applied to prod.
