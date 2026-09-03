# V3-01 — Foundation Lock: Session Persistence

> **STATUS: SHIPPED — PR #129 / #130.** This pass is merged and certified on `main` as part of the Phase B Foundation Lock (CERTIFIED at V3-12, PR #168). The document below is the elevated canonical spec and closure record. The session primitives it describes (`@henryco/auth/client` retry, broadcast, session-state; `@henryco/auth/server` refresh middleware) are live and depended on by V3-02, V3-02b, and V3-04. Treat anything still open as the explicit residual/hardening follow-ups named under **Deferred / residual**, not as unbuilt scope.

**Pass ID:** V3-01  ·  **Phase:** B (Foundation Lock)  ·  **Pillar:** P12 (Global, Mobile, Observability)
**Dependencies:** —  ·  **Effort:** M  ·  **Parallel-safe:** Y (with V3-03, V3-05, V3-07, V3-09, V3-10)
**Owner gate:** none (D11 applies at Phase B close, V3-12)  ·  **Risk class:** Identity

---

## Role
You are the V3 Foundation engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass closes one sub-bar of Foundation Lock: **session persistence**. A session must survive page refresh, tab close, short network drops, and access-token expiry mid-action — with zero silent logout and zero lost draft. Multi-tab consistency is part of the bar. The line you must not cross: no auth-provider migration, no new server-side session store (Redis/etc.), and never a token or refresh token in a log, a URL, or `localStorage`.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/01-session-persistence` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

Branch off `origin/main` after a parallel-session check (`git status` + `project_henryco_parallel_sessions.md`) — the working tree is shared across concurrent agent sessions.

## Audit summary
Supabase Auth sessions live in `httpOnly` cookies issued by `@henryco/auth` server helpers, with cross-subdomain SSO via cookies scoped to the base domain (resolved through `henryWebRoot()` / `henrySubdomain()` in `@henryco/config`, never a hardcoded host). The `hc_dash_pref` cookie holds a dashboard preference but there is no broader "remember where I was" surface. Three concrete gaps remain: (1) access-token expiry mid-action (e.g. a long form fill) is handled inconsistently — likely silent failure or a redirect to the chooser that loses draft state; (2) multi-tab consistency (logout in one tab, account switch in another) is unverified; (3) no shared retry primitive exists for mutating calls across short offline→online transitions. This pass closes all three with reusable primitives in `@henryco/auth`, a draft layer in `@henryco/lifecycle`, and a single SSR session-state cookie. It is the foundation V3-02 (auth reliability) and V3-04 (deep links) build their auth round-trips on.

## Mandatory scope

### S1 — Transparent token refresh that never logs a user out silently
`packages/auth/src/server/refresh-middleware.ts` wraps each app's Next.js middleware. On an expired access token: if a valid refresh token exists, refresh transparently and continue the request. If refresh fails, the response carries `X-HenryCo-Session-State: reauth` and the middleware routes to `/auth/reauth?return=<encoded-current-path>&intent=<form|page>&drafts=<draftKey>` on the account SSO root (URL built via `getAccountUrl()`), never a context-losing `/auth/choose`. The reauth screen lands the user back on the originating page with drafts re-applied (S2). Each of the 10 web apps wraps its existing `apps/<app>/middleware.ts` with the helper in one line, preserving per-app logic.

Acceptance (e2e): token expires during a 5-minute form → form survives + refresh is transparent; both tokens expired → user reaches `/auth/reauth`, signs in, returns to the form with content intact.

### S2 — Draft preservation across refresh + reauth
`packages/lifecycle/src/drafts/useFormDraft(key, initialValue, options)` auto-saves on a 500 ms input debounce, restores on mount, clears on successful submit or explicit discard, and survives the S1 reauth round-trip via a `sessionStorage` mirror. Web uses `localStorage`; Expo falls back to `AsyncStorage` behind a runtime check (both paths compile). In scope — wire `useFormDraft` into: marketplace checkout, support-thread create (`apps/account/app/api/support/create`), support-thread reply, jobs application, property listing submission, KYC/verification submission, profile edit, password reset, address add/edit, studio brief intake. Out of scope: chat-composer drafts (already handled in `@henryco/chat-composer`), single-step wallet transfer.

### S3 — Multi-tab session consistency
`packages/auth/src/client/session-broadcast.ts` exposes `createSessionBroadcaster()` over the single channel `SESSION_CHANNEL_NAME` (`"henryco-session"`) — reused, not a new channel; cart-saved-items already shares it. On logout it publishes `{ type: 'sign-out', reason: 'user' | 'server' | 'expired' }`; on account switch `{ type: 'user-changed', userId }`. Receiving tabs show a soft notice and redirect on the next interaction (never an immediate hard redirect that discards in-flight work).

### S4 — Resume-where-you-left-off surface
Extend the existing `@henryco/lifecycle` "continue where you left off" panel to list last-visited workflow steps and saved drafts (with timestamp + discard). Account home renders the panel as a top-of-page module when drafts exist; on mobile it is the first inline card after the welcome row.

### S5 — `hc_session_state` SSR cookie
`packages/auth/src/server/session-state.ts` and `packages/auth/src/client/session-state.ts` set/read one cookie (`HC_SESSION_STATE_COOKIE`) with values `signed-in | signed-in-stale | signed-out | reauth-required` (`SESSION_STATE_VALUES`). Server components read it to pick the hydration path, replacing ad-hoc per-app checks. Coexists with `hc_dash_pref` (different purpose).

### S6 — Network-drop tolerance
`packages/auth/src/client/retry.ts` exports `withSessionRetry(fn, { idempotencyKey?, maxRetries = 3, backoff })` plus `reserveIdempotencyKey` / `releaseIdempotencyKey`. Mutating auth-required calls retry up to 3× across offline→online transitions; idempotent calls send an `Idempotency-Key` header (UUID v4 from `crypto.randomUUID()`); non-idempotent calls surface "Connection unstable — retry?" rather than dropping silently.

### S7 — Telemetry
Emit via `@henryco/observability`: `henry.auth.session.refreshed`, `henry.auth.session.refresh_failed`, `henry.auth.session.reauth_succeeded`, `henry.auth.session.draft_restored`, `henry.auth.session.multitab_broadcast`. Add an owner-workspace tile showing daily reauth count + reauth success rate over the trailing 7 days.

## Out of scope
- Auth-provider changes / OAuth UX hardening / logout completeness — V3-02.
- Role-chooser badge counts — V3-02.
- Per-route fallback handling beyond S6 — V3-10.
- Native (Expo) session model and biometric reauth — V3-87.

## Dependencies
Depends on: Phase A audit baseline only. Blocks: **V3-02** (auth reliability reuses `hc_session_state` + the broadcast channel + the reauth screen), **V3-04** (deep-link auth round-trip generalizes S1's `return=` mechanism).

## Inheritance
`@henryco/auth` (extend, never fork) · `@henryco/observability` logger + `emitEvent` · `@henryco/lifecycle` continue-panel · the shared `SESSION_CHANNEL_NAME` broadcast channel · `@henryco/config` domain helpers for every URL · `@henryco/ui` toast primitive · the existing security-headers baseline.

## Implementation requirements

### Files
`packages/auth/src/client/`: `retry.ts`, `session-broadcast.ts`, `session-state.ts`, `known-storage.ts`, `index.ts`. `packages/auth/src/server/`: `refresh-middleware.ts`, `session-state.ts`, `reauth-cookie.ts`, `reauth-context.ts`. `packages/lifecycle/src/drafts/`: `useFormDraft.ts`, `DraftPanel.tsx`. `packages/ui/src/auth/ReauthScreen.tsx` wired at `apps/account/app/auth/reauth/page.tsx`. Per-app: one-line middleware wrap in each `apps/<app>/middleware.ts`; `useFormDraft` wiring in the 10 named surfaces. Telemetry event names added to the `@henryco/observability` event union. Owner tile under `apps/hub/app/owner/(command)/dashboard/`.

### Trust / safety / compliance
Session cookies stay `Secure`, `HttpOnly`, `SameSite=Lax`, scoped via the config domain helper. Reauth carries no request body in the URL — drafts are referenced by client-side key, never transmitted. `BroadcastChannel` is same-origin by design. Every reauth event audit-logs `{ userId, ip, ua, outcome, reason }` via `@henryco/observability/audit-log`. Never log access or refresh tokens; never put draft contents in URL params; never use `localStorage` for tokens/OTPs.

### Mobile + desktop parity
Web mobile: drafts via `localStorage`, broadcast works in mobile Safari/Chrome. Expo: `useFormDraft` falls back to `AsyncStorage`; full native session model is V3-87. Both code paths must compile and typecheck.

### i18n
All new strings (reauth screen, session-end toast, draft-restored toast, continue-panel labels) flow through `@henryco/i18n` under namespace `surface:auth-session` (Pattern A typed copy). Populate en-US; runtime DeepL (Pattern B) fills the other 11 locales. No hardcoded user-facing text.

### Brand & design system
Any user-facing brand string ("Henry Onyx") and division labels come from `@henryco/config` (`company.ts`) — never hardcoded; legal contexts use "Henry Onyx Limited". The reauth screen uses locked design-system tokens (`--site-*` / `--accent`, Fraunces for display), light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed. Every URL via the `@henryco/config` domain helpers — zero literal `henrycogroup.com`.

## Validation gates
1. `pnpm lint` + `pnpm typecheck` green across all apps + packages. 2. New unit tests for `withSessionRetry`, the session broadcaster, and `useFormDraft`; existing suites still green. 3. `pnpm ci:validate` build. 4. `pnpm i18n:check` (hardcoded-string gate). 5. `pnpm a11y` on `/auth/reauth`. 6. Security-headers gate preserved. 7. Preview smoke on account + marketplace + jobs + hub: sign in → `hc_session_state=signed-in`; type 3 lines in a long form; sign out in another tab → soft toast in tab A; hard-refresh → draft restored; sign in in a third tab → `user-changed` broadcast; expire access token → transparent refresh, submit succeeds; expire both tokens → land on `/auth/reauth`, sign in, return with draft intact. 8. Real-browser light + dark + mobile + desktop on the reauth screen.

## Deployment gate
All gates green; preview-smoke evidence captured in `.codex-temp/v3-01-session-persistence/preview-smoke.md`; owner reviews the PR (no emergency merge); squash-merge to `main` (Vercel auto-deploys all projects); 24-hour soak with no 401 spike before declaring closure.

## Final report contract
`.codex-temp/v3-01-session-persistence/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env (none — confirm) · validation evidence · smoke · live verification (24-h soak + owner-tile screenshot) · telemetry baseline (first-day counts for the 5 events) · deferred items · pass-closure assertion ("Session-persistence sub-bar locked; V3-02 starts next").

## Deferred / residual (post-ship, this pass is merged)
- Native Expo session model + biometric reauth → V3-87.
- Any draft surface added after this pass adopts `useFormDraft` at creation time (enforced in code review), not a new sweep.

## Self-verification
- [ ] S1 transparent-refresh middleware wraps all 10 web apps; both-tokens-expired routes to `/auth/reauth` with `return`/`intent`/`drafts`.
- [ ] S2 `useFormDraft` wired into all 10 named surfaces; survives the reauth round-trip; clears on submit.
- [ ] S3 multi-tab consistency verified across 3+ tabs over the shared `henryco-session` channel.
- [ ] S4 continue-where-you-left-off panel renders drafts on account home (desktop module + mobile first card).
- [ ] S5 `hc_session_state` cookie set + read consistently across SSR.
- [ ] S6 `withSessionRetry` covers a mutating route per app; idempotency keys present on idempotent calls.
- [ ] S7 the 5 telemetry events emit; owner reauth tile renders.
- [ ] No token/draft in any log or URL; security-headers baseline intact; no new server-side session store.
- [ ] All user-facing strings under `surface:auth-session`; brand + domains sourced from `@henryco/config`.
- [ ] Report written; hand-off named: V3-02 (auth reliability).
