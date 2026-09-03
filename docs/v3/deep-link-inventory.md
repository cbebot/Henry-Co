# V3-04 — Deep-link inventory

Catalog of every HenryCo surface that emits a deep link (a URL pointing
a recipient at a specific in-product destination), the column / field it
lands in, and whether the link is **relative** (resolves against the
emitting app's own origin) or **absolute** (a canonical cross-subdomain
`https://<sub>.<baseDomain>/…` URL).

Snapshot taken 2026-05-29 on `v3/04-deep-links` (base `5fa16317`).

## Source-of-truth rules

- New cross-domain links MUST come from the typed builders in
  `@henryco/seo/deeplinks` (`buildCareBookingLink`, `buildJobsRoleLink`,
  …). Builders resolve through `@henryco/config`
  (`getAbsoluteDivisionUrl` / `getAccountUrl`) so the domain is never
  hardcoded — a `NEXT_PUBLIC_BASE_DOMAIN` flip re-points every link.
- App-local notifications (the inbox renders on the same origin as the
  target) MAY keep relative paths — they are correct and cheaper than an
  absolute URL. The notification validator
  (`packages/notifications/validate-shared.ts → isSafeDeepLink`) accepts
  **both** a safe relative path and an absolute URL whose host ends in a
  HenryCo suffix.
- Email CTAs MUST be absolute (mail clients have no relative base) and
  carry UTM attribution. UTM tagging is applied centrally in
  `@henryco/email`'s `renderHenryCoEmail` when the layout sets
  `campaign` (see S6).

## 1. `customer_notifications.action_url` (in-app inbox)

Written by `@henryco/notifications` (`publishNotification` →
`action_url`) and by per-division `shared-account` bridges. The account
app renders these in the unified inbox / message center.

| Emitter | Path pattern | Kind | Builder available |
|---|---|---|---|
| `apps/account/app/api/support/create` | `/support/<threadId>` | relative | `buildSupportThreadLink` |
| `apps/account/app/api/webhooks/account` | `/support/<threadId>` | relative | `buildSupportThreadLink` |
| `apps/care/lib/support/account-sync` | `/support/<threadId>` | relative | `buildSupportThreadLink` |
| `apps/staff/app/api/support/reply` | `/support/<threadId>` | relative | `buildSupportThreadLink` |
| `apps/account/app/api/wallet/fund` | `/wallet/funding/<requestId>` | relative | `buildWalletFundingLink` |
| `apps/account/app/api/wallet/funding/[requestId]/proof` | `/wallet/funding/<requestId>` | relative | `buildWalletFundingLink` |
| `apps/account/app/api/wallet/withdrawal/request` | `/wallet/withdrawals` | relative | `buildWalletWithdrawalsLink` |
| `apps/account/app/api/verify` | `/verification` | relative | `buildVerificationLink` |
| `apps/staff/app/api/kyc/review` | `/verification` | relative | `buildVerificationLink` |
| `apps/account/app/api/studio/payments/[id]/wallet` | `/studio/payments/<id>` | relative | `buildStudioPaymentLink` |
| `apps/account/lib/notification-center` | `/messages/notification/<id>` (`notificationMessageHref`) | relative | `buildNotificationMessageLink` |
| `apps/account/lib/property-module` | `/property/saved` | relative | — (list surface) |
| `apps/jobs/lib/jobs/write` + `notifications` | `toJobsUrl(/jobs/<slug>)`, `toJobsUrl(/candidate/applications)`, `toJobsUrl(/candidate/saved-jobs)`, `toJobsUrl(/employer/company)` | absolute (config-derived) | `buildJobsRoleLink`, `buildJobsApplicationLink` |
| `apps/marketplace/lib/marketplace/projections` | order/store/track URLs (config-derived) | absolute | `buildMarketplaceOrderLink`, `buildMarketplaceStoreLink`, `buildMarketplaceOrderTrackingLink` |
| `apps/learn/lib/learn/shared-account` | `input.actionUrl` or `/learn` | relative fallback | `buildLearnCourseLink` |
| `apps/logistics/lib/logistics/shared-account` | `input.actionUrl` or `/logistics` | relative fallback | `buildLogisticsTrackingLink` |
| `apps/property/lib/property/shared-account` | `input.actionUrl` or `/property` | relative fallback | `buildPropertyListingLink` |

Legacy DB trigger: `handle_new_customer` (migration
`20260421191500_handle_new_customer_search_path.sql`) inserts a welcome
row with a relative `action_url`. Out of scope for this pass (SQL-side).

## 2. `staff_notifications.action_url` (staff inbox)

Schema: migration `20260502120000_staff_notifications_audience.sql`
(`action_url text`). Written by the staff-side publisher
(`packages/notifications/staff-*`). Same relative-vs-absolute rules
apply; staff links land on `staff.<baseDomain>` and stay relative when
the staff app renders the inbox.

## 3. `@henryco/email` templates (transactional email CTAs)

All email CTAs are already **absolute** and config-derived (none
hardcode a domain). UTM tagging is now applied centrally for templates
that route through `renderHenryCoEmail` and set `campaign`.

| Template file | CTA target source | UTM (S6) |
|---|---|---|
| `packages/email/auth-hook-templates.ts` | Supabase auth links (confirm / reset / magic) | intentionally untagged (transactional auth, not a campaign) |
| `apps/account/app/api/cron/notification-email-fallback` | `ctaUrl` (the notification's own action URL) + `/notifications` | **tagged** `notification_fallback_<division>` / `notification_fallback_digest` |
| `apps/studio/lib/studio/email/send.ts` | `${baseUrl()}/project/<id>?access=…`, proposal / project URLs | uses studio renderer; absolute, config-derived |
| `apps/learn/lib/email/learn-templates.ts` | `getAccountLearnUrl(...)`, `${baseUrl()}/courses/<slug>`, verify URL | custom learn renderer (not `renderHenryCoEmail`); absolute |
| `apps/care/lib/email/templates.ts` | care booking / account URLs | config-derived |
| `apps/marketplace/lib/email/marketplace-templates.ts` | order / store URLs | config-derived |
| `apps/property/lib/property/email/templates.ts` | listing URLs | config-derived |

Note: learn + studio ship their own bespoke HTML renderers (not
`renderHenryCoEmail`), so the layout-level UTM auto-tagging does not
reach them. They remain absolute + config-derived; adding UTM there is a
follow-up (would need per-renderer wiring). The canonical
notification-fallback path — which fans every in-app notification out to
email — is tagged, giving owner analytics attribution on the
highest-volume email surface.

## 4. SMS

No SMS provider is wired. The only outbound text channel is WhatsApp
(`sendLearnWhatsAppText`, `sendWhatsApp`), whose bodies embed the same
absolute, config-derived URLs as the matching email. SMS deep links are
therefore **out of scope** for this pass. The telemetry `DeepLinkSource`
union keeps an `"sms"` member so a future SMS channel slots in without a
contract change.

## 5. Share links (S5)

`packages/ui/src/share/ShareButton.tsx` produces share URLs via the
builders + `withShareAttribution` (`?ref=share&from=<hashed-sharer>`).
Arrival attribution is recorded against `customer_referrals`
(migration `20260403183000_account_integration_hardening.sql`,
`source = 'share'`). See S5.

## Gaps / follow-ups

- Learn + Studio bespoke email renderers are not UTM-tagged (own HTML
  pipeline). Low risk — links are absolute and correct; attribution is
  the only thing missing.
- Several notification emitters still pass relative paths where a typed
  builder now exists. These are correct (app-local inbox) but could be
  migrated to builders for consistency in a later sweep.
- The DB-side `handle_new_customer` welcome notification is not covered
  (SQL trigger, not a TS publisher).
