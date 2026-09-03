# REALTIME-01 — Foundation hardening: Supabase Realtime Connection Stability

> **STATUS: SHIPPED — PR #145.** This prompt is the elevated canonical spec and historical record for the Realtime stability fix. The connecting/reconnecting loop is fixed, four `henry.realtime.connection.*` events are registered and emitting, and the publication-membership backfill was applied owner-gated (commit `42f6b899`). A care-prod hot-fix (#146) mounted `SupabaseRealtimeProvider` in the care public layout immediately after. Execute the **Residual / hardening follow-ups** section only; treat everything above it as DONE and verified.

**Pass ID:** REALTIME-01  ·  **Phase:** B (Foundation Lock — hardening tail)  ·  **Pillar:** P12 (Global UX), P3 (Personalization)
**Dependencies:** V3-03 (#131 — added `support_messages` + `support_threads` to the `supabase_realtime` publication), V3-10 (#133 — degraded-side-effect pattern)  ·  **Effort:** S–M  ·  **Parallel-safe:** Y
**Owner gate:** none (visual verify on live deploy)  ·  **Risk class:** —

---

## Role
You are the V3 Realtime engineer for Henry Onyx. You execute exactly this one pass, then stop and report. You make the dashboard Realtime status indicator settle on "live" within a few seconds of mount and stay there for the whole session under normal network, while disconnecting and reconnecting cleanly on visibility-change / network-flap / token-refresh — never looping. The line you do not cross: no infinite-reconnect retry hacks and no swallowed auth errors; a connection that genuinely cannot establish must degrade visibly via the V3-10 pattern, not spin forever.

The owner directive, verbatim, that motivated this pass:
> "Fix supabase realtime connection, it always shows connecting, reconnecting, so that it will fix it if that is a bug. … production ready, no shallow or fake data or fake work."

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/realtime-01-stability` (per pass) |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
The Realtime client lives in `packages/dashboard-shell/src/shell/`: `supabase-realtime-provider.tsx` (top-level client + connection-state machine), `realtime-types.ts` (the `connecting | reconnecting | live | failed` state union), `realtime-data-source.ts`, `realtime-hooks.ts`, and `realtime-rules.ts`. Consumers include `packages/dashboard-shell/src/components/notifications/notifications-bell.tsx` (live unread count) and V3-03's `@henryco/messaging-thread` (channel updates for `delivery_state` on `support_messages` / `support_threads`).

The root cause this pass closed: the Realtime client used a JWT for RLS-aware subscriptions but did not rotate that JWT on `TOKEN_REFRESHED`. When the access token expired mid-session, every reconnect attempt was rejected by the broker, producing the visible `connecting → failed → reconnecting → connecting` loop. A secondary contributor was publication-membership drift — the client subscribed to tables that were not all present in `supabase_realtime` on the live project, so the server rejected those channels. Both are fixed on `main`: the provider now subscribes to `supabase.auth.onAuthStateChange`, calls `setAuth(newToken)` on refresh before re-subscribing, the publication was backfilled under an owner-gated migration (`42f6b899`), and four connection-state telemetry events were registered (`30a0ec6e`). The diagnostic that drove the fix is `5ce20a00`.

## Mandatory scope (SHIPPED — recorded for the closure record)
### S1 — State-machine diagnosis (done, PR #145 `5ce20a00`)
Documented the `connecting | reconnecting | live | failed` state machine in `supabase-realtime-provider.tsx` / `realtime-types.ts`, every transition trigger, and every consumer's channel name + table-watch shape. Identified the token-non-refresh loop as the 9-in-10 root cause. The diagnostic artifact records the evidence.

### S2 — Token-refresh fix (done, `02494745`)
The provider subscribes to `supabase.auth.onAuthStateChange`; on `TOKEN_REFRESHED` it calls `client.realtime.setAuth(session.access_token)` and re-subscribes channels with the fresh token. Reconnect is bounded: after N failed attempts the provider transitions to `failed` and surfaces a degraded indicator (V3-10 pattern) rather than looping. Provider is mounted exactly once per app shell (verified by grep — no nested re-mounts). Visibility-aware reconnect: on `visibilitychange → hidden` it disconnects gracefully; on `visible` it reconnects with a fresh token (covers iOS Safari WS-pause).

### S3 — Publication membership backfill (done, owner-gated `42f6b899`)
Confirmed every client-subscribed table is in the `supabase_realtime` publication on project `rzkbgwuznmdxnnhmjazy`. The migration that backfilled missing membership was applied **only** after explicit owner approval (no auto-apply to production).

### S4 — Connection telemetry (done, `30a0ec6e`)
Four events registered in `packages/observability/src/events.ts` and emitted on every transition:
`henry.realtime.connection.connecting`, `henry.realtime.connection.live`, `henry.realtime.connection.reconnecting` (with `attempt` + `reason`), `henry.realtime.connection.failed` (with `error_class`). The owner-workspace observability tile (V3-10) reads these from `henry_events`; a 24h connection-success-rate panel is available.

## Out of scope
- Realtime-driven product features (new live surfaces) — those belong to their owning product passes (e.g. V3-54 jobs interview room uses `@henryco/rooms`, not this provider).
- Mobile (Expo) Realtime parity — V3-87.
- The care-prod provider-mount hot-fix — already landed separately as #146; do not re-do.
- `packages/search-ui/` — owner-reserved, never touched.

## Dependencies
Depends on V3-03 (publication membership for messaging tables) and V3-10 (degraded-side-effect pattern + observability tile). Blocks nothing structurally; it is a hardening pass. Any future live-data surface inherits a stable provider because of it.

## Inheritance
Builds on `@henryco/dashboard-shell` (the shell provider + consumers), `@henryco/messaging-thread` (V3-03), `@henryco/observability` (events + audit + the V3-10 tile), and `@supabase/supabase-js` Realtime + `supabase.auth` session APIs.

## Implementation requirements
### Files
`packages/dashboard-shell/src/shell/supabase-realtime-provider.tsx`, `…/realtime-types.ts`, `…/realtime-rules.ts`; `packages/observability/src/events.ts` (event union); the owner-gated publication migration under `supabase/migrations/`. Consumers (`notifications-bell.tsx`, `@henryco/messaging-thread`) read the provider context — no consumer re-mounts the client.
### Trust / safety / compliance
RLS-aware channels only; the JWT used for Realtime is the live session access token, rotated on refresh — never a long-lived key. No secrets in client code. No migration applied to production without explicit owner approval (the publication backfill was owner-gated). Auth errors are logged + emitted as typed events, never swallowed.
### Mobile + desktop parity
Web mobile is in scope: visibility-aware reconnect covers iOS Safari's aggressive WS-pause on background. Expo super-app Realtime parity is N/A here — deferred to V3-87.
### i18n
The status indicator and any degraded-state copy route through `@henryco/i18n` under `surface:dashboard` (Pattern A typed keys: `realtime.live`, `realtime.reconnecting`, `realtime.offline`). No hardcoded user-facing strings; the internal state-union literals (`connecting`/`live`/…) are code tokens, not UI copy.
### Brand & design system
The indicator uses design-system tokens (`--accent` for "live", a neutral/`--state-warning` token for reconnecting) — no ad-hoc hex; light + dark; CLS ≈ 0. No brand strings rendered, so no `@henryco/config` brand read needed here.

## Validation gates
1. CI green on the branch: typecheck, lint, test, build.
2. State-machine unit test snapshots the transitions (`connecting → live`, refresh → live, flap → reconnecting → live, exhausted → failed).
3. RLS verification: a subscriber without rights to a watched table does not receive rows (channel scoped by JWT).
4. Manual smoke: cold-load reaches "live" within a few seconds; after a forced token refresh it stays "live"; after a tab visibility flap it recovers; on DevTools-throttled slow network it degrades visibly rather than looping.
5. V3-07 hardcoded-text strict gate PASS (one scanner false-positive on a TS conditional was exempted in `fabdd60b`).

## Deployment gate
All gates green; owner-gated migration applied only on explicit approval; visual verify on a live Vercel deploy that the indicator settles on "live" and holds. Squash-merge to `main`; no force-push, no auto-merge.

## Final report contract
`.codex-temp/v3-realtime-01-stability/report.md` (delivered as `.codex-temp/fix-supabase-realtime-stability/` for the original pass) with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion. The diagnostic at `docs/v3/realtime-diagnostic-2026-05-23.md` is the supporting artifact.

## Residual / hardening follow-ups (the only OPEN work)
1. **24h soak telemetry review.** Pull `henry.realtime.connection.*` from `henry_events` over a representative 24h on production and confirm `live` dwell-time dominates and `reconnecting.attempt` distribution has no runaway tail. Record the baseline in the closure report.
2. **Cross-app provider-mount audit.** Re-confirm by grep that exactly one `SupabaseRealtimeProvider` mounts per app shell across all 10 apps — the care hot-fix (#146) proved a public layout can be missing its mount. Add a lightweight CI assertion or doc note so a missing/duplicate mount is caught before prod.
3. **Reconnect-attempt cap tuning.** Verify the bounded-retry ceiling and backoff are tuned from the soak data (not guessed); if the data justifies a change, ship the smallest tuning diff with evidence.

## Self-verification
- [ ] S1: state-machine diagnostic recorded; loop root cause is the token-non-refresh path.
- [ ] S2: provider rotates the JWT on `TOKEN_REFRESHED`, reconnect is bounded, visibility-aware, mounted exactly once.
- [ ] S3: every client-subscribed table is in `supabase_realtime`; the backfill migration was owner-gated, not auto-applied.
- [ ] S4: four `henry.realtime.connection.*` events register + emit; the V3-10 tile shows 24h success rate.
- [ ] i18n: indicator copy is `surface:dashboard`-namespaced; no hardcoded strings.
- [ ] Tokens: indicator uses `--accent`/state tokens; light + dark; CLS ≈ 0.
- [ ] Residual follow-ups 1–3 executed and recorded in the closure report.
- [ ] CI + V3-07 strict gate PASS; live deploy shows "live" settling and holding.
