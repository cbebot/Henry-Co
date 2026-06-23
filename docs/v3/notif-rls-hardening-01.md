# V3-NOTIF-RLS-01 — Dashboard notifications: cross-user leak root cause + fix

**Date:** 2026-06-23
**Branch:** `v3/notif-rls-hardening` off `origin/main` (`f7cde70e`)
**Prod project:** `rzkbgwuznmdxnnhmjazy` (not reachable from the current MCP session)
**Ground truth used:** `supabase/prod-actual/schema.sql` (captured prod) + live code.

## Owner symptom

> "the dashboard notification is fake. it sends notification to users who dosent
> own the notification … it can bridge security too."

## What was NOT the bug (audited and proven clean)

The crude "User B's read returns User A's rows" path is airtight:

- **SELECT RLS** on `customer_notifications`, `customer_activity`,
  `customer_preferences`, `notification_delivery_log` is strictly
  `auth.uid() = user_id` (schema.sql:7842, :7833, :7848, :8055).
- **Realtime** is genuinely per-user: channel `customer_notifications:user:<id>`
  with `postgres_changes` filter `user_id=eq.<id>`
  (`packages/dashboard-shell/src/shell/supabase-realtime-provider.tsx`). The
  `"customer"`/`"staff"` strings nearby are telemetry labels, not shared
  channels. A realtime event only triggers a *refetch*; it never carries another
  row into the UI.
- **Read path** `/api/notifications/recent` → `getNotificationBellFeed(userId)`
  resolves the user server-side and queries with `.eq("user_id", userId)` via the
  service-role admin client.
- **Every publisher** (the `@henryco/notifications` shim, all per-division
  bridges, `support_staff_reply`, `handle_new_customer`) writes **one row to the
  correct single owner**.

## Root causes (two, both confirmed against captured prod)

### 1. Write-side cross-tenant injection — UPDATE policy missing `WITH CHECK`

`customer_notifications` (schema.sql:7841) and `customer_preferences` (:7847)
have an UPDATE policy with `USING` but **no `WITH CHECK`**. Postgres applies
`USING` only to the *old* row; with no `WITH CHECK` the *new* row is
unconstrained. Combined with the table-wide `UPDATE` grant to `authenticated`
(:8490 / :8498) and `user_id` being a plain updatable column with no guarding
trigger, an authenticated user can `PATCH` a notification they own, set
`user_id = <victim>` and rewrite `title/body/action_url`, and — because the
table is in `supabase_realtime` (:9677) — the retargeted row **live-pushes a
forged notification into the victim's bell**. This is exactly "notifications
sent to users who don't own them" + "bridges security."

The correct pattern already exists on `staff_notification_states` (INSERT +
UPDATE both carry `WITH CHECK (recipient_user_id = auth.uid())`, :8153/:8157) —
the two customer policies simply omit it.

### 2. Read-side IDOR — `get_signal_feed` has no `auth.uid()` guard in the capture

In `supabase/prod-actual/schema.sql`, `public.get_signal_feed(viewer_id, …)` is
the pre-hardening `LANGUAGE sql` body with no `auth.uid()` check, while EXECUTE
is granted to `authenticated`. Any logged-in user could read another user's
notification + activity feed by passing the victim's UUID directly to the
PostgREST RPC. SEC-HARDEN-06 (#323) was meant to add the guard but its sibling
fix (`get_default_user_address`) still shows the un-revoked anon/public grants in
this capture, suggesting #323's apply is not reflected here.

## Fix — `apps/hub/supabase/migrations/20260623090000_notification_rls_withcheck_and_signal_feed_guard.sql`

1. Recreate both UPDATE policies **with `WITH CHECK ((select auth.uid()) =
   user_id)`** → a row can never be updated to belong to another user.
2. **Seal the inbox:** `REVOKE insert, update, delete, truncate ON
   customer_notifications FROM anon, authenticated`. The inbox is authored
   exclusively by the service role (every monorepo write uses
   `createAdminSupabase()`/`admin()`); clients only `SELECT` (bell read) and
   receive realtime change events (which need SELECT, not write grants). SELECT
   is retained, so the bell + realtime keep working. This makes a client forge
   impossible even if the `WITH CHECK` is ever regressed.
   `customer_preferences` keeps its grants (a legacy client write path may exist)
   and is covered by the `WITH CHECK`.
3. **Re-assert the `get_signal_feed` `auth.uid()` IDOR guard** verbatim from
   SEC-HARDEN-06 TIER 0 — a byte-faithful no-op if #323 already landed, else it
   closes the read-IDOR. (Does not pull in the rest of #323; confirm #323 is
   applied on prod for `get_default_user_address` + the support_* guards.)

Idempotent (`DROP POLICY IF EXISTS` + `CREATE`, declarative `REVOKE`, `CREATE OR
REPLACE FUNCTION`). No table created, no money/payments object touched, no read
path changed for a legitimate owner.

## Status

**COMMITTED, NOT APPLIED** — apply after a rehearsal on prod
`rzkbgwuznmdxnnhmjazy`. Post-apply verification:

- A second authenticated user's `PATCH` setting `user_id=<victim>` on an owned
  notification is rejected (by RLS *and*, independently, by the missing grant).
- `get_signal_feed(<other-uuid>)` raises `42501` for an authenticated caller but
  still returns rows for the service role.
- The bell still hydrates and still receives realtime events.

## APPLIED TO PROD + DATA REMEDIATION (2026-06-23, owner-authenticated session)

Prod project confirmed = `rzkbgwuznmdxnnhmjazy` ("HENRY ONYX"). The other org
project `xzrqejqovbuaksoxyhap` has no `customer_notifications` (not the account DB).

**Structural migration APPLIED + verified live:**
- Both UPDATE policies now carry `with_check = ((select auth.uid()) = user_id)`.
- `customer_notifications` grants to `anon`/`authenticated` reduced to
  `SELECT, REFERENCES, TRIGGER` (no write) — inbox is service-role-authored.
- `get_signal_feed` on prod was ALREADY guarded (the captured schema was a
  pre-#323 snapshot) — the re-assert was a confirming no-op. Read-IDOR closed.

**Root cause of the owner's "fake / another user's notifications" report — found in the live data:**
A single care booking (`care_bookings.id`) had its "Care booking available"
notification inserted under up to **5 different real users** (distinct emails),
because `care-sync.ts` matches guest bookings by **email/phone** and notified
every matching account. Plus runaway duplication (one (user,booking) pair had
**252** identical rows). `customer_activity` was far worse — **343,592**
contaminated rows.

**Surgical remediation (rightful owner = `care_bookings.customer_id`):**
| table | before | deleted | after |
|---|---|---|---|
| customer_notifications | 10,062 | 6,895 wrong/unowned + 112 care dupes + 2,349 studio dupes + 155 exact dups | **551** |
| customer_activity | ~346,000 | 343,592 wrong/unowned + 2,031 dupes | **2,706** |

Verified post-clean: `care_notifs_wrong_owner_remaining = 0`,
`care_bookings_still_shared_across_users = 0`. Worst user went 5,877 → 243.

**Recurrence guard (code, this PR) — `apps/account/lib/care-sync.ts`:**
- Read path (`findMatchedCareBookings`): a booking already CLAIMED by another
  account (`customer_id` set ≠ viewer) is never matched/listed/notified.
- Write path (`syncCareArtifacts`): claim an unclaimed booking for the first
  matching account race-safely (`update … where customer_id is null`); skip if a
  concurrent claim won. One booking → one rightful owner, permanently.

**Residual, intentionally NOT auto-deleted (flagged for owner review):**
- `studio_notification`: de-flooded 2,482 → 133, but a few titles still span
  2–5 users (mostly the owner's own test-account name variants). Studio
  notifications carry no authoritative owner column on the row, so a safe
  delete needs the studio project→client mapping (follow-up; also needs the
  studio bridge's own owner guard like care got).
- `jobs_application` / `jobs_employer` / `jobs_post` / `learn_announcement`:
  ~9–11 shared references each — these are plausibly LEGITIMATE multi-party
  notifications (a class announcement reaches many students; an application
  rightly notifies candidate + employer). Not deleted without confirmation.
