# Sign-in Security Alerts + Push Notification Engine — Spec

**Date:** 2026-06-05 · **Author:** Claude Opus 4.8 (ultracode, acting on owner delegation)
**Status:** Approved-by-delegation, building. **Money-grade** (account holdings → security-critical).

## Goal
When an account is accessed from a **new device or new location**, the owner of that account is reliably alerted across **three redundant channels (in-app · email · push)** and can act: *"Was this you?" → Yes (trust this device) / No (sign out everywhere + force password reset)*. Build a clean, reusable **push engine** (web + native) that plugs into the existing notification spine — so every future money alert (payouts, disputes, payment events) gets push for free.

## Locked decisions
- **Trigger:** new device **OR** new country (high-signal, low-noise; familiar sign-ins stay silent).
- **Channels:** email + in-app + push (redundant — no single channel failure loses a money-grade alert).
- **Response:** "Was this you?" Yes → trust device · No → authenticated secure flow (revoke all other sessions + force password reset).
- **Device identity:** signed, long-lived `hc_device` cookie (random id); missing/unknown = new device. New-country derived from `customer_security_log` history (already records country per sign-in). Cleared cookie → re-alert (errs safe).
- **Permission UX:** opt-in control on `/security` + a one-time gentle post-sign-in nudge; the real browser prompt only fires on explicit opt-in (never burn the permission).

## Architecture — push is a CHANNEL, not a fork
The notification spine already models it: `publishNotification` → `customer_notifications` + `notification_delivery_log` (`channel`, `provider`, `delivery_state: sent→delivered→seen→failed`). Push = `channel:"push"`, `provider:"web-push"|"expo"`, logged + state-tracked identically.

### Data model (new migration)
- `push_subscriptions`: `id, user_id, channel ('web'|'expo'), endpoint (web), p256dh, auth (web push keys), expo_token, device_id (↔ hc_device cookie), ua_summary, created_at, last_used_at, revoked_at, failure_count`. RLS: owner reads own; service-role writes. Unique on (user_id, endpoint) / (user_id, expo_token).
- `account_known_devices`: `id, user_id, device_id, ua_summary, first_country, first_seen_at, last_seen_at, trusted_at, revoked_at`. The "known device" memory for new-device detection + the Yes/No trust state.

### `packages/push` (new engine, aligned with `notifications`/`email`)
- `tokens.ts` — register/list/revoke/prune subscriptions (service-role).
- `web-push.ts` — VAPID dispatch via the `web-push` lib; map 404/410 → prune.
- `expo-push.ts` — Expo Push API dispatch; map `DeviceNotRegistered` → prune.
- `dispatch.ts` — `dispatchPush(userId, payload)`: fan out to active subs, log each to `notification_delivery_log`, prune dead. Idempotent (dedupe key), failure-counted.
- `vapid.ts`/config — server-only keys (`PUSH_VAPID_PUBLIC_KEY`, `PUSH_VAPID_PRIVATE_KEY`, `PUSH_VAPID_SUBJECT`); public key exposed to the client for `subscribe`.
- **Tests (node:test):** dispatch fan-out, dead-token pruning, idempotency, channel-log shape. Security/money logic is tested.

### Integration
`publishNotification` fans out to push when `severity ∈ {urgent, security}` (or explicit `push:true`), after the in-app insert, respecting prefs/quiet-hours. Best-effort: push failure never blocks the in-app/email record.

### Web push client (`apps/account` + shared `packages/ui`)
- Service worker (`/sw.js`): `push` → `showNotification`; `notificationclick` → focus/open the deep link.
- `usePushSubscription` hook + `<EnableSecurityAlerts>` control: `Notification.requestPermission` → `PushManager.subscribe(VAPID)` → POST to `/api/push/subscribe` (stores in `push_subscriptions` with the `hc_device` id).
- The gentle post-sign-in nudge (dismissible, once).

### Sign-in detection + alert (first consumer — `apps/account/app/auth/callback`)
1. Ensure `hc_device` cookie (set if absent).
2. New device = device_id not in `account_known_devices` (active). New country = country not seen in `customer_security_log` for this user.
3. If new device or new country AND not the first-ever sign-in (signup): `publishNotification({division:"security", severity:"security", eventType:"new_device_sign_in", title, body, deepLink:"/security?review=<eventId>", actionLabel:"Was this you?"})` (in-app + push) + send the security email.
4. Upsert `account_known_devices` (so the next sign-in is silent).

### Security email + endpoints
- Email (`packages/email`): "New sign-in to your Henry Onyx account" — device, location, time; **Yes, it was me** (signed link → trust) / **No, secure my account** (→ authenticated `/security/secure?...`). Provider-agnostic brand template.
- `GET /api/security/confirm?token=` (signed, single-use) → mark device trusted.
- `/security/secure` (authenticated) → revoke all other sessions (`auth.admin.signOut` scope) + force password reset email. "No" routes here.

## Reliability (money-grade)
Per-channel delivery logging + states; dead-token pruning; idempotency keyed on the sign-in event id (no double-fire on rapid re-auth); signed single-use email-action tokens (no destructive auto-execute from a forwarded email); three redundant channels.

## Build order
1. Migration (`push_subscriptions` + `account_known_devices`) + RLS.
2. `packages/push` engine + node tests.
3. Integrate push into `publishNotification`.
4. New-device detection + alert publish in the auth callback (+ device cookie helper).
5. Security email template + confirm/secure endpoints.
6. Web-push client (SW + hook + control + nudge) + `/api/push/subscribe`.
7. Wire the existing Expo token (super-app) into `push_subscriptions`.
8. Verify (tsc/lint/build/tests) + ship.

---

## As-built (final) — divergences from the design above, and why

Three deliberate changes during implementation, all in the direction of **tighter security** and **no information disclosure** (owner directives: "make the security very tight" · "don't leak sensitive info like cross-division / vendor names").

1. **No bearer token in the email URL — session-authenticated actions instead.**
   A signed action token in the email link is a credential at rest in an inbox and leaks into referrer headers (violates "no sensitive data in URLs"). Instead the email is a **deep-link notification** to the authenticated `/security?review=<eventId>` surface, and every state change is an **authenticated, same-origin POST** (the live session is the credential; SameSite cookies are the CSRF defense). The `action-token.ts` util built earlier was therefore **deleted** (no dead code). The destructive "secure" action consequently can never auto-fire from a forwarded one-click link — it requires the user's authenticated session, which is also the only context that can truly revoke every session.

2. **Registered event type, not a new string.** The publish uses the already-registered `auth.security.new_device` (severity `security` → qualifies for push fan-out) instead of an unregistered `new_device_sign_in`, which the publish validator's allowlist would have rejected. `division: "security"` (a first-class division) is used so nothing implies a cross-division structure to the user.

3. **"Secure my account" reuses the proven money-grade revoke.** `POST /api/security/secure` (authenticated, rate-limited) sends the standard recovery email (`resetPasswordForEmail` → `/reset-password`), forgets every recognised device, then `supabase.auth.signOut({ scope: "global" })` — the same global revoke `/api/security/sign-out-everywhere` already uses. (supabase-js `admin.signOut` takes a JWT, not a user id, so a session-scoped revoke is the only real path — which aligns with requiring authentication.)

### Surfaces shipped
- **Pure, tested logic:** `sign-in-evaluation.ts` (grace-window rollout protection), `device-cookie.ts` (signed cookie), `security-email-content.ts` (the email copy — **unit-tested against a vendor/architecture/IP denylist** so it can never disclose `supabase`/`cross division`/an IP/etc.). 23 account unit tests + 7 push tests, all green.
- **Orchestration:** `sign-in-alert.ts` runs in `after()` (zero added redirect latency) from both `auth/callback` and `auth/confirm` (genuine sign-in OTPs only). Three independently-isolated channels (in-app+push · security log · email); any one failing never blocks the others or the sign-in.
- **In-app review:** `/security` gains the priority "Was this you?" panel (`?review=<id>`) + a "Recognised devices" manager + a per-device push opt-in (`EnableSecurityAlerts`). All copy via `translateSurfaceLabel` (i18n gate clean).
- **Endpoints:** `POST /api/security/confirm` (trust the alerted device, by event), `POST /api/security/device` (trust/remove a device), `POST /api/security/secure` (secure account), `GET /api/push/public-key`, `POST /api/push/subscribe` (web cookie **or** native `Bearer`), `POST /api/push/unsubscribe`.
- **Native:** `super-app` gains `registerAndSyncPushToken()` (Expo token → `/api/push/subscribe` with the Supabase access token). The endpoint accepts both web and Expo. Remaining native follow-up (separate app/build): call `registerAndSyncPushToken()` in the app's post-login lifecycle.

### Env to activate push (web + native) — feature degrades safely until set
`PUSH_VAPID_PUBLIC_KEY`, `PUSH_VAPID_PRIVATE_KEY`, `PUSH_VAPID_SUBJECT` (account app). `SUPABASE_JWT_SECRET` (already present) signs the device cookie. Without VAPID, push is a no-op and email + in-app still deliver.
