# V3 Audit — Foundation Base Lock (deep dive of §3)

**Pass:** V3 Strategic Architect (Phase A · deep audit)
**Compiled:** 2026-05-21
**Author:** Claude · Opus 4.7 (1M context) · maximum effort
**Status:** Authoritative reference for V3-01..V3-12 Foundation Lock passes. Extends `AUDIT-BASELINE.md §3`.

---

This document extends `docs/v3/AUDIT-BASELINE.md §3` (Foundation Lock state — the owner's #1 priority) with per-area file-cited evidence. Where the baseline summarises the foundation gap surface in two paragraphs per area, this document maps it to specific files, line numbers, migrations, and packages so V3-01..V3-12 prompt authors can open the right files on day one and know whether a claim is solid, partial, or unverified. Every "Solid" / "Partial-Gap" claim cites a file path; claims without verifiable file evidence are explicitly marked `needs verification`. Cross-references to passes follow the convention of `docs/v3/PASS-REGISTER.md`.

---

## 3.1 Session persistence

### Solid

- `@henryco/auth` package extracted with split surfaces for cookies/owner/server/staff/viewer:
  - `packages/auth/src/cookies.ts:25-77` — `readDashboardPreference`, `setDashboardPreference`, `clearDashboardPreference`. Cookie name `hc_dash_pref` defined at `packages/auth/src/types.ts:155`. 90-day max-age constant at `packages/auth/src/cookies.ts:17`.
  - `packages/auth/src/server.ts:179-257` — `decideDashboardResolution()` is a pure function over `AccessSnapshot`, unit-testable without Supabase.
  - `packages/auth/src/server.ts:267-285` — `resolveUserDashboard()` reads the snapshot then defers to the pure decision function.
  - `packages/auth/src/viewer.ts:83-156` — `readAccessSnapshot()` does three parallel Supabase reads (profile, owner_profiles, per-division memberships) with normalised-email fallback.
  - `packages/auth/src/viewer.ts:284-351` — `requireUnifiedViewer()` reads the user from the `x-supabase-user` header injected by middleware.
- Cross-subdomain SSO via `.henrycogroup.com` cookies — set in `packages/auth/src/cookies.ts:50-59` (`domain: '.${baseDomain}'`).
- The `hc_dash_pref` value space is narrow and validated on read (`packages/auth/src/cookies.ts:28-33` accepts only `customer | staff | owner`).
- Trusted-redirect normalisation rejects non-HenryCo hosts: `packages/config/urls.ts:27-65` — `normalizeTrustedRedirect()` collapses to `/` when the host doesn't end with `.henrycogroup.com` (or the local-host suffix).
- Logout signs out globally (`scope: 'global'`) AND clears the preference cookie on the apex domain: `apps/account/app/api/auth/logout/route.ts:49-58` (POST), `:89-101` (GET fallback for chooser anchor).
- Security event logged on every sign-out: `apps/account/app/api/auth/logout/route.ts:35-47` and `:74-86` write `account_sign_out` to the security-events log with ip/ua/location.

### Partial / Gap

- **`hc_dash_pref` is the only "remember-where-I-was" surface.** It carries dashboard preference (customer/staff/owner) but no route preference, no surface preference, and no scroll position. There is no broader "resume where you left off" cookie. Reference: only callers of `setDashboardPreference()` are the chooser POST handler (per the file comment at `packages/auth/src/cookies.ts:37-47`) and the IdentityBar role-switcher — no per-route resume.
- **Token-expiry mid-action handling is not centralised.** `apps/account/app/api/auth/logout/route.ts` is the only path that runs end-to-end token state through observability. There is no shared client-side "session expired, save draft + redirect with `next=`" boundary; individual call sites must each catch 401 and react.
  - `needs verification`: per-route 401 handling across `apps/*/components/**/Form*.tsx` is not centrally inventoried. The `redirect(getAccountUrl('/login'))` pattern (`packages/auth/src/viewer.ts:305, 317, 321`) covers server-component gates only.
- **Multi-tab session consistency is unverified.** No `BroadcastChannel` listener, no `storage` event listener for cross-tab sign-out propagation in `packages/ui/src/public-shell/use-public-session.tsx` or elsewhere.
  - Search confirms: `Grep "BroadcastChannel|storage.*event"` returns zero matches in `apps/account` and `packages/ui` (`needs verification` only because the search must extend to all 10 apps; the negative signal is strong).
- **Long-form draft preservation is not modelled.** No `customer_form_drafts` table, no `apps/*/lib/draft-store.ts`. A user filling a property listing form whose Supabase token expires mid-submit will lose the draft.
- **OAuth lane is unverified at the app level.** Supabase Auth supports OAuth providers, but the chooser screen at `apps/account/app/auth/choose/` and the login form at `apps/account/components/auth/LoginForm.tsx` do not expose verified Google/Apple buttons in source — `needs verification` of whether OAuth callback flows preserve `next=`.
- **`hc_dash_pref` does not survive a hard `.henrycogroup.com` cookie wipe.** No backing row in `profiles` or a session metadata table — the cookie is the only ledger.

### Recommended V3 passes

- **V3-01 foundation-session-persistence** (`docs/v3/prompts/v3-01-foundation-session-persistence.md`) — Token-expiry mid-action handling, multi-tab consistency, draft preservation.
- **V3-02 foundation-auth-reliability** (`docs/v3/prompts/v3-02-foundation-auth-reliability.md`) — OAuth UX, logout completeness, session-tampering defense (depends on V3-01).

---

## 3.2 Auth reliability

### Solid

- Resend → Brevo SMTP fallback for auth email: PR #5 per `AUDIT-BASELINE.md:80` and the migration history. The fallback target is configured in env (`needs verification` of exact env var names — only `AUDIT-BASELINE.md §1.4` and the integration table cite Resend+Brevo).
- HMAC-verified auth email hook: per `AUDIT-BASELINE.md:109`. The verification helper is `apps/account/app/api/webhooks/account/...` (`needs verification` of exact file path; integration-key doc may name the receiver).
- Signup rate limit (PNH-04): exists per `apps/account/app/api/auth/signup/route.ts` (V3-BACKLOG-FROM-V2 §A/§B references).
- Trusted-redirect normalisation already prevents open-redirect on `next=`: `packages/config/urls.ts:27-65`. Both `normalizeTrustedRedirect` and `resolveTrustedRedirect` enforce HenryCo host suffix and reject `//evil.com`, `data:`, `javascript:` patterns. Used by `apps/account/components/auth/SignupForm.tsx`, `apps/account/components/auth/LoginForm.tsx`, `apps/account/app/auth/verified/page.tsx`, `apps/account/app/auth/confirm/route.ts`, `apps/account/app/auth/choose/page.tsx`, `apps/account/app/auth/callback/route.ts`, `apps/account/app/api/auth/signup/route.ts`.
- Notification deep-link safety mirror runs on the client too: `packages/notifications-ui/src/deep-link.ts:19-48` — `isSafeNotificationDeepLink()` validates relative + absolute URLs against the same HenryCo host suffix list.
- Logout writes a global sign-out + clears `hc_dash_pref` on the apex (`apps/account/app/api/auth/logout/route.ts:49-58, 89-101`).
- Role chooser exists at `apps/account/app/auth/choose/` and uses the same `decideDashboardResolution()` the resolver uses (`packages/auth/src/server.ts:319-327` — `loadDashboardOptions` shared between chooser POST and IdentityBar dropdown).
- D8 RLS hot patch shipped 2026-05-09: `apps/hub/supabase/migrations/20260509120000_v2_closure_d8_rls_hot_patch.sql:1-50` — enables RLS + revokes anon grants on wallets, wallet_transactions, care_pricing_items, care_site_settings.
- DB-level auth predicate `is_staff_in()` lives in `apps/hub/supabase/migrations/20260502120000_staff_notifications_audience.sql` (referenced at `packages/auth/src/viewer.ts:23-28`). TS-side mirror is `packages/auth/src/staff.ts:128-142` (`hasStaffAccessIn`).

### Partial / Gap

- **Logout completeness is partial.** `apps/account/app/api/auth/logout/route.ts:49` calls `supabase.auth.signOut({ scope: 'global' })`, which invalidates the refresh token server-side; the response then clears `hc_dash_pref` (`:58`). But it does NOT:
  - Broadcast to other open tabs (no `BroadcastChannel` post in this file).
  - Clear browser IndexedDB / localStorage caches (no `localStorage.clear()` or per-app cache wipe).
  - Tear down OneSignal push subscriptions (the SW survives logout). `apps/hub/public/OneSignalSDKWorker.js` is the only worker referenced in the rewrites at `apps/hub/vercel.json` (search for `OneSignalSDKWorker.js`).
  - Reset `@henryco/intelligence` feature-flag side effects (per `docs/intelligence-rollout-status.md` line 39-44 — feature flags read from env, not session, so this is fine; but per-user intelligence event ingest may continue if a worker holds a stale token).
- **OAuth UX is unverified.** The repo does not surface OAuth provider buttons in source for `apps/account/components/auth/LoginForm.tsx` (`needs verification`).
- **Role chooser badge counts are missing (V3-BACKLOG I1).** The chooser surfaces lanes from `buildDashboardOptions()` (`packages/auth/src/server.ts:108-149`) but does not surface unread/queue counts per lane. The IdentityBar dropdown is the same shape — also no counts.
- **Session-tampering defense on sensitive paths is rules-based only.** The pattern relies on Supabase's signed JWT + the RLS layer. There is no signed-cookie HMAC ledger on routes like `/wallet/withdrawals/request`, `/verify`, `/api/wallet/withdrawal/request` (`apps/account/app/api/wallet/withdrawal/request/route.ts` per `docs/kyc-sensitive-action-gating.md:14-21`); enforcement relies on `requireAccountUser()` + KYC gate.
- **WhatsApp webhooks across care/property/studio still need HMAC.** Per V3-BACKLOG-FROM-V2 B1, the secret `WHATSAPP_APP_SECRET` and the verifier are not yet provisioned end-to-end. `needs verification` of the current state of `apps/care/app/api/webhooks/whatsapp/route.ts`, `apps/property/app/api/webhooks/whatsapp/route.ts`, `apps/studio/app/api/webhooks/whatsapp/route.ts`.
- **Signed-cookie defense on sensitive paths is not modelled.** Routes that mutate financial/identity state rely on Supabase session presence + KYC gate. There is no anti-CSRF token, no double-submit cookie pattern visible in `apps/account/app/api/wallet/`.
- **`@henryco/observability` instrumentation is partially adopted.** Only 3 of 10 apps have instrumentation files:
  - Confirmed present: `apps/account/instrumentation.ts`, `apps/account/instrumentation-client.ts`, `apps/hub/instrumentation.ts`, `apps/hub/instrumentation-client.ts`, `apps/staff/instrumentation.ts`, `apps/staff/instrumentation-client.ts`.
  - Confirmed absent: `apps/care/`, `apps/jobs/`, `apps/learn/`, `apps/logistics/`, `apps/marketplace/`, `apps/property/`, `apps/studio/` (no `instrumentation*.ts` files found).
  - Implication: Sentry errors on the 7 customer-facing public apps are not captured at the route layer. `AUDIT-BASELINE.md:221` flagged this as a gap; this audit confirms it as concretely as the file system permits.

### Recommended V3 passes

- **V3-02 foundation-auth-reliability** — OAuth UX hardening, logout completeness (IndexedDB/localStorage/cross-tab), role-chooser badges, session-tampering defense.
- **V3-10 foundation-logs-states-fallbacks** — observability adoption inventory across the 7 untouched apps (depends on the auth-error reporting boundary).
- **V3-24 identity-kyc-vendor-integration** (Phase C) — picks up the KYC gate hardening for the sensitive actions documented in `docs/kyc-sensitive-action-gating.md` once the foundation closes.

---

## 3.3 Notifications & message states

### Solid

- `customer_notifications` schema has full read state: `apps/hub/supabase/migrations/20260403183000_account_integration_hardening.sql:280-288` adds `read_at` + the `is_read=true → read_at=created_at` backfill on existing rows.
- `customer_notifications` enabled on Supabase Realtime publication: `apps/hub/supabase/migrations/20260501130000_notification_realtime_publication.sql:21-43` — idempotently adds the table to `supabase_realtime` publication and verifies RLS isolation at `:46-50`.
- Staff audience model has full read state: `apps/hub/supabase/migrations/20260502120000_staff_notifications_audience.sql:217-218` — `staff_notification_states` defines `is_read boolean not null default false, read_at timestamptz` at table-creation time; the partial index at `:257` is `(recipient_user_id, deleted_at, archived_at, is_read)` for unread lookups.
- Workspace notifications carry read state: `apps/hub/supabase/migrations/20260402235500_workspace_staff_platform.sql:113-114` — `is_read boolean not null default false, read_at timestamptz` with covering index at `:206`.
- HQ internal comms thread membership tracks last_read_at per user: `apps/hub/supabase/migrations/20260405123000_hq_internal_comm_members.sql:9` — `last_read_at timestamptz`.
- **Recently-deleted feed schema is real.** `apps/hub/supabase/migrations/20260502120000_staff_notifications_audience.sql:259-263` — `staff_notification_states_recipient_deleted_idx` is a partial index on `(recipient_user_id, deleted_at DESC) WHERE deleted_at IS NOT NULL`, designed for the recently-deleted listing query.
- **30-day purge cron infrastructure is real.** `apps/hub/supabase/migrations/20260502120000_staff_notifications_audience.sql:265-273` — partial indexes `staff_notification_states_purge_candidate_idx` and `customer_notifications_purge_candidate_idx` both on `(deleted_at) WHERE deleted_at IS NOT NULL`. The cron handler runs at `apps/account/vercel.json:12-15` (`/api/cron/notification-purge` daily at 03:00).
- **Cross-audience shared validation in notification publisher.** `packages/notifications/validate-shared.ts` defines the deny-list for control characters, the HenryCo host suffix allowlist, payload depth/key limits, and the UUID regex. Both `validatePublishInput` (customer) and `validateStaffPublishInput` (staff) share the same primitives — meaning a tightening at `packages/notifications/validate-shared.ts` propagates to both surfaces.
- **Severity-from-priority mapping is centralised.** Per `apps/care/lib/account-linking.ts:3, 186` — `severityFromPriority` is exported from `@henryco/notifications` so callers never invent their own urgency mapping.
- Notification publisher shim with idempotent send + audit: `packages/notifications` (referenced from `apps/care/lib/account-linking.ts:182-202` — `publishNotification()` with `eventType` envelope).
- Email-fallback cron present: `apps/account/vercel.json` lists `/api/cron/notification-email-fallback` at `*/15 * * * *`, `/api/cron/notification-purge` at `0 3 * * *`, `/api/cron/engagement-sweep` at `13 * * * *`.
- Pattern C (admin update for refresh, shim publish for new) documented inline at `apps/care/lib/account-linking.ts:172-203`.
- Support thread mute state PASS 24 phase 5 columns: `apps/hub/supabase/migrations/20260513200000_support_thread_state_pass24_phase5.sql:19-43` — `customer_muted_at`, `staff_muted_at`, plus partial indexes.
- `customer_last_read_at` and `staff_last_read_at` columns exist on `support_threads` per the migration header comment at `apps/hub/supabase/migrations/20260513200000_support_thread_state_pass24_phase5.sql:12-14`.
- Notification signal foundation extends the basic schema: `apps/hub/supabase/migrations/20260501120000_notification_signal_foundation_extensions.sql:5` documents the `customer_notifications` columns (body, created_at, is_read, read_at, archived_at, deleted_at, division, category, …).
- D7 (jobs message conversation-membership gap from V3-BACKLOG-FROM-V2) — auth-rls-initplan-wrap migration includes RLS policies on `support_messages`: `apps/hub/supabase/migrations/20260514140000_auth_rls_initplan_wrap.sql:117-119` — three policies (view in own threads, create in own threads, service-role full access) — these wrap `auth.<fn>()` so initplan optimisations apply.
- RLS-initplan wrap migration codifies the policy inventory for the entire customer-data surface — `apps/hub/supabase/migrations/20260514140000_auth_rls_initplan_wrap.sql:100-159` lists every policy on `customer_preferences`, `customer_wallets`, `customer_wallet_transactions`, `customer_notifications`, `customer_addresses`, `customer_activity`, `support_threads`, `support_messages`, `customer_subscriptions`, `customer_invoices`, `customer_documents`, `customer_payment_methods`, `customer_security_log`, plus the parallel marketplace tree (`marketplace_role_memberships`, `marketplace_carts`, `marketplace_vendor_follows`, `marketplace_cart_items`, `marketplace_orders`, `marketplace_order_groups`, `marketplace_order_items`, `marketplace_shipments`, `marketplace_payment_records`, `marketplace_addresses`, `marketplace_wishlists`, `marketplace_recently_viewed`, `marketplace_user_notifications`, `marketplace_vendor_applications`, `marketplace_disputes`, `marketplace_support_threads`, `marketplace_support_messages`, `marketplace_user_comm_preferences`), and the care/HQ-internal-comms tables. Pass `V3-12` red-team can use this list as the canonical RLS coverage probe.

### Partial / Gap

- **CRITICAL CONFIRMED (PRODUCT-GAP-LEDGER): `support_threads` + `support_messages` have NO `is_read`/`read_at` on the message rows.** The only read-state on support is the thread-level `customer_last_read_at`/`staff_last_read_at` introduced before PASS 24 phase 5. There is no per-message read receipt.
  - File evidence: searching `apps/hub/supabase/migrations/` for `support_threads` returns only `20260423143000_data_governance_foundation.sql:237` (governance metadata row), `20260424140000_customer_lifecycle_snapshot.sql:106` (snapshot recompute reference), `20260513200000_support_thread_state_pass24_phase5.sql:19-43` (mute columns added at PASS 24 phase 5). No `CREATE TABLE public.support_threads` is in `apps/hub/supabase/migrations/` — the table was created in a migration that lives outside this audit scope OR pre-dates the captured history.
  - `apps/hub/supabase/migrations/20260514140000_auth_rls_initplan_wrap.sql:117-119` confirms `support_messages` exists in the public schema (RLS policies are attached) but does NOT add read columns.
  - `apps/hub/supabase/migrations/20260514120000_unindexed_foreign_keys.sql:91, 136` references `marketplace_support_messages` and `support_messages_sender_id_fkey` — confirming the table and a sender_id FK but not a read-state column.
- **Legacy `/care?booking=` URLs are still being generated repo-side.** This is a regression from the PRODUCT-GAP-LEDGER claim that "Legacy account care links now route through `/care/bookings/[bookingId]` repo-side":
  - `apps/care/lib/account-linking.ts:27-29` — `buildBookingActionUrl(bookingId)` returns `/care?booking=${encodeURIComponent(bookingId)}` and feeds that into the notification payload at `:103, 122, 139, 165`.
  - `apps/account/components/divisions/CareBookingsDashboard.tsx:337` — `href={`/care?booking=${encodeURIComponent(booking.id)}${filterQs}${pageQs}`}` — the dashboard list-item link still emits legacy URLs.
  - The new canonical path lives at `apps/account/lib/account-links.ts:39-41` (`getCareBookingHref()` returns `/care/bookings/${encodeURIComponent(bookingId)}`) — but the two call sites above bypass it.
  - PRODUCT-GAP-LEDGER 2026-04-09 reported 409 historical `customer_notifications` rows with legacy URLs. With ongoing generation, the count grows.
- **Delivery state machine (sent/delivered/seen) is not modelled.** The publisher shim at `packages/notifications` writes a single row to `customer_notifications`; there is no `delivered_at` or `seen_at` separate from `read_at` (which is application-side, not transport-side). Push delivery via OneSignal SW is fire-and-forget — `apps/hub/public/OneSignalSDKWorker.js`.
- **Notification retry on transient failure is asymmetric.** Email retry runs via the `/api/cron/notification-email-fallback` cron at `apps/account/vercel.json:8-11`; in-app delivery is single-shot at write time.
- **`marketplace_support_threads` / `marketplace_support_messages` parallel-schema gap.** `apps/hub/supabase/migrations/20260514120000_unindexed_foreign_keys.sql:91` and `apps/hub/supabase/migrations/20260514140000_auth_rls_initplan_wrap.sql:146` reference both tables. There is a parallel marketplace-scoped support tree. Whether the marketplace tables carry read-state is `needs verification`.
- **Recently-deleted feed support is partially confirmed.** The notification widgets in `packages/dashboard-shell/src/components/notifications/{notifications-bell.tsx, notifications-drawer-body.tsx}` reference recently-deleted UI affordances; the storage column is `deleted_at` on `customer_notifications` per `apps/hub/supabase/migrations/20260501120000_notification_signal_foundation_extensions.sql:5`. 30-day purge cron is `apps/account/vercel.json:12-15`. `needs verification` of full UI round-trip.

### Recommended V3 passes

- **V3-03 foundation-notification-message-states** — Adds `is_read`/`read_at` on `support_threads` + `support_messages` (and the marketplace twins), models the delivery state machine, retry pattern for in-app.
- **V3-04 foundation-deep-links** — Owns the legacy `/care?booking=` backfill decision + final repo-side sweep (depends on V3-02).
- **V3-08 foundation-empty-dashboard-truth** — Subscription/invoice ledger truth-up (depends on V3-03 since reads gate the dashboard distinction).

---

## 3.4 Deep links

### Solid

- Canonical care-booking link helper: `apps/account/lib/account-links.ts:39-41` — `getCareBookingHref(bookingId)` returns `/care/bookings/${encodeURIComponent(bookingId)}`. Centralised so callers do not hand-craft the path.
- Subscriptions detail route exists: `apps/account/app/(account)/subscriptions/[subscriptionId]/page.tsx` (directory listing confirms `[subscriptionId]/page.tsx`).
- Invoices detail route exists: `apps/account/app/(account)/invoices/[invoiceId]/page.tsx` (directory listing confirms `[invoiceId]/page.tsx`).
- Care bookings detail route exists with notification read-marker integration: `apps/account/app/(account)/care/bookings/[bookingId]/page.tsx:174` calls `markNotificationsReadByActionUrl(user.id, '/care?booking=${encodeURIComponent(booking.id)}')` — meaning when the user opens the new detail route, the LEGACY-URL notifications are still being marked read (defensive backfill).
- Subscriptions detail server-side hydration: `apps/account/lib/account-data.ts:654-705` — `getSubscriptionContext()` returns the subscription plus filtered related invoices + support threads, scoped by reference keys.
- Per-division workspace href helper: `apps/account/lib/account-links.ts:29-37` — `getDivisionWorkspaceHref(division, path)` rejects unknown division keys (the `asDivisionKey` whitelist at `:24-27` enforces the 10 valid divisions).
- Notification deep-link safety guard: `packages/notifications-ui/src/deep-link.ts:19-48` — rejects `//evil.com`, `javascript:`, foreign hostnames; accepts relative paths + HenryCo absolute hosts.
- Auth-gated round-trip preservation primitives exist:
  - `packages/config/urls.ts:27-65` — `normalizeTrustedRedirect()` rejects untrusted `next=`.
  - `packages/auth/src/server.ts:158-165` — `buildChooserUrl()` preserves `next=` when set on the chooser, and `:198-232` carries `next` to the resolved target.
- Super-app linking: `apps/super-app/src/core/linking.ts:1-39` — Expo Router linking config with `henryco://` custom scheme + `https://staging.henrycogroup.com/app` HTTPS prefix.
- Super-app Android intent filter for universal links: `apps/super-app/app.json:29-42` — `autoVerify: true` on `https://staging.henrycogroup.com/app`.
- Super-app iOS associated domains: `apps/super-app/app.json:20` — `applinks:staging.henrycogroup.com`.

### Partial / Gap

- **Care booking deep-link regression confirmed.** Despite `getCareBookingHref()` existing at `apps/account/lib/account-links.ts:39-41`, two active call sites still emit legacy URLs:
  - `apps/care/lib/account-linking.ts:27-29` (`buildBookingActionUrl` — feeds notifications)
  - `apps/account/components/divisions/CareBookingsDashboard.tsx:337` (account dashboard list-item)
- **Universal links only configured for staging.** `apps/super-app/app.json:20` and `:29-42` both target `staging.henrycogroup.com/app` only. Production (`henrycogroup.com`) has no associated domains, no `apple-app-site-association`, no `assetlinks.json`.
  - Searching repo confirms: `Grep "apple-app-site-association|assetlinks.json"` returns only the V3 roadmap doc — no live `.well-known` files in any app.
- **Auth-gated deep-link round-trip is partial.** `next=` is honored when present but:
  - Not all entry points wrap `Link`/`router.push` with the trusted-redirect helper — only the auth gates do.
  - There is no central middleware that prefixes a deep-link request with `?next=` when redirecting unauthenticated users back to login. Per-route gates handle it inconsistently.
  - `apps/account/app/auth/callback/route.ts` and `apps/account/app/auth/confirm/route.ts` consume `normalizeTrustedRedirect` (per the file list above) — those paths are safe; the rest of the apps lean on `requireAccountUser()` style redirects which do NOT carry the requested URL.
- **SMS/share deep links inventory is absent.** No `apps/*/lib/share-link.ts` or `share-deep-link.ts` files found via search. The publisher shim accepts `deepLink` (per `apps/care/lib/account-linking.ts:189`) but there is no surface that emits SMS-formatted share links.
- **`company-hub` Expo app has no universal-links configuration.** `apps/company-hub/app/_layout.tsx` exists, but `apps/company-hub` has no `app.json` `associatedDomains` block (`needs verification` — only `apps/super-app/app.json` was inspected; the company-hub config may live elsewhere).

### Recommended V3 passes

- **V3-04 foundation-deep-links** — Legacy `/care?booking=` backfill decision; auth round-trip preservation; universal links; share-link inventory.
- **V3-87 mobile-super-app-parity-wave-1** (Phase I) — Production universal links + app links for both Expo apps (depends on V3-04).

---

## 3.5 Live data vs fake loading

### Solid

- **Canonical `PublicRouteLoader` ignores theatrical copy.** `packages/ui/src/public-shell/public-route-loader.tsx:31-79` — the component accepts `eyebrow`, `title`, `subtitle`, `tone`, `size` props but renders only a 2px top progress bar pinned to `top-0 z-[120]` with a 320ms animation delay. The destructured props are explicitly `_eyebrow`, `_title`, `_subtitle` (underscore-prefixed to silence lint) — meaning even if a `/loading.tsx` file passes "Preparing your creative workspace", the user never sees it.
- All public app loading files are wired to `PublicRouteLoader`:
  - `apps/care/app/(public)/loading.tsx:1-5` — naked `<PublicRouteLoader />` (no copy).
  - `apps/property/app/loading.tsx:14-17` — naked `<PublicRouteLoader />` with inline comment explaining the rewrite rationale.
  - `apps/care/app/loading.tsx`, `apps/property/app/account/loading.tsx`, etc. — all use the canonical loader.
- PERF-01 PublicRouteLoader adoption confirmed across all 10 apps' `/loading.tsx` files (per `Grep "PublicRouteLoader"` hit list: studio, staff, property×8, marketplace×2, logistics, learn×2, jobs, hub×2, care×N).
- PERF-01 W3C-gated smooth scroll in `apps/account/app/globals.css:824-839` — `@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }`. Honors OS-level reduced-motion preference.
- Real intelligence data on staff dashboard: per `docs/intelligence-rollout-status.md:19-23` — `apps/staff/lib/intelligence-data.ts` aggregator with prioritized queues + risk metrics. Listed as "fully integrated in this pass".
- Owner reporting genuine data: `docs/intelligence-rollout-status.md:34` — `apps/hub/lib/owner-data.ts`, `apps/hub/lib/owner-reporting.ts` are real (kept, not replaced).
- Lifecycle collector pulls real cross-division state: `apps/account/lib/lifecycle/collector.ts:868` reads `customer_subscriptions`; per `docs/intelligence-rollout-status.md` it underpins the task center.
- Subscriptions + invoices read from real tables (no mocks): `apps/account/lib/account-data.ts:599-606` (`getSubscriptions`), `:609-618` (`getSubscriptionById`), `:707-716` (`getInvoices`), `:718-727` (`getInvoiceById`).

### Partial / Gap

- **Source-level theatrical copy still exists in `/loading.tsx` call sites.** Although the canonical loader ignores it, the following files still pass props that would re-emerge if someone replaced the loader:
  - `apps/studio/app/loading.tsx:7-8` — `title="Loading HenryCo Studio" subtitle="Preparing your creative workspace."`
  - `apps/marketplace/app/loading.tsx:6-8` — `eyebrow="HenryCo Marketplace" title="Loading marketplace" subtitle="Preparing products, stores, and your personalized experience."`
  - `apps/logistics/app/loading.tsx:5-8` — `title="Loading logistics" subtitle="Preparing shipping, tracking, and delivery services."`
  - `apps/learn/app/loading.tsx:18-19` — `title={t("Loading your learning experience.")} subtitle={t("Preparing courses, learning paths, and your progress.")}` (translated through `translateSurfaceLabel`).
  - `apps/jobs/app/loading.tsx:9-11` — `title="Gathering this page for you" subtitle="We are loading the latest jobs and updates. You can keep this tab open — nothing is wrong on your side."` — this jobs string is plain-state and is the model the others should adopt.
  - The strings are also persisted in the i18n surface-extra-labels for 11 locales: `packages/i18n/src/surface-extra-labels.ts:350, 527, 1279, 1691, 2198, 2610, 3117, 3529, 4017, 4283, 4936, 5202, 5855, 6121` — "Preparing your Care experience" + "Preparing your support threads, message room, and reply composer.". Translating loading-theater strings is sunk cost.
  - The strings are also enumerated in `docs/v3/i18n-gaps/extra-label-universe.json:527-528` — meaning the i18n gap tracker explicitly catalogs them as work-units to translate; V3-05 should retire the strings before V3-07 burns more translation budget on them.
- **The `CareLoadingStage` component still hard-codes loading-theater copy.** `apps/care/components/ui/CareLoading.tsx:86-89` — `t(title || "Preparing your Care experience")` + `t(description || "Pulling the latest booking, pricing, and support context so the next screen opens cleanly.")` + bullets at `:135-137` (`"Loading your bookings", "Checking delivery status", "Preparing your dashboard"`). This component is consumed by 4 files:
  - `apps/care/components/care/TrackLookupClient.tsx`
  - `apps/care/app/(staff)/support/inbox/loading.tsx`
  - `apps/care/app/(staff)/owner/loading.tsx`
  - These files do not use `PublicRouteLoader` — they render `CareLoadingStage` directly. The theatrical copy DOES render at runtime in these surfaces.
- **`customer_subscriptions` rows = 0 in production (PRODUCT-GAP-LEDGER 2026-04-09).** UI is wired (`apps/account/components/dashboard/*`, dashboard-modules-account widget at `packages/dashboard-modules-account/src/widgets/active-subscriptions-card.tsx`); data path returns no rows. Zero-state copy at `:33-36` is "No active plans" — does not distinguish "you have no subscriptions" from "we couldn't fetch them".
- **`customer_invoices` rows = 2 in production (PRODUCT-GAP-LEDGER 2026-04-09).** Same shape: wired through `apps/account/lib/account-data.ts:707-716` + `dashboard-modules-account/src/widgets/invoices-pending-card.tsx` widget (file listed in widgets/).
- **Receipts depend on per-division publishing.** Per PRODUCT-GAP-LEDGER 2026-04-09 line 29: "Account can render invoice truth, but it cannot invent downloadable receipts that were never published." `apps/account/lib/branded-documents.ts` is the consumer side; the producer side is per-division (`apps/marketplace`, `apps/learn`, `apps/care` each emit branded documents) — coverage is uneven.
- **First-render HTML on live deploys may still expose loading copy.** PRODUCT-GAP-LEDGER 2026-04-09 lines 36-41 enumerated 6 public surfaces (Care, Learn, Logistics, Studio, Marketplace, Property) with loading copy in the initial HTML at scrape time. With `PublicRouteLoader` now ignoring copy in source, the deployed builds should be clean; `needs verification` via live HTML scrape.

### Recommended V3 passes

- **V3-05 foundation-kill-loading-theater** — Repo-side sweep: remove the theatrical strings from source even though the loader ignores them; rewrite `CareLoadingStage` to remove the title/bullet defaults; sunset the persisted i18n entries.
- **V3-08 foundation-empty-dashboard-truth** — Subscription/invoice "no data yet" vs "loading" vs "you have nothing" distinction; module-level zero-state copy.

---

## 3.6 Dead links

### Solid

- Centralised division URL helper: `apps/account/lib/account-links.ts` and `packages/config/urls.ts` provide validated cross-division href builders.
- Trusted-redirect helper rejects unknown hosts at the auth boundary: `packages/config/urls.ts:27-65`.
- Care booking canonical helper at `apps/account/lib/account-links.ts:39-41`.
- Hub vercel.json has explicit rewrite rules that prevent route ambiguity between hq.henrycogroup.com / workspace.henrycogroup.com / staff.henrycogroup.com: `apps/hub/vercel.json:14-83`.
- Live verification scaffolding exists: `scripts/verify-henryco-live.mjs` (header inspected).

### Partial / Gap

- **Legacy `/care?booking=` paths still in use (see 3.3 above).** Two repo-side generators:
  - `apps/care/lib/account-linking.ts:27-29`
  - `apps/account/components/divisions/CareBookingsDashboard.tsx:337`
- **`henrycogroup.com` literal sprawl is significantly worse than V3-BACKLOG Q1 estimated.** Q1 cited ~30 in care/account; the actual count across `apps/` is **186 occurrences across 75 files** (per `Grep -c "henrycogroup\.com" apps/`). Top culprits:
  - `apps/account/components/saved-items/WelcomeBackSurface.tsx:7` — 7 literals in a single component.
  - `apps/account/components/saved-items/SavedItemsClient.tsx:7` — 7 literals.
  - `apps/hub/app/lib/company-pages.ts:7` — 7 literals.
  - `apps/super-app/supabase/migrations/20260405120000_super_app_core.sql:8` — 8 literals (division URLs hard-coded into SQL seed data).
  - `apps/super-app/src/domain/divisionCatalog.ts:8` — 8 literals.
  - `apps/marketplace/scripts/seed-marketplace.mjs:7`, `apps/learn/scripts/verify-flows.ts:1`, `apps/jobs/scripts/seed-jobs.mjs:5`, `apps/jobs/scripts/verify-jobs-live.ts:2`, `apps/jobs/scripts/backfill-jobs-shared-links.ts:2` — scripts and seed-data carry literals too.
  - `apps/company-hub/src/lib/brand-emails.ts:13` — `BRAND_EMAIL_DOMAIN = "henrycogroup.com"`.
  - `apps/company-hub/src/data/divisions.ts:15-128` — every division entry hard-codes both `subdomain` and `visitUrl`.
- **Inventory of dead routes / orphaned routes is not yet exhaustive.** No script in `scripts/` is named `dead-link-sweep.mjs` or similar. The closest is `scripts/verify-henryco-live.mjs` but that's a live-deploy validator, not a repo route walker.
- **`apps/hub/public/OneSignalSDKWorker.js`** is still listed as an open item in V3-BACKLOG B10 (untracked file review). Confirmed: `Grep "OneSignalSDKWorker.js"` shows the file is referenced from `apps/hub/vercel.json:17, 35, 53, 75` (rewrite-allowlist exemption) and the file itself is untracked in this worktree per the initial `git status` listing.

### Recommended V3 passes

- **V3-06 foundation-dead-link-sweep** — Every `href=` verified against live route table; cross-division links; legacy paths deleted (depends on V3-05).
- **V3-07 foundation-hardcoded-text-cleanup** — Inventory the 186 `henrycogroup.com` literals; replace with `getDivisionUrl()` / `getAccountUrl()` / `getHqUrl()` from `@henryco/config`.

---

## 3.7 Hardcoded text

### Solid

- `docs/v3/i18n-gaps/` directory exists with structured outputs:
  - `summary.json` — per-locale per-module gap counts (auth: 0 across all 12 locales; consent: at most 1 per locale; surface: 2-10 per locale; account: 31-143 per locale).
  - `module-gaps.json`, `extra-label-gaps.json`, `extra-label-universe.json`, `work-units.json` — the canonical gap files referenced from `AUDIT-BASELINE.md:261`.
  - `extras.echo` counts (10-26 per locale) indicate strings echoed-literal because no translation was provided.
- `@henryco/i18n` Pattern A + Pattern B architecture: per memory `project_henryco_i18n_architecture.md`. Pattern A = typed copy modules; Pattern B = `translateSurfaceLabel` runtime DeepL.
- 12 locales live: `en, ar, de, es, fr, ha, hi, ig, it, pt, yo, zh` per `AUDIT-BASELINE.md:259` and the keys in `docs/v3/i18n-gaps/summary.json`.
- Most theatrical copy strings have been wired through `translateSurfaceLabel` already (cited above in 3.5 — 14 occurrences across `packages/i18n/src/surface-extra-labels.ts`).

### Partial / Gap

- **i18n gaps are concentrated in account module.** Per `docs/v3/i18n-gaps/summary.json:18-30`: account module has 31 (`ar`) to 143 (`de`) untranslated strings. Total: ~1,140 untranslated account strings across all 11 non-English locales (sum of the 11 values).
- **Jobs module ranks second.** `summary.json:56-68` — 45 (`ar`) to 77 (`it`) untranslated, totaling ~673 strings.
- **`henrycogroup.com` literal cleanup is undercounted in V3-BACKLOG Q1.** Real count is 186 across 75 files (see 3.6).
- **Loading-theater strings still persisted across 11 locales.** Listed in 3.5 above — sunk i18n cost on copy that V3-05 will retire.

### Recommended V3 passes

- **V3-07 foundation-hardcoded-text-cleanup** — Close work-units.json; remove `henrycogroup.com` literals; sweep remaining string-literals into surface labels.
- **V3-05 foundation-kill-loading-theater** — Retires the persisted loading strings before V3-07's sweep, to avoid translating dead copy.

---

## 3.8 Fake loading / fake state

### Solid

- Canonical `PublicRouteLoader` strips theatrical copy (see 3.5).
- Adoption confirmed across all 10 apps' top-level `/loading.tsx` (see grep results in 3.5).
- W3C-gated smooth-scroll prevents motion sickness on slow nav: `apps/account/app/globals.css:824-839`.
- PERF-01 inline comment justifies the design at `packages/ui/src/public-shell/public-route-loader.tsx:4-30` — explicit owner-validated pattern.

### Partial / Gap

- **`CareLoadingStage` is the remaining theater surface.** Used by 3 care app `loading.tsx` files (track lookup, staff support inbox, staff owner). The component still has hard-coded "Preparing your Care experience" / "Loading your bookings" / "Preparing your dashboard" defaults: `apps/care/components/ui/CareLoading.tsx:86-89, 135-137`.
- **W3C-gated smooth-scroll adoption is partial — concrete per-app evidence.** Confirmed by grepping `scroll-behavior: smooth` across all 10 `apps/*/app/globals.css`:
  - **Gated correctly** (inside `@media (prefers-reduced-motion: no-preference)`):
    - `apps/account/app/globals.css:835-839`
    - `apps/logistics/app/globals.css:87-89`
  - **Unconditional smooth-scroll (PERF-01 violation — motion-sickness risk for users with reduced-motion preference)**:
    - `apps/care/app/globals.css:112-113`
    - `apps/jobs/app/globals.css:170-171`
    - `apps/learn/app/globals.css:75-76`
    - `apps/marketplace/app/globals.css:70-71`
    - `apps/property/app/globals.css:94-95`
    - `apps/studio/app/globals.css:118-119`
  - **Not searched in this audit** (per-app globals not fully scanned): `apps/hub/app/globals.css`, `apps/staff/app/globals.css`. `needs verification`.
  - Implication: 6 of 8 public-facing customer apps run smooth-scroll without the W3C gate, contradicting the memory `project_henryco_perf01_loading.md` canonical pattern.
- **Theatrical copy at source-level is dead weight.** The strings in `studio/loading.tsx:7-8`, `marketplace/loading.tsx:6-8`, etc. are sunk source code + sunk i18n — the loader does not render them, but they confuse readers and increase translation cost.

### Recommended V3 passes

- **V3-05 foundation-kill-loading-theater** — Repo-side sweep + `CareLoadingStage` rebuild.
- **V3-09 foundation-mobile-consistency** — Pulls in W3C-gated smooth-scroll consistency across the 8 apps that lack it.

---

## 3.9 Empty dashboards

### Solid

- `@henryco/dashboard-shell` provides the modular register pattern: `packages/dashboard-shell/src/{index.ts, register.ts, command-palette.ts, role-gate.ts, notification-categories.ts}` (directory listing inspected). Modules are explicit about their data sources via the `EmptyTeaching` contract imported at `packages/dashboard-modules-account/src/module.tsx:11`.
- 7 dashboard-modules packages shipped (per `AUDIT-BASELINE.md:50`): `account, building, hotel, marketplace, owner, staff, wallet`.
- `dashboard-modules-account` widgets all read from real DB tables — no mock fallbacks:
  - `active-subscriptions-card.tsx` reads `snapshot.summary.activeSubscriptions` (from `customer_subscriptions`).
  - `invoices-pending-card.tsx` reads pending invoice rows.
  - `wallet-balance-card.tsx` reads wallet rows.
  - `support-open-card.tsx` reads `support_threads`.
  - `unread-notifications-card.tsx` reads `customer_notifications`.
  - `trust-tier-card.tsx`, `referrals-card.tsx`, `lifecycle-continue-widget.tsx`, `welcome-back-widget.tsx` round out the customer-overview module.
- `dashboard-modules-account/src/module.tsx:42-56` — module config explicitly gates eligibility on `viewer.kind === "customer"`.
- Staff dashboard pulls live data per `docs/intelligence-rollout-status.md:19-23`.
- Customer-overview snapshot is loaded once per module render via `loadCustomerOverviewSnapshot(viewer)` (`packages/dashboard-modules-account/src/module.tsx:24, 58-60`).

### Partial / Gap

- **Empty state copy does NOT distinguish "no data yet" from "loading" from "you have nothing".**
  - `dashboard-modules-account/src/widgets/active-subscriptions-card.tsx:33-36` — when subscriptions count is 0, the card shows `direction: "flat", magnitude: "No active plans"`. This reads the same whether the user has never subscribed, hasn't been migrated, or the query failed.
  - `dashboard-modules-account/src/widgets/invoices-pending-card.tsx:39-43` — confirmed same pattern: when both `recent` and `pending` are zero, shows `direction: "flat", magnitude: "No invoices yet"`. No distinction between "we haven't loaded yet" and "you have zero invoices".
  - `dashboard-modules-account/src/widgets/invoices-pending-card.tsx:26-31` — when `pending > 0` it shows `${pending} pending download` (a real trend); when only `recent > 0` shows "All settled · download anytime". The three states (`pending > 0`, `recent > 0 / pending = 0`, `recent = 0 / pending = 0`) do not include a fourth "still loading" state.
- **`customer_subscriptions` rows = 0 in production.** UI promises real subscriptions; data layer returns nothing. PRODUCT-GAP-LEDGER 2026-04-09 line 27.
- **`customer_invoices` rows = 2 in production.** PRODUCT-GAP-LEDGER 2026-04-09 line 28. Both customers may be test rows.
- **Owner workspace dashboard data freshness varies.** `AUDIT-BASELINE.md:347` flagged this. `apps/hub/lib/owner-data.ts` is real (per intelligence-rollout-status) but the per-tile freshness signal is not uniform. `needs verification` of which tiles report a `lastSyncedAt`.
- **`@henryco/dashboard-modules-building` and `dashboard-modules-hotel` are present but not yet user-facing.** Per `AUDIT-BASELINE.md:50` — domain modules for future verticals.

### Recommended V3 passes

- **V3-08 foundation-empty-dashboard-truth** — Distinguish "no data yet" from "loading" from "you have nothing" on every KPI tile; truth-up subscriptions/invoices.
- **V3-22 payments-finance-dashboard** (Phase C) — Owner-only finance dashboard once V3-13..V3-19 land (downstream consumer of V3-08's truth bar).

---

## 3.10 Mobile consistency

### Solid

- `@henryco/chat-composer` mobile full-screen mode confirmed: `packages/chat-composer/src/composer/FullScreenComposer.tsx` (file present in directory listing).
- Mobile WhatsApp-style support thread header shipped:
  - PR #114 — `fix(account): kill white-card hero bug across dashboard + collapse mobile support thread header`
  - PR #115 — `fix(account, messaging-thread): kill white-edge hero tiles + dark CTA visibility + add positive green Live pill`
  - PR #116 — `fix(account/support): rebuild mobile thread header as WhatsApp-style thin app bar`
  - PR #117 — `fix(account/support): bulletproof mobile thin-bar with last-in-source !important guard`
  - PR #118 — `fix(support): WhatsApp-style chat scroll on /support/[threadId] + hide dock on thread surfaces`
  - Implementation: `apps/account/components/support/SupportThreadHeader.tsx:84-100` (workspace-grade thread header with overflow menu, participants strip).
- Safe-area inset usage: `apps/super-app/src/design-system/components/Screen.tsx`, `packages/chat-composer/src/composer/composer-styles.tsx`, `packages/dashboard-shell/src/shell/{mobile-shell-css.ts, bottom-action-bar.tsx}`, `packages/messaging-thread/src/styles.css`, `packages/workspace-shell/src/styles.css`, `packages/ui/src/public-shell/public-tokens.ts` (file list from grep on `safe-area`).
- Mobile shell DASH-7 shipped: per commit `d68dde56 feat(dashboard): DASH-7 mobile shell + parity gate (#59)`.
- Chat-composer mobile keyboard handling: per commit `f7461170 fix(messaging-thread): chat composer polish — focus state, button alignment, mobile keyboard (#69)`.
- Notification toast viewport mobile-safe: `packages/dashboard-shell/src/components/notifications/notifications-toast-viewport.tsx` (file inspected via grep for safe-area).
- Mobile-shell CSS scaffolding: `packages/dashboard-shell/src/shell/mobile-shell-css.ts` (per grep hit).
- Care `BookPickupForm` mobile safe-area aware: `apps/care/components/care/BookPickupForm.tsx` (in grep hit list).
- Studio globals mobile considerations: `apps/studio/app/globals.css` (in grep hit list).

### Partial / Gap

- **Safe-area inset coverage is uneven across the 10 apps.** The grep above confirms coverage in `apps/super-app`, `apps/account/components/support/editorial.css`, `apps/care/components/care/BookPickupForm.tsx`, `apps/hub/app/(site)/HubHomeClient.tsx`, `apps/studio/app/globals.css`, `apps/company-hub/src/components/Toast.tsx`, `apps/company-hub/app/_layout.tsx`, `apps/company-hub/app/(tabs)/discover.tsx`, `apps/company-hub/app/(tabs)/index.tsx`. Notably absent from the grep hits: `apps/care/app/`, `apps/jobs/app/`, `apps/learn/app/`, `apps/logistics/app/`, `apps/marketplace/app/`, `apps/property/app/`. Per-app forms and dashboards may still lack `env(safe-area-inset-*)` adoption.
- **Mobile thin-bar pattern is account-specific.** PRs #114–#118 hardened the account support flow. The same pattern is not yet ported to:
  - `apps/care/components/support/SupportThreadWorkspace.tsx`
  - `apps/studio/components/studio/support/StudioSupportThreadRoom.tsx`
- **Viewport keyboard avoidance is verified for chat-composer (#69) but unverified for general forms.** `needs verification` of per-form keyboard-avoid behaviour in `apps/property/app/(public)/submit/`, `apps/marketplace/app/account/`, `apps/jobs/app/employer/`.
- **Expo super-app + company-hub mobile parity is Phase H/I scope, not foundation-lock.** Per `AUDIT-BASELINE.md:354`. The super-app design-system Screen primitive at `apps/super-app/src/design-system/components/Screen.tsx` is the right entry point but is not yet exhaustively adopted across features.

### Recommended V3 passes

- **V3-09 foundation-mobile-consistency** — Safe-area, viewport keyboard, swipe, sticky nav, modal escape — across all public + auth flows.
- **V3-87 mobile-super-app-parity-wave-1** (Phase I) — Mobile-app parity for notifications + messages + bookings + orders.

---

## Cross-cutting foundation issues

### Solid

- `@henryco/observability` ships logger + redaction + Sentry config builders + event-taxonomy emitter + audit-log subpath: `packages/observability/src/{logger.ts, redaction.ts, events.ts, audit-log.ts, sentry/{client.ts, server.ts, instrumentation.ts}}`.
- The package is decoupled from `@sentry/nextjs` version: `packages/observability/src/index.ts:9-14`.
- Account, hub, staff have instrumentation files calling the Sentry config builders: `apps/account/instrumentation*.ts`, `apps/hub/instrumentation*.ts`, `apps/staff/instrumentation*.ts`.
- Intelligence routes report "degraded side effects explicitly" per `docs/intelligence-rollout-status.md:53` — established pattern in account support + jobs/logistics crons + studio support.
- Idempotency keys + nonce scope migration: `apps/hub/supabase/migrations/20260407193000_idempotency_and_nonce_scope.sql`. Account webhook receipts at `apps/hub/supabase/migrations/20260407190000_account_webhook_receipts.sql`.
- DASH-9 audit log writer at `packages/observability/src/audit-log.ts` (server-only sub-path) per `packages/observability/src/index.ts:53-57`.
- Workspace mute partial indexes prevent dead reads: `apps/hub/supabase/migrations/20260513200000_support_thread_state_pass24_phase5.sql:30-36`.
- D8 wallet/care RLS hot patch is live: `apps/hub/supabase/migrations/20260509120000_v2_closure_d8_rls_hot_patch.sql`.

### Partial / Gap

- **Observability adoption gap (see 3.2).** Only 3 of 10 apps have instrumentation files. The 7 untouched apps (`care, jobs, learn, logistics, marketplace, property, studio`) cannot route errors through `@henryco/observability` even though the package is installed.
- **No traces / no SLOs / no performance budget enforcement.** Per `AUDIT-BASELINE.md:222`. The package exposes logger + events but no `@opentelemetry/*` integration. There is no per-route SLO file in `apps/*/app/`.
- **Degraded side-effect reporting is patchy outside intelligence routes.** Per `docs/intelligence-rollout-status.md:53` — only account-support routes + jobs/logistics crons + studio support reply call the pattern. The 60+ other `apps/*/app/api/**/route.ts` files do not consistently emit a degradation event.
- **Refresh loops losing context.** Beyond the care booking link issue (3.3, 3.4), no comprehensive sweep has audited "does refreshing this page preserve scroll, filters, draft, modal state?" `needs verification`.
- **Duplicated UI labels are not cataloged.** No `scripts/duplicate-labels.mjs` exists. The owner's "every card one job" audit cannot be answered from source without this scaffolding.
- **Every-card-one-job audit has not been performed.** `AUDIT-BASELINE.md:360` flags this as the owner's literal open question. No `audit/one-job-per-card.md` exists in this audit pass.
- **`hc_dash_pref` cookie cleared on sign-out (good), but no broader session-tear-down.** Per 3.2 — no IndexedDB/localStorage clearing.
- **No `customer_form_drafts` or `draft_store` table.** Lost work on token-expiry is unmitigated.
- **`marketplace_support_threads` / `marketplace_support_messages` parallel schema may have its own read-state gap.** `needs verification` — these tables appear in the unindexed-foreign-keys and RLS-initplan migrations but their CREATE TABLE definition isn't in the captured migration set.
- **WhatsApp webhook HMAC verification still owed across care/property/studio.** Per V3-BACKLOG-FROM-V2 B1; `needs verification` of current state.
- **`apps/hub/public/OneSignalSDKWorker.js` untracked file review still owed.** Per V3-BACKLOG-FROM-V2 B10.
- **Supabase migration tracking drift (Q5).** Per V3-BACKLOG-FROM-V2 Q5, the linked production migration tracker has 46 remote-only timestamps not in `apps/hub/supabase/migrations/`. DASH-9 worked around it by applying via `supabase db query --linked --file` (idempotent, bypasses tracking). The recommended remediation — `supabase migration repair --status applied <timestamp>` per remote-only row — is still owed. Implication for V3 audit: any "this migration file is the source of truth" claim must be validated against the linked DB before V3-12 accepts foundation closure.
- **Customer messaging vs marketplace messaging schema fork is structural.** The RLS-initplan migration confirms both `support_threads`/`support_messages` AND `marketplace_support_threads`/`marketplace_support_messages` exist as separate tables (`apps/hub/supabase/migrations/20260514140000_auth_rls_initplan_wrap.sql:113-119` vs `:145-146`). V3-03's read-state fix must address both schemas in parallel, not just the customer-level one.

### Recommended V3 passes

- **V3-10 foundation-logs-states-fallbacks** — Adoption inventory of `@henryco/observability` across the 7 untouched apps + per-route fallback pattern.
- **V3-11 foundation-one-job-per-card** — Audit every card/button/summary module against the "one job" rule (depends on V3-04 deep-link decisions).
- **V3-12 foundation-lock-acceptance** — Red-team gate; owner sign-off; blocks Phase C start.
- **V3-89 observability-traces-slos-budgets** (Phase I) — OpenTelemetry traces + SLOs + performance budgets (downstream of V3-10).

---

## Cross-pass dependency notes for V3-01..V3-12

Per `docs/v3/PASS-REGISTER.md:65`, Phase B parallelism plan:

```
wave 1 (parallel): V3-01, V3-03, V3-05, V3-07, V3-09, V3-10
wave 2 (after wave 1): V3-02 (depends on V3-01), V3-06 (depends on V3-05), V3-08 (depends on V3-03)
wave 3 (after wave 2): V3-04 (depends on V3-02), V3-11 (depends on V3-04)
wave 4 (close):        V3-12 (depends on V3-01..V3-11)
```

This audit confirms the dependency graph is correct:
- **V3-05 → V3-07** because the i18n surface should not include retired theatrical strings.
- **V3-03 → V3-08** because empty-dashboard truth needs the `is_read`/`read_at` ledger to distinguish "you have not loaded" from "you have nothing".
- **V3-02 → V3-04** because deep-link round-trip preservation needs the OAuth/redirect flow to be solid first.
- **V3-04 → V3-11** because the one-job-per-card audit needs to know which links actually go somewhere useful.
- **V3-01 → V3-02** because logout completeness depends on the session-persistence boundary being clean.

---

## Coverage checklist

This audit substantively covers (with file citations) the 11 areas of `AUDIT-BASELINE.md §3`:

- [x] 3.1 Session persistence — `packages/auth/src/{cookies,types,server,viewer,owner,staff}.ts` + `apps/account/app/api/auth/logout/route.ts` + `packages/config/urls.ts`.
- [x] 3.2 Auth reliability — `packages/auth/src/server.ts` + `apps/account/app/api/auth/logout/route.ts` + `apps/hub/supabase/migrations/20260509120000_v2_closure_d8_rls_hot_patch.sql` + observability adoption gap.
- [x] 3.3 Notifications & message states — `apps/hub/supabase/migrations/{20260403183000, 20260501120000, 20260501130000, 20260502120000, 20260513200000}*.sql` + `apps/care/lib/account-linking.ts` + `apps/account/components/divisions/CareBookingsDashboard.tsx`.
- [x] 3.4 Deep links — `apps/account/lib/account-links.ts` + `apps/super-app/src/core/linking.ts` + `apps/super-app/app.json` + `packages/notifications-ui/src/deep-link.ts`.
- [x] 3.5 Live data vs fake loading — `packages/ui/src/public-shell/public-route-loader.tsx` + per-app `loading.tsx` files + `apps/care/components/ui/CareLoading.tsx` + `apps/account/lib/account-data.ts`.
- [x] 3.6 Dead links — `apps/care/lib/account-linking.ts:27-29` + `apps/account/components/divisions/CareBookingsDashboard.tsx:337` + 186 `henrycogroup.com` literals across 75 files.
- [x] 3.7 Hardcoded text — `docs/v3/i18n-gaps/summary.json` + `packages/i18n/src/surface-extra-labels.ts` + literal-sprawl evidence.
- [x] 3.8 Fake loading / fake state — `packages/ui/src/public-shell/public-route-loader.tsx` + `apps/account/app/globals.css:824-839` + `apps/care/components/ui/CareLoading.tsx`.
- [x] 3.9 Empty dashboards — `packages/dashboard-modules-account/src/widgets/*` + `apps/account/lib/account-data.ts:599-727`.
- [x] 3.10 Mobile consistency — `apps/account/components/support/SupportThreadHeader.tsx` + safe-area grep map + chat-composer files.
- [x] Cross-cutting — `packages/observability/src/index.ts` + per-app `instrumentation*.ts` inventory + degraded-side-effect pattern.

Areas explicitly marked `needs verification` for downstream passes:
- Per-route 401 handling sweep across `apps/*/components/**/Form*.tsx`.
- Multi-tab `BroadcastChannel`/`storage` event handlers (negative-signal only).
- Marketplace parallel support schema (`marketplace_support_threads`/`marketplace_support_messages`) read-state.
- Owner workspace dashboard tile freshness signal.
- Live HTML scrape of 6 public surfaces to confirm theatrical copy is no longer visible at runtime.
- Per-form keyboard-avoid behaviour outside `chat-composer`.
- WhatsApp webhook HMAC verification current state across `care/property/studio`.
- Refresh-loop context preservation sweep.
- Duplicate UI labels inventory.
- Every-card-one-job audit (owner's literal question — handed to V3-11).

End of foundation-base-lock deep audit.
