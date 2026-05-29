# V3-06 — Dead-Link Static Scan Report

Generated: 2026-05-29T01:28:45.603Z
Generator: scripts/v3/dead-link-scan.mjs

ANTI-CLONE: internal route-table catalog — do not publish.

## Totals

- Apps scanned: 10
- Routes catalogued: 651
- Href/redirect sites found: 851

| Classification | Count |
|---|---|
| OK | 559 |
| DEAD | 0 |
| LEGACY | 0 |
| DYNAMIC-MAYBE | 229 |
| HELPER | 3 |
| EXTERNAL | 34 |
| ANCHOR | 13 |
| EXEMPT | 13 |

Anchor findings (same-page unresolved): 0

## DEAD (must fix or remove)

_None._

## LEGACY (must update to current pattern)

_None._

## DYNAMIC-MAYBE (confirm via live walk)

_229 entries — sample (first 40):_
- `apps/account/app/(account)/care/bookings/[bookingId]/page.tsx:297` — `/invoices/${invoice.id}`  _(template-literal interpolation)_
- `apps/account/app/(account)/care/bookings/[bookingId]/page.tsx:334` — `/support/${thread.id}`  _(template-literal interpolation)_
- `apps/account/app/(account)/documents/page.tsx:120` — `/api/documents/file/${doc.id}`  _(template-literal interpolation)_
- `apps/account/app/(account)/studio/payments/[id]/page.tsx:257` — `/studio/projects/${room.project.id}`  _(template-literal interpolation)_
- `apps/account/app/(account)/studio/projects/[id]/page.tsx:152` — `/studio/payments/${payment.id}`  _(template-literal interpolation)_
- `apps/account/app/(account)/studio/projects/[id]/page.tsx:264` — `/support/${room.supportThread.id}`  _(template-literal interpolation)_
- `apps/account/app/(account)/subscriptions/page.tsx:181` — `/subscriptions/${subscription.id}`  _(template-literal interpolation)_
- `apps/account/app/(account)/subscriptions/[subscriptionId]/page.tsx:88` — `/invoices/${invoice.id}`  _(template-literal interpolation)_
- `apps/account/app/(account)/subscriptions/[subscriptionId]/page.tsx:89` — `/support/${thread.id}`  _(template-literal interpolation)_
- `apps/account/app/(account)/support/page.tsx:248` — `/support/${thread.id}`  _(template-literal interpolation)_
- `apps/account/app/api/studio/payments/[id]/wallet/route.ts:152` — `/studio/payments/${paymentRow.id}`  _(template-literal interpolation)_
- `apps/account/app/api/verify/route.ts:54` — `/verification?error=${input.code}`  _(template-literal interpolation)_
- `apps/account/app/api/wallet/fund/route.ts:127` — `/wallet/funding/${requestId}`  _(template-literal interpolation)_
- `apps/account/app/api/wallet/fund/route.ts:200` — `/wallet/funding/${transaction.id}`  _(template-literal interpolation)_
- `apps/account/app/api/wallet/funding/[requestId]/proof/route.ts:146` — `/wallet/funding/${requestId}`  _(template-literal interpolation)_
- `apps/account/app/auth/choose/page.tsx:235` — `/api/auth/logout${safeNext !== "/" ? `  _(template-literal interpolation)_
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
- `apps/account/components/wallet/AddMoneyForm.tsx:52` — `/wallet/funding/${data.requestId}`  _(template-literal interpolation)_
- `apps/account/components/wallet/FundingRequestForm.tsx:71` — `/wallet/funding/${data.requestId}`  _(template-literal interpolation)_
- `apps/account/components/wallet/FundingRequestRow.tsx:55` — `/wallet/funding/${request.id}`  _(template-literal interpolation)_
- `apps/account/lib/email/templates.ts:311` — `${ACCOUNT_ORIGIN}`  _(template-literal interpolation)_
- `apps/account/lib/email/templates.ts:331` — `${ACCOUNT_ORIGIN}/security`  _(template-literal interpolation)_
- `apps/account/lib/email/templates.ts:358` — `${ACCOUNT_ORIGIN}/wallet`  _(template-literal interpolation)_
- `apps/account/lib/email/templates.ts:637` — `${ACCOUNT_ORIGIN}/invoices`  _(template-literal interpolation)_
- `apps/account/lib/email/templates.ts:660` — `${ACCOUNT_ORIGIN}/support/${threadId}`  _(template-literal interpolation)_
- `apps/account/lib/email/templates.ts:692` — `${ACCOUNT_ORIGIN}/subscriptions`  _(template-literal interpolation)_
- `apps/account/lib/email/templates.ts:724` — `${ACCOUNT_ORIGIN}`  _(template-literal interpolation)_
- `apps/account/proxy.ts:77` — `${getHqUrl(pathname)}${search}`  _(template-literal interpolation)_
- `apps/account/proxy.ts:77` — `${getHqUrl(pathname)}${search}`  _(template-literal interpolation)_
- `apps/care/app/(public)/book/actions.ts:89` — `/track?${params.toString()}`  _(template-literal interpolation)_
- `apps/care/app/(public)/unsubscribe/page.tsx:130` — `/api/care/preferences/unsubscribe?mode=resubscribe&token=${encodeURIComponent(token)}`  _(template-literal interpolation)_

## HELPER (cross-division / builder args — confirm via live walk)

_3 entries — sample (first 30):_
- `apps/studio/components/messaging/context-panel.tsx:218` — `../files`  _(relative/non-rooted path (likely helper arg))_
- `packages/newsletter/src/draft.ts:243` — `{{preferences_url}}`  _(relative/non-rooted path (likely helper arg))_
- `packages/newsletter/src/draft.ts:245` — `{{unsubscribe_url}}`  _(relative/non-rooted path (likely helper arg))_

## Anchor findings

_None unresolved (same-page)._

## S9 — inert-button candidates (ADVISORY; owned by V3-11)

Static candidates only — a `<button type="button">` with no `onClick`/`onPress`/pointer handler, no `formAction`, and no spread props. Scoped to explicit `type="button"` because a typeless `<button>` defaults to submit inside a form. Some may still be false positives (handler wired in a parent). The per-card 'opens the exact next step' verdict is V3-11's; this is a starting point, NOT a CI gate.

_0 candidate(s) — sample (first 40):_

