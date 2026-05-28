# V3-02 — Foundation: Auth Reliability

**Pass ID:** V3-02
**Phase:** B (FOUNDATION LOCK)
**Pillar:** P12 (Global, Mobile, Observability), P7 (Trust, Safety, Compliance)
**Dependencies:** V3-01 (session persistence) must close first
**Effort:** M (1–2 weeks)
**Parallel-safe:** NO (depends on V3-01)
**Owner gate:** None at start
**Risk class:** Identity-touching

---

## Role

You are the V3 Foundation engineer for HenryCo. You execute exactly this one pass, then stop and report.

This pass closes the **auth reliability** sub-bar of FOUNDATION LOCK. Authentication must be robust: OAuth UX is verified, logout is complete (clears everything), role chooser shows badge counts where useful, session-tampering defense is on every sensitive route, and KYC gating is consistent across the platform.

You produce code, migrations (if needed), tests, and a final report.

---

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch for this pass | `v3/02-auth-reliability` |
| Deploy | Vercel (10 web projects) |
| Backend | Supabase (single project, multi-app) |
| Auth | Supabase Auth via `@henryco/auth` |
| OS context for executor | Windows + bash; pnpm 9.15.5; Node 24.x |

Create branch from `main` after confirming V3-01 has merged.

---

## Audit summary (lifted from AUDIT-BASELINE.md §3.2)

> ### 3.2 Auth reliability
> - **Solid:** Resend → Brevo fallback for auth email; HMAC-verified auth hook
> - **Solid:** `@henryco/auth` package with extracted helpers
> - **Partial:** OAuth (Google/Apple/etc.) — Supabase has built-in but the app-level UX is unverified
> - **Gap:** logout completeness — does logout clear all caches, all tabs, all stored drafts, all IndexedDB?
> - **Gap:** role-chooser badge counts (V3-BACKLOG I1)
> - **Gap:** session-tampering defense (signed-cookie check on sensitive paths)

Owner anti-patterns to preserve from `feedback_*` memories:
- Polish is trust — auth flows are the #1 trust surface.
- Do not introduce destructive operations as shortcuts (no `git reset --hard` style auth fixes).

---

## Mandatory scope (what is in)

### S1 — OAuth UX hardening

Audit every OAuth path (Google, Apple, GitHub if enabled). For each:

- Confirm Supabase Auth project has the provider enabled + correct redirect URLs.
- Confirm the OAuth callback route (`apps/account/app/api/auth/callback/route.ts`) handles all error cases:
  - User cancels in provider → redirect to `/auth/choose?error=cancelled&intent=oauth_cancel`
  - Provider returns error → redirect to `/auth/choose?error=provider_error&detail=<sanitized>`
  - Cookie set fails → fallback to magic-link path
- Confirm OAuth account-linking behavior: signing in with Google when an email already exists with password-based auth must either auto-link (with consent) or surface a clear error.
- UI: every OAuth button shows the provider name + their official mark per their brand guidelines.
- After successful OAuth sign-in, the user lands at the role-aware redirect target (account customer → `/account`; staff → `/staffhq`; owner → `/owner`).

Out of scope:
- Adding NEW OAuth providers (only audit + harden existing).
- Changing the auth chooser visual design (V3 PASS 25 ships typography polish; preserve).

### S2 — Logout completeness

A `logout` action must clear:

- Supabase Auth session (`signOut()`)
- All cookies in `.henrycogroup.com` scope (`hc_*` cookies including `hc_dash_pref`, `hc_session_state`)
- `localStorage` entries scoped to HenryCo (`localStorage.clear()` is too aggressive — clear by prefix `henryco:` only)
- `sessionStorage` entries scoped to HenryCo
- IndexedDB stores that hold HenryCo data (chat-composer drafts, branded-document caches, intelligence event queue)
- Service Worker caches scoped to HenryCo (use `caches.keys()` + filter)
- BroadcastChannel sign-out broadcast (already in V3-01)

Implementation:
- New helper `@henryco/auth/client/logout-everywhere.ts` that:
  - Calls `supabase.auth.signOut()`
  - Calls `clearHenryCoStorage()` (a single function that handles localStorage + sessionStorage + IndexedDB + caches by HenryCo-prefix scope)
  - Broadcasts sign-out
  - Redirects to `/auth/choose?signed_out=true`
- Wire this helper from every "Sign out" button across all apps.

Tests:
- After logout, every HenryCo cookie is gone (verify via `document.cookie`).
- After logout, every `localStorage.getItem('henryco:*')` returns null.
- After logout, IndexedDB.deleteDatabase ran for HenryCo stores.
- After logout, opening a new tab to a protected route redirects to `/auth/choose`.

### S3 — Role chooser badge counts

The auth chooser screen (`/auth/choose`) shows per-role badges:

- For users with multiple roles (e.g., customer + provider + owner), each role tile shows:
  - Unread notification count for that role's surface
  - Pending action count (e.g., owner has "3 KYC submissions awaiting review")
  - Last visited timestamp ("Last visited 2 hours ago")

Implementation:
- New API route `apps/account/app/api/auth/role-status/route.ts` — returns `{ roles: [{ key, unreadCount, pendingActions, lastVisited }] }` for the authenticated user.
- The role chooser fetches this on mount; renders badges.
- The badges respect existing notification realtime channel — counts update live.

If the user has only one role, the chooser is skipped per existing behavior; this change applies only when chooser would render.

### S4 — Session-tampering defense on sensitive routes

Every "sensitive action" route (wallet transfer, KYC submission, password change, payment authorization, account deletion, role/membership change) requires:

- Re-authentication within the last 5 minutes OR an explicit re-auth challenge before the action proceeds.
- Cookie-integrity check: server verifies the `hc_session_state` cookie's signed HMAC matches the Supabase Auth subject.
- Audit log entry: `@henryco/observability/audit-log` writes `{ action, actor, ip, ua, outcome, reauthAt }`.

Implementation:
- New server helper `@henryco/auth/server/sensitive-action-guard.ts` — middleware function:
  - Reads Supabase session.
  - Reads `hc_last_reauth` cookie (timestamp; 5-min validity).
  - If absent or stale, returns 401 with `WWW-Authenticate: SensitiveActionReauth` + `X-HenryCo-Reauth-Intent: <action-name>` header.
  - On success, writes audit log entry.
- Wire into the following routes (existing kyc-sensitive-action-gating logic is partial — this generalizes it):
  - `apps/account/app/api/wallet/transfer/*`
  - `apps/account/app/api/verification/*` (KYC)
  - `apps/account/app/api/auth/change-password/*`
  - `apps/account/app/api/auth/delete-account/*`
  - `apps/account/app/api/profile/role/*`
  - `apps/account/app/api/security/*`
  - any payment-authorization route created later in V3-14/15/16 (this is the contract they consume)

Client-side: when 401 + `SensitiveActionReauth` appears, the page surfaces a small modal "Confirm your identity to continue" with password OR magic-link OR biometric (if Expo super-app). On success, `hc_last_reauth` cookie is refreshed and the action retries.

### S5 — Magic-link UX hardening

The magic-link path:
- Email arrives within 30 seconds (verify Resend rate-limit + Brevo fallback).
- Link expires in 15 minutes (Supabase default; document).
- Link is single-use (Supabase default; document).
- After click, the user lands at the role-aware redirect with a "Welcome back" toast.
- If link expired, show "Magic link expired. Send a new one?" with a button.
- If link already used, show "This link was used. Sign in again."

### S6 — Password reset flow

- Reset email arrives within 30 seconds.
- Reset link valid for 30 minutes.
- Reset form: new password confirmed twice; strength meter; "show password" toggle; accessibility-tested.
- After reset, automatic sign-in + redirect.
- Audit log entry.

### S7 — Logout from every-device

Account `/security` screen has a "Sign out everywhere" button:
- Calls Supabase `auth.signOut({ scope: 'global' })` — invalidates all refresh tokens.
- Clears server-side session cache if any.
- Audit log entry.
- After completion, current device signs out (via S2 logout-everywhere).

### S8 — Telemetry

Existing event names from `@henryco/intelligence` apply:
- `henry.auth.session.started`
- `henry.auth.session.ended`
- `henry.auth.signin.failed`

Add:
- `henry.auth.oauth.completed`
- `henry.auth.oauth.failed` with sanitized reason
- `henry.auth.logout.everywhere`
- `henry.auth.sensitive_action.reauth_required`
- `henry.auth.sensitive_action.reauth_succeeded`
- `henry.auth.role_chooser.viewed` (with role count)

Owner-workspace tile (extends V3-01's session-health tile): show daily sign-in success rate, OAuth provider breakdown, sensitive-action reauth rate.

---

## Out of scope

- Adding new OAuth providers (Apple/Google/GitHub only; no new providers).
- Biometric auth on web (Web Authentication API is V4+).
- MFA enrollment (V3-24 KYC may surface this).
- Account-linking UX beyond OAuth (e.g., link your phone number for SMS-OTP — V3-24).
- Session-cookie redesign (the cookie shape is fine).

---

## Dependencies

Depends on:
- V3-01 (session persistence) — uses `hc_session_state` cookie + multi-tab broadcast.

Blocks:
- V3-04 (deep links) — auth round-trip preservation is the foundation for deep-link round-trips.
- V3-76 (public API foundation) — auth scopes assume role + sensitive-action model.

---

## Inheritance (reuse without redefining)

- `@henryco/auth` package — extend.
- `@henryco/observability/audit-log` — use for sensitive-action logging.
- `@henryco/ui` — existing modal + toast primitives.
- Existing `/auth/choose` + `/auth/callback` routes — extend, not replace.
- Existing notification realtime channel — use for role-chooser badge live updates.

---

## Implementation requirements

### File-level deliverables

**Package changes** (`packages/auth/src/`):
- `client/logout-everywhere.ts` (new)
- `client/clear-henryco-storage.ts` (new) — helper used by logout-everywhere
- `server/sensitive-action-guard.ts` (new) — middleware
- `server/role-status.ts` (new) — derives role badges from notification + action counts
- `client/sensitive-action-modal.tsx` (new) — the reauth modal component
- `index.ts` — export new surfaces

**Per-app changes** (10 web apps):
- Every "Sign out" button replaced with the `logout-everywhere` helper call. Grep for `signOut`, `auth.signOut`, "Sign out" — wire all of them.
- The sensitive-action middleware is wired in each app's relevant routes (account is the primary host of these routes; others reference via API).

**New routes:**
- `apps/account/app/api/auth/role-status/route.ts` (new) — S3 endpoint
- `apps/account/app/security/sign-out-everywhere/route.ts` (new) — S7 endpoint

**UI changes:**
- `apps/account/app/auth/choose/page.tsx` — extend with badge rendering for multi-role users
- `apps/account/app/security/page.tsx` — add "Sign out everywhere" button

**Tests:**
- Unit tests for `logout-everywhere`, `clear-henryco-storage`, `sensitive-action-guard`, `role-status`
- Integration tests for the OAuth callback error paths
- e2e smoke for the auth chooser badge rendering

### Migration changes

None expected. Audit-log writes go to existing `audit_log_v2` table per DASH-9.

### Integration changes

None. Resend + Brevo + Supabase preserved.

### Trust / safety / compliance requirements

- Sensitive-action middleware emits audit log entries — ANTI-CLONE Principle 12.
- `WWW-Authenticate: SensitiveActionReauth` header is non-standard but follows RFC 7235 extensibility — document in OpenAPI spec when V3-76 (API foundation) lands.
- OAuth provider mark usage per provider brand guidelines (Google logo, Apple logo) — confirm with `apps/account/public/assets/oauth/*`.
- Logout-everywhere clears storage but does NOT clear server-side data — users can't "delete account by logout" (that's a different action, V3-93 privacy data rights).
- Sensitive-action reauth respects rate-limiting — don't allow brute-force via the modal (max 5 attempts per 5 min per user).

### Mobile + desktop parity

- Web: full S1–S8 implementation.
- Expo: out-of-scope this pass; native biometric reauth is V3-87.
- Sensitive-action modal is responsive — sheet UI on mobile, modal on desktop.

### i18n requirement

- All new user-facing strings (OAuth error messages, sensitive-action modal copy, role chooser badges, logout success toast) go through `@henryco/i18n` surface labels.
- Namespace: `surface:auth-reliability`.
- Populate en-US in this pass; runtime DeepL fills the 11 other locales.

---

## Validation gates

1. **Lint / typecheck / tests / build** — standard CI.
2. **i18n check** — new strings registered.
3. **A11y** — `/auth/choose`, `/auth/reauth` (from V3-01), `/account/security`, sensitive-action modal — all WCAG AA.
4. **PNH-04** — security headers preserved.
5. **OAuth smoke** — sign in with Google + sign in with Apple — both succeed end-to-end.
6. **Logout-everywhere smoke** — sign in on 3 devices; sign out everywhere on 1; confirm other 2 sign-out on next interaction.
7. **Sensitive-action smoke** — attempt wallet transfer without recent reauth; confirm modal appears; confirm action proceeds after reauth.
8. **Role-chooser badge smoke** — create a multi-role test user; confirm badges render with correct counts.

### Live verification (after merge)

- 48-hour soak.
- Owner reviews the session-health tile + new auth-reliability metrics.
- Run a quarterly "auth-failure" tabletop: simulated provider outage; confirm fallback paths function.

---

## Deployment gate

- All validation gates passing.
- Preview-deploy smoke evidence captured in `.codex-temp/v3-02/preview-smoke.md`.
- Owner reviews PR.
- Merge to `main`.
- 48-hour soak.

---

## Final report contract

Write `.codex-temp/v3-02-auth-reliability/report.md` covering:

1. Executive summary
2. Files changed
3. Migration / RLS / env confirmation (none expected)
4. Validation gate evidence
5. Smoke verification evidence
6. Live verification evidence
7. Telemetry baseline (5 new events)
8. Deferred items
9. Pass closure assertion

---

## Anti-patterns this pass must avoid

- Do not log out users without warning when token expires mid-action — that's V3-01's job to handle gracefully.
- Do not introduce a global "reauth-everywhere" gate that breaks read-only browsing — sensitive-action guard is per-route.
- Do not bypass `is_staff_in()` for role-status — preserve existing role-membership model.
- Do not use `localStorage.clear()` — only clear by HenryCo prefix.
- Do not store OAuth provider tokens in localStorage — Supabase Auth handles them.
- Do not name OAuth providers in error toasts beyond brand mark display — keep error copy generic + actionable.

---

## Self-verification

- [ ] OAuth flows verified end-to-end for every enabled provider.
- [ ] Logout-everywhere wired across all 10 apps.
- [ ] Role chooser badges render for multi-role users.
- [ ] Sensitive-action guard live on 7+ named routes.
- [ ] Magic-link + password-reset flows pass timing + UX bar.
- [ ] "Sign out everywhere" wired and tested.
- [ ] 6 new observability events emitting.
- [ ] PNH-04 baseline preserved.
- [ ] Report written.
- [ ] Hand-off named: V3-03 (notification/message states) and V3-04 (deep links).
