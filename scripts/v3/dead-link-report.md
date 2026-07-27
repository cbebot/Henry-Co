# V3-06 — Dead-Link Static Scan Report

Generated: 2026-07-27T11:30:48.145Z
Generator: scripts/v3/dead-link-scan.mjs

ANTI-CLONE: internal route-table catalog — do not publish.

## Totals

- Apps scanned: 10
- Routes catalogued: 790
- Href/redirect sites found: 904

| Classification | Count |
|---|---|
| OK | 593 |
| DEAD | 4 |
| LEGACY | 0 |
| DYNAMIC-MAYBE | 252 |
| HELPER | 3 |
| EXTERNAL | 27 |
| ANCHOR | 11 |
| EXEMPT | 14 |

Anchor findings (same-page unresolved): 3

## DEAD (must fix or remove)

- `apps/cms/app/(app)/_components/AppShell.tsx:44` — `/login`  _(no matching route in host app (cms) or division tables)_
- `apps/cms/app/auth/confirm/route.ts:52` — `/no-access`  _(no matching route in host app (cms) or division tables)_
- `apps/cms/app/no-access/page.tsx:25` — `/login`  _(no matching route in host app (cms) or division tables)_
- `apps/cms/app/page.tsx:7` — `/dashboard`  _(no matching route in host app (cms) or division tables)_

## LEGACY (must update to current pattern)

_None._

## DYNAMIC-MAYBE (confirm via live walk)

_252 entries — sample (first 40):_
- `apps/account/app/(account)/business/actions.ts:101` — `/business/${business.slug}`  _(template-literal interpolation)_
- `apps/account/app/(account)/business/actions.ts:207` — `/business/${slug}`  _(template-literal interpolation)_
- `apps/account/app/(account)/business/page.tsx:96` — `/business/${m.business.slug}`  _(template-literal interpolation)_
- `apps/account/app/(account)/business/[slug]/page.tsx:126` — `/business/${slug}/team`  _(template-literal interpolation)_
- `apps/account/app/(account)/business/[slug]/page.tsx:129` — `/business/${slug}/insights`  _(template-literal interpolation)_
- `apps/account/app/(account)/care/bookings/[bookingId]/page.tsx:297` — `/invoices/${invoice.id}`  _(template-literal interpolation)_
- `apps/account/app/(account)/care/bookings/[bookingId]/page.tsx:334` — `/support/${thread.id}`  _(template-literal interpolation)_
- `apps/account/app/(account)/documents/page.tsx:120` — `/api/documents/file/${doc.id}`  _(template-literal interpolation)_
- `apps/account/app/(account)/play/_components/LobbyClient.tsx:40` — `/play/${data.matchId}`  _(template-literal interpolation)_
- `apps/account/app/(account)/play/_components/MatchClient.tsx:91` — `/play/verify?match=${view.id}`  _(template-literal interpolation)_
- `apps/account/app/(account)/studio/payments/[id]/page.tsx:257` — `/studio/projects/${room.project.id}`  _(template-literal interpolation)_
- `apps/account/app/(account)/studio/projects/[id]/page.tsx:152` — `/studio/payments/${payment.id}`  _(template-literal interpolation)_
- `apps/account/app/(account)/studio/projects/[id]/page.tsx:264` — `/support/${room.supportThread.id}`  _(template-literal interpolation)_
- `apps/account/app/(account)/subscriptions/page.tsx:185` — `/subscriptions/${subscription.id}`  _(template-literal interpolation)_
- `apps/account/app/(account)/subscriptions/[subscriptionId]/page.tsx:88` — `/invoices/${invoice.id}`  _(template-literal interpolation)_
- `apps/account/app/(account)/subscriptions/[subscriptionId]/page.tsx:89` — `/support/${thread.id}`  _(template-literal interpolation)_
- `apps/account/app/(account)/support/page.tsx:248` — `/support/${thread.id}`  _(template-literal interpolation)_
- `apps/account/app/api/studio/payments/[id]/wallet/route.ts:152` — `/studio/payments/${paymentRow.id}`  _(template-literal interpolation)_
- `apps/account/app/api/verify/route.ts:54` — `/verification?error=${input.code}`  _(template-literal interpolation)_
- `apps/account/app/api/wallet/fund/route.ts:126` — `/wallet/funding/${requestId}`  _(template-literal interpolation)_
- `apps/account/app/api/wallet/fund/route.ts:199` — `/wallet/funding/${transaction.id}`  _(template-literal interpolation)_
- `apps/account/app/auth/choose/page.tsx:226` — `/api/auth/logout${safeNext !== "/" ? `  _(template-literal interpolation)_
- `apps/account/app/payments/callback/page.tsx:55` — `/login?next=${encodeURIComponent(normalizeTrustedRedirect(back))}`  _(template-literal interpolation)_
- `apps/account/components/divisions/CareBookingsDashboard.tsx:337` — `/care?booking=${encodeURIComponent(booking.id)}${filterQs}${pageQs}`  _(template-literal interpolation)_
- `apps/account/components/divisions/CareBookingsDashboard.tsx:389` — `/care?page=${page - 1}${activeFilter === "all" ? "" : `  _(template-literal interpolation)_
- `apps/account/components/divisions/CareBookingsDashboard.tsx:397` — `/care?page=${page + 1}${activeFilter === "all" ? "" : `  _(template-literal interpolation)_
- `apps/account/components/divisions/DivisionModulePage.tsx:250` — `/support/${t.id}`  _(template-literal interpolation)_
- `apps/account/components/invoices/InvoicesList.tsx:46` — `/invoices/${inv.id}`  _(template-literal interpolation)_
- `apps/account/components/learn/LearnExtras.tsx:114` — `${learnOrigin}/courses/${s.slug}`  _(template-literal interpolation)_
- `apps/account/components/marketplace/MarketplaceOrders.tsx:59` — `${marketplaceOrigin}/orders/${encodeURIComponent(order.id)}`  _(template-literal interpolation)_
- `apps/account/components/messages-inbox/InboxFilterChips.tsx:43` — `/messages?filter=${division}`  _(template-literal interpolation)_
- `apps/account/components/studio/StudioPayments.tsx:73` — `/studio/payments/${p.id}`  _(template-literal interpolation)_
- `apps/account/components/studio/StudioProjects.tsx:66` — `/studio/projects/${project.id}`  _(template-literal interpolation)_
- `apps/account/components/wallet/FundingRequestRow.tsx:54` — `/wallet/funding/${request.id}`  _(template-literal interpolation)_
- `apps/account/lib/email/templates.ts:423` — `${ACCOUNT_ORIGIN}`  _(template-literal interpolation)_
- `apps/account/lib/email/templates.ts:443` — `${ACCOUNT_ORIGIN}/security`  _(template-literal interpolation)_
- `apps/account/lib/email/templates.ts:470` — `${ACCOUNT_ORIGIN}/wallet`  _(template-literal interpolation)_
- `apps/account/lib/email/templates.ts:499` — `${ACCOUNT_ORIGIN}/wallet/withdrawals`  _(template-literal interpolation)_
- `apps/account/lib/email/templates.ts:527` — `${ACCOUNT_ORIGIN}/payments`  _(template-literal interpolation)_
- `apps/account/lib/email/templates.ts:557` — `${ACCOUNT_ORIGIN}/wallet/withdrawals`  _(template-literal interpolation)_

## HELPER (cross-division / builder args — confirm via live walk)

_3 entries — sample (first 30):_
- `apps/studio/components/messaging/context-panel.tsx:218` — `../files`  _(relative/non-rooted path (likely helper arg))_
- `packages/newsletter/src/draft.ts:243` — `{{preferences_url}}`  _(relative/non-rooted path (likely helper arg))_
- `packages/newsletter/src/draft.ts:245` — `{{unsubscribe_url}}`  _(relative/non-rooted path (likely helper arg))_

## Anchor findings

- `apps/hub/app/(site)/home/home-chrome.tsx:73` — `#top` _(no id match in the same file; verify via live walk if cross-component)_
- `apps/hub/app/(site)/home/home-standard.tsx:103` — `#engines` _(no id match in the same file; verify via live walk if cross-component)_
- `packages/ui/src/public-shell/public-chrome.tsx:534` — `#henryco-main` _(no id match in the same file; verify via live walk if cross-component)_

## S9 — inert-button candidates (ADVISORY; owned by V3-11)

Static candidates only — a `<button type="button">` with no `onClick`/`onPress`/pointer handler, no `formAction`, and no spread props. Scoped to explicit `type="button"` because a typeless `<button>` defaults to submit inside a form. Some may still be false positives (handler wired in a parent). The per-card 'opens the exact next step' verdict is V3-11's; this is a starting point, NOT a CI gate.

_0 candidate(s) — sample (first 40):_

