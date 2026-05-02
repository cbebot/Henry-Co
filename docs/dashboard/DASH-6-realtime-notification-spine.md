# DASH-6 — Realtime Notification Spine (Forged Prompt)

```
TOOL: Claude Code (Opus 4.7)
EFFORT: xhigh
PROJECT: HenryCo Ecosystem · henrycogroup.com · V2 active
PASS: V2-DASH-06 — Realtime notification spine wired to ContextDrawer
EXPECTED DURATION: Medium. May run in parallel with DASH-4 + DASH-5 after
                   DASH-3 completes (master §2 parallelism rules).

═══════════════════════════════════════════════════════
ROLE
═══════════════════════════════════════════════════════

Principal Systems Architect, Production Engineer, and Continuity Auditor for
the HenryCo Ecosystem. Opus 4.7. Self-verify against V1–V13.

═══════════════════════════════════════════════════════
CONTEXT — read in this order BEFORE writing code
═══════════════════════════════════════════════════════

1. docs/dashboard/DASHBOARD-AUDIT-REPORT.md (§A.5 realtime model, §A.8
   notification spine, §A.10 crons, §C.4 readiness, §C.10 #6 — promote
   notifications-ui shell-wide)
2. docs/dashboard/DASHBOARD-REBUILD-PROMPT-V2-FINAL.md (master)
3. docs/dashboard/DASH-1..DASH-5 forged prompts
4. .codex-temp/v2-not-02-a/report.md (V2-NOT-02-A — staff_notifications,
   staff_notification_states, is_staff_in() predicate, the 30-day
   purge cron, recently-deleted, swipe gestures, audience-agnostic
   primitives in @henryco/notifications-ui)
5. apps/hub/supabase/migrations/20260501130000_notification_realtime_publication.sql
   (customer_notifications publication)
6. apps/hub/supabase/migrations/20260502120000_staff_notifications_audience.sql
   (staff_notifications publication + RLS)
7. apps/account/components/notifications/* (existing customer-side bell,
   popover, toast viewport, inbox, recently-deleted — these migrate
   into shell consumption via packages/dashboard-modules-notifications)
8. apps/account/lib/notification-signal/* (existing customer Realtime
   provider — DASH-1 already shipped a unified SupabaseRealtimeProvider
   at the shell level; DASH-6 wires the fan-out and migrates the
   account-local provider into it)
9. packages/notifications-ui/src/* (V2-NOT-02-A — severity-style, icons,
   motion, gestures, deep-link, types, tokens — DASH-6 promotes from
   account-only consumption to shell-wide)

═══════════════════════════════════════════════════════
TRUTH HIERARCHY
═══════════════════════════════════════════════════════

CODE / DEPLOYMENT / LIVE truth — see master §3.

═══════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════

Wire the realtime notification spine to the ContextDrawer and promote
@henryco/notifications-ui from account-only to shell-wide consumption.
A SINGLE subscription at the shell level fans out to widgets via React
context (audit §C.4 + anti-pattern #9).

Deliverables:

1. SupabaseRealtimeProvider activation (DASH-1 scaffolded; DASH-6 turns
   it on)
   - Subscribes to: customer_notifications (RLS-isolated to user_id)
     and staff_notifications + staff_notification_states (RLS via
     is_staff_in()) when viewer.hasStaffAccess.
   - Single subscription per session; no per-widget subscriptions.

2. Fan-out store + hooks
   - Zustand or React-context store for active signals.
   - useNotificationSignal(filter?) — returns current notifications
     filtered by category / severity / division.
   - useTaskSignal(filter?) — returns tasks from the cross-module task
     stream (DASH-1 packages/data shipped the helpers; DASH-6 surfaces
     them via realtime).
   - useSignalInvalidation() — exposes a tag-based invalidation token
     that DASH-4's Smart Home cache() honors.

3. ContextDrawer surface (modules/notifications visualization in the
   right drawer slot)
   - Inbox (audit §A.8: read/unread/archive/delete/restore/purge).
   - Signal feed (live ranked feed; DASH-4 ships the Smart Home
     surface, DASH-6 ensures the same data is reflected in the drawer
     when open).
   - Quiet hours panel — read customer_preferences.quiet_hours_*.
   - Recently-deleted bin — DASH-3 shipped the route; DASH-6 wires the
     drawer entry point.
   - Preferences panel — muted_divisions, muted_event_types, email-
     fallback control.

4. Bell + popover + toast viewport (shell-wide)
   - Mount IdentityBar bell consuming @henryco/notifications-ui.
   - Toast viewport overlay anchored bottom-right desktop / bottom
     mobile. Toasts use motion tokens from @henryco/dashboard-shell
     (200ms ease-out fade+soft-scale).
   - Swipe gestures from V2-NOT-02-A's useSwipeReveal — already
     wrapped in SwipeableNotificationCard; DASH-6 ensures the same
     primitive is used in the drawer + toasts.

5. Quiet hours + muted divisions + muted event types enforcement
   - Read customer_preferences.quiet_hours_{enabled,start,end,timezone},
     muted_event_types[], muted_divisions[] (already exists per V2-NOT-
     01-A, audit §A.8).
   - Enforce at the rendering layer: signals during quiet hours render
     dimmer; muted categories don't toast (still inboxed); muted
     divisions don't bell-badge.

6. Email-fallback awareness
   - Where customer_notifications.email_dispatched_at IS NOT NULL,
     dim the signal in the drawer + toast viewport (audit §A.8).
   - The cron at apps/account/api/cron/notification-email-fallback runs
     */15 * * * * (audit §A.10) — DASH-6 doesn't touch the cron;
     reads the column.

7. Cross-tab / cross-device sync
   - Realtime subscription tied to user session ensures multi-tab
     coherence by default. Verify with two-tab smoke test.

═══════════════════════════════════════════════════════
GATE STRUCTURE
═══════════════════════════════════════════════════════

G0 — Recon at .codex-temp/v2-dash-06/recon.md.
G1 — SupabaseRealtimeProvider activated; subscriptions initialized
     once per shell mount; reconnect logic verified.
G2 — Fan-out store + hooks. Test: dispatching a notification updates
     the store within 50 ms.
G3 — ContextDrawer surface composition (inbox, signal feed, quiet
     hours, recently-deleted, preferences).
G4 — IdentityBar bell + popover + toast viewport (shell-wide consumption
     of @henryco/notifications-ui).
G5 — Quiet hours + muted enforcement.
G6 — Email-fallback dimming.
G7 — Cross-tab / cross-device sync verified (two browser tabs, single
     user; row inserted via cron path; both tabs reflect within 2 s).
G8 — Migrate apps/account-local NotificationSignalProvider into the
     shell-level SupabaseRealtimeProvider; remove the apps/account-local
     provider. Audit §A.3-1 (notifications-ui shell-wide) is closed
     here.
G9 — V1–V13 verification.
G10 — Persisted report at .codex-temp/v2-dash-06/report.md.

═══════════════════════════════════════════════════════
ANTI-PATTERNS — applied to DASH-6
═══════════════════════════════════════════════════════

From master §4.1:
  #9 Per-widget Realtime — single shell-level subscription. Verify by
     grep: post-DASH-6, no apps/* file imports @supabase/ssr realtime
     channels directly.
  #11 Migrating state-changing endpoints — UI rebuild only. The /api/
      notifications/* endpoints in apps/account stay as-is; the drawer
      reads through the new hooks but writes via the existing API.

From master §4.2:
  #13 No emoji-as-icon — V2-NOT-02-A already extracted icons.tsx; use it.
  #16 Empty inbox = typographic minimalism, not cartoons.
  #20 Copy: HenryCo voice. NO "All caught up! 🎉".

DO NOT:
- Build a generative summary of notifications (V3).
- Build a notification scheduler / digest engine (V3).
- Add new notification categories or event types in DASH-6 — they live
  in @henryco/notifications event-types.ts; modules added theirs in
  DASH-3 manifests.
- Touch the apps/account email-fallback cron schedule.

═══════════════════════════════════════════════════════
VERIFICATION REQUIREMENT — DASH-6 gate
═══════════════════════════════════════════════════════

V1 build/typecheck/lint  — PASS required.
V2 auth-continuity        — PASS required.
V3 RLS verification        — PASS required: probe both customer_
                           notifications and staff_notifications +
                           staff_notification_states with two
                           cross-tenant test users. 0 cross-pollination.
                           Live realtime probe must confirm RLS applies
                           to the subscription stream.
V4 Realtime smoke           — PASS REQUIRED — this phase is THE realtime
                           gate. Inject a customer_notifications row
                           via cron-test path and a staff_notifications
                           row via the publisher; confirm the shell
                           receives both within 2 s; disconnect WiFi,
                           reconnect, confirm subscription re-establishes
                           within 5 s.
V5 Mobile parity           — PASS required at all 6 breakpoints. The
                           ContextDrawer is a mobile bottom-sheet on
                           narrow viewports.
V6 Lighthouse + CWV         — PASS required.
V7 WCAG AA                  — PASS required. Drawer has focus trap;
                           live region announces new toasts politely;
                           swipe actions have keyboard equivalents
                           (V2-NOT-02-A useSwipeReveal already supports
                           reduced-motion + long-press fallback).
V8 Sender identity          — N/A — DASH-6 doesn't emit email.
V9 CTA reality              — PASS required: every drawer surface,
                           every toast action, every bell-popover
                           item, every recently-deleted action traced
                           to a real handler.
V10 Empty / loading / error / success — PASS required: empty inbox
                           (typographic), realtime disconnected (banner),
                           publisher error (toast), success-state lock
                           on action invocation.
V11 No console errors       — PASS required across the realtime
                           reconnect path.
V12 No 4xx/5xx              — PASS required.
V13 Role × division coverage — PASS required: customer-only sees
                           customer_notifications stream; staff sees
                           BOTH streams; quiet hours / muted divisions
                           / muted event types verified per role.

═══════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════

Persist at .codex-temp/v2-dash-06/report.md:
  Files modified
  Migration of apps/account NotificationSignalProvider → shell
  What was done
  How to verify
  Uncertainties
  Anti-pattern audit
  Verification gate (V1–V13)
  Realtime probe results (latency, reconnect, RLS)
  Cross-tab sync result
  Classification: DASH-6-COMPLETE | DASH-6-PARTIAL | DASH-6-BLOCKED
  Hand-off

PR title: feat(dashboard): DASH-6 realtime notification spine.

═══════════════════════════════════════════════════════
V2 SCOPE BOUNDARY
═══════════════════════════════════════════════════════

NOT permitted in DASH-6:
  - Generative summaries of notifications (V3).
  - New event types or categories.
  - New auth / MFA flows.
  - Notification digest engine.
  - Mobile bottom action bar (DASH-7).
  - Owner Track B (DASH-8).

═══════════════════════════════════════════════════════
PERSISTED-REPORT REQUIREMENT
═══════════════════════════════════════════════════════

  .codex-temp/v2-dash-06/recon.md
  .codex-temp/v2-dash-06/realtime-probe.md
  .codex-temp/v2-dash-06/cross-tab-probe.md
  .codex-temp/v2-dash-06/report.md         (final)

═══════════════════════════════════════════════════════
END OF DASH-6 FORGED PROMPT
═══════════════════════════════════════════════════════
```

---

## Authoring notes

- **Why DASH-6 is its own phase rather than absorbed into DASH-1.** The realtime fan-out hooks need every module's notification categories registered (DASH-3) before the contract can be exercised. Wiring it before modules exist means re-doing it when modules land.
- **Why one subscription, not two.** Audit §C.4 + anti-pattern #9: per-widget subscriptions blow up Supabase realtime quotas. One subscription, one fan-out, all widgets read through hooks.
- **Why migrate the account-local provider.** Audit §A.3-1: notifications-ui is account-only. Promoting it to shell-wide is the point. Leaving the account-local provider in place fragments the spine again.
