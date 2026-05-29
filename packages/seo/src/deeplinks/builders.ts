/**
 * V3-04 (S4) — Typed deep-link builders.
 *
 * One builder per deep-link target type HenryCo sends. Each returns a
 * canonical absolute https URL on the correct subdomain, derived entirely
 * from `@henryco/config` (no hardcoded domain). Builders that target a
 * path the Expo super-app intercepts (per the S2 universal-link manifest)
 * also have a `*AppLink` alias — identical URL, named for intent.
 *
 * The target routes below were verified against the live app router on
 * 2026-05-29:
 *   - Customer detail surfaces live on the ACCOUNT app (the unified
 *     dashboard): /care/bookings/<id>, /invoices/<id>,
 *     /subscriptions/<id>, /support/<id>, /wallet/funding/<id>,
 *     /studio/payments/<id>, /studio/projects/<id>,
 *     /jobs/interviews/<id>, /messages/notification/<id>.
 *   - Public/division detail surfaces live on their division app:
 *     marketplace /product/<slug>, /store/<slug>, /track/<orderNo>,
 *     /account/orders/<orderNo>; property /property/<slug>;
 *     learn /courses/<slug>, /certifications/verify/<code>;
 *     jobs /jobs/<slug>; logistics /track.
 */

import { accountUrl, divisionUrl, encodeIdSegment } from "./targets";

// ─────────────────────────────────────────────────────────────────────
// Account-app customer detail surfaces (the unified dashboard).
// These are the canonical "open the exact workflow step" targets cited
// in AUDIT-BASELINE §3.4 ("subscriptions + invoices + care bookings now
// deep-link into dedicated detail routes").
// ─────────────────────────────────────────────────────────────────────

export function buildCareBookingLink(input: { bookingId: string }): string {
  return accountUrl(`/care/bookings/${encodeIdSegment(input.bookingId)}`);
}

export function buildInvoiceLink(input: { invoiceId: string }): string {
  return accountUrl(`/invoices/${encodeIdSegment(input.invoiceId)}`);
}

export function buildSubscriptionLink(input: {
  subscriptionId: string;
}): string {
  return accountUrl(`/subscriptions/${encodeIdSegment(input.subscriptionId)}`);
}

export function buildSupportThreadLink(input: { threadId: string }): string {
  return accountUrl(`/support/${encodeIdSegment(input.threadId)}`);
}

export function buildWalletFundingLink(input: { requestId: string }): string {
  return accountUrl(`/wallet/funding/${encodeIdSegment(input.requestId)}`);
}

export function buildWalletWithdrawalsLink(): string {
  return accountUrl("/wallet/withdrawals");
}

export function buildStudioPaymentLink(input: { paymentId: string }): string {
  return accountUrl(`/studio/payments/${encodeIdSegment(input.paymentId)}`);
}

export function buildStudioProjectLink(input: { projectId: string }): string {
  return accountUrl(`/studio/projects/${encodeIdSegment(input.projectId)}`);
}

export function buildJobsInterviewLink(input: { sessionId: string }): string {
  return accountUrl(`/jobs/interviews/${encodeIdSegment(input.sessionId)}`);
}

export function buildNotificationMessageLink(input: {
  notificationId: string;
}): string {
  return accountUrl(
    `/messages/notification/${encodeIdSegment(input.notificationId)}`,
  );
}

export function buildVerificationLink(): string {
  return accountUrl("/verification");
}

// ─────────────────────────────────────────────────────────────────────
// Division public / detail surfaces.
// ─────────────────────────────────────────────────────────────────────

export function buildMarketplaceProductLink(input: {
  slug: string;
}): string {
  return divisionUrl("marketplace", `/product/${encodeIdSegment(input.slug)}`);
}

export function buildMarketplaceStoreLink(input: { slug: string }): string {
  return divisionUrl("marketplace", `/store/${encodeIdSegment(input.slug)}`);
}

export function buildMarketplaceOrderLink(input: { orderNo: string }): string {
  return divisionUrl(
    "marketplace",
    `/account/orders/${encodeIdSegment(input.orderNo)}`,
  );
}

export function buildMarketplaceOrderTrackingLink(input: {
  orderNo: string;
}): string {
  return divisionUrl("marketplace", `/track/${encodeIdSegment(input.orderNo)}`);
}

export function buildMarketplacePayLink(input: { orderNo: string }): string {
  return divisionUrl("marketplace", `/pay/${encodeIdSegment(input.orderNo)}`);
}

export function buildPropertyListingLink(input: { slug: string }): string {
  return divisionUrl("property", `/property/${encodeIdSegment(input.slug)}`);
}

export function buildJobsRoleLink(input: { slug: string }): string {
  return divisionUrl("jobs", `/jobs/${encodeIdSegment(input.slug)}`);
}

/**
 * Jobs application detail. There is no public per-application customer
 * route; candidates manage applications from the candidate dashboard list
 * (`/candidate/applications`), so this builds that list URL and tags the
 * application id as a hash so a future detail drill-down has a stable
 * anchor without inventing a 404 route.
 */
export function buildJobsApplicationLink(input: {
  applicationId: string;
}): string {
  const base = divisionUrl("jobs", "/candidate/applications");
  return `${base}#${encodeIdSegment(input.applicationId)}`;
}

export function buildLearnCourseLink(input: { slug: string }): string {
  return divisionUrl("learn", `/courses/${encodeIdSegment(input.slug)}`);
}

export function buildLearnCertificateVerifyLink(input: {
  code: string;
}): string {
  return divisionUrl(
    "learn",
    `/certifications/verify/${encodeIdSegment(input.code)}`,
  );
}

export function buildLogisticsTrackingLink(input?: {
  trackingId?: string;
}): string {
  const trackingId = input?.trackingId
    ? `?tracking=${encodeIdSegment(input.trackingId)}`
    : "";
  return divisionUrl("logistics", `/track${trackingId}`);
}

// ─────────────────────────────────────────────────────────────────────
// Mobile-app universal-link aliases.
//
// HenryCo uses native iOS Universal Links / Android App Links (S2), where
// the universal-link URL IS the web URL — the OS routes it to the app when
// installed, or Safari/Chrome when not. So every app-link is identical to
// the web URL. Aliases are exported so a caller that wants to express
// "this is the link we expect to open the app" is self-documenting.
// ─────────────────────────────────────────────────────────────────────

export const buildCareBookingAppLink = buildCareBookingLink;
export const buildMarketplaceOrderAppLink = buildMarketplaceOrderLink;
export const buildJobsApplicationAppLink = buildJobsApplicationLink;
export const buildLearnCourseAppLink = buildLearnCourseLink;
export const buildPropertyListingAppLink = buildPropertyListingLink;
