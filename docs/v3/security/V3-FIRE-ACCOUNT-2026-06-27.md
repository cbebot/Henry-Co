# V3-FIRE-ACCOUNT — Pre-launch adversarial security + smart-leak audit

- **Entity:** Henry Onyx Limited (codename `HenryCo` / `@henryco/*`; only valid domain **henryonyx.com**).
- **Division:** account (`apps/account` — the shared identity / wallet / KYC / notifications hub; the most sensitive division).
- **Live DB audited:** Supabase project `rzkbgwuznmdxnnhmjazy` ("HENRY ONYX"). The `customer_*` schema is owned by `apps/hub/supabase/migrations` (applied-not-in-repo for some tables).
- **Date:** 2026-06-27
- **Method:** static map (3 parallel subagents: RLS/SECDEF catalog; documents/wallet/proxy IDOR; auth flows + webhook) → live read-only probing as the **real `anon` and `authenticated`(stranger) roles** + prod function-body inspection (via the Supabase MCP), never `service_role`. `SELECT`/catalog only, zero mutation. Did **not** touch `payments_private` or the core money RPCs (inventory-only).
- **Calibration (owner directive):** only PII/money/KYC/auth exposure flagged; CRITICAL/HIGH require a live probe or concrete code path; unproven → SUSPECTED; pre-data defects annotated.

---

## Executive summary

**The account data layer is the most locked-down in the entire sweep — proven, not assumed — and there are 0 CRITICAL / 0 HIGH live findings.** This is the best possible outcome for the identity/wallet/KYC core.

- **Cross-user reads are fully closed (live probe).** As an authenticated *stranger* (a JWT owning nothing), reads returned **0** for **every** sensitive table: `customer_wallets`, `customer_wallet_transactions`, `customer_documents`, `customer_profiles`, `customer_notifications`, `customer_payment_methods`, `customer_preferences`, `customer_verification_submissions` (KYC), `customer_payout_methods`, `customer_wallet_withdrawal_requests`, `customer_activity`, `customer_security_log`. Every table is `auth.uid()=user_id` owner-scoped or RLS-on + 0-policy deny.
- **The #333 fix is live:** `customer_notifications` UPDATE policy carries `WITH CHECK (auth.uid()=user_id)`, and it is the only realtime-published table (owner-scoped SELECT → safe stream).
- **The SEC-HARDEN-06 #323 SECDEF IDOR fixes are live** — `get_signal_feed(viewer_id)` and `get_default_user_address(p_user_id)` both contain `if auth.uid() is not null and auth.uid() is distinct from <id> then raise … 42501` on prod (the repo source still ships the vulnerable form → re-land into repo to prevent regression).
- **No account-linking takeover, no webhook money-forgery:** OAuth/account linking is session-bound and password/HMAC-gated; the webhook verifies HMAC over the raw body *before* processing; and the named `webhooks/account` route **moves no money** (it's a notification/email/activity/referral relay — the cash→clearing seam lives in marketplace `@henryco/payment-router`, out of scope).
- **No CRITICAL IDOR on documents/wallet:** the worst-case `documents/[type]/[id]` → `kyc-summary` branch is explicitly self-only (`if (id !== "me" && id !== user.id) 403`); wallet credits never originate from a client call; the withdrawal PIN is genuinely enforced.

Residual risk is entirely **data-at-rest + secondary-defense hardening**, and two of the items are **systemic** (recur in studio/learn/jobs).

| # | Finding | Category | Severity |
|---|---------|----------|----------|
| **ACC-1** | Open redirect via **backslash bypass** of `normalizeTrustedRedirect` (`/\evil.com` → cross-origin) on every auth-return flow | Open redirect | **MEDIUM** |
| **ACC-2** | KYC government IDs + payment proofs stored at **permanent public Cloudinary URLs** (no signed/authenticated delivery) — *systemic* | KYC data-at-rest | **MEDIUM** (HIGH if a URL leaks) |
| **ACC-3** | `api/proxy/download` is an **authenticated open proxy** (arbitrary `?u=`, host-allowlist only, Cloudinary `image/fetch` SSRF, no ownership) — *systemic* | BOLA / SSRF | **MEDIUM** |
| **ACC-4** | Webhook HMAC key **falls back to the shared `CRON_SECRET`** → anyone holding it forges events (emails/notifications/activity/`referral.qualify`) for any user | Secret mgmt | **MEDIUM** |
| **ACC-5** | Webhook idempotency is **check-then-act** (non-atomic) → concurrent replay/retry double-processes, incl. duplicate `referral.qualify` pending wallet-credits | Money integrity | **MEDIUM** |
| **ACC-6** | Owner SELECT policies return secret columns — **`provider_token` owner-readable via Data API (live ×7)**, `withdrawal_pin_hash` (pre-data) | Secret over-exposure | **MEDIUM** |
| **ACC-7** | **Signup email-existence oracle** (`409 already_registered` vs `200`) | Enumeration | **MEDIUM** |
| **ACC-8** | OAuth auto-link takeover mitigation **disabled by default** (`HENRYCO_AUTH_OAUTH_LINK_INTENT` off) | AuthN config | **MEDIUM** |
| **ACC-9** | Withdrawal **PIN brute-force** posture (4-digit, no PIN-lockout, limiter falls to per-instance when Upstash unset) — **pre-data** (0 PINs set) + composes with ACC-6 | AuthN / money | **HIGH-conditional (pre-data)** |
| **ACC-10** | Email-OR staff/owner matching (`readAccessSnapshot`) + raw email in PostgREST `.or()`; `getSupportMessages` thread-only scope (defense-in-depth); no FORCE-RLS | Hardening | **LOW** |

---

## Findings (abbreviated — full repro in the per-agent maps)

### ACC-1 — Open redirect, backslash bypass (MEDIUM, confirmed)
`packages/config/urls.ts:38-39` — `normalizeTrustedRedirect` returns a `/`-prefixed value unless it starts with `//`. `/\evil.com` passes, and `new URL("/\\evil.com", origin)` (`:64`) yields `https://evil.com/` (WHATWG converts `\`→`/` for http(s)). Reaches the customer branch of `decideDashboardResolution` for all users. Confirmed in Node: `/\evil.com` and `/\t/evil.com` → `https://evil.com/`; `//evil.com` correctly blocked. **Repro:** `GET /auth/resolve?next=/\evil.com` (authed) → `307 Location: https://evil.com/`. No token leak (session cookie is base-domain-scoped) → MEDIUM. **Fix:** reject when char[1] is `/` **or** `\` (and control chars), or resolve `new URL(value, base)` up front and require `url.origin === base.origin`; add `/\…`, `/\t/…`, `/%09/…` to the redirect test vectors.

### ACC-2 — KYC IDs + payment proofs at permanent public Cloudinary URLs (MEDIUM; systemic)
`lib/cloudinary.ts:39-91` (`uploadOwnedAsset`) uploads with the default delivery type (no `access_mode:authenticated`), persisting a permanent public `secure_url` as `customer_documents.file_url` for **KYC government ID / selfie** (`verify/route.ts:124-142`, whose "private folder" comment is misleading) and **wallet payment proofs** (`wallet/funding/[requestId]/proof/route.ts`). Secrecy rests on a ~32-bit `public_id`. The DB row is owner-gated, but the **object** is world-readable forever to anyone who obtains the URL (DB/log access, `Referer`, the ACC-3 proxy, analytics). **This is the same Cloudinary pattern flagged in studio (deliverables/asset packs), learn (lesson videos), and jobs (resumes) — fix it as one cross-cutting change.** **Probe:** `curl -sI <id_document file_url>` unauthenticated → `200 image/*`. **Fix:** `access_mode:"authenticated"` + short-lived signed delivery minted after the ownership check; stop persisting a permanent public URL.

### ACC-3 — `proxy/download` authenticated open proxy (MEDIUM; systemic)
`api/proxy/download/route.ts` fetches an arbitrary client-supplied `?u=` after only a host-suffix allowlist, with **no resource→owner binding** and `redirect:"follow"`; `res.cloudinary.com` + Cloudinary `image/fetch` make it a general content-proxy/SSRF amplifier. Not CRITICAL (forwards no credentials). Same bug class as studio's `portal/download`. **Fix:** resolve downloads by an owned row id (as `documents/file/[id]` does), block `image/fetch`, `redirect:"manual"`, de-wildcard the allowlist.

### ACC-4 — Webhook signing key falls back to `CRON_SECRET` (MEDIUM, confirmed)
`webhooks/account/route.ts:36-38` — `ACCOUNT_WEBHOOK_SIGNING_SECRET || CRON_SECRET`. Whoever holds the broadly-scoped `CRON_SECRET` can forge valid events for arbitrary `user_id`s (security-alert/wallet-funded/welcome emails, injected notifications + `customer_activity`, and `referral.qualify`). **Fix:** require a dedicated `ACCOUNT_WEBHOOK_SIGNING_SECRET`; 503 if only `CRON_SECRET` is present.

### ACC-5 — Non-atomic webhook idempotency (MEDIUM, confirmed)
`route.ts` does SELECT `alreadyProcessedEvent` (`:64-72,:130`) → process → INSERT receipt last with the `23505` swallowed (`:348-354`). The `event_id` unique index protects only the receipt row. Concurrent duplicate deliveries both pass the SELECT and both process (duplicate emails/notifications + duplicate `referral.qualify` → duplicate **pending** `referral_rewards` `wallet_credit` rows, `referral-data.ts:327`); a handler 500 leaves no receipt → upstream retry reprocesses. Payout is finance-gated (so MEDIUM, not a direct credit). **Fix:** `INSERT … ON CONFLICT (event_id) DO NOTHING` and proceed only if a row was inserted (claim-before-process); check the insert error.

### ACC-6 — Secret columns owner-readable via the Data API (MEDIUM)
RLS is row-level, not column-level. `customer_payment_methods`'s "Users can manage own" ALL policy returns **`provider_token`** to the owner via PostgREST — live probe: **7/7 payment methods have a populated `provider_token`**. `customer_preferences`'s "view own" SELECT returns **`withdrawal_pin_hash`** (currently 0/17 set → pre-data). A hijacked session / phished JWT reads these directly; the pin-hash + 4-digit PIN (ACC-9) enables an **offline** crack that bypasses all online rate-limiting. **Fix (held `01`):** `REVOKE SELECT (provider_token) ON customer_payment_methods FROM anon, authenticated;` and `REVOKE SELECT (withdrawal_pin_hash) ON customer_preferences FROM anon, authenticated;` (service_role retains; the app reads these server-side).

### ACC-7 — Signup email-existence oracle (MEDIUM, confirmed)
`api/auth/signup/route.ts:141-146` returns `409 email_already_registered` for existing emails vs `200` for fresh — a clean enumeration oracle (the sibling `resend` route is deliberately neutral). **Fix:** return a neutral `200` and email the existing user a "sign in / reset" message instead.

### ACC-8 — OAuth auto-link mitigation disabled by default (MEDIUM, config)
`auth/callback/route.ts:139-168` + `oauth-link-intent.ts:166-169` — the anti-takeover diversion to `/auth/link-account` (require the account password before an auto-attached OAuth identity is usable) is gated behind `HENRYCO_AUTH_OAUTH_LINK_INTENT`, which **defaults off**; with it off the callback only emits telemetry and proceeds under the auto-linked session. Bounded by Supabase only auto-linking on verified-email-match → MEDIUM. **Fix:** set `HENRYCO_AUTH_OAUTH_LINK_INTENT=1` in prod.

### ACC-9 — Withdrawal PIN brute-force posture (HIGH-conditional, pre-data)
`wallet/withdrawal/request/route.ts` enforces the PIN with no logic bypass, but `lib/wallet-pin.ts:28` allows **4-digit** PINs (10k space) with **no PIN-specific lockout**; the only throttle is the shared sensitive-action limiter, which **falls back to a per-process in-memory `Map` when `UPSTASH_*` is unset** (`packages/auth/src/server/sensitive-action-rate-limit.ts:42,179-194`) → concurrency bypass across Vercel lambdas. Requires prior reauth (password). **Pre-data:** 0/17 preference rows have a PIN set today. Composes with ACC-6 (read the hash → offline crack). **Fix:** ≥6-digit PINs; a dedicated per-user failed-PIN counter + lockout; fail-closed on money routes when the durable limiter backend is unavailable; verify `UPSTASH_*` set in prod.

### ACC-10 — Lower-tier (LOW)
- `packages/auth/src/viewer.ts:107-137` `readAccessSnapshot` grants staff/owner by `user_id` **OR** `normalized_email` (the email-OR class; the `henrycogroup` seeds it could escalate are now **deactivated** — see reconcile below — so latent); email is interpolated raw into a PostgREST `.or()` (low — email validation rejects metachars).
- `getSupportMessages(threadId)` (`account-data.ts:539`) is thread-only scoped — safe in its one caller (ownership proven first) but a footgun; add `.eq("user_id", …)`.
- No `FORCE ROW LEVEL SECURITY` on the account money/PII/KYC tables (held `02`) — defense-in-depth given universal service-role usage.

---

## Closed / refuted (proven by live probe / source)

| Hypothesis | Verdict | Evidence |
|---|---|---|
| Cross-user read of wallets / KYC docs / profiles / payment-methods / notifications | **CLOSED** | authenticated-stranger read = **0** for all (owner-scoped or deny) |
| SECDEF IDOR (`get_signal_feed`, `get_default_user_address`) | **CLOSED** | prod function bodies contain the `auth.uid()` ownership guard (#323 live) |
| `customer_notifications` realtime / #333 UPDATE-policy gap | **CLOSED** | UPDATE policy has `WITH CHECK (auth.uid()=user_id)`; SELECT owner-scoped |
| Document/KYC/invoice IDOR via `documents/[type]/[id]` | **CLOSED** | `kyc-summary` is self-only (403 otherwise); invoice/receipt/thread are `user_id`-scoped |
| Account-linking takeover | **REFUTED** | linking is session-bound + password/HMAC-intent-gated |
| Webhook money-credit forgery / replay | **REFUTED** | HMAC-on-raw-body before processing + ±5-min window; **the webhook moves no money** |
| Wallet self-credit / cross-user wallet drain | **REFUTED** | credits never client-originated; studio-pay debits caller's own wallet (CAS + idempotency) |

**Cross-division reconcile:** marketplace **F-03 `henrycogroup.com` seeds are remediated** — live `is_active=0` (was 7) → takeover path closed.

---

## Proposed fixes index
- **Held migrations** `docs/v3/security/v3-fire-account-proposed-migrations/`: `01_revoke_secret_columns.sql` (ACC-6), `02_force_rls_account_money_pii.sql` (ACC-10).
- **App-layer (the bulk):** ACC-1 redirect `/\` reject; ACC-2 signed Cloudinary delivery (**cross-cutting** — also studio/learn/jobs); ACC-3 id-based `proxy/download` + block `image/fetch`; ACC-4 dedicated webhook secret; ACC-5 claim-before-process idempotency; ACC-7 neutral signup; ACC-8 enable `HENRYCO_AUTH_OAUTH_LINK_INTENT`; ACC-9 ≥6-digit PIN + lockout + fail-closed limiter; re-land the #323 SECDEF fixes into repo to prevent regression.

---

**V3-FIRE-ACCOUNT COMPLETE — 10 findings (0 critical / 0 high live / 8 med / 2 low; ACC-9 HIGH-conditional but pre-data), each with attached live or source evidence; 2 held migrations. The identity/wallet/KYC core is the MOST locked-down division of the sweep: every sensitive table proven stranger-denied, the #323/#333 fixes confirmed live, no account-linking takeover, and no webhook money-forgery (the named webhook moves no money). Residual risk is data-at-rest + secondary-defense hardening — open redirect, public Cloudinary KYC URLs (systemic), open proxy (systemic), webhook secret/idempotency, secret-column over-exposure, signup oracle, and a pre-data PIN-brute-force posture. No severity inflation.**
