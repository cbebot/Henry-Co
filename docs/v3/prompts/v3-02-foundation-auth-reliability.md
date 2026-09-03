# V3-02 — Foundation Lock: Auth Reliability

> **STATUS: SHIPPED — PR #158** (hardening follow-up **V3-02b** shipped as **PR #163**). Merged and certified on `main` within the Phase B Foundation Lock (CERTIFIED at V3-12, PR #168). The auth-reliability primitives below are live: `@henryco/auth/server` `requireSensitiveAction` / `withSensitiveAction` / `evaluateSensitiveActionGuard` + rate limiter, `@henryco/auth/client` `logoutEverywhere` / `clearHenryCoStorage` / `fetchWithSensitiveAction` / `SensitiveActionModalProvider`, server `role-status.ts`, and the OAuth error/link-intent cookies. This document is the elevated canonical spec and closure record. Residual coverage tracked under **Deferred / residual** (V3-02b extended logout-everywhere to the remaining public shells and stages the sensitive-action guard for KYC/password-change/delete-account routes as each lands).

**Pass ID:** V3-02  ·  **Phase:** B (Foundation Lock)  ·  **Pillar:** P12 (Global, Mobile, Observability), P7 (Trust, Safety, Compliance)
**Dependencies:** V3-01  ·  **Effort:** M  ·  **Parallel-safe:** N (blocks on V3-01)
**Owner gate:** none  ·  **Risk class:** Identity

---

## Role
You are the V3 Foundation engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass closes the **auth reliability** sub-bar of Foundation Lock: every OAuth path is verified, logout clears *everything*, the role chooser carries live badge counts, and a session-tampering / sensitive-action guard sits on every money- and identity-class route. Auth is the #1 trust surface — polish is trust. The line you must not cross: no new OAuth providers, no destructive shortcuts, no global reauth gate that breaks read-only browsing, and never `localStorage.clear()` (clear by HenryCo prefix only).

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/02-auth-reliability` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

Branch off `origin/main` after confirming V3-01 has merged (a parallel-session check first — the tree is shared).

## Audit summary
`@henryco/auth` ships extracted helpers; Supabase Auth backs every flow with Resend → Brevo email fallback behind an HMAC-verified auth hook. V3-01 added the `hc_session_state` cookie, the multi-tab broadcast channel (`SESSION_CHANNEL_NAME`), and the `/auth/reauth` round-trip — this pass builds on all three. Four gaps remain: (1) OAuth (Google/Apple) is enabled in Supabase but the app-level UX and error paths are unverified; (2) logout is incomplete — it does not provably clear cookies, prefixed `localStorage`/`sessionStorage`, IndexedDB, or Service Worker caches across tabs; (3) the role chooser shows no per-role unread/pending/last-visited signal; (4) sensitive routes (wallet transfer, KYC, password change, account deletion, role change) have no consistent re-auth + cookie-integrity + audit guard. This pass closes all four and publishes the `requireSensitiveAction` contract that V3-14/15/16 payment-authorization routes will consume.

## Mandatory scope

### S1 — OAuth UX hardening
Audit every enabled OAuth provider (Google, Apple). Confirm Supabase has each provider + correct redirect URLs (built from `@henryco/config` domain helpers, never literals). Harden the callback at `apps/account/app/api/auth/callback/route.ts`: user-cancel → `/auth/choose?error=cancelled&intent=oauth_cancel`; provider error → `/auth/choose?error=provider_error&detail=<sanitized>`; cookie-set failure → magic-link fallback. Account-linking: signing in with Google against an existing password account either auto-links with consent or surfaces a clear error (state carried in `oauth-link-intent` cookie). Each OAuth button shows the provider's official mark per brand guidelines. Post-success lands at the role-aware target (customer → account home, staff → staff HQ via `getStaffHqUrl()`, owner → owner workspace via `getHqUrl()`). Out of scope: adding new providers; restyling the chooser.

### S2 — Logout completeness
`packages/auth/src/client/logout-everywhere.ts` (`logoutEverywhere`) calls `supabase.auth.signOut()`, then `clearHenryCoStorage()` (`clear-henryco-storage.ts`, driven by the `known-storage.ts` prefix allowlist — `localStorage`/`sessionStorage` by HenryCo prefix, IndexedDB by known DB names, caches by name prefix), broadcasts `{ type: 'sign-out', reason }` over the shared channel, and redirects to `/auth/choose?signed_out=true` (via `getAccountUrl()`). Every "Sign out" control across the apps calls it. Tests: post-logout every HenryCo cookie is gone, every `henryco:`-prefixed storage key returns null, IndexedDB stores are deleted, and a new tab to a protected route redirects to the chooser. Never `localStorage.clear()`.

### S3 — Role-chooser badge counts
New route `apps/account/app/api/auth/role-status/route.ts` (backed by `packages/auth/src/server/role-status.ts`) returns `{ roles: [{ key, unreadCount, pendingActions, lastVisited }] }` for the authenticated user, derived from the notification + pending-action counts. The chooser at `apps/account/app/auth/choose/page.tsx` fetches on mount and renders per-role badges (e.g. owner "3 KYC submissions awaiting review"), updating live over the existing notification realtime channel. Single-role users skip the chooser (unchanged); this applies only when it would render. Never bypass `is_staff_in()` for role derivation.

### S4 — Sensitive-action guard
`packages/auth/src/server/sensitive-action-guard.ts` exposes `evaluateSensitiveActionGuard()`, the `withSensitiveAction()` wrapper, and `requireSensitiveAction()`. It reads the Supabase session, verifies the `hc_session_state` cookie's signed subject matches (`verify-supabase-session.ts`), and checks a recent-reauth cookie (`reauth-cookie.ts`, 5-minute validity). On absent/stale reauth it returns 401 with `WWW-Authenticate: SensitiveActionReauth` + `X-HenryCo-Reauth-Intent: <action>`; on success it writes `@henryco/observability/audit-log` `{ action, actor, ip, ua, outcome, reauthAt }`. A per-user rate limiter (`sensitive-action-rate-limit.ts`, max 5 attempts / 5 min) blocks brute force. Wire into: `apps/account/app/api/wallet/transfer/*`, `.../api/verification/*` (KYC), `.../api/auth/change-password/*`, `.../api/auth/delete-account/*`, `.../api/profile/role/*`, `.../api/security/*`, and it is the contract V3-14/15/16 payment-authorization routes consume. Client: `fetchWithSensitiveAction` + `SensitiveActionModalProvider` / `useSensitiveAction` (`client/sensitive-action-modal.tsx`) — on 401 + `SensitiveActionReauth`, render "Confirm your identity to continue" (password / magic-link / biometric on Expo), refresh the reauth cookie, retry the action.

### S5 — Magic-link UX
Email arrives ≤ 30 s (Resend rate-limit + Brevo fallback). Link is single-use, 15-minute expiry (Supabase default — document). Success → role-aware redirect + "Welcome back". Expired → "Magic link expired. Send a new one?" with a resend button. Already-used → "This link was used. Sign in again."

### S6 — Password reset
Reset email ≤ 30 s; link valid 30 min. Form: confirm twice + strength meter + show-password toggle, fully a11y-tested. After reset: auto sign-in + redirect + audit-log entry.

### S7 — Sign out everywhere
`apps/account/app/security/page.tsx` gains a "Sign out everywhere" control calling `auth.signOut({ scope: 'global' })` (invalidates all refresh tokens) + audit-log entry, then signs out the current device via `logoutEverywhere` (S2).

### S8 — Telemetry
Reuse `henry.auth.session.started` / `.ended` / `henry.auth.signin.failed`. Add `henry.auth.oauth.completed`, `henry.auth.oauth.failed` (sanitized reason), `henry.auth.logout.everywhere`, `henry.auth.sensitive_action.reauth_required`, `henry.auth.sensitive_action.reauth_succeeded`, `henry.auth.role_chooser.viewed` (role count). Extend V3-01's owner tile with daily sign-in success rate, OAuth provider breakdown, and sensitive-action reauth rate.

## Out of scope
- New OAuth providers; web biometric (WebAuthn) — V4+.
- MFA enrollment / phone-number linking — V3-24 (KYC).
- Session-cookie redesign (shape is fine).
- Threading `logoutEverywhere` through the remaining public shells — **V3-02b** (shipped, PR #163).

## Dependencies
Depends on: **V3-01** (uses `hc_session_state`, the broadcast channel, and the reauth screen). Blocks: **V3-04** (deep-link auth round-trip), **V3-76** (public-API auth scopes assume this role + sensitive-action model).

## Inheritance
`@henryco/auth` (extend) · `@henryco/observability/audit-log` · `@henryco/ui` modal + toast · existing `/auth/choose` + `/auth/callback` (extend, not replace) · notification realtime channel (live badges) · V3-01's session-state cookie + broadcast channel + reauth screen · `@henryco/config` domain helpers for every redirect URL.

## Implementation requirements

### Files
`packages/auth/src/client/`: `logout-everywhere.ts`, `clear-henryco-storage.ts`, `known-storage.ts`, `sensitive-action-modal.tsx`, `index.ts`. `packages/auth/src/server/`: `sensitive-action-guard.ts`, `sensitive-action-rate-limit.ts`, `role-status.ts`, `reauth-cookie.ts`, `verify-supabase-session.ts`, `oauth-error-cookie.ts`, `oauth-link-intent.ts`. New routes: `apps/account/app/api/auth/role-status/route.ts`. UI: `apps/account/app/auth/choose/page.tsx` (badges), `apps/account/app/security/page.tsx` ("Sign out everywhere"). Mount `SensitiveActionModalProvider` in the account layout. Tests: units for logout-everywhere, clear-henryco-storage, sensitive-action-guard, role-status; integration for OAuth callback error paths; e2e for chooser badges.

### Trust / safety / compliance
Sensitive-action guard writes an audit-log entry on every gated action. The `WWW-Authenticate: SensitiveActionReauth` extension follows RFC 7235 extensibility (document in the OpenAPI spec when V3-76 lands). OAuth marks per provider brand guidelines (`apps/account/public/assets/oauth/*`). `logoutEverywhere` clears client storage but never server data (account deletion is V3-93). Reauth modal is rate-limited (max 5/5 min/user). Error copy stays generic + actionable — never leak provider internals.

### Mobile + desktop parity
Web: full S1–S8. The sensitive-action modal is responsive — bottom-sheet on mobile, modal on desktop. Native biometric reauth is V3-87.

### i18n
All new strings (OAuth error messages, sensitive-action modal copy, chooser badges, logout/welcome toasts) flow through `@henryco/i18n` under `surface:auth-reliability`. Populate en-US; runtime DeepL fills the other 11 locales. No hardcoded user-facing text.

### Brand & design system
Brand strings ("Henry Onyx") + division labels from `@henryco/config`; legal/compliance contexts use "Henry Onyx Limited". Chooser, security page, and reauth modal use locked tokens (`--site-*` / `--accent`, Fraunces display), light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed. Every redirect/callback URL via the config domain helpers — zero literal domains.

## Validation gates
1. `pnpm lint` / `pnpm typecheck` / tests / `pnpm ci:validate` build green. 2. `pnpm i18n:check`. 3. `pnpm a11y` on `/auth/choose`, `/auth/reauth`, `/account/security`, and the sensitive-action modal (WCAG AA). 4. Security-headers gate preserved. 5. OAuth smoke: Google + Apple sign-in end-to-end. 6. Logout-everywhere smoke: sign in on 3 sessions, sign out everywhere from one, confirm the others sign out on next interaction. 7. Sensitive-action smoke: attempt a wallet transfer without recent reauth → modal → proceeds after reauth → audit-log row written. 8. Role-chooser badge smoke with a multi-role fixture user (counts correct). 9. Real-browser light + dark + mobile + desktop on chooser/security/modal.

## Deployment gate
All gates green; preview-smoke evidence in `.codex-temp/v3-02-auth-reliability/preview-smoke.md`; owner reviews the PR; squash-merge to `main`; 48-hour soak (owner reviews sign-in success rate + reauth rate on the tile). The residual 48-h soak was owner-waived after green through +6h (see memory `project_henryco_v3_02_auth_reliability.md`).

## Final report contract
`.codex-temp/v3-02-auth-reliability/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env (audit-log writes to the existing `audit_log_v2` table — no new schema) · validation evidence · smoke · live verification (48-h soak) · telemetry baseline (6 new events) · deferred items (the V3-02b diff template — marketplace wiring is the reference) · pass-closure assertion. The report's §8 item 2 is the load-bearing V3-02b handoff.

## Deferred / residual (post-ship, this pass is merged)
- **V3-02b (shipped, PR #163):** thread `onSignOut={logoutEverywhere}` through the remaining public-shell hosts (care, jobs, learn, logistics, property, studio public chromes + hub-public); marketplace was the template. Stage `requireSensitiveAction` for the KYC-submission, future password-change, and delete-account routes as each lands.
- Native biometric reauth → V3-87.

## Self-verification
- [ ] S1 OAuth verified end-to-end for every enabled provider; all callback error paths land on the chooser with sanitized reasons.
- [ ] S2 `logoutEverywhere` wired across all apps; provably clears cookies + prefixed storage + IndexedDB + caches; never `localStorage.clear()`.
- [ ] S3 role-chooser badges render for multi-role users and update live; `is_staff_in()` not bypassed.
- [ ] S4 `requireSensitiveAction` live on the 6+ named route groups; audit-log row + rate limiter verified; `fetchWithSensitiveAction` modal retries the action.
- [ ] S5/S6 magic-link + password-reset meet the timing + UX bar; reset auto-signs-in with an audit entry.
- [ ] S7 "Sign out everywhere" invalidates all refresh tokens + audit-logs, then signs out the current device.
- [ ] S8 the 6 new telemetry events emit; owner tile shows sign-in + reauth metrics.
- [ ] Security-headers baseline intact; no provider name leaked in error copy.
- [ ] All new strings under `surface:auth-reliability`; brand + domains sourced from `@henryco/config`.
- [ ] Report written (incl. the V3-02b handoff); hand-off named: V3-03 (notification/message states) and V3-04 (deep links).
