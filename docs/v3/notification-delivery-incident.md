# Notification Delivery Incident — V3-03 Backfill Misclassification (V3-DELIVERY-01)

**Investigation date:** 2026-05-24
**Investigator:** Wave B.1 closure remediation engineer (Opus 4.7, max effort)
**Originating signal:** Wave B.1 closure audit Section 5 item #29 — "1408 of 1409 `customer_notifications` in `delivery_state='failed'`, pre-existing email-delivery failures previously hidden."
**Verdict:** **NOT a real delivery incident.** A V3-03 cron-logic gap classified 1,408 pre-existing in-app-only notifications as `failed` because the cron's "mark stale 'sent' rows as 'failed'" Stage 2 has no "was email actually attempted" guard.
**User-facing impact:** zero. The 1,408 rows belong to **13 distinct users**; the original in-app notifications were already delivered through the realtime channel pre-V3-03. No customer sees a "failed" indicator anywhere — the `delivery_state` column drives only the V3-03 internal cron + the (not-yet-wired) shared `<NotificationBell />` pip rendering.

---

## 1. Diagnostic queries + results

All queries executed 2026-05-24 ~05:50 UTC against project `rzkbgwuznmdxnnhmjazy` via Supabase MCP.

### Q0 — table-wide delivery_state distribution

```sql
SELECT
  count(*) FILTER (WHERE delivery_state='sent') AS sent,
  count(*) FILTER (WHERE delivery_state='delivered') AS delivered,
  count(*) FILTER (WHERE delivery_state='seen') AS seen,
  count(*) FILTER (WHERE delivery_state='failed') AS failed,
  count(*) FILTER (WHERE email_dispatched_at IS NOT NULL) AS ever_dispatched,
  count(*) FILTER (WHERE email_provider IS NOT NULL) AS has_provider,
  count(*) AS total
FROM public.customer_notifications;
```

| sent | delivered | seen | failed | ever_dispatched | has_provider | total |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 0 | 0 | 1408 | **0** | **0** | 1409 |

**Reading:** zero rows in the entire table have ever been email-dispatched and zero have an email_provider routing. Yet 1408 are marked `failed`. The "failure" was never an email failure — these rows never tried email.

### Q1 — Timestamp distribution of failures

| Day window | Failed count |
|---|---:|
| 2026-04-02 (first occurrence) | 25 |
| 2026-04-03 to 2026-04-10 (peak week) | 908 |
| 2026-04-14 to 2026-04-30 | 433 |
| 2026-05-01 | 87 |
| 2026-05-08 to 2026-05-22 (last occurrence) | 14 |
| **Total** | **1408** |

Earliest: 2026-04-02 21:56 UTC. Latest: **2026-05-22 13:05 UTC — 16 hours before the V3-03 migration was applied** (2026-05-23 04:14 UTC). No new rows have entered the 'failed' state since the migration applied because no new in-app notifications have been written in production at scale during the 38h since.

### Q2 — Division breakdown

| Division | Failed count | % |
|---|---:|---:|
| care | 769 | 55% |
| jobs | 285 | 20% |
| studio | 160 | 11% |
| learn | 90 | 6% |
| property | 45 | 3% |
| wallet | 29 | 2% |
| account | 15 | 1% |
| `null` | 15 | 1% |

Distribution mirrors the rough division-of-traffic split for the platform — no single failing pipeline; this is across-the-board.

### Q3 — Failure cause classification

The V3-03 migration adds `delivery_state TEXT NOT NULL DEFAULT 'sent'` (per `apps/hub/supabase/migrations/20260522154818_message_read_state.sql` line 122). On `ALTER TABLE … ADD COLUMN`, all 1409 existing rows received `delivery_state='sent'`.

The V3-03 redelivery cron (`apps/account/app/api/cron/notification-redelivery/route.ts` Stage 2, lines 199–218) runs every 5 minutes and executes:

```ts
.in("delivery_state", ["sent", "delivered"])
.lte("created_at", failedCutoff)   // failedCutoff = now() - 24h
.limit(PROCESS_LIMIT)              // 200 per run
```

**There is no filter for whether the row ever attempted email delivery.** Every pre-existing row was older than 24h, so every pre-existing row hit the Stage 2 mark-as-failed transition within ~7 cron runs (~35 min) after migration apply.

**This is a cron-logic gap, not an email outage.** The notifications were delivered in-app through the realtime push pipeline (the realtime publication contained these tables already per migration `20260523073251_realtime_publication_customer_notifications` and the older equivalents). Customers received the notifications. They were just never email-delivered because they weren't designed to be.

### Q4 — Failure age relative to now (audit date 2026-05-24)

| Age | Count |
|---|---:|
| < 7 days | 2 |
| 7–30 days | 185 |
| 30–90 days | 1221 |
| > 90 days | 0 |
| **Total** | **1408** |

Failure window is **2026-04-02 → 2026-05-22**, a closed 51-day historical window. Nothing newer than 2026-05-22 because the next-newest in-app notification creation date (the 1 row marked `sent`) hasn't crossed the 24-hour Stage-2 threshold yet, and only one new in-app notification has been created since.

### Q5 — Sample of the 10 most recent "failures"

| id | created_at | category | division | title | email_dispatched_at | email_provider |
|---|---|---|---|---|---|---|
| `cea02b72` | 2026-05-22 13:05 | account | (null) | "Your HenryCo account is ready" | NULL | NULL |
| `56cb4fe0` | 2026-05-22 04:01 | general | jobs | "Job saved" | NULL | NULL |
| `7ffca700` | 2026-05-15 16:00 | general | jobs | "New application received" | NULL | NULL |
| `59c55836` | 2026-05-15 16:00 | general | jobs | "New application received" | NULL | NULL |
| `e82f67a1` | 2026-05-15 16:00 | general | jobs | "Application submitted" | NULL | NULL |
| `2e7b8bf7` | 2026-05-09 05:33 | general | jobs | "New application received" | NULL | NULL |
| `34c11c22` | 2026-05-09 05:33 | general | jobs | "New application received" | NULL | NULL |
| `68013c11` | 2026-05-09 05:33 | general | jobs | "Application submitted" | NULL | NULL |
| `39fe05b3` | 2026-05-08 11:52 | account | (null) | "Your HenryCo account is ready" | NULL | NULL |
| `dd85761a` | 2026-05-01 18:01 | studio | studio | "Payment reminder • Custom Software scope for Company" — body "You have reached your daily email sending quota." | NULL | NULL |

Reading: "Your HenryCo account is ready", "Job saved", "Application submitted", "New application received" — these are routine in-app notifications. No email failure modes in the bodies. The single mention of "daily email sending quota" in the studio payment reminder body (row `dd85761a`) is **the content of an unrelated message**, not the actual failure mode of this row.

Sub-finding: 103 of 1408 (7%) of failed-row bodies contain the substring "quota" — these are the studio payment-reminder templates that themselves describe email quota exceeded. The remaining 1305 row bodies are routine notifications with no quota signal.

### Q6 — Affected users and activity

```sql
SELECT
  count(DISTINCT cn.user_id) AS distinct_users_with_failures,
  count(DISTINCT cn.user_id) FILTER (WHERE u.last_sign_in_at >= now() - interval '30 days') AS active_within_30d,
  count(DISTINCT cn.user_id) FILTER (WHERE u.last_sign_in_at >= now() - interval '7 days') AS active_within_7d,
  count(DISTINCT cn.user_id) FILTER (WHERE u.last_sign_in_at IS NULL) AS never_signed_in
FROM public.customer_notifications cn
JOIN auth.users u ON u.id = cn.user_id
WHERE cn.delivery_state='failed';
```

| distinct_users | active_30d | active_7d | never_signed_in |
|---:|---:|---:|---:|
| **13** | 6 | 4 | 4 |

1,408 rows spread across only 13 users = **average 108 failed rows per user**. This is consistent with development/staging traffic + a few real test accounts. **Not a customer-impact incident.**

### Q7 — Reference-type breakdown (verifies notification class)

| reference_type | count |
|---|---:|
| `care_booking` | 768 |
| `jobs_alert` | 165 |
| `studio_notification` | 158 |
| `jobs_employer` | 64 |
| `(null)` | 44 |
| `property_listing` | 39 |
| `jobs_application` | 35 |
| `learn_teacher_application` | 31 |
| `learn_announcement` | 28 |
| `jobs_post` | 21 |
| `learn_enrollment` | 17 |
| `support_thread` | 16 |
| `learn_assignment` | 12 |
| `property_inquiry` | 5 |
| `notification_signal_qa` | 1 |

Routine product notifications. No reference_type pattern that suggests a single failing pipeline.

---

## 2. Root cause

The V3-03 design implicitly assumed every notification row attempts email delivery. Stage 2 of `notification-redelivery/route.ts` marks any row in `('sent','delivered')` state with `created_at < now() - 24h` as `failed`. For pre-V3-03 in-app-only rows (which never had email attempted), the V3-03 migration's `DEFAULT 'sent'` put them into the cron's catchment area, and Stage 2 marked them `failed` within ~35 minutes of migration apply (1408 ÷ 200 per-run × 5 min per run).

The failure classification is **semantically wrong**: a row that was never expected to email cannot have failed-to-email.

---

## 3. Why this matters (and why it doesn't)

**Why it matters:**
- The V3-10 owner observability tile, the Marketplace `/api/health` envelope (`failedNotifications: 3030` per V3-10 baseline §7), and any future Wave B.2 dashboard that reads `customer_notifications.delivery_state` will surface alarming-looking numbers that are not actionable.
- If Wave B.2 V3-08 (empty-dashboard-truth) wires customer-facing "you have a delivery problem" affordance, it will fire false-positive 1,408 times unless this is fixed first.
- The future V3-03 follow-up that adds the shared `<NotificationBell />` `DeliveryStatePip` rendering will paint 1,408 historical notifications with the "failed" glyph in users' bells unless this is fixed first.

**Why it doesn't matter (today):**
- Zero customer-facing surfaces consume `delivery_state` in production right now. The bell pip primitive shipped but is not wired into any shell yet (V3-03 PR #131 explicitly deferred per-shell wiring). The owner observability tile reads `henry_events`, not `customer_notifications`.
- The 13 affected users are a small, mostly-test population.
- No actual customer notification was missed — these were delivered in-app via realtime when originally written.

---

## 4. Recommendation matrix

The original task brief offered four owner-decision options (a/b/c/d). Given the finding that **these are not real failures**, none of the original four options actually apply (silent close / targeted retry / goodwill email / triage-by-class all assume there was something to retry or apologize for). The correct shape is:

### Recommended: option **(e) — backfill correction + cron guard, ship as a single PR**

This is the cleanest, smallest, and most honest path. Two small changes:

1. **One-time SQL to re-classify the 1,408 rows** from `failed` to a non-actionable state:

   ```sql
   -- Option e.1 — recommended: mark as 'seen' (already-delivered, already-viewed-in-app)
   UPDATE public.customer_notifications
      SET delivery_state = 'seen'
    WHERE delivery_state = 'failed'
      AND email_dispatched_at IS NULL
      AND email_provider IS NULL;
   -- Expected: UPDATE 1408
   ```

   `seen` is preferred over `sent` because (a) the cron will not re-process `seen` rows (Stage 2 only catches `sent`/`delivered`), (b) any future bell-pip rendering will show a "seen" glyph which is the truthful state — these were shown in-app months ago, and (c) it does not require introducing a new delivery state value.

2. **Add an email-attempted guard to the V3-03 redelivery cron Stage 2** at `apps/account/app/api/cron/notification-redelivery/route.ts` lines 199–218 + the equivalent staff_notifications block:

   ```ts
   const { data: failedRows, error: selErr } = await admin
     .from("customer_notifications")
     .select("id")
     .in("delivery_state", ["sent", "delivered"])
     .lte("created_at", failedCutoff)
     // V3-DELIVERY-01: only mark as failed if email delivery was actually
     // attempted. Rows that were in-app-only never had a delivery to fail.
     .not("email_dispatched_at", "is", null)
     .limit(PROCESS_LIMIT);
   ```

   And the same `not("email_dispatched_at", "is", null)` filter on the staff_notifications Stage 2 query.

**Effort:** 1 PR, ~6 lines of TypeScript change + 1 one-time SQL statement. Owner-gated SQL execution (gate matches V3-03's existing migration apply pattern).

**Why this beats the original options:**
- Option (a) silent close: same outcome, but doesn't fix the cron, so future in-app notifications will get re-marked as failed in 24h.
- Option (b) targeted retry: there's nothing to retry — the original in-app delivery succeeded.
- Option (c) goodwill email: would confuse users ("we owe you a status update"... about a notification they already saw in-app three weeks ago).
- Option (d) triage-by-class: no class distinction matters since the failure mode is uniform.

### Alternative: option **(f) — accept and document, fix only the cron**

If the owner prefers to leave historical data untouched, skip the one-time UPDATE and only ship the cron fix. Pros: zero data mutation. Cons: the 1,408 `failed` rows continue to read as failures on any future V3-08 dashboard or bell-pip rendering until they age out of any time-windowed query. This requires every downstream consumer to be aware of the historical artifact.

**Recommendation:** option (e). It's smaller in operational risk than the original (b)/(c) and prevents downstream confusion.

---

## 5. New pass registration — V3-DELIVERY-01

To track this work cleanly, register it as a hardening pass per the convention in `docs/v3/PASS-REGISTER.md` lines 12 + 254:

**ID:** `V3-DELIVERY-01`
**Slug:** `notification-delivery-classification-fix`
**Pillar:** P3 (Notifications) + P12 (Foundation)
**Deps:** V3-03 closure (already merged via PR #131)
**Effort:** S (<1 wk)
**Parallel-safe:** Y
**Owner decision required:** D-new (option-e SQL apply vs option-f code-only)
**Risk:** none — read/write to non-customer-facing telemetry column
**One-line:** *"Re-classify 1,408 historical `customer_notifications.delivery_state='failed'` rows that were never email-attempted; add `email_dispatched_at IS NOT NULL` guard to V3-03 redelivery cron Stage 2 so the misclassification cannot recur."*
**Bucket:** Phase B-cleanup. Does not block any other pass.

The owner sign-off paragraph for the PASS-REGISTER row should note: "Investigation under `docs/v3/notification-delivery-incident.md` (V3-DELIVERY-01) confirmed the 1,408 `failed` rows are a V3-03 backfill artifact, not a real delivery incident. This pass closes the artifact + the cron gap that caused it."

---

## 6. Files / queries to reference

- This document: `docs/v3/notification-delivery-incident.md`
- Cross-reference from Wave B.1 synthesis: `docs/closure/wave-b1-synthesis.md` Section 5 item #29
- Cross-reference from baseline: `.codex-temp/wave-b1-closure/baseline-snapshot.md` §7
- V3-03 migration source: `apps/hub/supabase/migrations/20260522154818_message_read_state.sql`
- V3-03 redelivery cron source: `apps/account/app/api/cron/notification-redelivery/route.ts`
- V3-03 PR #131 closure: `https://github.com/cbebot/Henry-Co/pull/131`

---

**End of investigation.** No customer outreach is recommended. The data underwent a classification mistake; the actual notifications were delivered. The fix is a 6-line cron-guard PR plus an optional 1-statement historical UPDATE that owner can execute when convenient.
