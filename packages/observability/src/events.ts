/**
 * @henryco/observability/events — event taxonomy emitter.
 *
 * Implements the canonical event names defined in
 * `docs/event-taxonomy.md`. The string-literal union forces compile-
 * time validation: emitting an unrecognised event name fails the type
 * check, eliminating an entire class of analytics drift bugs.
 *
 * Format: `henry.<domain>.<entity>.<verb>`. Every event maps to a
 * canonical name + classification + outcome per the taxonomy doc.
 *
 * Source-of-truth analytics writer (`buildCanonicalActivityMetadata`
 * in `packages/intelligence/src/analytics.ts`) remains the persistence
 * path — this emitter is for STRUCTURED LOGGING + SENTRY breadcrumbs,
 * not for `customer_activity` row writes. The two paths share the
 * canonical names so a downstream join is trivial.
 */

import { logger, type Logger } from "./logger";

/**
 * Every canonical event name defined in `docs/event-taxonomy.md`.
 * Keep this list in sync with the doc — tests that scan both should
 * be added to V2-OBS-02 (deferred).
 */
export type HenryEventName =
  // account
  | "henry.auth.account.created"
  | "henry.support.thread.created"
  | "henry.support.thread.replied"
  | "henry.account.notification.read"
  | "henry.account.notification.unread"
  | "henry.account.notification.archived"
  | "henry.trust.verification.submitted"
  | "henry.trust.verification.resolved"
  // wallet
  | "henry.wallet.funding.requested"
  | "henry.wallet.funding.proof_uploaded"
  | "henry.wallet.withdrawal.requested"
  | "henry.wallet.withdrawal.blocked"
  // marketplace
  | "henry.marketplace.cart.updated"
  | "henry.marketplace.wishlist.updated"
  | "henry.marketplace.vendor.follow_updated"
  | "henry.marketplace.checkout.started"
  | "henry.marketplace.order.placed"
  | "henry.marketplace.payment.verified"
  | "henry.marketplace.order.confirmed"
  | "henry.marketplace.order.packed"
  | "henry.marketplace.order.shipped"
  | "henry.marketplace.order.delivered"
  | "henry.marketplace.order.delayed"
  | "henry.marketplace.vendor_application.submitted"
  | "henry.marketplace.vendor_application.resolved"
  | "henry.marketplace.payout.requested"
  | "henry.marketplace.dispute.opened"
  | "henry.marketplace.dispute.updated"
  | "henry.marketplace.dispute.resolved"
  // marketplace profile drawer (mobile workspace nav) — DESIGN-01.
  // `opened` fires when the user taps the trigger; `closed` fires on
  // any dismissal (`via` payload identifies the path); `item_selected`
  // fires when a nav link is tapped (followed by `navigation` close).
  | "henry.marketplace.profile_drawer.opened"
  | "henry.marketplace.profile_drawer.closed"
  | "henry.marketplace.profile_drawer.item_selected"
  // care
  | "henry.care.booking.updated"
  // jobs
  | "henry.jobs.profile.updated"
  | "henry.jobs.role.saved"
  | "henry.jobs.application.updated"
  | "henry.jobs.employer.verification_updated"
  // learn
  | "henry.learn.enrollment.created"
  | "henry.learn.payment.confirmed"
  | "henry.learn.progress.lesson_completed"
  | "henry.learn.certificate.issued"
  | "henry.learn.support.thread.created"
  // logistics
  | "henry.logistics.quote.requested"
  | "henry.logistics.booking.created"
  // property
  | "henry.property.listing.saved"
  | "henry.property.listing.unsaved"
  | "henry.property.listing.inquiry_submitted"
  | "henry.property.listing.viewing_requested"
  | "henry.property.listing.submitted"
  | "henry.property.listing.updated"
  | "henry.property.listing.reviewed"
  // studio
  | "henry.studio.lead.submitted"
  | "henry.studio.proposal.ready"
  | "henry.studio.payment.updated"
  | "henry.studio.project.updated"
  | "henry.studio.message.added"
  // auth/session — V3-01 foundation lock (session persistence)
  | "henry.auth.session.refreshed"
  | "henry.auth.session.refresh_failed"
  | "henry.auth.session.reauth_succeeded"
  | "henry.auth.session.draft_restored"
  | "henry.auth.session.multitab_broadcast"
  // ui/mobile — V3-09 foundation lock (mobile consistency)
  | "henry.ui.mobile_keyboard.kept_visible"
  | "henry.ui.mobile_keyboard.obscured"
  | "henry.ui.modal_escape.backdrop_tap"
  | "henry.ui.modal_escape.android_back"
  // notification / message delivery state — V3-03 foundation lock
  // (notification & message states). 'delivered' = realtime push or
  // email-fallback success; 'read' = recipient marked seen via UI
  // (IntersectionObserver or explicit POST); 'failed' = hard bounce
  // OR redelivery cron exhausted retries.
  | "henry.notification.delivered"
  | "henry.notification.read"
  | "henry.notification.failed"
  | "henry.message.delivered"
  | "henry.message.read"
  | "henry.message.failed"
  // ui-state telemetry — V3-05 foundation lock (kill loading theater).
  // `shown` fires on StructuredSkeleton mount, `exceeded_threshold`
  // fires when the skeleton stays mounted longer than 3s (configurable).
  // Feeds the owner workspace slow-surface tile.
  | "henry.ui.skeleton.shown"
  | "henry.ui.skeleton.exceeded_threshold"
  // uploads / Cloudinary reliability — RELIABILITY-01.
  // Every Cloudinary touch-point emits the canonical pair (`requested`
  // on entry to the upload helper, `succeeded`/`failed` on resolve) so
  // the owner-workspace upload-health tile can compute per-folder
  // success rates without scraping logs. `degraded` fires when the
  // retry budget exhausts and the route returns the V3-10 degraded-
  // side-effect envelope to the caller.
  | "henry.uploads.cloudinary.requested"
  | "henry.uploads.cloudinary.succeeded"
  | "henry.uploads.cloudinary.failed"
  | "henry.uploads.cloudinary.degraded"
  // marketplace payment proof — pairs with the new
  // /api/checkout/payment-proof route. Owner-workspace finance tile
  // joins these to `marketplace_payment_records.proof_url` to detect
  // orders that submitted without proof reaching Cloudinary.
  | "henry.marketplace.payment_proof.uploaded"
  | "henry.marketplace.payment_proof.failed"
  // search indexing — SEARCH-01 indexing reliability uplift.
  // `lag` fires once per worker drain with the backlog + oldest-pending
  // age + processed counts so the owner-workspace observability tile
  // can compute the indexing SLO without polling Typesense. `failed`
  // fires per failed batch with a `failure_class` payload so the
  // failure pattern is debuggable (`network`, `schema_mismatch`,
  // `rate_limit`, `bulk_partial`, `unknown_collection`,
  // `payload_invalid`, `unknown`). `dead_letter` fires when a row
  // exceeds MAX_ATTEMPTS so operators can decide whether to manually
  // requeue or surgically delete.
  | "henry.search.indexing.lag"
  | "henry.search.indexing.failed"
  | "henry.search.indexing.dead_letter"
  // search query — SEARCH-01 zero-result observability (session 2
  // wires the emitter; the event registered here so the typed
  // emission path is ready for session 2 callers and the taxonomy
  // doc stays in sync).
  | "henry.search.query.zero_results";

/**
 * Per `docs/event-taxonomy.md` — events split into actor-driven user
 * actions vs system-driven state changes. The classification is
 * paired with the canonical name in the canonical analytics writer.
 */
export type EventClassification = "user_action" | "system_state";

/**
 * Per `docs/event-taxonomy.md` — outcome enum. Captures both the
 * forward state (started / completed) and the failure modes
 * (blocked / failed) that owner analytics dashboards distinguish.
 */
export type EventOutcome =
  | "started"
  | "completed"
  | "saved"
  | "submitted"
  | "requested"
  | "updated"
  | "removed"
  | "approved"
  | "rejected"
  | "blocked"
  | "failed"
  | "pending"
  | "paid"
  | "verified"
  | "resolved"
  | "delivered"
  | "issued";

/**
 * Emit a structured log line + (when available) a Sentry breadcrumb
 * for the given event. The host app's Sentry instance — initialised
 * via `buildServerSentryConfig()` / `buildClientSentryConfig()` — is
 * accessed via dynamic `import("@sentry/nextjs")` so this package
 * doesn't depend on Sentry being installed.
 *
 * The structured log line is always emitted (no Sentry dependency).
 *
 * `traceId` should be set when the event is part of a multi-step
 * flow — the canonical analytics writer carries the same id so a
 * downstream join can stitch breadcrumbs to canonical rows.
 */
export type EmitEventParams = {
  name: HenryEventName;
  classification: EventClassification;
  outcome: EventOutcome;
  /** Optional viewer / actor id — surfaces in Sentry user context. */
  actorId?: string;
  /** Optional trace id for cross-emit correlation. */
  traceId?: string;
  /** Optional payload — redacted by the logger before emit. */
  payload?: Record<string, unknown>;
  /** Optional logger override — defaults to the workspace logger. */
  logger?: Logger;
};

export function emitEvent(params: EmitEventParams): void {
  const log = params.logger ?? logger;
  const eventLogger = log.child({ event: params.name });
  eventLogger.info(`event:${params.outcome}`, {
    canonicalName: params.name,
    classification: params.classification,
    outcome: params.outcome,
    actorId: params.actorId,
    traceId: params.traceId,
    payload: params.payload,
  });
  // Sentry breadcrumb — dynamic-imported so the package compiles
  // without @sentry/nextjs as a hard dependency. Errors swallowed
  // silently because breadcrumbs are best-effort by design.
  void writeSentryBreadcrumb(params).catch(() => null);
}

async function writeSentryBreadcrumb(params: EmitEventParams): Promise<void> {
  // The dynamic import returns the host's Sentry singleton when
  // @sentry/nextjs has been initialised; otherwise it falls back to
  // a no-op. The `catch` upstream swallows missing-module errors.
  try {
    const Sentry = (await import("@sentry/nextjs")) as {
      addBreadcrumb?: (b: Record<string, unknown>) => void;
    };
    Sentry.addBreadcrumb?.({
      category: "henryco.event",
      message: params.name,
      data: {
        classification: params.classification,
        outcome: params.outcome,
        actorId: params.actorId,
        traceId: params.traceId,
      },
      level: params.outcome === "failed" || params.outcome === "blocked" ? "warning" : "info",
    });
  } catch {
    // Sentry not installed / not initialised — silent fallback.
  }
}
