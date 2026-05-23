# REALTIME-01 — Supabase Realtime Connection Stability

**Pass ID:** REALTIME-01
**Phase:** Bug-fix / hardening
**Pillar:** P12 (Global UX), P3 (Personalization), notifications
**Dependencies:** Wave B.1 on main — V3-03 added support_messages + support_threads to the `supabase_realtime` publication; V3-10 shipped degraded-side-effect pattern
**Effort:** S–M (1–2 sessions)
**Parallel-safe:** YES
**Owner gate:** Visual verify on live deploy
**Risk class:** None

---

## Role

You are the V3 Realtime engineer. Owner directive, verbatim:

> "Fix supabase realtime connection, it always shows connecting, reconnecting, so that it will fix it if that is a bug. … production ready, no shallow or fake data or fake work."

**The bar:** the Realtime status indicator settles on "live" within a few seconds of mount + stays there for the duration of the user's session under normal network conditions. Disconnects + reconnects happen as expected on visibility-change / network-flap / token-refresh — they don't loop. Every transition is observable in `henry_events`.

---

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `fix/realtime-connection-stability` |
| Worktree | `C:/Users/HP VICTUS/HenryCo/.worktree/fix-realtime` |
| Branch base | `main @ 1768a99d` |
| OS context | Windows + bash; pnpm 9.15.5; Node 24.x |

Use ABSOLUTE PATHS. For Bash, first call `cd "C:/Users/HP VICTUS/HenryCo/.worktree/fix-realtime"`. For git, prefer `git -C "<path>" <cmd>`. DO NOT touch the parent repo or sibling worktrees.

---

## Reference architecture (conductor-verified)

`packages/dashboard-shell/src/shell/`:
- `supabase-realtime-provider.tsx` — top-level Realtime client + connection state
- `realtime-types.ts` — connection-state union (`connecting | reconnecting | live | failed`?)
- Consumers:
  - `packages/dashboard-shell/src/components/notifications/notifications-bell.tsx` (live unread count)
  - V3-03's `@henryco/messaging-thread` consumes channel updates for delivery_state
  - V3-03's notification redelivery cron

Recent commits touching realtime:
- V3-03 (#131, `d825cd60`) — added `support_messages` + `support_threads` to `supabase_realtime` publication. Author of the trigger function + delivery-state schema.
- V3-10 (#133, `42c2562f`) — established degraded-side-effect pattern, fallback-policy doc
- V3-09 (#135, `8396a93e`) — touched dashboard-shell BottomSheet + Drawer (not realtime directly)

Possible bug vectors (rank-ordered by likelihood):

1. **Auth token not refreshed before Realtime reconnects** — Supabase Realtime uses a JWT for RLS-aware subscriptions. If the JWT expires mid-session and the Realtime client doesn't refresh it before retrying, every reconnect attempt is rejected → loops `connecting → failed → reconnecting → connecting`.
2. **Publication-table mismatch** — V3-03 added `support_messages` + `support_threads` to the publication. If the client subscribes to a channel for a table that ISN'T in the publication (typo, stale code), the server rejects the subscription. Loop.
3. **Channel naming collision** — multiple subscriptions to the same channel name across tabs can confuse the broker. Each tab's status reflects the broker's view of "another tab took my spot".
4. **Heartbeat/keepalive config** — if the heartbeat is set too aggressively (e.g., 1s) or too lax (e.g., 5min), the connection state can flap.
5. **WebSocket fallback to long-polling** — if WebSocket is blocked (corporate proxy, dev tunnel), Realtime tries WS first then falls back. The transition can look like "connecting → reconnecting".
6. **Multiple `SupabaseRealtimeProvider` mounts** — if the provider is mounted multiple times in a single React tree (e.g., per-route layout + per-page layout), each instance independently connects + competes for channels.
7. **iOS Safari Page Visibility** — when the user backgrounds the tab, Safari aggressively pauses the WS. On resume, the client must reconnect cleanly.

---

## Mandatory scope

### Phase 1 — Reproduce + diagnose

1. Read `supabase-realtime-provider.tsx` and `realtime-types.ts` end-to-end. Document the state machine: what states exist? What transitions exist? What triggers each transition?
2. Read every consumer (notifications-bell, messaging-thread, any other). Document the channel names they subscribe to + the table-watching shape.
3. Verify the `supabase_realtime` publication on the production Supabase project lists every table the client subscribes to. If any are missing, that's the bug — the server rejects, the client loops.
4. Verify the auth-token refresh flow. Does the Realtime client subscribe to `supabase.auth.onAuthStateChange` and rotate the channel token on TOKEN_REFRESHED? If not, that's the bug.
5. Check for multiple provider mounts via grep — should be exactly ONE per app shell.
6. Check heartbeat / `realtime.config` in the Supabase client init.

Output: `docs/v3/realtime-diagnostic-2026-05-23.md` — state machine diagram, suspected bug, evidence.

### Phase 2 — Fix

Implement the smallest possible fix to address the root cause identified in Phase 1. Likely fixes:

- **Token refresh:** subscribe the Realtime client to auth-state changes, call `channel.realtime.setAuth(newToken)` on TOKEN_REFRESHED, then re-subscribe with the fresh token.
- **Publication sync:** verify every client-subscribed table is in the publication. If a publication entry is missing, ship a migration adding it.
- **Provider deduping:** ensure the provider is mounted exactly once at the app's root and consumers use the provided context. No nested re-mounts.
- **Heartbeat tuning:** set heartbeat to a reasonable interval (default Supabase is 30s — usually fine; tune only if measurement justifies).
- **Visibility-aware reconnect:** on `visibilitychange` to `hidden`, gracefully disconnect; on `visible`, reconnect with fresh token.

### Phase 3 — Observability

Emit `henry.realtime.connection.*` events on every transition:
- `henry.realtime.connection.connecting`
- `henry.realtime.connection.live`
- `henry.realtime.connection.reconnecting` (with `attempt` + `reason`)
- `henry.realtime.connection.failed` (with `error_class`)

Owner-workspace tile (extend V3-10's observability tile) shows the connection success rate over the last 24h.

### Phase 4 — Tests + smoke

- Unit test for the state machine (snapshot transitions)
- Manual smoke procedure documented: test on cold-load, after auth refresh, after tab visibility flap, on slow network (Chrome DevTools throttle)
- Optional: an integration smoke that opens a channel + asserts it reaches "live" within N seconds

### Phase 5 — DRAFT PR

Commit per logical chunk. Push + open DRAFT PR with diagnostic doc + before/after evidence + manual smoke procedure.

Report at `.codex-temp/fix-supabase-realtime-stability/report.md`.

---

## Anti-patterns (HARD stops)

- **NO retrying forever** — if the connection truly can't establish, surface a degraded UI (V3-10 pattern) rather than infinite-reconnect.
- **NO swallowing auth errors silently** — log + emit a typed event.
- **NO touching `packages/search-ui/`** (owner-reserved).
- **NO migrations applied to production without owner explicit approval** — propose dry-run.
- **NO `git push --force`** (use `--force-with-lease` if needed).
- **NO PR auto-merge.**

---

## Self-verification checklist

- [ ] `docs/v3/realtime-diagnostic-2026-05-23.md` with state machine + suspected bug + evidence
- [ ] Root-cause fix applied (semantic, not a sleep-and-pray retry hack)
- [ ] Provider mounted exactly once across the dashboard-shell consumers
- [ ] 4 connection-state telemetry events registered + emitting
- [ ] Typecheck + lint PASS
- [ ] V3-07 strict gate PASS (no new hardcoded text)
- [ ] DRAFT PR opened with diagnostic doc + smoke procedure

You're Opus 4.7. The owner directive: "fix supabase realtime connection". This is a state-machine + token-refresh bug 9 times out of 10. Trace the state, find the transition that loops, fix the trigger.
