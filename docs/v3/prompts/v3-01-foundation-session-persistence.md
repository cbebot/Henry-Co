# V3-01 — Foundation: Session Persistence

**Pass ID:** V3-01
**Phase:** B (FOUNDATION LOCK)
**Pillar:** P12 (Global, Mobile, Observability)
**Dependencies:** Phase A audit (this prompt assumes `docs/v3/AUDIT-BASELINE.md` exists)
**Effort:** M (1–2 weeks)
**Parallel-safe:** YES (with V3-03, V3-05, V3-07, V3-09, V3-10)
**Owner gate:** None at start (D11 at Phase B close)
**Risk class:** Identity-touching

---

## Role

You are the V3 Foundation engineer for HenryCo. You execute exactly this one pass, then stop and report. You do not start any other V3 pass.

This pass closes a single foundation lock area: **session persistence**. The base must feel solid. Sessions must survive refresh, tab close, short network drops, and token expiry mid-action. Multi-tab consistency is part of the bar.

You produce code, migrations (if needed), tests, and a final report. You do NOT produce per-pass prompts; those already exist.

---

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch for this pass | `v3/01-session-persistence` |
| Deploy | Vercel (10 web projects) |
| Backend | Supabase (single project, multi-app) |
| Auth | Supabase Auth via `@henryco/auth` |
| OS context for executor | Windows + bash; pnpm 9.15.5; Node 24.x |

Create your working branch from `main` after confirming `main` has no uncommitted owner work (`git status` + parallel-session check per `project_henryco_parallel_sessions.md`).

---

## Audit summary (lifted from AUDIT-BASELINE.md §3.1)

From the baseline:

> ### 3.1 Session persistence
> - **Solid:** Supabase Auth session in `httpOnly` cookies via `@henryco/auth` server helpers
> - **Solid:** cross-subdomain SSO via `.henrycogroup.com` cookies
> - **Partial:** `hc_dash_pref` cookie holds dashboard preference but no broader "remember where I was" surface
> - **Gap:** what happens on token-expiry mid-action (e.g., long form fill) is not consistently handled — likely silent failure or re-redirect to login losing draft state
> - **Gap:** multi-tab session consistency (e.g., logout in one tab) needs verification

Owner's verbatim instruction (from `OWNER-BRIEF.md` and the foundation-lock section):

> "Lock in the boring essentials first: session persistence, auth reliability, notifications and message states, deep links into exact workflows, live data for dashboards, invoices, subscriptions, receipts, consistent mobile behavior. If the core feels solid, every later version compounds instead of collapsing."

This pass closes the session-persistence sub-bar.

---

## Mandatory scope (what is in)

### S1 — Token-refresh middleware that never logs a user out silently

When a Supabase access token expires mid-request:
- If a valid refresh token exists, transparently refresh and continue.
- If refresh fails (refresh token also expired), the response carries a `WWW-Authenticate: ReauthRequired` header AND an explicit `X-HenryCo-Session-State: reauth` header.
- The Next.js middleware shape MUST route the user to `/auth/reauth?return=<current-path>&intent=<form|page>&drafts=<draftKey>` — never a generic `/auth/choose` re-login that loses context.
- The reauth screen MUST land the user back at the originating page, with all preserved drafts re-applied (see S2).

Required behavior tests (e2e):
- Token expires while user types in a 5-minute form — form survives + refresh happens transparently.
- Refresh token also expired → user lands on `/auth/reauth`, signs in, lands back on the form with the typed content intact.
- User logs out in tab A → tab B (open with the same account) sees a soft "session ended" toast within 5 seconds and redirects on next interaction (NOT immediate hard redirect — preserve in-flight work).

### S2 — Draft preservation across refresh + reauth

Every form longer than 2 fields persists drafts to `localStorage` (web) and `AsyncStorage` (Expo) under a per-route key. Drafts:
- Auto-save on input throttle (500ms debounce).
- Restore on page mount.
- Clear on successful submit OR explicit user "discard".
- Survive reauth round-trip per S1.

In scope: marketplace checkout, support thread create, support thread reply, jobs application, property listing submission, KYC submission, profile edit, password reset, address add/edit, studio brief intake.

Out of scope (deferred to per-feature prompts): chat-composer drafts (already implemented in `@henryco/chat-composer`), wallet transfer (single-step, no draft needed).

### S3 — Multi-tab session consistency

Use `BroadcastChannel('henryco-session')` to coordinate tabs:
- On logout, broadcast `{ type: 'sign-out', reason: 'user' | 'server' | 'expired' }`.
- On user change (account switcher), broadcast `{ type: 'user-changed', userId: '...' }`.
- Receiving tabs show a soft notice + redirect on next interaction.

Cart-saved-items already uses `BroadcastChannel` for save-item sync (V2-CART-01) — extend the same `henryco-session` channel surface for session events. Do NOT introduce a new channel.

### S4 — Resume-where-you-left-off surface

Extend the existing `@henryco/lifecycle` "continue where you left off" panel to include:
- Last visited workflow steps (e.g., "Continue your KYC submission — 2 documents pending").
- Saved drafts with timestamps and discard buttons.

Account `/dashboard` shows the panel as a top-of-page module when drafts exist. Mobile placement is the inline first card after the welcome row.

### S5 — `hc_session_state` cookie

Single source of session state for SSR. Set to one of:
- `signed-in`
- `signed-in-stale` (auth still valid but profile/role data may be stale; refresh on next request)
- `signed-out`
- `reauth-required`

Server components read this cookie to decide hydration path. Replaces ad-hoc checks scattered across apps.

### S6 — Network-drop tolerance

Mutating client requests on auth-required surfaces (form submits, save buttons) use a retry-with-backoff utility from `@henryco/auth/client` (NEW export):
- Up to 3 retries on network failure (offline → online transitions).
- Idempotent requests pass an `Idempotency-Key` header per V3-BACKLOG idempotency conventions.
- Non-idempotent requests show "Connection unstable — retry?" UI rather than silently dropping.

### S7 — Telemetry

Every session event emits a `@henryco/observability` event:
- `henry.auth.session.refreshed` (silent refresh succeeded)
- `henry.auth.session.refresh_failed` (refresh failed → reauth)
- `henry.auth.session.reauth_succeeded` (user completed reauth)
- `henry.auth.session.draft_restored` (draft survived reauth)
- `henry.auth.session.multitab_broadcast` (cross-tab sync occurred)

Events flow into the standard observability pipeline. Dashboard tile in owner workspace shows daily reauth count + reauth success rate.

---

## Out of scope

- Auth provider changes (no migration off Supabase Auth).
- Role-chooser badge counts (V3-BACKLOG I1 — handled in V3-02).
- Logout completeness across all storage surfaces (V3-02).
- OAuth UX hardening (V3-02).
- Mobile app session model — Expo super-app has its own session storage; out-of-scope here (V3-87 phase I).
- Per-route fallback handling beyond what S6 specifies (handled in V3-10).

---

## Dependencies

This pass depends on:
- Phase A audit complete (this prompt assumes `docs/v3/AUDIT-BASELINE.md` is the truth).

Blocks:
- V3-02 (auth reliability) — V3-02 builds on the session primitives shipped here.
- V3-04 (deep links) — auth round-trip preservation is the foundation for deep-link round-trips.

---

## Inheritance (reuse without redefining)

- `@henryco/auth` package — extend; do not fork.
- `@henryco/observability` — use existing logger + emitEvent.
- `@henryco/lifecycle` — extend continue-where-you-left-off; do not duplicate.
- `BroadcastChannel('henryco-session')` — share with V2-CART-01 cart-saved-items.
- Existing PNH-04 security headers — preserve.
- Existing `hc_dash_pref` cookie — coexist with new `hc_session_state` (different purposes).
- `@henryco/ui` — toast primitive (existing) for session-state notices.

---

## Implementation requirements

### File-level deliverables

**Package changes** (`packages/auth/src/`):
- `client/retry.ts` (new) — `withSessionRetry(fn, { idempotencyKey?, maxRetries=3, backoff='exp' })`
- `client/session-broadcast.ts` (new) — `BroadcastChannel('henryco-session')` wrapper
- `client/session-state.ts` (new) — read `hc_session_state` cookie + react to changes
- `server/refresh-middleware.ts` (new) — Next middleware helper for transparent refresh + reauth routing
- `server/session-state.ts` (new) — set/read `hc_session_state` cookie server-side
- `index.ts` — export new surfaces

**Per-app changes** (10 web apps, one middleware update each):
- `apps/<app>/middleware.ts` — wrap existing middleware with `withSessionRefresh` helper
- The wrap is one-line where possible; preserve existing per-app middleware logic.

**New shared component** (`packages/ui/src/auth/`):
- `ReauthScreen.tsx` — the `/auth/reauth` surface; props: `returnPath`, `intent`, `draftKey`
- Wire route at `apps/account/app/auth/reauth/page.tsx` (account is the SSO root)

**Draft preservation** (`packages/lifecycle/src/drafts/`):
- `useFormDraft(key, initialValue, options)` (new) — auto-save + restore + clear hook
- `useFormDraftPersistence` — survives reauth via `sessionStorage` mirror
- `DraftPanel.tsx` — extension of existing continue-where-you-left-off panel

**Per-feature draft wiring (10 surfaces):**
- `apps/marketplace/app/checkout/*` — wire `useFormDraft`
- `apps/account/app/support/new/*`
- `apps/account/app/support/[threadId]/reply/*` (delegates to chat-composer, but verify)
- `apps/jobs/app/apply/[jobId]/*`
- `apps/property/app/list-property/*`
- `apps/account/app/verification/*`
- `apps/account/app/settings/profile/*`
- `apps/account/app/security/reset-password/*`
- `apps/account/app/addresses/*`
- `apps/studio/app/request/*`

For each surface: add `useFormDraft('<key>', defaults)`; pass the persisted state into the form's controlled inputs; clear on successful submit.

**Observability** (`packages/observability/src/events.ts`):
- Add the 5 new event names (S7 list) to the `HenryEventName` union.
- Wire emission in `packages/auth/src/server/refresh-middleware.ts` and `packages/auth/src/client/session-broadcast.ts`.

**Owner-workspace tile** (`apps/hub/app/owner/(command)/dashboard/`):
- New module: `session-health-tile.tsx` showing daily reauth count + reauth success rate (last 7 days).

### Migration changes

No schema changes. The new `hc_session_state` cookie is a transport-layer concern; not persisted in DB.

If telemetry storage is needed for the owner-workspace tile, persist to existing `henry_events` event sink (whatever `@henryco/observability/events.ts` writes to). Don't introduce a new table.

### Integration changes

None. Supabase Auth + Resend + Brevo + existing providers preserved.

### Trust / safety / compliance requirements

- Session cookies remain `Secure`, `HttpOnly`, `SameSite=Lax`, scoped to `.henrycogroup.com` per PNH-04 baseline.
- Reauth never logs original-request data in URL (drafts stored under client-side key, referenced by ID, not transmitted in URL).
- `BroadcastChannel` is same-origin only by design — no cross-origin leakage.
- Idempotency keys generated client-side use UUID v4 from `crypto.randomUUID()` — sufficient entropy.
- ANTI-CLONE Principle 12 (audit logs): every reauth event logs `userId + IP + UA + outcome + reason`.

### Mobile + desktop parity

- Web mobile: drafts persist via `localStorage`; `BroadcastChannel` works in mobile Safari + Chrome.
- Expo (super-app + company-hub): out-of-scope for this pass (V3-87 phase I); native session model is different.
- The `useFormDraft` hook has a runtime check — on Expo it falls back to `AsyncStorage`; on web it uses `localStorage`. Both paths must compile.

### i18n requirement

- All new user-facing strings (reauth screen, session-end toast, draft-restored toast, continue-where-you-left-off labels) go through `@henryco/i18n` surface labels.
- Add labels under a new namespace `surface:auth-session` per Pattern A typed copy.
- Provide en-US + en-GB + ar + de + es + fr + ha + hi + ig + it + pt + yo + zh (12 locales) keys; populate en-US in this pass; runtime DeepL fills the rest per Pattern B.

---

## Validation gates

Before merging:

1. **Lint** — `pnpm lint` passes across all 10 web apps + 33 packages.
2. **Typecheck** — `pnpm typecheck` passes (existing CI).
3. **Tests** — new tests for `withSessionRetry`, `session-broadcast`, `useFormDraft`. Existing tests still pass.
4. **Build** — `pnpm ci:validate` from root.
5. **i18n check** — `pnpm i18n:check` (existing CI gate).
6. **A11y** — `pnpm a11y` against the new `/auth/reauth` route.
7. **PNH-04** — security headers preserved on every app (existing CI gate).

### Smoke verification (preview deploy)

On Vercel preview for at least 4 apps (account + marketplace + jobs + hub):

1. Sign in. Confirm `hc_session_state=signed-in` cookie present.
2. Open a long form (e.g., support thread create). Type 3 lines.
3. In another tab, sign out. Confirm tab A sees the soft toast.
4. Hard-refresh tab A. Confirm `useFormDraft` restores the 3 lines.
5. In a third tab, sign in. Confirm `userId` matches; verify tab A sees `user-changed` broadcast.
6. Manually expire the access token (Supabase dashboard or by waiting / shortening expiry in dev) and submit the form. Confirm transparent refresh; submission succeeds without redirect.
7. Manually expire BOTH access + refresh tokens. Confirm redirect to `/auth/reauth`, sign in, land back at the form with the 3 lines preserved.

### Live verification (after merge)

After production deploy of the merged change:

- Browse to each of the 10 web apps; confirm middleware loaded (Vercel logs show no errors).
- Confirm owner-workspace tile renders daily reauth count = 0 on first day (then real data).
- Run a 24-hour soak; confirm no spike in 401s.

---

## Deployment gate

- All validation gates passing.
- Preview-deploy smoke 1–7 evidence captured in `.codex-temp/v3-01/preview-smoke.md`.
- Owner reviews the PR. No emergency-merge.
- Merge to `main`. Vercel auto-deploys all 10 projects.
- 24-hour soak before declaring closure.

---

## Final report contract

Write `.codex-temp/v3-01-session-persistence/report.md` containing:

1. **Executive summary** — one paragraph: what shipped, what's deferred.
2. **Files changed** — full list grouped by package + app + per-feature wiring.
3. **Migration / RLS / env** — none expected; confirm.
4. **Validation gate evidence** — paste lint/typecheck/test/build/i18n/a11y outputs.
5. **Smoke verification evidence** — paste the 7 smoke checks with screenshots or HAR exports.
6. **Live verification evidence** — 24-hour soak observations + owner-tile screenshot.
7. **Telemetry baseline** — first-day event counts for the 5 new events.
8. **Deferred items** — anything in mandatory scope that didn't ship + why + V3-NN follow-up reference.
9. **Pass closure assertion** — "Session-persistence sub-bar locked. Recommend V3-02 (auth reliability) starts next."

The report is the closure artifact. Without it, the pass is not closed.

---

## Anti-patterns this pass must avoid

- Do not introduce a new session-state store (e.g., Redis); use cookie + client storage primitives.
- Do not log session tokens or refresh tokens — ever.
- Do not put draft contents in URL parameters.
- Do not use `localStorage` for sensitive data (drafts only; not OTPs, not tokens).
- Do not introduce a long-lived "remember me" cookie beyond Supabase's existing refresh-token lifetime — that's a separate identity-class change requiring D-decision.
- Do not break PNH-04 security headers.
- Do not name third-party services (Anthropic, OpenAI) in any user-facing copy — none should appear here, but if accidentally written, redact.

---

## Self-verification (the executor signs this off in the report)

- [ ] Token-refresh middleware deployed to all 10 web apps.
- [ ] Draft preservation wired into all 10 named feature surfaces.
- [ ] Multi-tab session consistency verified across 3+ tabs.
- [ ] `hc_session_state` cookie set + read consistently.
- [ ] Network-drop tolerance verified on at least one mutating route per app.
- [ ] 5 new observability events emitting.
- [ ] Owner-workspace session-health tile rendering.
- [ ] No PNH-04 baseline violations.
- [ ] No introduction of third-party session stores.
- [ ] Report written to `.codex-temp/v3-01-session-persistence/report.md`.
- [ ] Hand-off named: V3-02 (auth reliability).
